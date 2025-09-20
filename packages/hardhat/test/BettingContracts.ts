import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("Betting Contracts", function () {
  let betFactory: Contract;
  let betMarket: Contract;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy BetFactory
    const BetFactory = await ethers.getContractFactory("BetFactory");
    betFactory = await BetFactory.deploy();
    await betFactory.waitForDeployment();
  });

  describe("BetFactory", function () {
    it("Should deploy successfully", async function () {
      expect(await betFactory.getAddress()).to.be.properAddress;
      expect(await betFactory.owner()).to.equal(owner.address);
    });

    it("Should create a new market", async function () {
      const question = "Will Bitcoin reach $100k by end of 2024?";

      const tx = await betFactory.createMarket(question);
      const receipt = await tx.wait();

      // Get the market address from the event
      const event = receipt.logs.find((log: any) => log.fragment?.name === "MarketCreated");
      const marketAddress = event.args[0];

      expect(marketAddress).to.be.properAddress;
      expect(await betFactory.isMarket(marketAddress)).to.be.true;
      expect(await betFactory.getMarketCount()).to.equal(1);
    });

    it("Should track user markets", async function () {
      const question = "Will Ethereum reach $10k by end of 2024?";

      await betFactory.connect(user1).createMarket(question);
      const userMarkets = await betFactory.getUserMarkets(user1.address);

      expect(userMarkets.length).to.equal(1);
      expect(await betFactory.isMarket(userMarkets[0])).to.be.true;
    });

    it("Should get active markets", async function () {
      const question1 = "Question 1";
      const question2 = "Question 2";

      await betFactory.createMarket(question1);
      await betFactory.createMarket(question2);

      const activeMarkets = await betFactory.getActiveMarkets();
      expect(activeMarkets.length).to.equal(2);
    });
  });

  describe("BetMarket", function () {
    beforeEach(async function () {
      // Create a market for testing
      const question = "Will Bitcoin reach $100k by end of 2024?";
      const tx = await betFactory.createMarket(question);
      const receipt = await tx.wait();

      const event = receipt.logs.find((log: any) => log.fragment?.name === "MarketCreated");
      const marketAddress = event.args[0];

      betMarket = await ethers.getContractAt("BetMarket", marketAddress);
    });

    it("Should initialize correctly", async function () {
      expect(await betMarket.creator()).to.equal(owner.address);
      expect(await betMarket.question()).to.equal("Will Bitcoin reach $100k by end of 2024?");
      expect(await betMarket.isSettled()).to.be.false;
      expect(await betMarket.BET_AMOUNT()).to.equal(ethers.parseEther("0.01"));
    });

    it("Should allow users to place bets", async function () {
      const betAmount = ethers.parseEther("0.01");

      // User1 bets on yes
      await expect(betMarket.connect(user1).placeBet(true, { value: betAmount }))
        .to.emit(betMarket, "BetPlaced")
        .withArgs(user1.address, true, betAmount);

      // User2 bets on no
      await expect(betMarket.connect(user2).placeBet(false, { value: betAmount }))
        .to.emit(betMarket, "BetPlaced")
        .withArgs(user2.address, false, betAmount);

      // Check bet amounts
      const [yesAmount1, noAmount1] = await betMarket.getUserBets(user1.address);
      const [yesAmount2, noAmount2] = await betMarket.getUserBets(user2.address);

      expect(yesAmount1).to.equal(betAmount);
      expect(noAmount1).to.equal(0);
      expect(yesAmount2).to.equal(0);
      expect(noAmount2).to.equal(betAmount);

      // Check market stats
      const [totalYes, totalNo, totalBets, isSettled, winner] = await betMarket.getMarketStats();
      expect(totalYes).to.equal(betAmount);
      expect(totalNo).to.equal(betAmount);
      expect(totalBets).to.equal(2);
      expect(isSettled).to.be.false;
    });

    it("Should reject incorrect bet amounts", async function () {
      const wrongAmount = ethers.parseEther("0.02");

      await expect(betMarket.connect(user1).placeBet(true, { value: wrongAmount })).to.be.revertedWith(
        "Must bet exactly 0.01 ETH",
      );
    });

    it("Should reject bets on settled markets", async function () {
      const betAmount = ethers.parseEther("0.01");

      // Settle the market first
      await betMarket.settleMarket(true);

      await expect(betMarket.connect(user1).placeBet(true, { value: betAmount })).to.be.revertedWith(
        "Market is already settled",
      );
    });

    it("Should allow only creator to settle market", async function () {
      await expect(betMarket.connect(user1).settleMarket(true)).to.be.revertedWith(
        "Only creator can call this function",
      );

      await expect(betMarket.settleMarket(true)).to.emit(betMarket, "MarketSettled").withArgs(true);
    });

    it("Should calculate rewards correctly", async function () {
      const betAmount = ethers.parseEther("0.01");

      // User1 bets on yes, User2 bets on no
      await betMarket.connect(user1).placeBet(true, { value: betAmount });
      await betMarket.connect(user2).placeBet(false, { value: betAmount });

      // Settle with yes winning
      await betMarket.settleMarket(true);

      // User1 should get their bet back plus User2's bet
      const reward1 = await betMarket.calculateReward(user1.address);
      expect(reward1).to.equal(ethers.parseEther("0.02"));

      // User2 should get nothing
      const reward2 = await betMarket.calculateReward(user2.address);
      expect(reward2).to.equal(0);
    });

    it("Should allow users to claim rewards", async function () {
      const betAmount = ethers.parseEther("0.01");

      // User1 bets on yes, User2 bets on no
      await betMarket.connect(user1).placeBet(true, { value: betAmount });
      await betMarket.connect(user2).placeBet(false, { value: betAmount });

      // Settle with yes winning
      await betMarket.settleMarket(true);

      // User1 claims reward
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const tx = await betMarket.connect(user1).claimReward();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(user1.address);

      expect(finalBalance).to.equal(initialBalance + ethers.parseEther("0.02") - gasUsed);

      // User1 should not be able to claim again
      await expect(betMarket.connect(user1).claimReward()).to.be.revertedWith("Already claimed");
    });

    it("Should handle multiple bets from same user", async function () {
      const betAmount = ethers.parseEther("0.01");

      // User1 bets on yes twice
      await betMarket.connect(user1).placeBet(true, { value: betAmount });
      await betMarket.connect(user1).placeBet(true, { value: betAmount });

      const [yesAmount, noAmount, totalAmount] = await betMarket.getUserBets(user1.address);
      expect(yesAmount).to.equal(ethers.parseEther("0.02"));
      expect(noAmount).to.equal(0);
      expect(totalAmount).to.equal(ethers.parseEther("0.02"));
    });
  });

  describe("Integration Tests", function () {
    it("Should work end-to-end with factory and market", async function () {
      const question = "Will the price of ETH be above $3000 tomorrow?";

      // Create market
      const tx = await betFactory.createMarket(question);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => log.fragment?.name === "MarketCreated");
      const marketAddress = event.args[0];

      const market = await ethers.getContractAt("BetMarket", marketAddress);

      // Users place bets
      await market.connect(user1).placeBet(true, { value: ethers.parseEther("0.01") });
      await market.connect(user2).placeBet(false, { value: ethers.parseEther("0.01") });
      await market.connect(user3).placeBet(true, { value: ethers.parseEther("0.01") });

      // Check active markets
      const activeMarkets = await betFactory.getActiveMarkets();
      expect(activeMarkets.length).to.equal(1);
      expect(activeMarkets[0]).to.equal(marketAddress);

      // Settle market
      await market.settleMarket(true);

      // Check that market is no longer active
      const activeMarketsAfter = await betFactory.getActiveMarkets();
      expect(activeMarketsAfter.length).to.equal(0);

      // Users claim rewards
      await market.connect(user1).claimReward();
      await market.connect(user3).claimReward();

      // Check user bet history
      const [user1Markets, user1YesAmounts, user1NoAmounts, user1TotalAmounts] = await betFactory.getUserBetHistory(
        user1.address,
      );

      expect(user1Markets.length).to.equal(1);
      expect(user1Markets[0]).to.equal(marketAddress);
      expect(user1YesAmounts[0]).to.equal(ethers.parseEther("0.01"));
      expect(user1NoAmounts[0]).to.equal(0);
      expect(user1TotalAmounts[0]).to.equal(ethers.parseEther("0.01"));
    });
  });
});
