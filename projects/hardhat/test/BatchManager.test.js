const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");

describe("BatchManager", function () {
  let batchManager;
  let once721Template;
  let once1155Template;
  let batchFactory;
  let onceToken;
  let owner;
  let systemAdmin;
  let trustedSigner;
  let issuer;
  let claimer;
  let batchAdmin;
  let addrs;

  // Constants
  const SYSTEM_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SYSTEM_ADMIN_ROLE"));
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

  // Test data - Need at least 10 codes to meet minimum requirement
  const codes = ["CODE001", "CODE002", "CODE003", "CODE004", "CODE005", 
                 "CODE006", "CODE007", "CODE008", "CODE009", "CODE010"];
  let merkleTree;
  let merkleRoot;
  let merkleProofs = {};

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

  // Helper function to create backend signature for batch creation
  async function createBatchCreationSignature(params, issuer, nonce, deadline, signer) {
    const messageHash = ethers.keccak256(ethers.solidityPacked(
      ["address", "uint8", "string", "string", "bytes32", "uint256", "uint256", "address", "uint96", "string", "uint256", "uint256"],
      [
        issuer,
        params.nftType,
        params.name,
        params.symbol,
        params.merkleRoot,
        params.totalCodes,
        params.expireTime,
        params.royaltyRecipient,
        params.royaltyFeeNumerator,
        params.baseURI,
        deadline,
        nonce
      ]
    ));

    return await signer.signMessage(ethers.getBytes(messageHash));
  }

  beforeEach(async function () {
    // Get signers
    [owner, systemAdmin, trustedSigner, issuer, claimer, batchAdmin, ...addrs] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const OnceToken = await ethers.getContractFactory("OnceToken");
    onceToken = await OnceToken.deploy(owner.address, owner.address);
    await onceToken.waitForDeployment();
    onceToken.mint(owner.address, ethers.parseEther("1000000")); // Mint 1 million tokens to owner

    // Deploy templates
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

    // Grant SYSTEM_ADMIN_ROLE to systemAdmin
    await batchManager.connect(owner).grantRole(SYSTEM_ADMIN_ROLE, systemAdmin.address);
    
    // Grant SYSTEM_ADMIN_ROLE to systemAdmin in BatchFactory as well
    const FACTORY_SYSTEM_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SYSTEM_ADMIN_ROLE"));
    await batchFactory.connect(owner).grantRole(FACTORY_SYSTEM_ADMIN_ROLE, systemAdmin.address);

    // Set minimum codes to match our test data
    await batchFactory.connect(systemAdmin).setMinCodesPerBatch(codes.length);

    // Add trusted signer to both contracts
    await batchManager.connect(systemAdmin).addTrustedSigner(trustedSigner.address);
    await batchFactory.connect(systemAdmin).addTrustedSigner(trustedSigner.address);

    // Grant BATCH_FACTORY_ROLE to BatchFactory in BatchManager
    await batchManager.connect(systemAdmin).setBatchFactory(await batchFactory.getAddress());

    // Distribute mock tokens
    await onceToken.transfer(issuer.address, ethers.parseEther("10000"));
    await onceToken.connect(issuer).approve(await batchFactory.getAddress(), ethers.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("Should deploy with correct initial state", async function () {
      expect(await batchManager.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await batchManager.hasRole(SYSTEM_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await batchManager.getCurrentBatchId()).to.equal(0);
      expect(await batchManager.paused()).to.be.false;
    });

    it("Should set trusted signer correctly", async function () {
      expect(await batchManager.isTrustedSigner(trustedSigner.address)).to.be.true;
    });

    it("Should set batch factory role correctly", async function () {
      expect(await batchManager.isBatchFactory(await batchFactory.getAddress())).to.be.true;
    });
  });

  describe("Batch Creation", function () {
    beforeEach(async function () {
      // Create NFT contract and batch through factory
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const nonce = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 0, // ERC721
        name: "Test NFT",
        symbol: "TNFT",
        merkleRoot: merkleRoot,
        totalCodes: codes.length,
        expireTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250, // 2.5%
        baseURI: "",  // Empty base URI to avoid access control issues
        deadline: deadline,
        backendSig: "0x" // Will be replaced with actual signature
      };
      
      // Create backend signature
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce,
        deadline,
        trustedSigner
      );

      const tx = await batchFactory.connect(issuer).createBatch(createBatchParams);
      const receipt = await tx.wait();
    });

    it("Should create batch with correct parameters", async function () {
      const batchInfo = await batchManager.getBatchInfo(1);
      
      expect(batchInfo.batchId).to.equal(1);
      expect(batchInfo.issuer).to.equal(issuer.address);
      expect(batchInfo.merkleRoot).to.equal(merkleRoot);
      expect(batchInfo.totalCodes).to.equal(codes.length);
      expect(batchInfo.claimedCodes).to.equal(0);
      expect(batchInfo.isPaused).to.be.false;
      expect(batchInfo.isNFT721).to.be.true;
    });

    it("Should emit BatchCreated event", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 0, // ERC721
        name: "Test NFT 2",
        symbol: "TNFT2",
        merkleRoot: merkleRoot,
        totalCodes: codes.length,
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250,
        baseURI: "",
        deadline: deadline,
        backendSig: "0x"
      };
      
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce,
        deadline,
        trustedSigner
      );

      await expect(batchFactory.connect(issuer).createBatch(createBatchParams))
        .to.emit(batchManager, "BatchCreated");
    });

    it("Should track issuer batches", async function () {
      const issuerBatches = await batchManager.getIssuerBatches(issuer.address);
      expect(issuerBatches).to.include(BigInt(1));
    });

    it("Should increment batch ID correctly", async function () {
      expect(await batchManager.getCurrentBatchId()).to.equal(1);
    });
  });

  // Helper function - move outside of describe blocks so it's available everywhere
  async function createBackendSignature(
      batchId,
      codeId,
      to,
      nftType,
      tokenId,
      nonce,
      deadline
    ) {
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(codeId));
      
      const messageHash = ethers.keccak256(
        ethers.solidityPacked(
          ["uint256", "bytes32", "address", "uint256", "uint256", "uint256", "uint256"],
          [batchId, codeHash, to, nftType, tokenId, nonce, deadline]
        )
      );

      const signature = await trustedSigner.signMessage(ethers.getBytes(messageHash));
      return signature;
    }

  describe("Code Claiming", function () {
    let batchId;
    let nftContract;

    beforeEach(async function () {
      // Create batch
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 0, // ERC721
        name: "Test NFT",
        symbol: "TNFT",
        merkleRoot: merkleRoot,
        totalCodes: codes.length,
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250,
        baseURI: "",
        deadline: deadline,
        backendSig: "0x"
      };
      
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce,
        deadline,
        trustedSigner
      );

      const tx = await batchFactory.connect(issuer).createBatch(createBatchParams);
      const receipt = await tx.wait();
      
      // Extract batch ID and NFT contract from events
      const batchCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = batchManager.interface.parseLog(log);
          return parsed.name === "BatchCreated";
        } catch {
          return false;
        }
      });
      
      if (batchCreatedEvent) {
        const parsed = batchManager.interface.parseLog(batchCreatedEvent);
        batchId = parsed.args.batchId;
        nftContract = parsed.args.nftContract;
      }
    });

    it("Should allow valid code claim for ERC721", async function () {
      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const tokenId = 0; // Must be 0 for ERC721
      const nonce = 0; // Current claimed codes
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0, // NFT type: ERC721
        tokenId,
        nonce,
        deadline
      );

      await expect(
        batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          backendSig,
          merkleProofs[codeId]
        )
      ).to.emit(batchManager, "CodeClaimed")
        .withArgs(batchId, codeId, claimer.address);

      // Check if code is marked as claimed
      expect(await batchManager.isCodeClaimed(batchId, codeId)).to.be.true;

      // Check if NFT was minted
      const Once721 = await ethers.getContractFactory("Once721TemplateV2");
      const nftContractInstance = Once721.attach(nftContract);
      expect(await nftContractInstance.balanceOf(claimer.address)).to.equal(1);
    });

    it("Should create batch for ERC1155 and allow claiming", async function () {
      // Create ERC1155 batch
      const deadline1155 = Math.floor(Date.now() / 1000) + 3600;
      const nonce1155 = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 1, // ERC1155_ART
        name: "Test ERC1155",
        symbol: "T1155",
        merkleRoot: merkleRoot,
        totalCodes: codes.length,
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250,
        baseURI: "",
        deadline: deadline1155,
        backendSig: "0x"
      };
      
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce1155,
        deadline1155,
        trustedSigner
      );

      const tx = await batchFactory.connect(issuer).createBatch(createBatchParams);
      const receipt = await tx.wait();
      
      const batchCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = batchManager.interface.parseLog(log);
          return parsed.name === "BatchCreated";
        } catch {
          return false;
        }
      });
      
      let erc1155BatchId, erc1155Contract;
      if (batchCreatedEvent) {
        const parsed = batchManager.interface.parseLog(batchCreatedEvent);
        erc1155BatchId = parsed.args.batchId;
        erc1155Contract = parsed.args.nftContract;
      }

      // Claim code for ERC1155
      const codeId = codes[0];
      const claimDeadline = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
      const tokenId = 1; // Must be > 0 for ERC1155
      const claimNonce = await batchManager.getWalletNonce(claimer.address);
      
      const backendSig = await createBackendSignature(
        erc1155BatchId,
        codeId,
        claimer.address,
        1, // NFT type: ERC1155
        tokenId,
        claimNonce,
        claimDeadline
      );

      await expect(
        batchManager.connect(claimer).claimCode(
          erc1155BatchId,
          codeId,
          tokenId,
          claimDeadline,
          backendSig,
          merkleProofs[codeId]
        )
      ).to.emit(batchManager, "CodeClaimed")
        .withArgs(erc1155BatchId, codeId, claimer.address);

      // Check if NFT was minted
      const Once1155 = await ethers.getContractFactory("Once1155TemplateV2");
      const nftContractInstance = Once1155.attach(erc1155Contract);
      expect(await nftContractInstance.balanceOf(claimer.address, tokenId)).to.equal(1);
    });

    it("Should reject already claimed code", async function () {
      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
      const tokenId = 0;
      const nonce = 0;
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );

      // First claim should succeed
      await batchManager.connect(claimer).claimCode(
        batchId,
        codeId,
        tokenId,
        deadline,
        backendSig,
        merkleProofs[codeId]
      );

      // Second claim should fail
      const backendSig2 = await createBackendSignature(
        batchId,
        codeId,
        addrs[0].address,
        0,
        tokenId,
        1, // Different nonce
        deadline
      );

      await expect(
        batchManager.connect(addrs[0]).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          backendSig2,
          merkleProofs[codeId]
        )
      ).to.be.revertedWith("Code already claimed");
    });

    it("Should reject invalid merkle proof", async function () {
      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const tokenId = 0;
      const nonce = 0;
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );

      // Use wrong proof
      const wrongProof = merkleProofs[codes[1]];

      await expect(
        batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          backendSig,
          wrongProof
        )
      ).to.be.revertedWith("Invalid merkle proof");
    });

    it("Should reject expired signature", async function () {
      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) - 300; // 5 minutes ago
      const tokenId = 0;
      const nonce = 0;
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );

      await expect(
        batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          backendSig,
          merkleProofs[codeId]
        )
      ).to.be.revertedWith("Signature expired");
    });

    it("Should reject signature from untrusted signer", async function () {
      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
      const tokenId = 0;
      const nonce = 0;
      
      // Sign with untrusted signer
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(codeId));
      const messageHash = ethers.keccak256(
        ethers.solidityPacked(
          ["uint256", "bytes32", "address", "uint256", "uint256", "uint256", "uint256"],
          [batchId, codeHash, claimer.address, 0, tokenId, nonce, deadline]
        )
      );

      const untrustedSig = await addrs[0].signMessage(ethers.getBytes(messageHash));

      await expect(
        batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          untrustedSig,
          merkleProofs[codeId]
        )
      ).to.be.revertedWith("Invalid signer");
    });

    it("Should handle signature generation and verification correctly", async function () {
      // This test verifies that signatures are generated and verified correctly
      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const tokenId = 0;
      const nonce = 0;
      
      const signature1 = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );
      
      const signature2 = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );
      
      // Same parameters should generate identical signatures
      expect(signature1).to.equal(signature2);
      
      // Claim should succeed with valid signature
      await batchManager.connect(claimer).claimCode(
        batchId,
        codeId,
        tokenId,
        deadline,
        signature1,
        merkleProofs[codeId]
      );

      // Verify the code is claimed
      const isCodeClaimed = await batchManager.isCodeClaimed(batchId, codeId);
      expect(isCodeClaimed).to.be.true;
    });

    it("Should validate token ID correctly for ERC721 vs ERC1155", async function () {
      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = 0;
      
      // For ERC721, tokenId must be 0
      const backendSigWrongTokenId = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        1, // Wrong: should be 0 for ERC721
        nonce,
        deadline
      );

      await expect(
        batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          1, // Wrong tokenId
          deadline,
          backendSigWrongTokenId,
          merkleProofs[codeId]
        )
      ).to.be.revertedWith("TokenId must be 0 for ERC721");
    });

    it("Should update claimed codes counter", async function () {
      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const tokenId = 0;
      const nonce = 0;
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );

      const batchInfoBefore = await batchManager.getBatchInfo(batchId);
      expect(batchInfoBefore.claimedCodes).to.equal(0);

      await batchManager.connect(claimer).claimCode(
        batchId,
        codeId,
        tokenId,
        deadline,
        backendSig,
        merkleProofs[codeId]
      );

      const batchInfoAfter = await batchManager.getBatchInfo(batchId);
      expect(batchInfoAfter.claimedCodes).to.equal(1);
    });
  });

  describe("Pause Functionality", function () {
    let batchId;

    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 0,
        name: "Test NFT",
        symbol: "TNFT",
        merkleRoot: merkleRoot,
        totalCodes: codes.length,
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250,
        baseURI: "",
        deadline: deadline,
        backendSig: "0x"
      };
      
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce,
        deadline,
        trustedSigner
      );

      const tx = await batchFactory.connect(issuer).createBatch(createBatchParams);
      const receipt = await tx.wait();
      
      const batchCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = batchManager.interface.parseLog(log);
          return parsed.name === "BatchCreated";
        } catch {
          return false;
        }
      });
      
      if (batchCreatedEvent) {
        const parsed = batchManager.interface.parseLog(batchCreatedEvent);
        batchId = parsed.args.batchId;
      }
    });

    it("Should allow system admin to pause contract globally", async function () {
      await batchManager.connect(systemAdmin).pause();
      expect(await batchManager.paused()).to.be.true;

      // Should prevent claiming when paused
      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const tokenId = 0;
      const nonce = 0;
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );

      await expect(
        batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          backendSig,
          merkleProofs[codeId]
        )
      ).to.be.revertedWithCustomError(batchManager, "EnforcedPause");
    });

    it("Should allow system admin to pause specific batch", async function () {
      await batchManager.connect(systemAdmin).pauseBatch(batchId, true);
      
      const batchInfo = await batchManager.getBatchInfo(batchId);
      expect(batchInfo.isPaused).to.be.true;

      // Should prevent claiming from paused batch
      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const tokenId = 0;
      const nonce = 0;
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );

      await expect(
        batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          backendSig,
          merkleProofs[codeId]
        )
      ).to.be.revertedWith("Batch is paused");
    });

    it("Should allow system admin to pause issuer", async function () {
      await batchManager.connect(systemAdmin).pauseIssuer(issuer.address, true);

      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const tokenId = 0;
      const nonce = 0;
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );

      await expect(
        batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          backendSig,
          merkleProofs[codeId]
        )
      ).to.be.revertedWith("Issuer is paused");
    });

    it("Should allow system admin to pause issuer when creating batch", async function () {
      await batchManager.connect(systemAdmin).pauseIssuer(issuer.address, true);

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 0,
        name: "Test NFT",
        symbol: "TNFT",
        merkleRoot: merkleRoot,
        totalCodes: codes.length,
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250,
        baseURI: "",
        deadline: deadline,
        backendSig: "0x"
      };
      
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce,
        deadline,
        trustedSigner
      );

      await expect(batchFactory.connect(issuer).createBatch(createBatchParams)).to.be.revertedWith("Issuer is paused");
    });

    it("Should allow system admin to pause wallet globally", async function () {
      await batchManager.connect(systemAdmin).pauseWalletGlobally(claimer.address, true);

      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const tokenId = 0;
      const nonce = 0;
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );

      await expect(
        batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          backendSig,
          merkleProofs[codeId]
        )
      ).to.be.revertedWith("Wallet is paused");
    });

    it("Should allow system admin to pause wallet in specific batch", async function () {
      await batchManager.connect(systemAdmin).pauseWalletInBatch(batchId, claimer.address, true);

      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const tokenId = 0;
      const nonce = 0;
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );

      await expect(
        batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          backendSig,
          merkleProofs[codeId]
        )
      ).to.be.revertedWith("Wallet is paused");
    });

    it("Should allow system admin to pause specific code", async function () {
      const codeId = codes[0];
      await batchManager.connect(systemAdmin).pauseCodeInBatch(batchId, codeId, true);

      expect(await batchManager.isCodePaused(batchId, codeId)).to.be.true;

      const deadline = Math.floor(Date.now() / 1000) + 600;
      const tokenId = 0;
      const nonce = 0;
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );

      await expect(
        batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          backendSig,
          merkleProofs[codeId]
        )
      ).to.be.revertedWith("Code is paused");
    });

    it("Should allow batch owner to pause their batch", async function () {
      await batchManager.connect(issuer).pauseBatch(batchId, true);
      
      const batchInfo = await batchManager.getBatchInfo(batchId);
      expect(batchInfo.isPaused).to.be.true;
    });

    it("Should not allow non-authorized users to pause", async function () {
      await expect(
        batchManager.connect(claimer).pauseBatch(batchId, true)
      ).to.be.revertedWith("Not authorized");

      await expect(
        batchManager.connect(claimer).pauseIssuer(issuer.address, true)
      ).to.be.revertedWithCustomError(batchManager, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Access Control and Admin Functions", function () {
    let batchId;

    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 0,
        name: "Test NFT",
        symbol: "TNFT",
        merkleRoot: merkleRoot,
        totalCodes: codes.length,
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250,
        baseURI: "",
        deadline: deadline,
        backendSig: "0x"
      };
      
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce,
        deadline,
        trustedSigner
      );

      const tx = await batchFactory.connect(issuer).createBatch(createBatchParams);
      const receipt = await tx.wait();
      
      const batchCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = batchManager.interface.parseLog(log);
          return parsed.name === "BatchCreated";
        } catch {
          return false;
        }
      });
      
      if (batchCreatedEvent) {
        const parsed = batchManager.interface.parseLog(batchCreatedEvent);
        batchId = parsed.args.batchId;
      }
    });

    it("Should allow batch owner to add and remove batch admin", async function () {
      // Add batch admin
      await batchManager.connect(issuer).addBatchAdmin(batchId, batchAdmin.address);
      expect(await batchManager.isBatchAdmin(batchId, batchAdmin.address)).to.be.true;

      // Batch admin should be able to pause batch
      await batchManager.connect(batchAdmin).pauseBatch(batchId, true);
      
      const batchInfo = await batchManager.getBatchInfo(batchId);
      expect(batchInfo.isPaused).to.be.true;

      // Remove batch admin
      await batchManager.connect(issuer).removeBatchAdmin(batchId, batchAdmin.address);
      expect(await batchManager.isBatchAdmin(batchId, batchAdmin.address)).to.be.false;

      // Should no longer be able to pause batch
      await expect(
        batchManager.connect(batchAdmin).pauseBatch(batchId, false)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should not allow non-owner to add batch admin", async function () {
      await expect(
        batchManager.connect(claimer).addBatchAdmin(batchId, batchAdmin.address)
      ).to.be.revertedWith("Only batch owner can add admin");
    });

    it("Should allow system admin to manage trusted signers", async function () {
      const newSigner = addrs[0];
      
      // Add trusted signer
      await batchManager.connect(systemAdmin).addTrustedSigner(newSigner.address);
      expect(await batchManager.isTrustedSigner(newSigner.address)).to.be.true;

      // Remove trusted signer
      await batchManager.connect(systemAdmin).removeTrustedSigner(newSigner.address);
      expect(await batchManager.isTrustedSigner(newSigner.address)).to.be.false;
    });

    it("Should not allow duplicate trusted signers", async function () {
      await expect(
        batchManager.connect(systemAdmin).addTrustedSigner(trustedSigner.address)
      ).to.be.revertedWith("Signer already exists");
    });

    it("Should not allow removing non-existent trusted signer", async function () {
      await expect(
        batchManager.connect(systemAdmin).removeTrustedSigner(addrs[0].address)
      ).to.be.revertedWith("Signer does not exist");
    });

    it("Should allow system admin to manage batch factory role", async function () {
      const newFactory = addrs[0]; // Use any address as mock factory

      // Add batch factory
      await expect(
        batchManager.connect(systemAdmin).setBatchFactory(newFactory.address)
      ).to.emit(batchManager, "BatchFactorySet")
       .withArgs(newFactory.address);

      expect(await batchManager.isBatchFactory(newFactory.address)).to.be.true;

      // Remove batch factory
      await expect(
        batchManager.connect(systemAdmin).removeBatchFactory(newFactory.address)  
      ).to.emit(batchManager, "BatchFactoryRemoved")
       .withArgs(newFactory.address);

      expect(await batchManager.isBatchFactory(newFactory.address)).to.be.false;
    });

    it("Should not allow non-admin to manage batch factory role", async function () {
      const newFactory = addrs[0];

      await expect(
        batchManager.connect(claimer).setBatchFactory(newFactory.address)
      ).to.be.revertedWithCustomError(batchManager, "AccessControlUnauthorizedAccount");

      await expect(
        batchManager.connect(claimer).removeBatchFactory(newFactory.address)
      ).to.be.revertedWithCustomError(batchManager, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow setting zero address as batch factory", async function () {
      await expect(
        batchManager.connect(systemAdmin).setBatchFactory(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid batch factory address");
    });

    it("Should allow setting batch expire time", async function () {
      const newExpireTime = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
      
      await batchManager.connect(issuer).setBatchExpireTime(batchId, newExpireTime);
      
      const batchInfo = await batchManager.getBatchInfo(batchId);
      expect(batchInfo.expireTime).to.equal(newExpireTime);
    });

    it("Should reject claiming from expired batch", async function () {
      // Set batch to expire in the past
      const pastExpireTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      await batchManager.connect(issuer).setBatchExpireTime(batchId, pastExpireTime);

      const codeId = codes[0];
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const tokenId = 0;
      const nonce = 0;
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );

      await expect(
        batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          backendSig,
          merkleProofs[codeId]
        )
      ).to.be.revertedWith("Batch expired");
    });
  });

  describe("View Functions", function () {
    let batchId;

    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 0,
        name: "Test NFT",
        symbol: "TNFT",
        merkleRoot: merkleRoot,
        totalCodes: codes.length,
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250,
        baseURI: "",
        deadline: deadline,
        backendSig: "0x"
      };
      
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce,
        deadline,
        trustedSigner
      );

      const tx = await batchFactory.connect(issuer).createBatch(createBatchParams);
      const receipt = await tx.wait();
      
      const batchCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = batchManager.interface.parseLog(log);
          return parsed.name === "BatchCreated";
        } catch {
          return false;
        }
      });
      
      if (batchCreatedEvent) {
        const parsed = batchManager.interface.parseLog(batchCreatedEvent);
        batchId = parsed.args.batchId;
      }
    });

    it("Should return correct batch info", async function () {
      const batchInfo = await batchManager.getBatchInfo(batchId);
      
      expect(batchInfo.batchId).to.equal(batchId);
      expect(batchInfo.issuer).to.equal(issuer.address);
      expect(batchInfo.merkleRoot).to.equal(merkleRoot);
      expect(batchInfo.totalCodes).to.equal(codes.length);
      expect(batchInfo.claimedCodes).to.equal(0);
      expect(batchInfo.isPaused).to.be.false;
      expect(batchInfo.isNFT721).to.be.true;
    });

    it("Should return correct code claim status", async function () {
      const codeId = codes[0];
      
      expect(await batchManager.isCodeClaimed(batchId, codeId)).to.be.false;
      
      // Claim the code
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const tokenId = 0;
      const nonce = 0;
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0,
        tokenId,
        nonce,
        deadline
      );

      await batchManager.connect(claimer).claimCode(
        batchId,
        codeId,
        tokenId,
        deadline,
        backendSig,
        merkleProofs[codeId]
      );
      
      expect(await batchManager.isCodeClaimed(batchId, codeId)).to.be.true;
    });

    it("Should return correct code pause status", async function () {
      const codeId = codes[0];
      
      expect(await batchManager.isCodePaused(batchId, codeId)).to.be.false;
      
      await batchManager.connect(systemAdmin).pauseCodeInBatch(batchId, codeId, true);
      
      expect(await batchManager.isCodePaused(batchId, codeId)).to.be.true;
    });

    it("Should return issuer batches", async function () {
      const issuerBatches = await batchManager.getIssuerBatches(issuer.address);
      expect(issuerBatches).to.include(BigInt(batchId));
    });

    it("Should return current batch ID", async function () {
      expect(await batchManager.getCurrentBatchId()).to.equal(batchId);
    });

    it("Should revert for non-existent batch", async function () {
      await expect(
        batchManager.getBatchInfo(999)
      ).to.be.revertedWith("Batch does not exist");
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle batch creation with zero expire time", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 0,
        name: "Test NFT",
        symbol: "TNFT",
        merkleRoot: merkleRoot,
        totalCodes: codes.length,
        expireTime: 0, // No expiration
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250,
        baseURI: "",
        deadline: deadline,
        backendSig: "0x"
      };
      
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce,
        deadline,
        trustedSigner
      );

      const tx = await batchFactory.connect(issuer).createBatch(createBatchParams);
      const receipt = await tx.wait();
      
      // Should succeed - no expiration is valid
      expect(receipt.status).to.equal(1);
    });

    it("Should handle multiple code claims in same batch", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 0,
        name: "Test NFT",
        symbol: "TNFT",
        merkleRoot: merkleRoot,
        totalCodes: codes.length,
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250,
        baseURI: "",
        deadline: deadline,
        backendSig: "0x"
      };
      
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce,
        deadline,
        trustedSigner
      );

      const tx = await batchFactory.connect(issuer).createBatch(createBatchParams);
      const receipt = await tx.wait();
      
      const batchCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = batchManager.interface.parseLog(log);
          return parsed.name === "BatchCreated";
        } catch {
          return false;
        }
      });
      
      let batchId;
      if (batchCreatedEvent) {
        const parsed = batchManager.interface.parseLog(batchCreatedEvent);
        batchId = parsed.args.batchId;
      }

      // Claim multiple codes
      for (let i = 0; i < 3; i++) {
        const codeId = codes[i];
        const deadline = Math.floor(Date.now() / 1000) + 3600;
        const tokenId = 0;
        const nonce = i; // Use index as nonce
        
        const codeHash = ethers.keccak256(ethers.toUtf8Bytes(codeId));
        const messageHash = ethers.keccak256(
          ethers.solidityPacked(
            ["uint256", "bytes32", "address", "uint256", "uint256", "uint256", "uint256"],
            [batchId, codeHash, claimer.address, 0, tokenId, nonce, deadline]
          )
        );

        const backendSig = await trustedSigner.signMessage(ethers.getBytes(messageHash));

        await batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          backendSig,
          merkleProofs[codeId]
        );
      }

      const batchInfo = await batchManager.getBatchInfo(batchId);
      expect(batchInfo.claimedCodes).to.equal(3);
    });

    it("Should handle large merkle trees", async function () {
      // Create a larger merkle tree
      const largeCodes = Array.from({ length: 100 }, (_, i) => `CODE${i.toString().padStart(3, '0')}`);
      const largeLeaves = largeCodes.map(code => ethers.keccak256(ethers.toUtf8Bytes(code)));
      const largeMerkleTree = new MerkleTree(largeLeaves, ethers.keccak256, { sortPairs: true });
      const largeMerkleRoot = largeMerkleTree.getHexRoot();

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 0,
        name: "Large Test NFT",
        symbol: "LTNFT",
        merkleRoot: largeMerkleRoot,
        totalCodes: largeCodes.length,
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250,
        baseURI: "",
        deadline: deadline,
        backendSig: "0x"
      };
      
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce,
        deadline,
        trustedSigner
      );

      // Should be able to create batch with large merkle tree
      const tx = await batchFactory.connect(issuer).createBatch(createBatchParams);
      expect(tx).to.be.ok;
    });

    it("Should prevent direct access to createBatch by non-factory accounts", async function () {
      // Test that only batch factory can call createBatch directly, not even the owner
      await expect(
        batchManager.connect(owner).createBatch(
          issuer.address, // Valid issuer
          await once721Template.getAddress(),
          merkleRoot,
          codes.length,
          Math.floor(Date.now() / 1000) + 3600,
          true
        )
      ).to.be.revertedWithCustomError(batchManager, "AccessControlUnauthorizedAccount");
    });

    it("Should only allow batch factory to call createBatch", async function () {
      // Test that non-factory cannot call createBatch
      await expect(
        batchManager.connect(issuer).createBatch(
          issuer.address,
          await once721Template.getAddress(),
          merkleRoot,
          codes.length,
          Math.floor(Date.now() / 1000) + 3600,
          true
        )
      ).to.be.revertedWithCustomError(batchManager, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Events", function () {
    let batchId;

    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 0,
        name: "Test NFT",
        symbol: "TNFT",
        merkleRoot: merkleRoot,
        totalCodes: codes.length,
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250,
        baseURI: "",
        deadline: deadline,
        backendSig: "0x"
      };
      
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce,
        deadline,
        trustedSigner
      );

      const tx = await batchFactory.connect(issuer).createBatch(createBatchParams);
      const receipt = await tx.wait();
      
      const batchCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = batchManager.interface.parseLog(log);
          return parsed.name === "BatchCreated";
        } catch {
          return false;
        }
      });
      
      if (batchCreatedEvent) {
        const parsed = batchManager.interface.parseLog(batchCreatedEvent);
        batchId = parsed.args.batchId;
      }
    });

    it("Should emit proper events for pause operations", async function () {
      await expect(batchManager.connect(systemAdmin).pauseBatch(batchId, true))
        .to.emit(batchManager, "BatchPaused")
        .withArgs(batchId, true);

      await expect(batchManager.connect(systemAdmin).pauseIssuer(issuer.address, true))
        .to.emit(batchManager, "IssuerPaused")
        .withArgs(issuer.address, true);

      await expect(batchManager.connect(systemAdmin).pauseWalletGlobally(claimer.address, true))
        .to.emit(batchManager, "WalletPaused")
        .withArgs(claimer.address, 0, true, true);

      await expect(batchManager.connect(systemAdmin).pauseCodeInBatch(batchId, codes[0], true))
        .to.emit(batchManager, "CodePaused")
        .withArgs(batchId, codes[0], true);
    });

    it("Should emit events for admin operations", async function () {
      await expect(batchManager.connect(issuer).addBatchAdmin(batchId, batchAdmin.address))
        .to.emit(batchManager, "BatchAdminAdded")
        .withArgs(batchId, batchAdmin.address);

      await expect(batchManager.connect(issuer).removeBatchAdmin(batchId, batchAdmin.address))
        .to.emit(batchManager, "BatchAdminRemoved")
        .withArgs(batchId, batchAdmin.address);

      const newSigner = addrs[0];
      await expect(batchManager.connect(systemAdmin).addTrustedSigner(newSigner.address))
        .to.emit(batchManager, "TrustedSignerAdded")
        .withArgs(newSigner.address);

      await expect(batchManager.connect(systemAdmin).removeTrustedSigner(newSigner.address))
        .to.emit(batchManager, "TrustedSignerRemoved")
        .withArgs(newSigner.address);
    });

    it("Should emit SignatureVerified event on successful claim", async function () {
      const codeId = codes[1]; // Use codes[1] instead of codes[0] to avoid conflict with paused code
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const tokenId = 0;
      const nonce = 0;
      
      const backendSig = await createBackendSignature(
        batchId,
        codeId,
        claimer.address,
        0, // NFT type: ERC721
        tokenId,
        nonce,
        deadline
      );

      await expect(
        batchManager.connect(claimer).claimCode(
          batchId,
          codeId,
          tokenId,
          deadline,
          backendSig,
          merkleProofs[codeId]
        )
      ).to.emit(batchManager, "SignatureVerified")
        .withArgs(batchId, claimer.address, trustedSigner.address);
    });
  });

  describe("Wallet Nonce Management", function () {
    it("Should return 0 nonce for new wallet", async function () {
      const newWallet = addrs[0]; // ใช้ wallet ที่ยังไม่เคย claim
      const nonce = await batchManager.getWalletNonce(newWallet.address);
      expect(nonce).to.equal(0);
    });

    it("Should return correct nonce for different wallets", async function () {
      const wallet1 = addrs[0];
      const wallet2 = addrs[1];
      
      const nonce1 = await batchManager.getWalletNonce(wallet1.address);
      const nonce2 = await batchManager.getWalletNonce(wallet2.address);
      
      expect(nonce1).to.equal(0);
      expect(nonce2).to.equal(0);
    });

    it("Should increment nonce after successful claim", async function () {
      // Setup batch first
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 0, // ERC721
        name: "Nonce Test NFT",
        symbol: "NTNFT",
        merkleRoot: merkleRoot,
        totalCodes: codes.length,
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250,
        baseURI: "",
        deadline: deadline,
        backendSig: "0x"
      };
      
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce,
        deadline,
        trustedSigner
      );

      const tx = await batchFactory.connect(issuer).createBatch(createBatchParams);
      const receipt = await tx.wait();
      
      const batchCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = batchManager.interface.parseLog(log);
          return parsed.name === "BatchCreated";
        } catch {
          return false;
        }
      });
      
      const testBatchId = batchCreatedEvent ? 
        batchManager.interface.parseLog(batchCreatedEvent).args.batchId : null;
      expect(testBatchId).to.not.be.null;

      // Check initial nonce
      const testWallet = addrs[2]; // ใช้ wallet ใหม่ที่ยังไม่เคย claim
      const initialNonce = await batchManager.getWalletNonce(testWallet.address);
      expect(initialNonce).to.equal(0);
      
      // Perform claim
      const codeId = codes[0];
      const claimDeadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour instead of 10 minutes
      const tokenId = 0; // ERC721
      
      const backendSig = await createBackendSignature(
        testBatchId,
        codeId,
        testWallet.address,
        0, // NFT type: ERC721
        tokenId,
        initialNonce,
        claimDeadline
      );

      // Should emit WalletNonceIncremented event
      await expect(
        batchManager.connect(testWallet).claimCode(
          testBatchId,
          codeId,
          tokenId,
          claimDeadline,
          backendSig,
          merkleProofs[codeId]
        )
      ).to.emit(batchManager, "WalletNonceIncremented")
       .withArgs(testWallet.address, initialNonce + 1n);

      // Check nonce increased
      const finalNonce = await batchManager.getWalletNonce(testWallet.address);
      expect(finalNonce).to.equal(initialNonce + 1n);
    });

    it("Should have independent nonces for different wallets", async function () {
      // Setup batch
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await batchFactory.issuerNonce(issuer.address);
      
      const createBatchParams = {
        nftType: 0, // ERC721
        name: "Multi Wallet Test NFT", 
        symbol: "MWTNFT",
        merkleRoot: merkleRoot,
        totalCodes: codes.length,
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        existingNFTContract: ethers.ZeroAddress,
        royaltyRecipient: issuer.address,
        royaltyFeeNumerator: 250,
        baseURI: "",
        deadline: deadline,
        backendSig: "0x"
      };
      
      createBatchParams.backendSig = await createBatchCreationSignature(
        createBatchParams,
        issuer.address,
        nonce,
        deadline,
        trustedSigner
      );

      const tx = await batchFactory.connect(issuer).createBatch(createBatchParams);
      const receipt = await tx.wait();
      
      const batchCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = batchManager.interface.parseLog(log);
          return parsed.name === "BatchCreated";
        } catch {
          return false;
        }
      });
      
      const testBatchId = batchCreatedEvent ? 
        batchManager.interface.parseLog(batchCreatedEvent).args.batchId : null;

      const wallet1 = addrs[3];
      const wallet2 = addrs[4];

      // Both wallets claim different codes
      const codeId1 = codes[1];
      const codeId2 = codes[2];
      const claimDeadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour instead of 10 minutes
      const tokenId = 0; // ERC721

      // Get initial nonces
      const initialNonce1 = await batchManager.getWalletNonce(wallet1.address);
      const initialNonce2 = await batchManager.getWalletNonce(wallet2.address);
      expect(initialNonce1).to.equal(0);
      expect(initialNonce2).to.equal(0);

      // Create signatures for both wallets
      const backendSig1 = await createBackendSignature(
        testBatchId,
        codeId1,
        wallet1.address,
        0,
        tokenId,
        initialNonce1,
        claimDeadline
      );

      const backendSig2 = await createBackendSignature(
        testBatchId,
        codeId2,
        wallet2.address,
        0,
        tokenId,
        initialNonce2,
        claimDeadline
      );

      // Wallet1 claims first
      await batchManager.connect(wallet1).claimCode(
        testBatchId,
        codeId1,
        tokenId,
        claimDeadline,
        backendSig1,
        merkleProofs[codeId1]
      );

      // Wallet2 claims second
      await batchManager.connect(wallet2).claimCode(
        testBatchId,
        codeId2,
        tokenId,
        claimDeadline,
        backendSig2,
        merkleProofs[codeId2]
      );

      // Check that each wallet has independent nonce
      const finalNonce1 = await batchManager.getWalletNonce(wallet1.address);
      const finalNonce2 = await batchManager.getWalletNonce(wallet2.address);

      expect(finalNonce1).to.equal(1);
      expect(finalNonce2).to.equal(1);
    });

    it("Should correctly implement getWalletNonce view function", async function () {
      const testWallet = addrs[5];
      const nonce = await batchManager.getWalletNonce(testWallet.address);
      expect(typeof nonce).to.equal("bigint");
      expect(nonce).to.equal(0n);
    });
  });
});

