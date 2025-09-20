import { PrivyClient } from "@privy-io/server-auth";
import {
  createPublicClient,
  formatUnits,
  parseUnits,
  http,
  encodeFunctionData,
  Hex,
} from "viem";
import { monadTestnet } from "../config/chains";
import { config } from "../config/env";

export interface BetMarketConfig {
  privyAppId: string;
  privyAppSecret: string;
  rpcUrl?: string;
}

export interface MarketStats {
  totalYesBets: string;
  totalNoBets: string;
  totalBets: number;
  isSettled: boolean;
  winner?: boolean;
}

export interface UserBets {
  yesAmount: string;
  noAmount: string;
  totalAmount: string;
}

export interface BetPlacementResult {
  success: boolean;
  txHash?: string;
  message: string;
}

export interface ProfitCalculation {
  potentialWinnings: string;
  profitIfWin: string;
  currentOdds: {
    yesOdds: number;
    noOdds: number;
  };
  marketShare: {
    yesPercentage: number;
    noPercentage: number;
  };
}

// BetMarket contract ABI
const BET_MARKET_ABI = [
  {
    inputs: [],
    name: "BET_AMOUNT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "betOnYes", type: "bool" }],
    name: "placeBet",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "_winner", type: "bool" }],
    name: "settleMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "calculateReward",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserBets",
    outputs: [
      { name: "yesAmount", type: "uint256" },
      { name: "noAmount", type: "uint256" },
      { name: "totalAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getPendingClaim",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMarketStats",
    outputs: [
      { name: "_totalYesBets", type: "uint256" },
      { name: "_totalNoBets", type: "uint256" },
      { name: "_totalBets", type: "uint256" },
      { name: "_isSettled", type: "bool" },
      { name: "_winner", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getQuestion",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "creator",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalYesBets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalNoBets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalBets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isSettled",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "winner",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "betOnYes", type: "bool" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "BetPlaced",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "winner", type: "bool" }],
    name: "MarketSettled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "RewardClaimed",
    type: "event",
  },
] as const;

export class BetMarketService {
  private readonly publicClient;
  private readonly privyClient;
  private readonly chain;

