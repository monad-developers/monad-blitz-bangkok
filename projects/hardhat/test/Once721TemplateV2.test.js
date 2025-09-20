const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Once721TemplateV2", function () {
  let once721V2;
  let owner;
  let admin;
  let minter;
  let user1;
  let user2;
  let royaltyRecipient;
  let addrs;

  const TOKEN_NAME = "OnceNFT V2";
  const TOKEN_SYMBOL = "ONCE2";
  const ROYALTY_FEE = 250; // 2.5%
  const BASE_URI = "https://api.example.com/metadata/";

  beforeEach(async function () {
    // Get signers
    [owner, admin, minter, user1, user2, royaltyRecipient, ...addrs] = await ethers.getSigners();

    // Deploy Once721TemplateV2 contract
    const Once721TemplateV2 = await ethers.getContractFactory("Once721TemplateV2");
    once721V2 = await Once721TemplateV2.deploy();
    await once721V2.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with template name and symbol", async function () {
      expect(await once721V2.name()).to.equal("Template");
      expect(await once721V2.symbol()).to.equal("TPL");
    });

    it("Should not be initialized after deployment", async function () {
      // Any function with onlyInitialized should revert
      await expect(
        once721V2.connect(owner).pause()
      ).to.be.revertedWithCustomError(once721V2, "AccessControlUnauthorizedAccount");
    });

    it("Should not have any roles assigned before initialization", async function () {
      const DEFAULT_ADMIN_ROLE = await once721V2.DEFAULT_ADMIN_ROLE();
      const DEDICATED_ADMIN_ROLE = await once721V2.DEDICATED_ADMIN_ROLE();
      const MINTER_ROLE = await once721V2.MINTER_ROLE();

      expect(await once721V2.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.false;
      expect(await once721V2.hasRole(DEDICATED_ADMIN_ROLE, owner.address)).to.be.false;
      expect(await once721V2.hasRole(MINTER_ROLE, minter.address)).to.be.false;
    });
  });

  describe("Initialization", function () {
    it("Should initialize correctly with proper parameters", async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      expect(await once721V2.name()).to.equal(TOKEN_NAME);
      expect(await once721V2.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should assign roles correctly after initialization", async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      const DEFAULT_ADMIN_ROLE = await once721V2.DEFAULT_ADMIN_ROLE();
      const DEDICATED_ADMIN_ROLE = await once721V2.DEDICATED_ADMIN_ROLE();
      const MINTER_ROLE = await once721V2.MINTER_ROLE();

      expect(await once721V2.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await once721V2.hasRole(DEDICATED_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await once721V2.hasRole(MINTER_ROLE, minter.address)).to.be.true;
    });

    it("Should set royalty info correctly after initialization", async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      const [recipient, fee] = await once721V2.royaltyInfo(1, 10000);
      expect(recipient).to.equal(royaltyRecipient.address);
      expect(fee).to.equal(ROYALTY_FEE);
    });

    it("Should not allow double initialization", async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      await expect(
        once721V2.initialize(
          "New Name",
          "NEW",
          owner.address,
          minter.address,
          royaltyRecipient.address,
          ROYALTY_FEE
        )
      ).to.be.revertedWith("Already initialized");
    });

    it("Should start token ID counter at 1", async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      await once721V2.connect(minter).safeMint(user1.address, 1);
      expect(await once721V2.ownerOf(1)).to.equal(user1.address);
    });
  });

  describe("Name and Symbol Override", function () {
    it("Should return template name/symbol before initialization", async function () {
      expect(await once721V2.name()).to.equal("Template");
      expect(await once721V2.symbol()).to.equal("TPL");
    });

    it("Should return initialized name/symbol after initialization", async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      expect(await once721V2.name()).to.equal(TOKEN_NAME);
      expect(await once721V2.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should handle empty name and symbol", async function () {
      await once721V2.initialize(
        "",
        "",
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      expect(await once721V2.name()).to.equal("");
      expect(await once721V2.symbol()).to.equal("");
    });

    it("Should handle long name and symbol", async function () {
      const longName = "A".repeat(100);
      const longSymbol = "B".repeat(50);

      await once721V2.initialize(
        longName,
        longSymbol,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );

      expect(await once721V2.name()).to.equal(longName);
      expect(await once721V2.symbol()).to.equal(longSymbol);
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
    });

    it("Should allow owner to grant and revoke roles", async function () {
      const DEDICATED_ADMIN_ROLE = await once721V2.DEDICATED_ADMIN_ROLE();
      
      // Grant role
      await once721V2.connect(owner).grantRole(DEDICATED_ADMIN_ROLE, admin.address);
      expect(await once721V2.hasRole(DEDICATED_ADMIN_ROLE, admin.address)).to.be.true;

      // Revoke role
      await once721V2.connect(owner).revokeRole(DEDICATED_ADMIN_ROLE, admin.address);
      expect(await once721V2.hasRole(DEDICATED_ADMIN_ROLE, admin.address)).to.be.false;
    });

    it("Should not allow non-owner to grant roles", async function () {
      const DEDICATED_ADMIN_ROLE = await once721V2.DEDICATED_ADMIN_ROLE();
      
      await expect(
        once721V2.connect(user1).grantRole(DEDICATED_ADMIN_ROLE, admin.address)
      ).to.be.revertedWithCustomError(once721V2, "AccessControlUnauthorizedAccount");
    });

    it("Should allow role holders to renounce their own roles", async function () {
      const MINTER_ROLE = await once721V2.MINTER_ROLE();
      
      await once721V2.connect(minter).renounceRole(MINTER_ROLE, minter.address);
      expect(await once721V2.hasRole(MINTER_ROLE, minter.address)).to.be.false;
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
    });

    it("Should allow minter to mint tokens", async function () {
      await once721V2.connect(minter).safeMint(user1.address, 1);
      
      expect(await once721V2.ownerOf(1)).to.equal(user1.address);
      expect(await once721V2.balanceOf(user1.address)).to.equal(1);
    });

    it("Should increment token IDs correctly", async function () {
      await once721V2.connect(minter).safeMint(user1.address, 1);
      await once721V2.connect(minter).safeMint(user2.address, 2);
      
      expect(await once721V2.ownerOf(1)).to.equal(user1.address);
      expect(await once721V2.ownerOf(2)).to.equal(user2.address);
    });

    it("Should not allow non-minter to mint", async function () {
      await expect(
        once721V2.connect(user1).safeMint(user1.address, 1)
      ).to.be.revertedWithCustomError(once721V2, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow minting before initialization", async function () {
      // Deploy a fresh contract
      const Once721TemplateV2 = await ethers.getContractFactory("Once721TemplateV2");
      const freshContract = await Once721TemplateV2.deploy();
      await freshContract.waitForDeployment();

      await expect(
        freshContract.connect(minter).safeMint(user1.address, 1)
      ).to.be.revertedWithCustomError(freshContract, "AccessControlUnauthorizedAccount");
    });

    it("Should emit Transfer event on mint", async function () {
      await expect(once721V2.connect(minter).safeMint(user1.address, 1))
        .to.emit(once721V2, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, 1);
    });

    it("Should mint to zero address should revert", async function () {
      await expect(
        once721V2.connect(minter).safeMint(ethers.ZeroAddress, 1)
      ).to.be.revertedWithCustomError(once721V2, "ERC721InvalidReceiver");
    });

    it("Should allow minting multiple tokens to same address", async function () {
      await once721V2.connect(minter).safeMint(user1.address, 1);
      await once721V2.connect(minter).safeMint(user1.address, 1);
      await once721V2.connect(minter).safeMint(user1.address, 2);
      
      expect(await once721V2.balanceOf(user1.address)).to.equal(3);
      expect(await once721V2.ownerOf(1)).to.equal(user1.address);
      expect(await once721V2.ownerOf(2)).to.equal(user1.address);
      expect(await once721V2.ownerOf(3)).to.equal(user1.address);
    });

    it("Should not allow minting with zero batch ID", async function () {
      await expect(
        once721V2.connect(minter).safeMint(user1.address, 0)
      ).to.be.revertedWith("BatchId must be greater than 0");
    });

    it("Should store and retrieve batch ID correctly", async function () {
      const batchId1 = 123;
      const batchId2 = 456;
      
      await once721V2.connect(minter).safeMint(user1.address, batchId1);
      await once721V2.connect(minter).safeMint(user2.address, batchId2);
      
      expect(await once721V2.getBatchId(1)).to.equal(batchId1);
      expect(await once721V2.getBatchId(2)).to.equal(batchId2);
    });

    it("Should allow same batch ID for multiple tokens", async function () {
      const batchId = 100;
      
      await once721V2.connect(minter).safeMint(user1.address, batchId);
      await once721V2.connect(minter).safeMint(user2.address, batchId);
      await once721V2.connect(minter).safeMint(user1.address, batchId);
      
      expect(await once721V2.getBatchId(1)).to.equal(batchId);
      expect(await once721V2.getBatchId(2)).to.equal(batchId);
      expect(await once721V2.getBatchId(3)).to.equal(batchId);
    });

    it("Should handle large batch IDs", async function () {
      const largeBatchId = ethers.MaxUint256;
      
      await once721V2.connect(minter).safeMint(user1.address, largeBatchId);
      expect(await once721V2.getBatchId(1)).to.equal(largeBatchId);
    });

    it("Should revert when querying batch ID for non-existent token", async function () {
      await expect(once721V2.getBatchId(999))
        .to.be.revertedWith("ERC721: query for nonexistent token");
    });
  });

  describe("URI Management", function () {
    beforeEach(async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
      await once721V2.connect(minter).safeMint(user1.address, 1);
    });

    it("Should return empty string for tokenURI when base URI is not set", async function () {
      expect(await once721V2.tokenURI(1)).to.equal("");
    });

    it("Should allow admin to set base URI", async function () {
      await once721V2.connect(owner).setBaseURI(BASE_URI);
      expect(await once721V2.tokenURI(1)).to.equal(BASE_URI + "1");
    });

    it("Should not allow non-admin to set URI", async function () {
      await expect(
        once721V2.connect(user1).setBaseURI(BASE_URI)
      ).to.be.revertedWithCustomError(once721V2, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow setting URI before initialization", async function () {
      // Deploy a fresh contract
      const Once721TemplateV2 = await ethers.getContractFactory("Once721TemplateV2");
      const freshContract = await Once721TemplateV2.deploy();
      await freshContract.waitForDeployment();

      await expect(
        freshContract.connect(owner).setBaseURI(BASE_URI)
      ).to.be.revertedWithCustomError(freshContract, "AccessControlUnauthorizedAccount");
    });

    it("Should revert when querying URI for non-existent token", async function () {
      await expect(once721V2.tokenURI(999))
        .to.be.revertedWith("ERC721: URI query for nonexistent token");
    });

    it("Should handle multiple token URIs correctly", async function () {
      await once721V2.connect(minter).safeMint(user2.address, 2);
      await once721V2.connect(owner).setBaseURI(BASE_URI);
      
      expect(await once721V2.tokenURI(1)).to.equal(BASE_URI + "1");
      expect(await once721V2.tokenURI(2)).to.equal(BASE_URI + "2");
    });

    it("Should allow updating base URI", async function () {
      const newURI = "https://new.api.com/metadata/";
      
      await once721V2.connect(owner).setBaseURI(BASE_URI);
      expect(await once721V2.tokenURI(1)).to.equal(BASE_URI + "1");
      
      await once721V2.connect(owner).setBaseURI(newURI);
      expect(await once721V2.tokenURI(1)).to.equal(newURI + "1");
    });

    it("Should handle empty base URI", async function () {
      await once721V2.connect(owner).setBaseURI("");
      expect(await once721V2.tokenURI(1)).to.equal("");
    });
  });

  describe("Pausable Functionality", function () {
    beforeEach(async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
      await once721V2.connect(minter).safeMint(user1.address, 1);
    });

    it("Should allow admin to pause and unpause", async function () {
      // Pause
      await once721V2.connect(owner).pause();
      expect(await once721V2.paused()).to.be.true;

      // Unpause
      await once721V2.connect(owner).unpause();
      expect(await once721V2.paused()).to.be.false;
    });

    it("Should not allow non-admin to pause", async function () {
      await expect(
        once721V2.connect(user1).pause()
      ).to.be.revertedWithCustomError(once721V2, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow non-admin to unpause", async function () {
      await once721V2.connect(owner).pause();
      
      await expect(
        once721V2.connect(user1).unpause()
      ).to.be.revertedWithCustomError(once721V2, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow pause/unpause before initialization", async function () {
      // Deploy a fresh contract
      const Once721TemplateV2 = await ethers.getContractFactory("Once721TemplateV2");
      const freshContract = await Once721TemplateV2.deploy();
      await freshContract.waitForDeployment();

      await expect(
        freshContract.connect(owner).pause()
      ).to.be.revertedWithCustomError(freshContract, "AccessControlUnauthorizedAccount");
    });

    it("Should prevent transfers when paused", async function () {
      await once721V2.connect(owner).pause();
      
      await expect(
        once721V2.connect(user1).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWith("ERC721Pausable: token transfer while paused");
    });

    it("Should prevent minting when paused", async function () {
      await once721V2.connect(owner).pause();
      
      await expect(
        once721V2.connect(minter).safeMint(user2.address, 2)
      ).to.be.revertedWith("ERC721Pausable: token transfer while paused");
    });

    it("Should allow transfers after unpause", async function () {
      await once721V2.connect(owner).pause();
      await once721V2.connect(owner).unpause();
      
      await once721V2.connect(user1).transferFrom(user1.address, user2.address, 1);
      expect(await once721V2.ownerOf(1)).to.equal(user2.address);
    });

    it("Should emit Paused event", async function () {
      await expect(once721V2.connect(owner).pause())
        .to.emit(once721V2, "Paused")
        .withArgs(owner.address);
    });

    it("Should emit Unpaused event", async function () {
      await once721V2.connect(owner).pause();
      
      await expect(once721V2.connect(owner).unpause())
        .to.emit(once721V2, "Unpaused")
        .withArgs(owner.address);
    });

    it("Should handle multiple pause/unpause cycles", async function () {
      // First cycle
      await once721V2.connect(owner).pause();
      expect(await once721V2.paused()).to.be.true;
      await once721V2.connect(owner).unpause();
      expect(await once721V2.paused()).to.be.false;

      // Second cycle
      await once721V2.connect(owner).pause();
      expect(await once721V2.paused()).to.be.true;
      await once721V2.connect(owner).unpause();
      expect(await once721V2.paused()).to.be.false;

      // Should still work normally
      await once721V2.connect(user1).transferFrom(user1.address, user2.address, 1);
      expect(await once721V2.ownerOf(1)).to.equal(user2.address);
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
      await once721V2.connect(minter).safeMint(user1.address, 1);
      await once721V2.connect(minter).safeMint(user1.address, 2);
    });

    it("Should allow token owner to transfer", async function () {
      await once721V2.connect(user1).transferFrom(user1.address, user2.address, 1);
      expect(await once721V2.ownerOf(1)).to.equal(user2.address);
    });

    it("Should allow approved address to transfer", async function () {
      await once721V2.connect(user1).approve(user2.address, 1);
      await once721V2.connect(user2).transferFrom(user1.address, user2.address, 1);
      expect(await once721V2.ownerOf(1)).to.equal(user2.address);
    });

    it("Should allow approved for all to transfer", async function () {
      await once721V2.connect(user1).setApprovalForAll(user2.address, true);
      await once721V2.connect(user2).transferFrom(user1.address, user2.address, 1);
      await once721V2.connect(user2).transferFrom(user1.address, user2.address, 2);
      
      expect(await once721V2.ownerOf(1)).to.equal(user2.address);
      expect(await once721V2.ownerOf(2)).to.equal(user2.address);
    });

    it("Should not allow unauthorized transfer", async function () {
      await expect(
        once721V2.connect(user2).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWithCustomError(once721V2, "ERC721InsufficientApproval");
    });

    it("Should emit Transfer event", async function () {
      await expect(once721V2.connect(user1).transferFrom(user1.address, user2.address, 1))
        .to.emit(once721V2, "Transfer")
        .withArgs(user1.address, user2.address, 1);
    });

    it("Should update balances correctly", async function () {
      expect(await once721V2.balanceOf(user1.address)).to.equal(2);
      expect(await once721V2.balanceOf(user2.address)).to.equal(0);
      
      await once721V2.connect(user1).transferFrom(user1.address, user2.address, 1);
      
      expect(await once721V2.balanceOf(user1.address)).to.equal(1);
      expect(await once721V2.balanceOf(user2.address)).to.equal(1);
    });

    it("Should support safe transfers", async function () {
      await once721V2.connect(user1)["safeTransferFrom(address,address,uint256)"](
        user1.address,
        user2.address,
        1
      );
      expect(await once721V2.ownerOf(1)).to.equal(user2.address);
    });

    it("Should support safe transfers with data", async function () {
      const data = ethers.toUtf8Bytes("test data");
      await once721V2.connect(user1)["safeTransferFrom(address,address,uint256,bytes)"](
        user1.address,
        user2.address,
        1,
        data
      );
      expect(await once721V2.ownerOf(1)).to.equal(user2.address);
    });
  });

  describe("Approvals", function () {
    beforeEach(async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
      await once721V2.connect(minter).safeMint(user1.address, 1);
    });

    it("Should allow token owner to approve", async function () {
      await once721V2.connect(user1).approve(user2.address, 1);
      expect(await once721V2.getApproved(1)).to.equal(user2.address);
    });

    it("Should allow approved for all", async function () {
      await once721V2.connect(user1).setApprovalForAll(user2.address, true);
      expect(await once721V2.isApprovedForAll(user1.address, user2.address)).to.be.true;
      
      await once721V2.connect(user1).setApprovalForAll(user2.address, false);
      expect(await once721V2.isApprovedForAll(user1.address, user2.address)).to.be.false;
    });

    it("Should emit Approval event", async function () {
      await expect(once721V2.connect(user1).approve(user2.address, 1))
        .to.emit(once721V2, "Approval")
        .withArgs(user1.address, user2.address, 1);
    });

    it("Should emit ApprovalForAll event", async function () {
      await expect(once721V2.connect(user1).setApprovalForAll(user2.address, true))
        .to.emit(once721V2, "ApprovalForAll")
        .withArgs(user1.address, user2.address, true);
    });

    it("Should clear approval on transfer", async function () {
      await once721V2.connect(user1).approve(user2.address, 1);
      expect(await once721V2.getApproved(1)).to.equal(user2.address);
      
      await once721V2.connect(user1).transferFrom(user1.address, user2.address, 1);
      expect(await once721V2.getApproved(1)).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Royalty (ERC2981)", function () {
    beforeEach(async function () {
      await once721V2.initialize(
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
      const [recipient, royaltyAmount] = await once721V2.royaltyInfo(1, salePrice);
      
      expect(recipient).to.equal(royaltyRecipient.address);
      expect(royaltyAmount).to.equal(salePrice * BigInt(ROYALTY_FEE) / BigInt(10000));
    });

    it("Should support ERC2981 interface", async function () {
      const ERC2981_INTERFACE_ID = "0x2a55205a";
      expect(await once721V2.supportsInterface(ERC2981_INTERFACE_ID)).to.be.true;
    });

    it("Should handle zero sale price", async function () {
      const [recipient, royaltyAmount] = await once721V2.royaltyInfo(1, 0);
      
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
        const [recipient, royaltyAmount] = await once721V2.royaltyInfo(1, price);
        expect(recipient).to.equal(royaltyRecipient.address);
        expect(royaltyAmount).to.equal(price * BigInt(ROYALTY_FEE) / BigInt(10000));
      }
    });
  });

  describe("Interface Support", function () {
    beforeEach(async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
    });

    it("Should support required interfaces", async function () {
      // ERC721
      expect(await once721V2.supportsInterface("0x80ac58cd")).to.be.true;
      // AccessControl
      expect(await once721V2.supportsInterface("0x7965db0b")).to.be.true;
      // ERC2981
      expect(await once721V2.supportsInterface("0x2a55205a")).to.be.true;
      // ERC165
      expect(await once721V2.supportsInterface("0x01ffc9a7")).to.be.true;
    });

    it("Should not support ERC721Enumerable interface", async function () {
      // ERC721Enumerable - should NOT be supported in V2
      expect(await once721V2.supportsInterface("0x780e9d63")).to.be.false;
    });

    it("Should not support random interfaces", async function () {
      expect(await once721V2.supportsInterface("0x12345678")).to.be.false;
    });
  });

  describe("Edge Cases and Error Handling", function () {
    beforeEach(async function () {
      await once721V2.initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        owner.address,
        minter.address,
        royaltyRecipient.address,
        ROYALTY_FEE
      );
    });

    it("Should handle querying balance of zero address", async function () {
      await expect(once721V2.balanceOf(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(once721V2, "ERC721InvalidOwner");
    });

    it("Should handle querying owner of non-existent token", async function () {
      await expect(once721V2.ownerOf(999))
        .to.be.revertedWithCustomError(once721V2, "ERC721NonexistentToken");
    });

    it("Should handle approval of non-existent token", async function () {
      await expect(once721V2.connect(user1).approve(user2.address, 999))
        .to.be.revertedWithCustomError(once721V2, "ERC721NonexistentToken");
    });

    it("Should handle getting approved of non-existent token", async function () {
      await expect(once721V2.getApproved(999))
        .to.be.revertedWithCustomError(once721V2, "ERC721NonexistentToken");
    });

    it("Should handle transfer of non-existent token", async function () {
      await expect(
        once721V2.connect(user1).transferFrom(user1.address, user2.address, 999)
      ).to.be.revertedWithCustomError(once721V2, "ERC721NonexistentToken");
    });

    it("Should handle large token IDs correctly in URI", async function () {
      // Mint many tokens to get higher IDs
      for (let i = 0; i < 50; i++) {
        await once721V2.connect(minter).safeMint(user1.address, i + 1);
      }
      
      await once721V2.connect(owner).setBaseURI(BASE_URI);
      expect(await once721V2.tokenURI(50)).to.equal(BASE_URI + "50");
    });

    it("Should handle initialization with zero addresses", async function () {
      // Deploy fresh contract for this test
      const Once721TemplateV2 = await ethers.getContractFactory("Once721TemplateV2");
      const freshContract = await Once721TemplateV2.deploy();
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
      const Once721TemplateV2 = await ethers.getContractFactory("Once721TemplateV2");
      const freshContract = await Once721TemplateV2.deploy();
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
      const [recipient, royaltyAmount] = await freshContract.royaltyInfo(1, salePrice);
      
      expect(recipient).to.equal(royaltyRecipient.address);
      expect(royaltyAmount).to.equal(salePrice * BigInt(highFee) / BigInt(10000));
    });

    it("Should handle zero royalty fee", async function () {
      // Deploy fresh contract for this test
      const Once721TemplateV2 = await ethers.getContractFactory("Once721TemplateV2");
      const freshContract = await Once721TemplateV2.deploy();
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
      const [recipient, royaltyAmount] = await freshContract.royaltyInfo(1, salePrice);
      
      expect(recipient).to.equal(royaltyRecipient.address);
      expect(royaltyAmount).to.equal(0);
    });

    it("Should maintain batch ID through transfers", async function () {
      const batchId = 42;
      await once721V2.connect(minter).safeMint(user1.address, batchId);
      
      // Check initial batch ID
      expect(await once721V2.getBatchId(1)).to.equal(batchId);
      
      // Transfer token
      await once721V2.connect(user1).transferFrom(user1.address, user2.address, 1);
      
      // Batch ID should remain the same after transfer
      expect(await once721V2.getBatchId(1)).to.equal(batchId);
      expect(await once721V2.ownerOf(1)).to.equal(user2.address);
    });

    it("Should preserve batch ID when contract is paused and unpaused", async function () {
      const batchId = 99;
      await once721V2.connect(minter).safeMint(user1.address, batchId);
      
      // Pause contract
      await once721V2.connect(owner).pause();
      expect(await once721V2.getBatchId(1)).to.equal(batchId);
      
      // Unpause contract
      await once721V2.connect(owner).unpause();
      expect(await once721V2.getBatchId(1)).to.equal(batchId);
    });
  });
});
