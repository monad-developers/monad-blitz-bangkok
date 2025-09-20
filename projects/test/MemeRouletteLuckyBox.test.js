const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MemeRouletteLuckyBox", function () {
  let luckyBox;
  let mockUSDT;
  let mockRefiller;
  let owner;
  let player1;
  let player2;
  let teamWallet;

  const SPIN_PRICE = ethers.parseUnits("1", 6); // 1 USDT
  const TEAM_FEE = ethers.parseUnits("0.05", 6); // 5%
  const REFILL_BUDGET = ethers.parseUnits("0.95", 6); // 95%

  beforeEach(async function () {
    [owner, player1, player2, teamWallet] = await ethers.getSigners();

    // Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    mockUSDT = await MockUSDT.deploy(owner.address);
    await mockUSDT.waitForDeployment();

    // Deploy MockRefiller
    const MockRefiller = await ethers.getContractFactory("MockRefiller");
    mockRefiller = await MockRefiller.deploy(owner.address);
    await mockRefiller.waitForDeployment();

    // Deploy MemeRouletteLuckyBox
    const MemeRouletteLuckyBox = await ethers.getContractFactory("MemeRouletteLuckyBox");
    luckyBox = await MemeRouletteLuckyBox.deploy(owner.address, await mockUSDT.getAddress(), teamWallet.address);
    await luckyBox.waitForDeployment();

    // Set refiller
    await luckyBox.setRefiller(await mockRefiller.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await luckyBox.owner()).to.equal(owner.address);
    });

    it("Should set the right USDT address", async function () {
      expect(await luckyBox.USDT()).to.equal(await mockUSDT.getAddress());
    });

    it("Should set the right team wallet", async function () {
      expect(await luckyBox.teamWallet()).to.equal(teamWallet.address);
    });

    it("Should set the right refiller", async function () {
      expect(await luckyBox.refiller()).to.equal(await mockRefiller.getAddress());
    });
  });

  describe("Pool Configuration", function () {
    it("Should configure pool with 10 tokens", async function () {
      const tokens = [];
      const slotAmounts = [];
      
      // Create 10 mock tokens
      for (let i = 0; i < 10; i++) {
        const MockToken = await ethers.getContractFactory("MockUSDT");
        const token = await MockToken.deploy(owner.address);
        await token.waitForDeployment();
        tokens.push(await token.getAddress());
        slotAmounts.push(ethers.parseUnits("1", 6)); // 1 token per piece
      }

      await luckyBox.configurePool(tokens, slotAmounts);
      
      const poolTokens = await luckyBox.getTokens();
      expect(poolTokens.length).to.equal(10);
      
      for (let i = 0; i < 10; i++) {
        expect(poolTokens[i]).to.equal(tokens[i]);
        expect(await luckyBox.slotAmount(tokens[i])).to.equal(slotAmounts[i]);
      }
    });

    it("Should reject configuration with wrong number of tokens", async function () {
      const tokens = [await mockUSDT.getAddress()];
      const slotAmounts = [ethers.parseUnits("1", 6)];

      await expect(luckyBox.configurePool(tokens, slotAmounts))
        .to.be.revertedWithCustomError(luckyBox, "InvalidConfig");
    });
  });

  describe("Initial Deposit", function () {
    beforeEach(async function () {
      // Configure pool first
      const tokens = [];
      const slotAmounts = [];
      
      for (let i = 0; i < 10; i++) {
        const MockToken = await ethers.getContractFactory("MockUSDT");
        const token = await MockToken.deploy(owner.address);
        await token.waitForDeployment();
        tokens.push(await token.getAddress());
        slotAmounts.push(ethers.parseUnits("1", 6));
      }

      await luckyBox.configurePool(tokens, slotAmounts);
    });

    it("Should deposit initial inventory", async function () {
      const tokens = await luckyBox.getTokens();
      
      // Approve tokens for deposit
      for (const tokenAddress of tokens) {
        const token = await ethers.getContractAt("MockUSDT", tokenAddress);
        await token.approve(await luckyBox.getAddress(), ethers.parseUnits("10", 6)); // 10 pieces per token
      }

      await luckyBox.depositInitial();

      // Check balances
      for (const tokenAddress of tokens) {
        const token = await ethers.getContractAt("MockUSDT", tokenAddress);
        const balance = await token.balanceOf(await luckyBox.getAddress());
        expect(balance).to.equal(ethers.parseUnits("10", 6)); // 10 pieces
      }
    });
  });

  describe("Spinning", function () {
    let tokens;
    let mockTokens;

    beforeEach(async function () {
      // Setup pool
      tokens = [];
      mockTokens = [];
      const slotAmounts = [];
      
      for (let i = 0; i < 10; i++) {
        const MockToken = await ethers.getContractFactory("MockUSDT");
        const token = await MockToken.deploy(owner.address);
        await token.waitForDeployment();
        tokens.push(await token.getAddress());
        mockTokens.push(token);
        slotAmounts.push(ethers.parseUnits("1", 6));
      }

      await luckyBox.configurePool(tokens, slotAmounts);

      // Deposit initial inventory
      for (let i = 0; i < tokens.length; i++) {
        await mockTokens[i].approve(await luckyBox.getAddress(), ethers.parseUnits("10", 6));
      }
      await luckyBox.depositInitial();

      // Fund refiller
      for (let i = 0; i < tokens.length; i++) {
        await mockTokens[i].transfer(await mockRefiller.getAddress(), ethers.parseUnits("100", 6));
      }
      await mockUSDT.transfer(await mockRefiller.getAddress(), ethers.parseUnits("1000", 6));

      // Give player some USDT
      await mockUSDT.transfer(player1.address, ethers.parseUnits("100", 6));
    });

    it("Should allow player to spin and win tokens", async function () {
      // Approve USDT
      await mockUSDT.connect(player1).approve(await luckyBox.getAddress(), SPIN_PRICE);

      // Get initial balances
      const initialTeamBalance = await mockUSDT.balanceOf(teamWallet.address);
      const initialRefillerBalance = await mockUSDT.balanceOf(await mockRefiller.getAddress());

      // Spin
      const tx = await luckyBox.connect(player1).spin();
      const receipt = await tx.wait();

      // Check events
      const spinEvent = receipt.logs.find(log => {
        try {
          const parsed = luckyBox.interface.parseLog(log);
          return parsed.name === "Spin";
        } catch {
          return false;
        }
      });

      expect(spinEvent).to.not.be.undefined;

      // Check balances
      const finalTeamBalance = await mockUSDT.balanceOf(teamWallet.address);
      const finalRefillerBalance = await mockUSDT.balanceOf(await mockRefiller.getAddress());

      expect(finalTeamBalance - initialTeamBalance).to.equal(TEAM_FEE);
      expect(finalRefillerBalance - initialRefillerBalance).to.equal(REFILL_BUDGET);

      // Check that player received a token
      let playerWonToken = false;
      for (let i = 0; i < tokens.length; i++) {
        const balance = await mockTokens[i].balanceOf(player1.address);
        if (balance > 0) {
          playerWonToken = true;
          expect(balance).to.equal(ethers.parseUnits("1", 6)); // 1 piece
          break;
        }
      }
      expect(playerWonToken).to.be.true;
    });

    it("Should reject spin without USDT approval", async function () {
      await expect(luckyBox.connect(player1).spin())
        .to.be.reverted;
    });

    it("Should reject spin without sufficient USDT balance", async function () {
      // Don't give player USDT
      await expect(luckyBox.connect(player2).spin())
        .to.be.reverted;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set team wallet", async function () {
      await luckyBox.setTeamWallet(player1.address);
      expect(await luckyBox.teamWallet()).to.equal(player1.address);
    });

    it("Should allow owner to set refiller", async function () {
      await luckyBox.setRefiller(player1.address);
      expect(await luckyBox.refiller()).to.equal(player1.address);
    });

    it("Should reject non-owner from setting team wallet", async function () {
      await expect(luckyBox.connect(player1).setTeamWallet(player2.address))
        .to.be.revertedWithCustomError(luckyBox, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to rescue tokens", async function () {
      // Give some USDT to the contract
      await mockUSDT.transfer(await luckyBox.getAddress(), ethers.parseUnits("10", 6));
      
      const initialBalance = await mockUSDT.balanceOf(player1.address);
      await luckyBox.rescue(await mockUSDT.getAddress(), ethers.parseUnits("5", 6), player1.address);
      const finalBalance = await mockUSDT.balanceOf(player1.address);
      
      expect(finalBalance - initialBalance).to.equal(ethers.parseUnits("5", 6));
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Setup pool
      const tokens = [];
      const slotAmounts = [];
      
      for (let i = 0; i < 10; i++) {
        const MockToken = await ethers.getContractFactory("MockUSDT");
        const token = await MockToken.deploy(owner.address);
        await token.waitForDeployment();
        tokens.push(await token.getAddress());
        slotAmounts.push(ethers.parseUnits("1", 6));
      }

      await luckyBox.configurePool(tokens, slotAmounts);
    });

    it("Should return correct pool snapshot", async function () {
      const snapshot = await luckyBox.getPoolSnapshot();
      expect(snapshot.tokenList.length).to.equal(10);
      expect(snapshot.perPieceAmounts.length).to.equal(10);
      expect(snapshot.poolTargetSize).to.equal(100); // 10 tokens * 10 pieces
    });

    it("Should return correct tokens list", async function () {
      const tokens = await luckyBox.getTokens();
      expect(tokens.length).to.equal(10);
    });
  });
});
