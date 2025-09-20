const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Once1155TemplateV2", function () {
  let once1155V2;
  let owner;
  let admin;
  let minter;
  let user1;
  let user2;
  let royaltyRecipient;
  let addrs;

  const TOKEN_NAME = "OnceNFT1155 V2";
  const TOKEN_SYMBOL = "ONCE1155V2";
  const ROYALTY_FEE = 250; // 2.5%
  const BASE_URI = "https://api.example.com/metadata/{id}.json";
  const TOKEN_ID_1 = 1;
  const TOKEN_ID_2 = 2;
  const MINT_AMOUNT = 100;
  const BATCH_ID_1 = 1001;
  const BATCH_ID_2 = 1002;

  beforeEach(async function () {
    // Get signers
    [owner, admin, minter, user1, user2, royaltyRecipient, ...addrs] = await ethers.getSigners();

    // Deploy Once1155TemplateV2 contract
    const Once1155TemplateV2 = await ethers.getContractFactory("Once1155TemplateV2");
    once1155V2 = await Once1155TemplateV2.deploy();
    await once1155V2.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with empty template URI", async function () {
      expect(await once1155V2.uri(TOKEN_ID_1)).to.equal("");
    });

    it("Should not be initialized after deployment", async function () {
      // Any function with onlyInitialized should revert
      await expect(
        once1155V2.connect(owner).pause()
      ).to.be.revertedWithCustomError(once1155V2, "AccessControlUnauthorizedAccount");
    });

    it("Should not have any roles assigned before initialization", async function () {
      const DEFAULT_ADMIN_ROLE = await once1155V2.DEFAULT_ADMIN_ROLE();
      const DEDICATED_ADMIN_ROLE = await once1155V2.DEDICATED_ADMIN_ROLE();
      const MINTER_ROLE = await once1155V2.MINTER_ROLE();

      expect(await once1155V2.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.false;
      expect(await once1155V2.hasRole(DEDICATED_ADMIN_ROLE, owner.address)).to.be.false;
      expect(await once1155V2.hasRole(MINTER_ROLE, minter.address)).to.be.false;
    });

    it("Should not have name and symbol before initialization", async function () {
      expect(await once1155V2.name()).to.equal("");
      expect(await once1155V2.symbol()).to.equal("");
    });
  });

  describe("Initialization", function () {
    it("Should initialize correctly with proper parameters", async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      expect(await once1155V2.name()).to.equal(TOKEN_NAME);
      expect(await once1155V2.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should assign roles correctly after initialization", async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      const DEFAULT_ADMIN_ROLE = await once1155V2.DEFAULT_ADMIN_ROLE();
      const DEDICATED_ADMIN_ROLE = await once1155V2.DEDICATED_ADMIN_ROLE();
      const MINTER_ROLE = await once1155V2.MINTER_ROLE();

      expect(await once1155V2.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await once1155V2.hasRole(DEDICATED_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await once1155V2.hasRole(MINTER_ROLE, minter.address)).to.be.true;
    });

    it("Should set royalty info correctly after initialization", async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      const [recipient, fee] = await once1155V2.royaltyInfo(TOKEN_ID_1, 10000);
      expect(recipient).to.equal(royaltyRecipient.address);
      expect(fee).to.equal(ROYALTY_FEE);
    });

    it("Should not allow double initialization", async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      await expect(
        once1155V2.initialize(
          "New Name",
          "NEW",
          owner.address,
          minter.address,
          royaltyRecipient.address,
          ROYALTY_FEE
        )
      ).to.be.revertedWith("Already initialized");
    });

    it("Should start not paused after initialization", async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      expect(await once1155V2.paused()).to.be.false;
    });
  });

  describe("Name and Symbol", function () {
    it("Should return empty name/symbol before initialization", async function () {
      expect(await once1155V2.name()).to.equal("");
      expect(await once1155V2.symbol()).to.equal("");
    });

    it("Should return initialized name/symbol after initialization", async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      expect(await once1155V2.name()).to.equal(TOKEN_NAME);
      expect(await once1155V2.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should handle empty name and symbol", async function () {
      await once1155V2.initialize(
        "",
        "",
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      expect(await once1155V2.name()).to.equal("");
      expect(await once1155V2.symbol()).to.equal("");
    });

    it("Should handle long name and symbol", async function () {
      const longName = "A".repeat(100);
      const longSymbol = "B".repeat(50);

      await once1155V2.initialize(
        longName,
        longSymbol,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      expect(await once1155V2.name()).to.equal(longName);
      expect(await once1155V2.symbol()).to.equal(longSymbol);
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
    });

    it("Should allow owner to grant and revoke roles", async function () {
      const DEDICATED_ADMIN_ROLE = await once1155V2.DEDICATED_ADMIN_ROLE();
      
      // Grant role
      await once1155V2.connect(owner).grantRole(DEDICATED_ADMIN_ROLE, admin.address);
      expect(await once1155V2.hasRole(DEDICATED_ADMIN_ROLE, admin.address)).to.be.true;

      // Revoke role
      await once1155V2.connect(owner).revokeRole(DEDICATED_ADMIN_ROLE, admin.address);
      expect(await once1155V2.hasRole(DEDICATED_ADMIN_ROLE, admin.address)).to.be.false;
    });

    it("Should not allow non-owner to grant roles", async function () {
      const DEDICATED_ADMIN_ROLE = await once1155V2.DEDICATED_ADMIN_ROLE();
      
      await expect(
        once1155V2.connect(user1).grantRole(DEDICATED_ADMIN_ROLE, admin.address)
      ).to.be.revertedWithCustomError(once1155V2, "AccessControlUnauthorizedAccount");
    });

    it("Should allow role holders to renounce their own roles", async function () {
      const MINTER_ROLE = await once1155V2.MINTER_ROLE();
      
      await once1155V2.connect(minter).renounceRole(MINTER_ROLE, minter.address);
      expect(await once1155V2.hasRole(MINTER_ROLE, minter.address)).to.be.false;
    });
  });

  describe("URI Management", function () {
    beforeEach(async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
    });

    it("Should return empty URI when not set", async function () {
      expect(await once1155V2.uri(TOKEN_ID_1)).to.equal("");
      expect(await once1155V2.uri(TOKEN_ID_2)).to.equal("");
    });

    it("Should allow admin to set URI", async function () {
      await once1155V2.connect(owner).setURI(BASE_URI);
      expect(await once1155V2.uri(TOKEN_ID_1)).to.equal(BASE_URI);
      expect(await once1155V2.uri(TOKEN_ID_2)).to.equal(BASE_URI);
    });

    it("Should not allow non-admin to set URI", async function () {
      await expect(
        once1155V2.connect(user1).setURI(BASE_URI)
      ).to.be.revertedWithCustomError(once1155V2, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow setting URI before initialization", async function () {
      // Deploy a fresh contract
      const Once1155TemplateV2 = await ethers.getContractFactory("Once1155TemplateV2");
      const freshContract = await Once1155TemplateV2.deploy();
      await freshContract.waitForDeployment();

      await expect(
        freshContract.connect(owner).setURI(BASE_URI)
      ).to.be.revertedWithCustomError(freshContract, "AccessControlUnauthorizedAccount");
    });

    it("Should return same URI for all token IDs", async function () {
      await once1155V2.connect(owner).setURI(BASE_URI);
      
      expect(await once1155V2.uri(TOKEN_ID_1)).to.equal(BASE_URI);
      expect(await once1155V2.uri(TOKEN_ID_2)).to.equal(BASE_URI);
      expect(await once1155V2.uri(999)).to.equal(BASE_URI);
    });

    it("Should allow updating URI multiple times", async function () {
      const newURI = "https://new.api.com/metadata/{id}.json";
      
      await once1155V2.connect(owner).setURI(BASE_URI);
      expect(await once1155V2.uri(TOKEN_ID_1)).to.equal(BASE_URI);
      
      await once1155V2.connect(owner).setURI(newURI);
      expect(await once1155V2.uri(TOKEN_ID_1)).to.equal(newURI);
    });

    it("Should handle empty URI", async function () {
      await once1155V2.connect(owner).setURI("");
      expect(await once1155V2.uri(TOKEN_ID_1)).to.equal("");
    });

    it("Should update URI correctly without checking event", async function () {
      // Some ERC1155 implementations may not emit URI event on _setURI
      // Let's just verify the URI is updated correctly
      const initialURI = await once1155V2.uri(TOKEN_ID_1);
      expect(initialURI).to.equal("");
      
      await once1155V2.connect(owner).setURI(BASE_URI);
      const updatedURI = await once1155V2.uri(TOKEN_ID_1);
      expect(updatedURI).to.equal(BASE_URI);
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
    });

    it("Should allow minter to mint tokens", async function () {
      await once1155V2.connect(minter).mint(
        user1.address,
        TOKEN_ID_1,
        MINT_AMOUNT,
        "0x",
        BATCH_ID_1
      );

      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(MINT_AMOUNT);
    });

    it("Should allow minter to batch mint tokens", async function () {
      const ids = [TOKEN_ID_1, TOKEN_ID_2];
      const amounts = [MINT_AMOUNT, MINT_AMOUNT * 2];
      const batchIds = [BATCH_ID_1, BATCH_ID_2];

      await once1155V2.connect(minter).mintBatch(
        user1.address,
        ids,
        amounts,
        "0x",
        batchIds
      );

      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(amounts[0]);
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_2)).to.equal(amounts[1]);
    });

    it("Should not allow non-minter to mint", async function () {
      await expect(
        once1155V2.connect(user1).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, "0x", BATCH_ID_1)
      ).to.be.revertedWithCustomError(once1155V2, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow non-minter to batch mint", async function () {
      await expect(
        once1155V2.connect(user1).mintBatch(
          user1.address,
          [TOKEN_ID_1],
          [MINT_AMOUNT],
          "0x",
          [BATCH_ID_1]
        )
      ).to.be.revertedWithCustomError(once1155V2, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow minting before initialization", async function () {
      // Deploy a fresh contract
      const Once1155TemplateV2 = await ethers.getContractFactory("Once1155TemplateV2");
      const freshContract = await Once1155TemplateV2.deploy();
      await freshContract.waitForDeployment();

      await expect(
        freshContract.connect(minter).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, "0x", BATCH_ID_1)
      ).to.be.revertedWithCustomError(freshContract, "AccessControlUnauthorizedAccount");
    });

    it("Should emit TransferSingle event on mint", async function () {
      await expect(
        once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, "0x", BATCH_ID_1)
      ).to.emit(once1155V2, "TransferSingle")
        .withArgs(minter.address, ethers.ZeroAddress, user1.address, TOKEN_ID_1, MINT_AMOUNT);
    });

    it("Should emit TransferBatch event on batch mint", async function () {
      const ids = [TOKEN_ID_1, TOKEN_ID_2];
      const amounts = [MINT_AMOUNT, MINT_AMOUNT * 2];
      const batchIds = [BATCH_ID_1, BATCH_ID_2];

      await expect(
        once1155V2.connect(minter).mintBatch(user1.address, ids, amounts, "0x", batchIds)
      ).to.emit(once1155V2, "TransferBatch")
        .withArgs(minter.address, ethers.ZeroAddress, user1.address, ids, amounts);
    });

    it("Should not allow minting to zero address", async function () {
      await expect(
        once1155V2.connect(minter).mint(ethers.ZeroAddress, TOKEN_ID_1, MINT_AMOUNT, "0x", BATCH_ID_1)
      ).to.be.revertedWithCustomError(once1155V2, "ERC1155InvalidReceiver");
    });

    it("Should allow minting zero amount", async function () {
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 0, "0x", BATCH_ID_1);
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(0);
    });

    it("Should allow minting multiple amounts to same address", async function () {
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 50, "0x", BATCH_ID_1);
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 30, "0x", BATCH_ID_1);
      
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(80);
    });

    it("Should handle batch mint with array length mismatch", async function () {
      await expect(
        once1155V2.connect(minter).mintBatch(
          user1.address,
          [TOKEN_ID_1, TOKEN_ID_2],
          [MINT_AMOUNT], // Length mismatch
          "0x",
          [BATCH_ID_1, BATCH_ID_2]
        )
      ).to.be.revertedWithCustomError(once1155V2, "ERC1155InvalidArrayLength");
    });

    it("Should handle large mint amounts", async function () {
      const largeAmount = ethers.parseEther("1000000");
      
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, largeAmount, "0x", BATCH_ID_1);
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(largeAmount);
    });
  });

  describe("BatchId Functionality", function () {
    beforeEach(async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
    });

    it("Should store and retrieve batchId correctly", async function () {
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, "0x", BATCH_ID_1);
      
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(BATCH_ID_1);
    });

    it("Should return 0 for non-existent token batchId", async function () {
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(0);
    });

    it("Should not allow batchId of 0", async function () {
      await expect(
        once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, "0x", 0)
      ).to.be.revertedWith("BatchId must be greater than 0");
    });

    it("Should allow minting same token with same batchId", async function () {
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 50, "0x", BATCH_ID_1);
      await once1155V2.connect(minter).mint(user2.address, TOKEN_ID_1, 30, "0x", BATCH_ID_1);
      
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(BATCH_ID_1);
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(50);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(30);
    });

    it("Should not allow minting same token with different batchId", async function () {
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 50, "0x", BATCH_ID_1);
      
      await expect(
        once1155V2.connect(minter).mint(user2.address, TOKEN_ID_1, 30, "0x", BATCH_ID_2)
      ).to.be.revertedWith("BatchId mismatch for existing tokenId");
    });

    it("Should store batchIds correctly for batch mint", async function () {
      const ids = [TOKEN_ID_1, TOKEN_ID_2];
      const amounts = [MINT_AMOUNT, MINT_AMOUNT * 2];
      const batchIds = [BATCH_ID_1, BATCH_ID_2];

      await once1155V2.connect(minter).mintBatch(user1.address, ids, amounts, "0x", batchIds);
      
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(BATCH_ID_1);
      expect(await once1155V2.getBatchId(TOKEN_ID_2)).to.equal(BATCH_ID_2);
    });

    it("Should not allow batch mint with batchId 0", async function () {
      const ids = [TOKEN_ID_1, TOKEN_ID_2];
      const amounts = [MINT_AMOUNT, MINT_AMOUNT * 2];
      const batchIds = [BATCH_ID_1, 0]; // One batchId is 0

      await expect(
        once1155V2.connect(minter).mintBatch(user1.address, ids, amounts, "0x", batchIds)
      ).to.be.revertedWith("BatchId must be greater than 0");
    });

    it("Should not allow batch mint with batchId mismatch", async function () {
      // First mint TOKEN_ID_1 with BATCH_ID_1
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 50, "0x", BATCH_ID_1);
      
      // Try to batch mint TOKEN_ID_1 with different batchId
      const ids = [TOKEN_ID_1, TOKEN_ID_2];
      const amounts = [MINT_AMOUNT, MINT_AMOUNT * 2];
      const batchIds = [BATCH_ID_2, BATCH_ID_2]; // TOKEN_ID_1 has different batchId

      await expect(
        once1155V2.connect(minter).mintBatch(user1.address, ids, amounts, "0x", batchIds)
      ).to.be.revertedWith("BatchId mismatch for existing tokenId");
    });

    it("Should require batchIds array length to match ids array length", async function () {
      const ids = [TOKEN_ID_1, TOKEN_ID_2];
      const amounts = [MINT_AMOUNT, MINT_AMOUNT * 2];
      const batchIds = [BATCH_ID_1]; // Length mismatch

      await expect(
        once1155V2.connect(minter).mintBatch(user1.address, ids, amounts, "0x", batchIds)
      ).to.be.revertedWith("Ids and batchIds length mismatch");
    });

    it("Should handle large batchId values", async function () {
      const largeBatchId = "999999999999999999999999999999";
      
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, "0x", largeBatchId);
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(largeBatchId);
    });

    it("Should allow different tokens to have same batchId", async function () {
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 50, "0x", BATCH_ID_1);
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_2, 100, "0x", BATCH_ID_1);
      
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(BATCH_ID_1);
      expect(await once1155V2.getBatchId(TOKEN_ID_2)).to.equal(BATCH_ID_1);
    });

    it("Should maintain batchId consistency across multiple mints", async function () {
      // Mint TOKEN_ID_1 multiple times with same batchId
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 10, "0x", BATCH_ID_1);
      await once1155V2.connect(minter).mint(user2.address, TOKEN_ID_1, 20, "0x", BATCH_ID_1);
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 15, "0x", BATCH_ID_1);
      
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(BATCH_ID_1);
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(25);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(20);
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, "0x", BATCH_ID_1);
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_2, MINT_AMOUNT * 2, "0x", BATCH_ID_2);
    });

    it("Should allow token holder to transfer tokens", async function () {
      const transferAmount = 50;
      
      await once1155V2.connect(user1).safeTransferFrom(
        user1.address,
        user2.address,
        TOKEN_ID_1,
        transferAmount,
        "0x"
      );

      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(MINT_AMOUNT - transferAmount);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(transferAmount);
    });

    it("Should allow approved operator to transfer tokens", async function () {
      const transferAmount = 30;
      
      await once1155V2.connect(user1).setApprovalForAll(user2.address, true);
      await once1155V2.connect(user2).safeTransferFrom(
        user1.address,
        user2.address,
        TOKEN_ID_1,
        transferAmount,
        "0x"
      );

      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(MINT_AMOUNT - transferAmount);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(transferAmount);
    });

    it("Should not allow unauthorized transfer", async function () {
      await expect(
        once1155V2.connect(user2).safeTransferFrom(
          user1.address,
          user2.address,
          TOKEN_ID_1,
          50,
          "0x"
        )
      ).to.be.revertedWithCustomError(once1155V2, "ERC1155MissingApprovalForAll");
    });

    it("Should allow batch transfers", async function () {
      const transferAmounts = [25, 50];
      
      await once1155V2.connect(user1).safeBatchTransferFrom(
        user1.address,
        user2.address,
        [TOKEN_ID_1, TOKEN_ID_2],
        transferAmounts,
        "0x"
      );
      
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(MINT_AMOUNT - transferAmounts[0]);
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_2)).to.equal((MINT_AMOUNT * 2) - transferAmounts[1]);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(transferAmounts[0]);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_2)).to.equal(transferAmounts[1]);
    });

    it("Should emit TransferSingle event on transfer", async function () {
      const transferAmount = 25;
      
      await expect(
        once1155V2.connect(user1).safeTransferFrom(
          user1.address,
          user2.address,
          TOKEN_ID_1,
          transferAmount,
          "0x"
        )
      ).to.emit(once1155V2, "TransferSingle")
        .withArgs(user1.address, user1.address, user2.address, TOKEN_ID_1, transferAmount);
    });

    it("Should emit TransferBatch event on batch transfer", async function () {
      const ids = [TOKEN_ID_1, TOKEN_ID_2];
      const amounts = [25, 50];
      
      await expect(
        once1155V2.connect(user1).safeBatchTransferFrom(
          user1.address,
          user2.address,
          ids,
          amounts,
          "0x"
        )
      ).to.emit(once1155V2, "TransferBatch")
        .withArgs(user1.address, user1.address, user2.address, ids, amounts);
    });

    it("Should not allow transfer of more tokens than owned", async function () {
      await expect(
        once1155V2.connect(user1).safeTransferFrom(
          user1.address,
          user2.address,
          TOKEN_ID_1,
          MINT_AMOUNT + 1,
          "0x"
        )
      ).to.be.revertedWithCustomError(once1155V2, "ERC1155InsufficientBalance");
    });

    it("Should handle transfer to self", async function () {
      const transferAmount = 25;
      const initialBalance = await once1155V2.balanceOf(user1.address, TOKEN_ID_1);
      
      await once1155V2.connect(user1).safeTransferFrom(
        user1.address,
        user1.address,
        TOKEN_ID_1,
        transferAmount,
        "0x"
      );

      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(initialBalance);
    });

    it("Should handle zero amount transfer", async function () {
      const initialBalance1 = await once1155V2.balanceOf(user1.address, TOKEN_ID_1);
      const initialBalance2 = await once1155V2.balanceOf(user2.address, TOKEN_ID_1);
      
      await once1155V2.connect(user1).safeTransferFrom(
        user1.address,
        user2.address,
        TOKEN_ID_1,
        0,
        "0x"
      );

      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(initialBalance1);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(initialBalance2);
    });
  });

  describe("Approvals", function () {
    beforeEach(async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, "0x", BATCH_ID_1);
    });

    it("Should allow approval for all", async function () {
      await once1155V2.connect(user1).setApprovalForAll(user2.address, true);
      expect(await once1155V2.isApprovedForAll(user1.address, user2.address)).to.be.true;
      
      await once1155V2.connect(user1).setApprovalForAll(user2.address, false);
      expect(await once1155V2.isApprovedForAll(user1.address, user2.address)).to.be.false;
    });

    it("Should emit ApprovalForAll event", async function () {
      await expect(once1155V2.connect(user1).setApprovalForAll(user2.address, true))
        .to.emit(once1155V2, "ApprovalForAll")
        .withArgs(user1.address, user2.address, true);
    });

    it("Should handle self-approval", async function () {
      await once1155V2.connect(user1).setApprovalForAll(user1.address, true);
      expect(await once1155V2.isApprovedForAll(user1.address, user1.address)).to.be.true;
    });

    it("Should allow multiple approvals", async function () {
      await once1155V2.connect(user1).setApprovalForAll(user2.address, true);
      await once1155V2.connect(user1).setApprovalForAll(admin.address, true);
      
      expect(await once1155V2.isApprovedForAll(user1.address, user2.address)).to.be.true;
      expect(await once1155V2.isApprovedForAll(user1.address, admin.address)).to.be.true;
    });
  });

  describe("Batch Operations", function () {
    beforeEach(async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
      await once1155V2.connect(minter).mintBatch(
        user1.address,
        [TOKEN_ID_1, TOKEN_ID_2],
        [MINT_AMOUNT, MINT_AMOUNT * 2],
        "0x",
        [BATCH_ID_1, BATCH_ID_2]
      );
    });

    it("Should return correct batch balances", async function () {
      const balances = await once1155V2.balanceOfBatch(
        [user1.address, user1.address],
        [TOKEN_ID_1, TOKEN_ID_2]
      );
      
      expect(balances[0]).to.equal(MINT_AMOUNT);
      expect(balances[1]).to.equal(MINT_AMOUNT * 2);
    });

    it("Should handle batch balance queries with different addresses", async function () {
      await once1155V2.connect(minter).mint(user2.address, TOKEN_ID_1, 50, "0x", BATCH_ID_1);
      
      const balances = await once1155V2.balanceOfBatch(
        [user1.address, user2.address],
        [TOKEN_ID_1, TOKEN_ID_1]
      );
      
      expect(balances[0]).to.equal(MINT_AMOUNT);
      expect(balances[1]).to.equal(50);
    });

    it("Should handle batch balance queries with array length mismatch", async function () {
      await expect(
        once1155V2.balanceOfBatch(
          [user1.address, user2.address],
          [TOKEN_ID_1] // Length mismatch
        )
      ).to.be.revertedWithCustomError(once1155V2, "ERC1155InvalidArrayLength");
    });

    it("Should handle empty batch balance queries", async function () {
      const balances = await once1155V2.balanceOfBatch([], []);
      expect(balances.length).to.equal(0);
    });
  });

  describe("Pausable Functionality", function () {
    beforeEach(async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, "0x", BATCH_ID_1);
    });

    it("Should allow admin to pause and unpause", async function () {
      // Pause
      await once1155V2.connect(owner).pause();
      expect(await once1155V2.paused()).to.be.true;

      // Unpause
      await once1155V2.connect(owner).unpause();
      expect(await once1155V2.paused()).to.be.false;
    });

    it("Should not allow non-admin to pause", async function () {
      await expect(
        once1155V2.connect(user1).pause()
      ).to.be.revertedWithCustomError(once1155V2, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow non-admin to unpause", async function () {
      await once1155V2.connect(owner).pause();
      
      await expect(
        once1155V2.connect(user1).unpause()
      ).to.be.revertedWithCustomError(once1155V2, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow pause/unpause before initialization", async function () {
      // Deploy a fresh contract
      const Once1155TemplateV2 = await ethers.getContractFactory("Once1155TemplateV2");
      const freshContract = await Once1155TemplateV2.deploy();
      await freshContract.waitForDeployment();

      await expect(
        freshContract.connect(owner).pause()
      ).to.be.revertedWithCustomError(freshContract, "AccessControlUnauthorizedAccount");
    });

    it("Should prevent transfers when paused", async function () {
      await once1155V2.connect(owner).pause();
      
      await expect(
        once1155V2.connect(user1).safeTransferFrom(user1.address, user2.address, TOKEN_ID_1, 50, "0x")
      ).to.be.revertedWith("ERC1155Pausable: token transfer while paused");
    });

    it("Should prevent minting when paused", async function () {
      await once1155V2.connect(owner).pause();
      
      await expect(
        once1155V2.connect(minter).mint(user2.address, TOKEN_ID_2, MINT_AMOUNT, "0x", BATCH_ID_2)
      ).to.be.revertedWith("ERC1155Pausable: token transfer while paused");
    });

    it("Should prevent batch transfers when paused", async function () {
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_2, MINT_AMOUNT, "0x", BATCH_ID_2);
      await once1155V2.connect(owner).pause();
      
      await expect(
        once1155V2.connect(user1).safeBatchTransferFrom(
          user1.address,
          user2.address,
          [TOKEN_ID_1, TOKEN_ID_2],
          [25, 50],
          "0x"
        )
      ).to.be.revertedWith("ERC1155Pausable: token transfer while paused");
    });

    it("Should prevent batch minting when paused", async function () {
      await once1155V2.connect(owner).pause();
      
      await expect(
        once1155V2.connect(minter).mintBatch(
          user2.address,
          [TOKEN_ID_1, TOKEN_ID_2],
          [50, 100],
          "0x",
          [BATCH_ID_1, BATCH_ID_2]
        )
      ).to.be.revertedWith("ERC1155Pausable: token transfer while paused");
    });

    it("Should allow operations after unpause", async function () {
      await once1155V2.connect(owner).pause();
      await once1155V2.connect(owner).unpause();
      
      await once1155V2.connect(user1).safeTransferFrom(user1.address, user2.address, TOKEN_ID_1, 25, "0x");
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(25);
    });

    it("Should emit Paused event", async function () {
      await expect(once1155V2.connect(owner).pause())
        .to.emit(once1155V2, "Paused")
        .withArgs(owner.address);
    });

    it("Should emit Unpaused event", async function () {
      await once1155V2.connect(owner).pause();
      
      await expect(once1155V2.connect(owner).unpause())
        .to.emit(once1155V2, "Unpaused")
        .withArgs(owner.address);
    });

    it("Should handle multiple pause/unpause cycles", async function () {
      // First cycle
      await once1155V2.connect(owner).pause();
      expect(await once1155V2.paused()).to.be.true;
      await once1155V2.connect(owner).unpause();
      expect(await once1155V2.paused()).to.be.false;

      // Second cycle
      await once1155V2.connect(owner).pause();
      expect(await once1155V2.paused()).to.be.true;
      await once1155V2.connect(owner).unpause();
      expect(await once1155V2.paused()).to.be.false;

      // Should still work normally
      await once1155V2.connect(user1).safeTransferFrom(user1.address, user2.address, TOKEN_ID_1, 10, "0x");
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(10);
    });
  });

  describe("Royalty (ERC2981)", function () {
    beforeEach(async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
    });

    it("Should return correct royalty info", async function () {
      const salePrice = ethers.parseEther("1");
      const [recipient, royaltyAmount] = await once1155V2.royaltyInfo(TOKEN_ID_1, salePrice);
      
      expect(recipient).to.equal(royaltyRecipient.address);
      expect(royaltyAmount).to.equal(salePrice * BigInt(ROYALTY_FEE) / BigInt(10000));
    });

    it("Should support ERC2981 interface", async function () {
      const ERC2981_INTERFACE_ID = "0x2a55205a";
      expect(await once1155V2.supportsInterface(ERC2981_INTERFACE_ID)).to.be.true;
    });

    it("Should handle zero sale price", async function () {
      const [recipient, royaltyAmount] = await once1155V2.royaltyInfo(TOKEN_ID_1, 0);
      
      expect(recipient).to.equal(royaltyRecipient.address);
      expect(royaltyAmount).to.equal(0);
    });

    it("Should calculate royalty correctly for different sale prices", async function () {
      const testPrices = [
        ethers.parseEther("0.1"),
        ethers.parseEther("10"),
        ethers.parseEther("100")
      ];

      for (const price of testPrices) {
        const [recipient, royaltyAmount] = await once1155V2.royaltyInfo(TOKEN_ID_1, price);
        expect(recipient).to.equal(royaltyRecipient.address);
        expect(royaltyAmount).to.equal(price * BigInt(ROYALTY_FEE) / BigInt(10000));
      }
    });

    it("Should return same royalty info for different token IDs", async function () {
      const salePrice = ethers.parseEther("1");
      
      const [recipient1, royaltyAmount1] = await once1155V2.royaltyInfo(TOKEN_ID_1, salePrice);
      const [recipient2, royaltyAmount2] = await once1155V2.royaltyInfo(TOKEN_ID_2, salePrice);
      
      expect(recipient1).to.equal(recipient2);
      expect(royaltyAmount1).to.equal(royaltyAmount2);
    });
  });

  describe("Interface Support", function () {
    beforeEach(async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
    });

    it("Should support required interfaces", async function () {
      // ERC1155
      expect(await once1155V2.supportsInterface("0xd9b67a26")).to.be.true;
      // AccessControl
      expect(await once1155V2.supportsInterface("0x7965db0b")).to.be.true;
      // ERC2981
      expect(await once1155V2.supportsInterface("0x2a55205a")).to.be.true;
      // ERC165
      expect(await once1155V2.supportsInterface("0x01ffc9a7")).to.be.true;
    });

    it("Should not support random interfaces", async function () {
      expect(await once1155V2.supportsInterface("0x12345678")).to.be.false;
    });

    it("Should not support ERC721 interface", async function () {
      // ERC721 - should NOT be supported in 1155
      expect(await once1155V2.supportsInterface("0x80ac58cd")).to.be.false;
    });
  });

  describe("Edge Cases and Error Handling", function () {
    beforeEach(async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
    });

    it("Should handle querying balance of zero address", async function () {
      // ERC1155 allows querying balance of zero address, it just returns 0
      const balance = await once1155V2.balanceOf(ethers.ZeroAddress, TOKEN_ID_1);
      expect(balance).to.equal(0);
    });

    it("Should handle initialization with zero addresses", async function () {
      // Deploy fresh contract for this test
      const Once1155TemplateV2 = await ethers.getContractFactory("Once1155TemplateV2");
      const freshContract = await Once1155TemplateV2.deploy();
      await freshContract.waitForDeployment();

      // Should succeed with zero addresses (though not recommended)
      await freshContract.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      const DEFAULT_ADMIN_ROLE = await freshContract.DEFAULT_ADMIN_ROLE();
      expect(await freshContract.hasRole(DEFAULT_ADMIN_ROLE, ethers.ZeroAddress)).to.be.true;
    });

    it("Should handle high royalty fee", async function () {
      // Deploy fresh contract for this test
      const Once1155TemplateV2 = await ethers.getContractFactory("Once1155TemplateV2");
      const freshContract = await Once1155TemplateV2.deploy();
      await freshContract.waitForDeployment();

      const highFee = 5000; // 50%
      await freshContract.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        highFee
      );

      const salePrice = ethers.parseEther("1");
      const [recipient, royaltyAmount] = await freshContract.royaltyInfo(TOKEN_ID_1, salePrice);
      
      expect(recipient).to.equal(royaltyRecipient.address);
      expect(royaltyAmount).to.equal(salePrice * BigInt(highFee) / BigInt(10000));
    });

    it("Should handle zero royalty fee", async function () {
      // Deploy fresh contract for this test
      const Once1155TemplateV2 = await ethers.getContractFactory("Once1155TemplateV2");
      const freshContract = await Once1155TemplateV2.deploy();
      await freshContract.waitForDeployment();

      await freshContract.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        0
      );

      const salePrice = ethers.parseEther("1");
      const [recipient, royaltyAmount] = await freshContract.royaltyInfo(TOKEN_ID_1, salePrice);
      
      expect(recipient).to.equal(royaltyRecipient.address);
      expect(royaltyAmount).to.equal(0);
    });

    it("Should handle maximum uint256 values", async function () {
      const maxUint256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, maxUint256, "0x", BATCH_ID_1);
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(maxUint256);
    });

    it("Should handle very large token IDs", async function () {
      const largeTokenId = "999999999999999999999999999999";
      
      await once1155V2.connect(minter).mint(user1.address, largeTokenId, 100, "0x", BATCH_ID_1);
      expect(await once1155V2.balanceOf(user1.address, largeTokenId)).to.equal(100);
    });

    it("Should handle batch operations with single item", async function () {
      await once1155V2.connect(minter).mintBatch(user1.address, [TOKEN_ID_1], [100], "0x", [BATCH_ID_1]);
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(100);
      
      const balances = await once1155V2.balanceOfBatch([user1.address], [TOKEN_ID_1]);
      expect(balances[0]).to.equal(100);
    });

    it("Should handle transfer with data parameter", async function () {
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 100, "0x", BATCH_ID_1);
      
      const data = ethers.toUtf8Bytes("test data");
      await once1155V2.connect(user1).safeTransferFrom(
        user1.address,
        user2.address,
        TOKEN_ID_1,
        50,
        data
      );
      
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(50);
    });

    it("Should handle batch transfer with data parameter", async function () {
      await once1155V2.connect(minter).mintBatch(
        user1.address,
        [TOKEN_ID_1, TOKEN_ID_2],
        [100, 200],
        "0x",
        [BATCH_ID_1, BATCH_ID_2]
      );
      
      const data = ethers.toUtf8Bytes("batch test data");
      await once1155V2.connect(user1).safeBatchTransferFrom(
        user1.address,
        user2.address,
        [TOKEN_ID_1, TOKEN_ID_2],
        [25, 50],
        data
      );
      
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(25);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_2)).to.equal(50);
    });

    it("Should handle batchId edge cases", async function () {
      // Test maximum uint256 batchId
      const maxUint256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
      
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 100, "0x", maxUint256);
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(maxUint256);
      
      // Test batchId = 1 (minimum valid batchId)
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_2, 200, "0x", 1);
      expect(await once1155V2.getBatchId(TOKEN_ID_2)).to.equal(1);
    });

    it("Should handle getBatchId for non-minted tokens", async function () {
      const nonExistentTokenId = 99999;
      expect(await once1155V2.getBatchId(nonExistentTokenId)).to.equal(0);
    });

    it("Should not allow modifying batchId after initial assignment", async function () {
      // Initial mint with BATCH_ID_1
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 50, "0x", BATCH_ID_1);
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(BATCH_ID_1);
      
      // Try to mint same token with different batchId - should fail
      await expect(
        once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 25, "0x", BATCH_ID_2)
      ).to.be.revertedWith("BatchId mismatch for existing tokenId");
      
      // batchId should remain unchanged
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(BATCH_ID_1);
    });
  });

  describe("Integration Tests", function () {
    beforeEach(async function () {
      await once1155V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
      await once1155V2.connect(owner).setURI(BASE_URI);
    });

    it("Should support complete lifecycle: mint -> transfer -> approve -> transfer", async function () {
      // Mint
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 1000, "0x", BATCH_ID_1);
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(1000);
      
      // Transfer
      await once1155V2.connect(user1).safeTransferFrom(user1.address, user2.address, TOKEN_ID_1, 300, "0x");
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(700);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(300);
      
      // Approve
      await once1155V2.connect(user2).setApprovalForAll(admin.address, true);
      expect(await once1155V2.isApprovedForAll(user2.address, admin.address)).to.be.true;
      
      // Transfer by approved operator
      await once1155V2.connect(admin).safeTransferFrom(user2.address, user1.address, TOKEN_ID_1, 100, "0x");
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(800);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(200);
    });

    it("Should support batch operations lifecycle", async function () {
      const ids = [TOKEN_ID_1, TOKEN_ID_2];
      const amounts = [500, 1000];
      
      // Batch mint
      await once1155V2.connect(minter).mintBatch(user1.address, ids, amounts, "0x", [BATCH_ID_1, BATCH_ID_2]);
      
      // Check balances
      const balances = await once1155V2.balanceOfBatch([user1.address, user1.address], ids);
      expect(balances[0]).to.equal(amounts[0]);
      expect(balances[1]).to.equal(amounts[1]);
      
      // Batch transfer
      const transferAmounts = [100, 200];
      await once1155V2.connect(user1).safeBatchTransferFrom(
        user1.address,
        user2.address,
        ids,
        transferAmounts,
        "0x"
      );
      
      // Verify final balances
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(amounts[0] - transferAmounts[0]);
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_2)).to.equal(amounts[1] - transferAmounts[1]);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(transferAmounts[0]);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_2)).to.equal(transferAmounts[1]);
    });

    it("Should handle pause during complex operations", async function () {
      // Mint tokens
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 1000, "0x", BATCH_ID_1);
      
      // Pause contract
      await once1155V2.connect(owner).pause();
      
      // All operations should fail
      await expect(
        once1155V2.connect(minter).mint(user2.address, TOKEN_ID_2, 500, "0x", BATCH_ID_2)
      ).to.be.revertedWith("ERC1155Pausable: token transfer while paused");
      
      await expect(
        once1155V2.connect(user1).safeTransferFrom(user1.address, user2.address, TOKEN_ID_1, 100, "0x")
      ).to.be.revertedWith("ERC1155Pausable: token transfer while paused");
      
      // Unpause and resume operations
      await once1155V2.connect(owner).unpause();
      
      await once1155V2.connect(minter).mint(user2.address, TOKEN_ID_2, 500, "0x", BATCH_ID_2);
      await once1155V2.connect(user1).safeTransferFrom(user1.address, user2.address, TOKEN_ID_1, 100, "0x");
      
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(100);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_2)).to.equal(500);
    });

    it("Should maintain correct state after role changes", async function () {
      // Initial mint
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 500, "0x", BATCH_ID_1);
      
      // Revoke minter role
      const MINTER_ROLE = await once1155V2.MINTER_ROLE();
      await once1155V2.connect(owner).revokeRole(MINTER_ROLE, minter.address);
      
      // Minting should fail
      await expect(
        once1155V2.connect(minter).mint(user2.address, TOKEN_ID_2, 300, "0x", BATCH_ID_2)
      ).to.be.revertedWithCustomError(once1155V2, "AccessControlUnauthorizedAccount");
      
      // Grant minter role to new address
      await once1155V2.connect(owner).grantRole(MINTER_ROLE, admin.address);
      
      // New minter should work
      await once1155V2.connect(admin).mint(user2.address, TOKEN_ID_2, 300, "0x", BATCH_ID_2);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_2)).to.equal(300);
      
      // Transfers should still work normally
      await once1155V2.connect(user1).safeTransferFrom(user1.address, user2.address, TOKEN_ID_1, 100, "0x");
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(100);
    });

    it("Should handle batchId consistency during complex operations", async function () {
      // Complex scenario: mint, transfer, roles, pause/unpause with batchId tracking
      
      // Initial mint with batchId tracking
      await once1155V2.connect(minter).mint(user1.address, TOKEN_ID_1, 500, "0x", BATCH_ID_1);
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(BATCH_ID_1);
      
      // Mint more of same token (should maintain batchId)
      await once1155V2.connect(minter).mint(user2.address, TOKEN_ID_1, 300, "0x", BATCH_ID_1);
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(BATCH_ID_1);
      
      // Batch mint different tokens
      await once1155V2.connect(minter).mintBatch(
        user1.address,
        [TOKEN_ID_2],
        [200],
        "0x",
        [BATCH_ID_2]
      );
      expect(await once1155V2.getBatchId(TOKEN_ID_2)).to.equal(BATCH_ID_2);
      
      // Pause and unpause - batchIds should remain intact
      await once1155V2.connect(owner).pause();
      await once1155V2.connect(owner).unpause();
      
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(BATCH_ID_1);
      expect(await once1155V2.getBatchId(TOKEN_ID_2)).to.equal(BATCH_ID_2);
      
      // Role changes - batchIds should remain intact
      const MINTER_ROLE = await once1155V2.MINTER_ROLE();
      await once1155V2.connect(owner).grantRole(MINTER_ROLE, admin.address);
      
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(BATCH_ID_1);
      expect(await once1155V2.getBatchId(TOKEN_ID_2)).to.equal(BATCH_ID_2);
      
      // New minter should respect existing batchIds
      await once1155V2.connect(admin).mint(user2.address, TOKEN_ID_1, 100, "0x", BATCH_ID_1);
      expect(await once1155V2.getBatchId(TOKEN_ID_1)).to.equal(BATCH_ID_1);
      
      // Should fail with wrong batchId
      await expect(
        once1155V2.connect(admin).mint(user2.address, TOKEN_ID_1, 50, "0x", BATCH_ID_2)
      ).to.be.revertedWith("BatchId mismatch for existing tokenId");
      
      // Final validation
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_1)).to.equal(500);
      expect(await once1155V2.balanceOf(user2.address, TOKEN_ID_1)).to.equal(400);
      expect(await once1155V2.balanceOf(user1.address, TOKEN_ID_2)).to.equal(200);
    });
  });
});
