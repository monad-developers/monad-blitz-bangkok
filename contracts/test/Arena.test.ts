import { ethers } from "hardhat";
import { expect } from "chai";
import { GameToken, Arena, Badges } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Monad Code Arena", function () {
  let gameToken: GameToken;
  let arena: Arena;
  let badges: Badges;
  let owner: SignerWithAddress;
  let oracle: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;
  let treasury: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000000"); // 1B tokens
  const STAKE_AMOUNT = ethers.parseEther("100"); // 100 GAME tokens

  beforeEach(async function () {
    [owner, oracle, player1, player2, treasury] = await ethers.getSigners();

    // Deploy GameToken
    const GameTokenFactory = await ethers.getContractFactory("GameToken");
    gameToken = await GameTokenFactory.deploy();
    await gameToken.waitForDeployment();

    // Deploy Arena
    const ArenaFactory = await ethers.getContractFactory("Arena");
    arena = await ArenaFactory.deploy(await gameToken.getAddress(), oracle.address);
    await arena.waitForDeployment();

    // Deploy Badges
    const BadgesFactory = await ethers.getContractFactory("Badges");
    badges = await BadgesFactory.deploy("https://api.monadarena.com/badges/");
    await badges.waitForDeployment();

    // Setup: Add Arena as minter for GameToken
    await gameToken.addMinter(await arena.getAddress());

    // Setup: Add Arena as minter for Badges
    await badges.addMinter(await arena.getAddress());

    // Transfer tokens to players
    await gameToken.transfer(player1.address, ethers.parseEther("10000"));
    await gameToken.transfer(player2.address, ethers.parseEther("10000"));

    // Approve Arena to spend player tokens
    await gameToken.connect(player1).approve(await arena.getAddress(), ethers.parseEther("10000"));
    await gameToken.connect(player2).approve(await arena.getAddress(), ethers.parseEther("10000"));
  });

  describe("GameToken", function () {
    it("Should have correct initial supply", async function () {
      expect(await gameToken.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await gameToken.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY - ethers.parseEther("20000") // 10k to each player
      );
    });

    it("Should allow minters to mint tokens", async function () {
      await gameToken.mint(player1.address, ethers.parseEther("1000"));
      expect(await gameToken.balanceOf(player1.address)).to.equal(ethers.parseEther("11000"));
    });

    it("Should not allow non-minters to mint", async function () {
      await expect(
        gameToken.connect(player1).mint(player1.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("GameToken: caller is not a minter");
    });
  });

  describe("Arena - Match Creation", function () {
    it("Should create a match successfully", async function () {
      const challengeHash = ethers.keccak256(ethers.toUtf8Bytes("challenge1"));
      
      const tx = await arena.connect(player1).createMatch(
        0, // SpeedSolve
        STAKE_AMOUNT,
        challengeHash,
        300 // 5 minutes
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return arena.interface.parseLog(log)?.name === "MatchCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      
      // Check player's token balance decreased
      expect(await gameToken.balanceOf(player1.address)).to.equal(
        ethers.parseEther("10000") - STAKE_AMOUNT
      );
    });

    it("Should not allow creating match with zero stake", async function () {
      const challengeHash = ethers.keccak256(ethers.toUtf8Bytes("challenge1"));
      
      await expect(
        arena.connect(player1).createMatch(0, 0, challengeHash, 300)
      ).to.be.revertedWith("Arena: stake amount must be positive");
    });
  });

  describe("Arena - Match Joining", function () {
    let matchId: string;

    beforeEach(async function () {
      const challengeHash = ethers.keccak256(ethers.toUtf8Bytes("challenge1"));
      
      const tx = await arena.connect(player1).createMatch(
        0, // SpeedSolve
        STAKE_AMOUNT,
        challengeHash,
        300
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return arena.interface.parseLog(log)?.name === "MatchCreated";
        } catch {
          return false;
        }
      });

      const parsedEvent = arena.interface.parseLog(event!);
      matchId = parsedEvent?.args[0];
    });

    it("Should allow opponent to join match", async function () {
      await arena.connect(player2).joinMatch(matchId);

      const match = await arena.getMatch(matchId);
      expect(match.opponent).to.equal(player2.address);
      expect(match.status).to.equal(1); // Joined

      // Check both players' balances
      expect(await gameToken.balanceOf(player1.address)).to.equal(
        ethers.parseEther("10000") - STAKE_AMOUNT
      );
      expect(await gameToken.balanceOf(player2.address)).to.equal(
        ethers.parseEther("10000") - STAKE_AMOUNT
      );
    });

    it("Should not allow creator to join own match", async function () {
      await expect(
        arena.connect(player1).joinMatch(matchId)
      ).to.be.revertedWith("Arena: cannot join own match");
    });
  });

  describe("Arena - Match Resolution", function () {
    let matchId: string;

    beforeEach(async function () {
      const challengeHash = ethers.keccak256(ethers.toUtf8Bytes("challenge1"));
      
      // Create match
      const createTx = await arena.connect(player1).createMatch(
        0, // SpeedSolve
        STAKE_AMOUNT,
        challengeHash,
        300
      );

      const createReceipt = await createTx.wait();
      const createEvent = createReceipt?.logs.find(log => {
        try {
          return arena.interface.parseLog(log)?.name === "MatchCreated";
        } catch {
          return false;
        }
      });

      const parsedCreateEvent = arena.interface.parseLog(createEvent!);
      matchId = parsedCreateEvent?.args[0];

      // Join match
      await arena.connect(player2).joinMatch(matchId);
    });

    it("Should resolve match correctly", async function () {
      // Create oracle signature
      const messageHash = ethers.keccak256(
        ethers.solidityPacked(["bytes32", "address"], [matchId, player1.address])
      );
      const signature = await oracle.signMessage(ethers.getBytes(messageHash));

      // Resolve match
      await arena.connect(oracle).resolveMatch(matchId, player1.address, signature);

      const match = await arena.getMatch(matchId);
      expect(match.winner).to.equal(player1.address);
      expect(match.status).to.equal(4); // Resolved

      // Check payout (2 * stake - 2.5% fee)
      const totalPot = STAKE_AMOUNT * 2n;
      const protocolFee = (totalPot * 250n) / 10000n; // 2.5%
      const expectedPayout = totalPot - protocolFee;

      const player1Balance = await gameToken.balanceOf(player1.address);
      const expectedBalance = ethers.parseEther("10000") - STAKE_AMOUNT + expectedPayout;
      
      expect(player1Balance).to.equal(expectedBalance);
    });

    it("Should not allow non-oracle to resolve match", async function () {
      const messageHash = ethers.keccak256(
        ethers.solidityPacked(["bytes32", "address"], [matchId, player1.address])
      );
      const signature = await player1.signMessage(ethers.getBytes(messageHash));

      await expect(
        arena.connect(player1).resolveMatch(matchId, player1.address, signature)
      ).to.be.revertedWith("Arena: caller is not oracle");
    });
  });

  describe("Badges", function () {
    it("Should mint first win badge", async function () {
      await badges.mintBadge(player1.address, 1); // FIRST_WIN_BADGE

      expect(await badges.hasBadge(player1.address, 1)).to.be.true;
      expect(await badges.balanceOf(player1.address, 1)).to.equal(1);
    });

    it("Should not allow duplicate badge minting", async function () {
      await badges.mintBadge(player1.address, 1);
      
      await expect(
        badges.mintBadge(player1.address, 1)
      ).to.be.revertedWith("Badges: player already has badge");
    });

    it("Should prevent badge transfers", async function () {
      await badges.mintBadge(player1.address, 1);
      
      await expect(
        badges.connect(player1).safeTransferFrom(
          player1.address,
          player2.address,
          1,
          1,
          "0x"
        )
      ).to.be.revertedWith("Badges: transfers not allowed");
    });

    it("Should return player's badges", async function () {
      await badges.mintBadge(player1.address, 1); // First win
      await badges.mintBadge(player1.address, 2); // Five streak

      const playerBadges = await badges.getPlayerBadges(player1.address);
      expect(playerBadges).to.have.lengthOf(2);
      expect(playerBadges[0]).to.equal(1);
      expect(playerBadges[1]).to.equal(2);
    });
  });

  describe("Integration", function () {
    it("Should handle complete match flow", async function () {
      const challengeHash = ethers.keccak256(ethers.toUtf8Bytes("integration_test"));
      
      // 1. Create match
      const createTx = await arena.connect(player1).createMatch(
        0, // SpeedSolve
        STAKE_AMOUNT,
        challengeHash,
        300
      );

      const createReceipt = await createTx.wait();
      const createEvent = createReceipt?.logs.find(log => {
        try {
          return arena.interface.parseLog(log)?.name === "MatchCreated";
        } catch {
          return false;
        }
      });

      const parsedCreateEvent = arena.interface.parseLog(createEvent!);
      const matchId = parsedCreateEvent?.args[0];

      // 2. Join match
      await arena.connect(player2).joinMatch(matchId);

      // 3. Resolve match (player1 wins)
      const messageHash = ethers.keccak256(
        ethers.solidityPacked(["bytes32", "address"], [matchId, player1.address])
      );
      const signature = await oracle.signMessage(ethers.getBytes(messageHash));
      await arena.connect(oracle).resolveMatch(matchId, player1.address, signature);

      // 4. Award badge (simulate oracle awarding first win badge)
      await badges.mintBadge(player1.address, 1); // FIRST_WIN_BADGE

      // Verify final state
      const match = await arena.getMatch(matchId);
      expect(match.winner).to.equal(player1.address);
      expect(await badges.hasBadge(player1.address, 1)).to.be.true;

      // Verify balances
      const totalPot = STAKE_AMOUNT * 2n;
      const protocolFee = (totalPot * 250n) / 10000n;
      const expectedPayout = totalPot - protocolFee;
      
      const player1Balance = await gameToken.balanceOf(player1.address);
      const expectedBalance = ethers.parseEther("10000") - STAKE_AMOUNT + expectedPayout;
      expect(player1Balance).to.equal(expectedBalance);
    });
  });
});