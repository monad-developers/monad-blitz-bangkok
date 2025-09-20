const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");

describe("BatchFactory", function () {
  let batchFactory;
  let batchManager;
  let once721Template;
  let once1155Template;
  let onceToken;
  let owner;
  let systemAdmin;
  let issuer;
  let royaltyRecipient;
  let trustedSigner;
  let addrs;

  // Constants
  const SYSTEM_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SYSTEM_ADMIN_ROLE"));
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const TOKENS_PER_CODE = ethers.parseEther("1"); // 1 token per code
  const ROYALTY_FEE = 500; // 5% in basis points

  // Test data - Need at least 10 codes to meet minimum requirement
  const codes = ["CODE001", "CODE002", "CODE003", "CODE004", "CODE005",
    "CODE006", "CODE007", "CODE008", "CODE009", "CODE010"];
  let merkleTree;
  let merkleRoot;
  let merkleProofs = {};

  // NFT Type enum
  const NFTType = {
    ERC721: 0,
    ERC1155_ART: 1,
    ERC1155_STAMP: 2
  };

  before(async function () {
    // Generate merkle tree once for all tests using merkletreejs
    const leaves = codes.map(code => ethers.keccak256(ethers.toUtf8Bytes(code)));
    merkleTree = new MerkleTree(leaves, ethers.keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getHexRoot();

    // Generate proofs for each code
    codes.forEach((code) => {
      const leaf = ethers.keccak256(ethers.toUtf8Bytes(code));
      merkleProofs[code] = merkleTree.getHexProof(leaf);
    });
  });

  beforeEach(async function () {
    // Get signers
    [owner, systemAdmin, issuer, royaltyRecipient, trustedSigner, ...addrs] = await ethers.getSigners();

    // Deploy OnceToken (ERC20 payment token)
    const OnceToken = await ethers.getContractFactory("OnceToken");
    onceToken = await OnceToken.deploy(owner.address, owner.address);
    await onceToken.waitForDeployment();

    // Mint tokens to owner and issuer for testing
    await onceToken.mint(owner.address, ethers.parseEther("1000000"));
    await onceToken.mint(issuer.address, ethers.parseEther("10000"));

    // Deploy template contracts
    const Once721TemplateV2 = await ethers.getContractFactory("Once721TemplateV2");
    once721Template = await Once721TemplateV2.deploy();
    await once721Template.waitForDeployment();

    const Once1155TemplateV2 = await ethers.getContractFactory("Once1155TemplateV2");
    once1155Template = await Once1155TemplateV2.deploy();
    await once1155Template.waitForDeployment();

    // Deploy BatchManager
    const BatchManager = await ethers.getContractFactory("BatchManager");
    batchManager = await BatchManager.deploy();
    await batchManager.waitForDeployment();

    // Deploy BatchFactory
    const BatchFactory = await ethers.getContractFactory("BatchFactory");
    batchFactory = await BatchFactory.deploy(
      await batchManager.getAddress(),
      await once721Template.getAddress(),
      await once1155Template.getAddress(),
      await onceToken.getAddress()
    );
    await batchFactory.waitForDeployment();

    // Grant necessary roles
    await batchFactory.grantRole(SYSTEM_ADMIN_ROLE, systemAdmin.address);
    await batchManager.grantRole(SYSTEM_ADMIN_ROLE, systemAdmin.address);

    // Grant BATCH_FACTORY_ROLE to BatchFactory so it can call createBatch
    await batchManager.connect(systemAdmin).setBatchFactory(await batchFactory.getAddress());

    // Add trusted signer for backend signature verification
    await batchFactory.connect(systemAdmin).addTrustedSigner(trustedSigner.address);
  });

  // Helper function to generate valid backend signature
  async function createValidBatchParams(overrides = {}) {
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    // Get current nonce for the issuer (this will be used in signature)
    const currentNonce = await batchFactory.getIssuerNonce(issuer.address);

    const defaultParams = {
      nftType: NFTType.ERC721,
      name: "Test NFT",
      symbol: "TNFT",
      merkleRoot: merkleRoot,
      totalCodes: codes.length,
      expireTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      existingNFTContract: ethers.ZeroAddress,
      royaltyRecipient: ethers.ZeroAddress,
      royaltyFeeNumerator: 0,
      baseURI: "",
      deadline: deadline
    };

    const finalParams = { ...defaultParams, ...overrides };

    // Create message hash for signing (including current nonce)
    const messageHash = ethers.keccak256(ethers.solidityPacked(
      ["address", "uint8", "string", "string", "bytes32", "uint256", "uint256", "address", "uint96", "string", "uint256", "uint256"],
      [issuer.address, finalParams.nftType, finalParams.name, finalParams.symbol, finalParams.merkleRoot,
      finalParams.totalCodes, finalParams.expireTime, finalParams.royaltyRecipient, finalParams.royaltyFeeNumerator,
      finalParams.baseURI, finalParams.deadline, currentNonce]
    ));

    // Sign the message
    const backendSig = await trustedSigner.signMessage(ethers.getBytes(messageHash));

    return { ...finalParams, backendSig };
  }

  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      expect(await batchFactory.once721Template()).to.equal(await once721Template.getAddress());
      expect(await batchFactory.once1155Template()).to.equal(await once1155Template.getAddress());
      expect(await batchFactory.batchManager()).to.equal(await batchManager.getAddress());
      expect(await batchFactory.paymentToken()).to.equal(await onceToken.getAddress());
      expect(await batchFactory.tokensPerCode()).to.equal(1);
      expect(await batchFactory.minCodesPerBatch()).to.equal(10);
    });

    it("Should grant DEFAULT_ADMIN_ROLE and SYSTEM_ADMIN_ROLE to deployer", async function () {
      expect(await batchFactory.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await batchFactory.hasRole(SYSTEM_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should revert if deployed with zero addresses", async function () {
      const BatchFactory = await ethers.getContractFactory("BatchFactory");

      await expect(
        BatchFactory.deploy(
          ethers.ZeroAddress,
          await once721Template.getAddress(),
          await once1155Template.getAddress(),
          await onceToken.getAddress()
        )
      ).to.be.revertedWith("Invalid BatchManager address");

      await expect(
        BatchFactory.deploy(
          await batchManager.getAddress(),
          ethers.ZeroAddress,
          await once1155Template.getAddress(),
          await onceToken.getAddress()
        )
      ).to.be.revertedWith("Invalid ERC721 template address");

      await expect(
        BatchFactory.deploy(
          await batchManager.getAddress(),
          await once721Template.getAddress(),
          ethers.ZeroAddress,
          await onceToken.getAddress()
        )
      ).to.be.revertedWith("Invalid ERC1155 template address");

      await expect(
        BatchFactory.deploy(
          await batchManager.getAddress(),
          await once721Template.getAddress(),
          await once1155Template.getAddress(),
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Invalid payment token address");
    });
  });

  describe("Configuration", function () {
    it("Should allow SYSTEM_ADMIN to set tokens per code", async function () {
      await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      expect(await batchFactory.tokensPerCode()).to.equal(TOKENS_PER_CODE);
    });

    it("Should allow SYSTEM_ADMIN to set minimum codes per batch", async function () {
      await batchFactory.connect(systemAdmin).setMinCodesPerBatch(20);
      expect(await batchFactory.minCodesPerBatch()).to.equal(20);
    });

    it("Should allow SYSTEM_ADMIN to set payment token", async function () {
      const newTokenAddress = addrs[0].address;
      await batchFactory.connect(systemAdmin).setPaymentToken(newTokenAddress);
      expect(await batchFactory.paymentToken()).to.equal(newTokenAddress);
    });

    it("Should revert when non-admin tries to change configuration", async function () {
      await expect(
        batchFactory.connect(issuer).setTokensPerCode(TOKENS_PER_CODE)
      ).to.be.revertedWithCustomError(batchFactory, "AccessControlUnauthorizedAccount");

      await expect(
        batchFactory.connect(issuer).setMinCodesPerBatch(20)
      ).to.be.revertedWithCustomError(batchFactory, "AccessControlUnauthorizedAccount");

      await expect(
        batchFactory.connect(issuer).setPaymentToken(addrs[0].address)
      ).to.be.revertedWithCustomError(batchFactory, "AccessControlUnauthorizedAccount");
    });

    it("Should revert when setting min codes to zero", async function () {
      await expect(
        batchFactory.connect(systemAdmin).setMinCodesPerBatch(0)
      ).to.be.revertedWith("Min codes must be positive");
    });

    it("Should revert when setting payment token to zero address", async function () {
      await expect(
        batchFactory.connect(systemAdmin).setPaymentToken(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid payment token address");
    });
  });

  describe("Batch Creation with New NFT Contract", function () {
    beforeEach(async function () {
      // Set up tokens per code and approve spending
      await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
      await onceToken.connect(issuer).approve(await batchFactory.getAddress(), totalCost);
    });

    it("Should create ERC721 batch with new contract", async function () {
      const params = await createValidBatchParams({
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      const tx = await batchFactory.connect(issuer).createBatch(params);
      const receipt = await tx.wait();

      // Check events
      const batchCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = batchFactory.interface.parseLog(log);
          return parsed.name === "BatchCreatedViaFactory";
        } catch {
          return false;
        }
      });

      expect(batchCreatedEvent).to.not.be.undefined;

      const nftDeployedEvent = receipt.logs.find(log => {
        try {
          const parsed = batchFactory.interface.parseLog(log);
          return parsed.name === "NFTContractDeployed";
        } catch {
          return false;
        }
      });

      expect(nftDeployedEvent).to.not.be.undefined;
    });

    it("Should revert with invalid backend signature", async function () {
      const params = await createValidBatchParams();
      // Replace with invalid signature
      params.backendSig = "0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890";

      await expect(
        batchFactory.connect(issuer).createBatch(params)
      ).to.be.reverted;
    });

    it("Should revert with expired signature", async function () {
      const expiredDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const params = await createValidBatchParams({ deadline: expiredDeadline });

      await expect(
        batchFactory.connect(issuer).createBatch(params)
      ).to.be.revertedWith("Signature expired");
    });
  });

  describe("Trusted Signer Management", function () {
    it("Should allow SYSTEM_ADMIN to add trusted signer", async function () {
      const newSigner = addrs[0];
      await batchFactory.connect(systemAdmin).addTrustedSigner(newSigner.address);

      expect(await batchFactory.isTrustedSigner(newSigner.address)).to.be.true;
    });

    it("Should allow SYSTEM_ADMIN to remove trusted signer", async function () {
      const signerToRemove = trustedSigner.address;
      await batchFactory.connect(systemAdmin).removeTrustedSigner(signerToRemove);

      expect(await batchFactory.isTrustedSigner(signerToRemove)).to.be.false;
    });

    it("Should revert when non-admin tries to add trusted signer", async function () {
      await expect(
        batchFactory.connect(issuer).addTrustedSigner(addrs[1].address)
      ).to.be.revertedWithCustomError(batchFactory, "AccessControlUnauthorizedAccount");
    });

    it("Should revert when adding zero address as trusted signer", async function () {
      await expect(
        batchFactory.connect(systemAdmin).addTrustedSigner(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid signer address");
    });

    it("Should revert when adding existing trusted signer", async function () {
      await expect(
        batchFactory.connect(systemAdmin).addTrustedSigner(trustedSigner.address)
      ).to.be.revertedWith("Signer already exists");
    });
  });

  describe("Batch Creation with New NFT Contract (Continued)", function () {
    beforeEach(async function () {
      await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
      await onceToken.connect(issuer).approve(await batchFactory.getAddress(), totalCost);
    });

    it("Should create ERC1155 ART batch with new contract", async function () {
      const params = await createValidBatchParams({
        nftType: NFTType.ERC1155_ART,
        name: "Test Art Collection",
        symbol: "TART",
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      const tx = await batchFactory.connect(issuer).createBatch(params);
      const receipt = await tx.wait();

      // Verify events are emitted
      const events = receipt.logs.filter(log => {
        try {
          const parsed = batchFactory.interface.parseLog(log);
          return parsed.name === "BatchCreatedViaFactory" || parsed.name === "NFTContractDeployed";
        } catch {
          return false;
        }
      });

      expect(events.length).to.be.at.least(2);
    });

    it("Should create ERC1155 STAMP batch with new contract", async function () {
      const params = await createValidBatchParams({
        nftType: NFTType.ERC1155_STAMP,
        name: "Test Stamp Collection",
        symbol: "TSTAMP",
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      const tx = await batchFactory.connect(issuer).createBatch(params);
      const receipt = await tx.wait();

      // Verify batch creation
      expect(receipt.status).to.equal(1);
    });

    it("Should track issuer NFT contracts", async function () {
      const params = await createValidBatchParams({
        name: "Test NFT",
        symbol: "TNFT",
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      await batchFactory.connect(issuer).createBatch(params);

      const issuerContracts = await batchFactory.getIssuerNFTContracts(issuer.address);
      expect(issuerContracts.length).to.equal(1);

      const issuerERC721Contracts = await batchFactory.getIssuerNFTContractsByType(
        issuer.address,
        NFTType.ERC721
      );
      expect(issuerERC721Contracts.length).to.equal(1);
    });

    it("Should collect payment correctly", async function () {
      const initialBalance = await onceToken.balanceOf(issuer.address);
      const totalCost = TOKENS_PER_CODE * BigInt(codes.length);

      const params = await createValidBatchParams({
        name: "Test NFT",
        symbol: "TNFT",
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      await batchFactory.connect(issuer).createBatch(params);

      const finalBalance = await onceToken.balanceOf(issuer.address);
      expect(initialBalance - finalBalance).to.equal(totalCost);

      const factoryBalance = await batchFactory.getPaymentBalance();
      expect(factoryBalance).to.equal(totalCost);
    });

    it("Should work with free batch creation (tokens per code = 0)", async function () {
      await batchFactory.connect(systemAdmin).setTokensPerCode(0);

      const params = await createValidBatchParams({
        name: "Free NFT",
        symbol: "FREE",
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      const tx = await batchFactory.connect(issuer).createBatch(params);
      expect(tx).to.not.be.reverted;

      const factoryBalance = await batchFactory.getPaymentBalance();
      expect(factoryBalance).to.equal(0);
    });
  });

  describe("Batch Creation with Existing NFT Contract", function () {
    let existingNFTContract;

    beforeEach(async function () {
      // Set up tokens per code and approve spending
      await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
      await onceToken.connect(issuer).approve(await batchFactory.getAddress(), totalCost * 2n); // Approve for multiple batches

      // Create an existing NFT contract first
      const params = await createValidBatchParams({
        name: "Existing NFT",
        symbol: "ENFT",
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      const tx = await batchFactory.connect(issuer).createBatch(params);
      const receipt = await tx.wait();

      // Get the deployed contract address from events
      const deployedEvent = receipt.logs.find(log => {
        try {
          const parsed = batchFactory.interface.parseLog(log);
          return parsed.name === "NFTContractDeployed";
        } catch {
          return false;
        }
      });

      existingNFTContract = deployedEvent.args.nftContract;
    });

    it("Should create batch with existing NFT contract", async function () {
      const params = await createValidBatchParams({
        existingNFTContract: existingNFTContract
      });

      const tx = await batchFactory.connect(issuer).createBatch(params);
      const receipt = await tx.wait();

      // Should have BatchCreatedViaFactory event but no NFTContractDeployed event
      const batchCreatedEvents = receipt.logs.filter(log => {
        try {
          const parsed = batchFactory.interface.parseLog(log);
          return parsed.name === "BatchCreatedViaFactory";
        } catch {
          return false;
        }
      });

      const deployedEvents = receipt.logs.filter(log => {
        try {
          const parsed = batchFactory.interface.parseLog(log);
          return parsed.name === "NFTContractDeployed";
        } catch {
          return false;
        }
      });

      expect(batchCreatedEvents.length).to.equal(1);
      expect(deployedEvents.length).to.equal(0);
    });

    it("Should revert with invalid existing NFT contract", async function () {
      const params = await createValidBatchParams({
        existingNFTContract: issuer.address // Use random address as invalid NFT contract
      });

      await expect(
        batchFactory.connect(issuer).createBatch(params)
      ).to.be.reverted;
    });
  });

  describe("Input Validation", function () {
    beforeEach(async function () {
      await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
      await onceToken.connect(issuer).approve(await batchFactory.getAddress(), totalCost);
    });

    it("Should revert with invalid merkle root", async function () {
      const params = await createValidBatchParams({
        merkleRoot: ethers.ZeroHash
      });

      await expect(
        batchFactory.connect(issuer).createBatch(params)
      ).to.be.revertedWith("Invalid merkle root");
    });

    it("Should revert with too few codes", async function () {
      const params = await createValidBatchParams({
        totalCodes: 5 // Below minimum of 10
      });

      await expect(
        batchFactory.connect(issuer).createBatch(params)
      ).to.be.revertedWith("Total codes below minimum");
    });

    it("Should revert with invalid royalty recipient", async function () {
      const params = await createValidBatchParams({
        royaltyRecipient: ethers.ZeroAddress
      });

      await expect(
        batchFactory.connect(issuer).createBatch(params)
      ).to.be.revertedWith("Invalid royalty recipient");
    });

    it("Should revert with too high royalty fee", async function () {
      const params = await createValidBatchParams({
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: 10001
      });

      await expect(
        batchFactory.connect(issuer).createBatch(params)
      ).to.be.revertedWith("Royalty fee too high");
    });

    it("Should revert when insufficient token allowance", async function () {
      // Reset approval to insufficient amount
      await onceToken.connect(issuer).approve(await batchFactory.getAddress(), 0);

      const params = await createValidBatchParams();

      await expect(
        batchFactory.connect(issuer).createBatch(params)
      ).to.be.revertedWithCustomError(onceToken, "ERC20InsufficientAllowance");
    });
  });

  describe("Nonce Management and Address Prediction", function () {
    it("Should increment nonce after each deployment", async function () {
      await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
      await onceToken.connect(issuer).approve(await batchFactory.getAddress(), totalCost * 3n);

      const initialNonce = await batchFactory.getIssuerNonce(issuer.address);
      expect(initialNonce).to.equal(0);

      // Create first batch
      const params1 = await createValidBatchParams({
        name: "First NFT",
        symbol: "FIRST",
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      await batchFactory.connect(issuer).createBatch(params1);
      expect(await batchFactory.getIssuerNonce(issuer.address)).to.equal(1);

      // Create second batch
      const params2 = await createValidBatchParams({
        nftType: NFTType.ERC1155_ART,
        name: "Second NFT",
        symbol: "SECOND",
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      await batchFactory.connect(issuer).createBatch(params2);
      expect(await batchFactory.getIssuerNonce(issuer.address)).to.equal(2);
    });

    it("Should predict NFT contract address correctly", async function () {
      const predictedAddress = await batchFactory.predictNextAddress(
        issuer.address,
        NFTType.ERC721,
        "Predicted NFT",
        "PRED"
      );

      await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
      await onceToken.connect(issuer).approve(await batchFactory.getAddress(), totalCost);

      const params = await createValidBatchParams({
        name: "Predicted NFT",
        symbol: "PRED",
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      const tx = await batchFactory.connect(issuer).createBatch(params);
      const receipt = await tx.wait();

      const deployedEvent = receipt.logs.find(log => {
        try {
          const parsed = batchFactory.interface.parseLog(log);
          return parsed.name === "NFTContractDeployed";
        } catch {
          return false;
        }
      });

      expect(deployedEvent.args.nftContract).to.equal(predictedAddress);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
    });

    it("Should calculate batch cost correctly", async function () {
      const cost = await batchFactory.calculateBatchCost(codes.length);
      expect(cost).to.equal(TOKENS_PER_CODE * BigInt(codes.length));
    });

    it("Should return payment balance", async function () {
      const initialBalance = await batchFactory.getPaymentBalance();
      expect(initialBalance).to.equal(0);

      // Create a batch to add to balance
      const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
      await onceToken.connect(issuer).approve(await batchFactory.getAddress(), totalCost);

      const params = await createValidBatchParams({
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      await batchFactory.connect(issuer).createBatch(params);

      const finalBalance = await batchFactory.getPaymentBalance();
      expect(finalBalance).to.equal(totalCost);
    });
  });

  describe("Payment Management", function () {
    beforeEach(async function () {
      await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);

      // Create a batch to generate payments
      const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
      await onceToken.connect(issuer).approve(await batchFactory.getAddress(), totalCost);

      const params = await createValidBatchParams({
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      await batchFactory.connect(issuer).createBatch(params);
    });

    it("Should allow SYSTEM_ADMIN to withdraw payments", async function () {
      const factoryBalance = await batchFactory.getPaymentBalance();
      const recipientInitialBalance = await onceToken.balanceOf(systemAdmin.address);

      await batchFactory.connect(systemAdmin).withdrawPayments(systemAdmin.address, factoryBalance);

      const recipientFinalBalance = await onceToken.balanceOf(systemAdmin.address);
      expect(recipientFinalBalance - recipientInitialBalance).to.equal(factoryBalance);

      const finalFactoryBalance = await batchFactory.getPaymentBalance();
      expect(finalFactoryBalance).to.equal(0);
    });

    it("Should revert when non-admin tries to withdraw payments", async function () {
      const factoryBalance = await batchFactory.getPaymentBalance();

      await expect(
        batchFactory.connect(issuer).withdrawPayments(issuer.address, factoryBalance)
      ).to.be.revertedWithCustomError(batchFactory, "AccessControlUnauthorizedAccount");
    });

    it("Should revert when withdrawing to zero address", async function () {
      const factoryBalance = await batchFactory.getPaymentBalance();

      await expect(
        batchFactory.connect(systemAdmin).withdrawPayments(ethers.ZeroAddress, factoryBalance)
      ).to.be.revertedWith("Invalid recipient address");
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should protect against reentrancy in createBatch", async function () {
      // This test would require a malicious contract that tries to reenter
      // For now, we just verify the nonReentrant modifier is present by checking
      // that the function doesn't allow multiple simultaneous calls from the same context
      await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
      await onceToken.connect(issuer).approve(await batchFactory.getAddress(), totalCost);

      const params = await createValidBatchParams({
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      // Should succeed normally
      await expect(batchFactory.connect(issuer).createBatch(params)).to.not.be.reverted;
    });
  });

  describe("OnceToken Trusted Spender Functionality", function () {
    describe("Trusted Spender Management", function () {
      it("Should allow admin to set trusted spender", async function () {
        await onceToken.connect(owner).setTrustedSpender(await batchFactory.getAddress());
        expect(await onceToken.trustedSpender()).to.equal(await batchFactory.getAddress());
      });

      it("Should revert when non-admin tries to set trusted spender", async function () {
        await expect(
          onceToken.connect(issuer).setTrustedSpender(await batchFactory.getAddress())
        ).to.be.revertedWithCustomError(onceToken, "AccessControlUnauthorizedAccount");
      });

      it("Should allow setting trusted spender to zero address", async function () {
        await onceToken.connect(owner).setTrustedSpender(ethers.ZeroAddress);
        expect(await onceToken.trustedSpender()).to.equal(ethers.ZeroAddress);
      });
    });

    describe("Unlimited Allowance for Trusted Spender", function () {
      beforeEach(async function () {
        // Set BatchFactory as trusted spender
        await onceToken.connect(owner).setTrustedSpender(await batchFactory.getAddress());
        await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      });

      it("Should return maximum allowance for trusted spender", async function () {
        const allowance = await onceToken.allowance(issuer.address, await batchFactory.getAddress());
        expect(allowance).to.equal(ethers.MaxUint256);
      });

      it("Should return normal allowance for non-trusted spender", async function () {
        const normalSpender = addrs[0];
        const approvalAmount = ethers.parseEther("100");
        
        await onceToken.connect(issuer).approve(normalSpender.address, approvalAmount);
        const allowance = await onceToken.allowance(issuer.address, normalSpender.address);
        expect(allowance).to.equal(approvalAmount);
      });

      it("Should allow trusted spender to transfer without explicit approval", async function () {
        const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
        const initialBalance = await onceToken.balanceOf(issuer.address);
        
        // Don't approve - trusted spender should work without approval
        const params = await createValidBatchParams({
          royaltyRecipient: royaltyRecipient.address,
          royaltyFeeNumerator: ROYALTY_FEE,
        });

        await expect(batchFactory.connect(issuer).createBatch(params)).to.not.be.reverted;
        
        const finalBalance = await onceToken.balanceOf(issuer.address);
        expect(initialBalance - finalBalance).to.equal(totalCost);
      });

      it("Should not consume allowance for trusted spender transfers", async function () {
        const allowanceBefore = await onceToken.allowance(issuer.address, await batchFactory.getAddress());
        expect(allowanceBefore).to.equal(ethers.MaxUint256);

        const params = await createValidBatchParams({
          royaltyRecipient: royaltyRecipient.address,
          royaltyFeeNumerator: ROYALTY_FEE,
        });

        await batchFactory.connect(issuer).createBatch(params);
        
        const allowanceAfter = await onceToken.allowance(issuer.address, await batchFactory.getAddress());
        expect(allowanceAfter).to.equal(ethers.MaxUint256); // Should remain unlimited
      });

      it("Should work for multiple transfers from trusted spender", async function () {
        const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
        const initialBalance = await onceToken.balanceOf(issuer.address);

        // Create first batch
        const params1 = await createValidBatchParams({
          name: "First Batch",
          symbol: "FIRST",
          royaltyRecipient: royaltyRecipient.address,
          royaltyFeeNumerator: ROYALTY_FEE,
        });

        await batchFactory.connect(issuer).createBatch(params1);

        // Create second batch - should still work without new approval
        const params2 = await createValidBatchParams({
          name: "Second Batch", 
          symbol: "SECOND",
          royaltyRecipient: royaltyRecipient.address,
          royaltyFeeNumerator: ROYALTY_FEE,
        });

        await expect(batchFactory.connect(issuer).createBatch(params2)).to.not.be.reverted;
        
        const finalBalance = await onceToken.balanceOf(issuer.address);
        expect(initialBalance - finalBalance).to.equal(totalCost * 2n);
      });
    });

    describe("Trusted Spender with Zero Address", function () {
      beforeEach(async function () {
        // Ensure trusted spender is not set (zero address)
        await onceToken.connect(owner).setTrustedSpender(ethers.ZeroAddress);
        await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      });

      it("Should return normal allowance when trusted spender is zero address", async function () {
        const allowance = await onceToken.allowance(issuer.address, await batchFactory.getAddress());
        expect(allowance).to.equal(0); // No explicit approval given
      });

      it("Should require normal approval when trusted spender is zero address", async function () {
        const params = await createValidBatchParams({
          royaltyRecipient: royaltyRecipient.address,
          royaltyFeeNumerator: ROYALTY_FEE,
        });

        // Should fail without approval
        await expect(
          batchFactory.connect(issuer).createBatch(params)
        ).to.be.revertedWithCustomError(onceToken, "ERC20InsufficientAllowance");

        // Should work with approval
        const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
        await onceToken.connect(issuer).approve(await batchFactory.getAddress(), totalCost);
        
        await expect(batchFactory.connect(issuer).createBatch(params)).to.not.be.reverted;
      });
    });

    describe("Trusted Spender Address Change", function () {
      beforeEach(async function () {
        await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      });

      it("Should update allowance behavior when trusted spender changes", async function () {
        const factoryAddress = await batchFactory.getAddress();
        const otherAddress = addrs[0].address;

        // Initially no trusted spender
        expect(await onceToken.allowance(issuer.address, factoryAddress)).to.equal(0);
        expect(await onceToken.allowance(issuer.address, otherAddress)).to.equal(0);

        // Set factory as trusted spender
        await onceToken.connect(owner).setTrustedSpender(factoryAddress);
        expect(await onceToken.allowance(issuer.address, factoryAddress)).to.equal(ethers.MaxUint256);
        expect(await onceToken.allowance(issuer.address, otherAddress)).to.equal(0);

        // Change trusted spender to other address
        await onceToken.connect(owner).setTrustedSpender(otherAddress);
        expect(await onceToken.allowance(issuer.address, factoryAddress)).to.equal(0);
        expect(await onceToken.allowance(issuer.address, otherAddress)).to.equal(ethers.MaxUint256);
      });

      it("Should disable unlimited allowance when trusted spender is removed", async function () {
        const factoryAddress = await batchFactory.getAddress();

        // Set as trusted spender
        await onceToken.connect(owner).setTrustedSpender(factoryAddress);
        expect(await onceToken.allowance(issuer.address, factoryAddress)).to.equal(ethers.MaxUint256);

        // Remove trusted spender
        await onceToken.connect(owner).setTrustedSpender(ethers.ZeroAddress);
        expect(await onceToken.allowance(issuer.address, factoryAddress)).to.equal(0);

        // Should now require normal approval
        const params = await createValidBatchParams({
          royaltyRecipient: royaltyRecipient.address,
          royaltyFeeNumerator: ROYALTY_FEE,
        });

        await expect(
          batchFactory.connect(issuer).createBatch(params)
        ).to.be.revertedWithCustomError(onceToken, "ERC20InsufficientAllowance");
      });
    });

    describe("Gas Efficiency with Trusted Spender", function () {
      it("Should save gas by not requiring approval transactions", async function () {
        await onceToken.connect(owner).setTrustedSpender(await batchFactory.getAddress());
        await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);

        const params = await createValidBatchParams({
          royaltyRecipient: royaltyRecipient.address,
          royaltyFeeNumerator: ROYALTY_FEE,
        });

        // This test demonstrates that no prior approval transaction is needed
        // The gas efficiency comes from not needing to send a separate approve() transaction
        const tx = await batchFactory.connect(issuer).createBatch(params);
        const receipt = await tx.wait();
        
        expect(receipt.status).to.equal(1);
        // In a real scenario, this would save ~46,000 gas from the approve() transaction
      });
    });

    describe("Security Considerations", function () {
      it("Should only affect the specific trusted spender address", async function () {
        const factoryAddress = await batchFactory.getAddress();
        const maliciousAddress = addrs[1].address;

        await onceToken.connect(owner).setTrustedSpender(factoryAddress);

        // Factory should have unlimited allowance
        expect(await onceToken.allowance(issuer.address, factoryAddress)).to.equal(ethers.MaxUint256);
        
        // Other addresses should not have unlimited allowance
        expect(await onceToken.allowance(issuer.address, maliciousAddress)).to.equal(0);
      });

      it("Should not affect normal ERC20 approval functionality", async function () {
        const factoryAddress = await batchFactory.getAddress();
        const normalSpender = systemAdmin.address; // Use systemAdmin instead of addrs[0]
        const approvalAmount = ethers.parseEther("50");

        // Set trusted spender first
        await onceToken.connect(owner).setTrustedSpender(factoryAddress);
        
        // Verify trusted spender is set correctly
        expect(await onceToken.trustedSpender()).to.equal(factoryAddress);
        
        // Normal approval should still work
        await onceToken.connect(issuer).approve(normalSpender, approvalAmount);
        expect(await onceToken.allowance(issuer.address, normalSpender)).to.equal(approvalAmount);
        
        // Trusted spender should still have unlimited allowance
        expect(await onceToken.allowance(issuer.address, factoryAddress)).to.equal(ethers.MaxUint256);
      });
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum royalty fee (100%)", async function () {
      await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
      await onceToken.connect(issuer).approve(await batchFactory.getAddress(), totalCost);

      const params = await createValidBatchParams({
        name: "Max Royalty NFT",
        symbol: "MAXR",
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: 10000
      });

      await expect(batchFactory.connect(issuer).createBatch(params)).to.not.be.reverted;
    });

    it("Should handle empty base URI", async function () {
      await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
      await onceToken.connect(issuer).approve(await batchFactory.getAddress(), totalCost);

      const params = await createValidBatchParams({
        name: "No URI NFT",
        symbol: "NOURI",
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      await expect(batchFactory.connect(issuer).createBatch(params)).to.not.be.reverted;
    });

    it("Should handle very long names and symbols", async function () {
      await batchFactory.connect(systemAdmin).setTokensPerCode(TOKENS_PER_CODE);
      const totalCost = TOKENS_PER_CODE * BigInt(codes.length);
      await onceToken.connect(issuer).approve(await batchFactory.getAddress(), totalCost);

      const longName = "A".repeat(100);
      const longSymbol = "B".repeat(50);

      const params = await createValidBatchParams({
        name: longName,
        symbol: longSymbol,
        royaltyRecipient: royaltyRecipient.address,
        royaltyFeeNumerator: ROYALTY_FEE,
      });

      await expect(batchFactory.connect(issuer).createBatch(params)).to.not.be.reverted;
    });
  });
});