  constructor(betMarketConfig: BetMarketConfig) {
    this.chain = monadTestnet;

    // Create public client for reading blockchain data
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(betMarketConfig.rpcUrl || this.chain.rpcUrls.default.http[0]),
    });

    // Initialize Privy client
    this.privyClient = new PrivyClient(
      betMarketConfig.privyAppId,
      betMarketConfig.privyAppSecret
    );
  }

  /**
   * Get the betting amount required for this market
   */
  async getBetAmount(marketAddress: string): Promise<string> {
    try {
      const betAmount = await this.publicClient.readContract({
        address: marketAddress as `0x${string}`,
        abi: BET_MARKET_ABI,
        functionName: "BET_AMOUNT",
      });

      return formatUnits(betAmount as bigint, 18);
    } catch (error) {
      console.error("Failed to get bet amount:", error);
      return "0.01"; // Default bet amount
    }
  }

  /**
   * Get market statistics including current yes/no bets
   */
  async getMarketStats(marketAddress: string): Promise<MarketStats> {
    try {
      const [totalYesBets, totalNoBets, totalBets, isSettled, winner] =
        await this.publicClient.readContract({
          address: marketAddress as `0x${string}`,
          abi: BET_MARKET_ABI,
          functionName: "getMarketStats",
        });

      return {
        totalYesBets: formatUnits(totalYesBets as bigint, 18),
        totalNoBets: formatUnits(totalNoBets as bigint, 18),
        totalBets: Number(totalBets),
        isSettled: isSettled as boolean,
        winner: isSettled ? (winner as boolean) : undefined,
      };
    } catch (error) {
      console.error("Failed to get market stats:", error);
      return {
        totalYesBets: "0",
        totalNoBets: "0",
        totalBets: 0,
        isSettled: false,
      };
    }
  }

  /**
   * Get user's bet history for a specific market
   */
  async getUserBets(marketAddress: string, userAddress: string): Promise<UserBets> {
    try {
      const [yesAmount, noAmount, totalAmount] = await this.publicClient.readContract({
        address: marketAddress as `0x${string}`,
        abi: BET_MARKET_ABI,
        functionName: "getUserBets",
        args: [userAddress as `0x${string}`],
      });

      return {
        yesAmount: formatUnits(yesAmount as bigint, 18),
        noAmount: formatUnits(noAmount as bigint, 18),
        totalAmount: formatUnits(totalAmount as bigint, 18),
      };
    } catch (error) {
      console.error("Failed to get user bets:", error);
      return {
        yesAmount: "0",
        noAmount: "0",
        totalAmount: "0",
      };
    }
  }

  /**
   * Calculate potential profit for a bet before placing it
   */
  async calculatePotentialProfit(
    marketAddress: string,
    betOnYes: boolean,
    betAmount: string = "0.01"
  ): Promise<ProfitCalculation> {
    try {
      const stats = await this.getMarketStats(marketAddress);

      const currentYesBets = parseFloat(stats.totalYesBets);
      const currentNoBets = parseFloat(stats.totalNoBets);
      const betAmountNum = parseFloat(betAmount);

      // Calculate what the totals would be after this bet
      const newYesBets = currentYesBets + (betOnYes ? betAmountNum : 0);
      const newNoBets = currentNoBets + (betOnYes ? 0 : betAmountNum);
      const totalPool = newYesBets + newNoBets;

      if (totalPool === 0) {
        return {
          potentialWinnings: betAmount,
          profitIfWin: "0",
          currentOdds: { yesOdds: 1, noOdds: 1 },
          marketShare: { yesPercentage: 50, noPercentage: 50 },
        };
      }

      // Calculate potential winnings based on proportional share
      let potentialWinnings: number;
      let profitIfWin: number;

      if (betOnYes) {
        // If betting on yes, potential winnings = bet + proportional share of no bets
        potentialWinnings = betAmountNum + (betAmountNum * newNoBets) / newYesBets;
        profitIfWin = potentialWinnings - betAmountNum;
      } else {
        // If betting on no, potential winnings = bet + proportional share of yes bets
        potentialWinnings = betAmountNum + (betAmountNum * newYesBets) / newNoBets;
        profitIfWin = potentialWinnings - betAmountNum;
      }

      // Calculate odds (ratio of potential winnings to bet amount)
      const yesOdds = newNoBets > 0 ? (newYesBets + newNoBets) / newYesBets : 1;
      const noOdds = newYesBets > 0 ? (newYesBets + newNoBets) / newNoBets : 1;

      // Calculate market share percentages
      const yesPercentage = (newYesBets / totalPool) * 100;
      const noPercentage = (newNoBets / totalPool) * 100;

      return {
        potentialWinnings: potentialWinnings.toFixed(6),
        profitIfWin: profitIfWin.toFixed(6),
        currentOdds: {
          yesOdds: parseFloat(yesOdds.toFixed(3)),
          noOdds: parseFloat(noOdds.toFixed(3)),
        },
        marketShare: {
          yesPercentage: parseFloat(yesPercentage.toFixed(2)),
          noPercentage: parseFloat(noPercentage.toFixed(2)),
        },
      };
    } catch (error) {
      console.error("Failed to calculate potential profit:", error);
      return {
        potentialWinnings: betAmount,
        profitIfWin: "0",
        currentOdds: { yesOdds: 1, noOdds: 1 },
        marketShare: { yesPercentage: 50, noPercentage: 50 },
      };
    }
  }

  /**
   * Place a bet on a market using Privy wallet
   */
  async placeBet(
    marketAddress: string,
    privyWalletId: string,
    betOnYes: boolean
  ): Promise<BetPlacementResult> {
    try {
      // Get the required bet amount
      const betAmount = await this.getBetAmount(marketAddress);
      const betAmountWei = parseUnits(betAmount, 18);

      // Prepare bet transaction data
      const placeBetData = encodeFunctionData({
        abi: BET_MARKET_ABI,
        functionName: "placeBet",
        args: [betOnYes],
      });

      const transaction = {
        to: marketAddress as `0x${string}`,
        data: placeBetData,
        value: `0x${betAmountWei.toString(16)}` as const,
        chainId: this.chain.id as number,
      };

      // Send transaction using Privy wallet API
      const result = await this.privyClient.walletApi.ethereum.sendTransaction({
        walletId: privyWalletId,
        transaction,
        caip2: `eip155:${this.chain.id}`,
      });

      console.log(
        `Bet placed on ${betOnYes ? "YES" : "NO"} for ${betAmount} MON. Transaction hash: ${result.hash}`
      );

      return {
        success: true,
        txHash: result.hash,
        message: `Bet placed successfully on ${betOnYes ? "YES" : "NO"}`,
      };
    } catch (error) {
      console.error("Bet placement failed:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Bet placement failed",
      };
    }
  }

  /**
   * Settle a market (only market creator can do this)
   */
  async settleMarket(
    marketAddress: string,
    privyWalletId: string,
    winner: boolean
  ): Promise<BetPlacementResult> {
    try {
      // Prepare settle market transaction data
      const settleData = encodeFunctionData({
        abi: BET_MARKET_ABI,
        functionName: "settleMarket",
        args: [winner],
      });

      const transaction = {
        to: marketAddress as `0x${string}`,
        data: settleData,
        value: "0x0" as const,
        chainId: this.chain.id as number,
      };

      // Send transaction using Privy wallet API
      const result = await this.privyClient.walletApi.ethereum.sendTransaction({
        walletId: privyWalletId,
        transaction,
        caip2: `eip155:${this.chain.id}`,
      });

      console.log(
        `Market settled with winner: ${winner ? "YES" : "NO"}. Transaction hash: ${result.hash}`
      );

      return {
        success: true,
        txHash: result.hash,
        message: `Market settled successfully with winner: ${winner ? "YES" : "NO"}`,
      };
    } catch (error) {
      console.error("Market settlement failed:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Market settlement failed",
      };
    }
  }

  /**
   * Claim rewards from a settled market
   */
  async claimReward(
    marketAddress: string,
    privyWalletId: string
  ): Promise<BetPlacementResult> {
    try {
      // Prepare claim reward transaction data
      const claimData = encodeFunctionData({
        abi: BET_MARKET_ABI,
        functionName: "claimReward",
        args: [],
      });

      const transaction = {
        to: marketAddress as `0x${string}`,
        data: claimData,
        value: "0x0" as const,
        chainId: this.chain.id as number,
      };

      // Send transaction using Privy wallet API
      const result = await this.privyClient.walletApi.ethereum.sendTransaction({
        walletId: privyWalletId,
        transaction,
        caip2: `eip155:${this.chain.id}`,
      });

      console.log(`Rewards claimed. Transaction hash: ${result.hash}`);

      return {
        success: true,
        txHash: result.hash,
        message: "Rewards claimed successfully",
      };
    } catch (error) {
      console.error("Reward claim failed:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Reward claim failed",
      };
    }
  }

  /**
   * Get pending claim amount for a user
   */
  async getPendingClaim(marketAddress: string, userAddress: string): Promise<string> {
    try {
      const pendingClaim = await this.publicClient.readContract({
        address: marketAddress as `0x${string}`,
        abi: BET_MARKET_ABI,
        functionName: "getPendingClaim",
        args: [userAddress as `0x${string}`],
      });

      return formatUnits(pendingClaim as bigint, 18);
    } catch (error) {
      console.error("Failed to get pending claim:", error);
      return "0";
    }
  }

  /**
   * Get market question
   */
  async getQuestion(marketAddress: string): Promise<string> {
    try {
      const question = await this.publicClient.readContract({
        address: marketAddress as `0x${string}`,
        abi: BET_MARKET_ABI,
        functionName: "getQuestion",
      });

      return question as string;
    } catch (error) {
      console.error("Failed to get question:", error);
      return "";
    }
  }

  /**
   * Get market creator address
   */
  async getCreator(marketAddress: string): Promise<string> {
    try {
      const creator = await this.publicClient.readContract({
        address: marketAddress as `0x${string}`,
        abi: BET_MARKET_ABI,
        functionName: "creator",
      });

      return creator as string;
    } catch (error) {
      console.error("Failed to get creator:", error);
      return "";
    }
  }
}

/**
 * Factory function to create a BetMarketService instance with default config
 */
export function createBetMarketService(): BetMarketService {
  const betMarketConfig: BetMarketConfig = {
    privyAppId: config.privy.appId,
    privyAppSecret: config.privy.appSecret,
    rpcUrl: config.gasTank.rpcUrl,
  };

  return new BetMarketService(betMarketConfig);
}

/**
 * Default export for the service instance
 */
export const betMarketService = createBetMarketService();