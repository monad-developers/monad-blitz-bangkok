import { PrivyClient } from "@privy-io/server-auth";
import {
  createPublicClient,
  formatUnits,
  parseUnits,
  http,
  encodeFunctionData,
  Hex,
} from "viem";
import { config } from "../config/env";
import { monadTestnet } from "../config/chains";

export interface BetFactoryConfig {
  privyAppId: string;
  privyAppSecret: string;
  contractAddress: string;
  rpcUrl?: string;
}

export interface MarketCreationResult {
  success: boolean;
  marketAddress?: string;
  txHash?: string;
  message: string;
}

export interface BetResult {
  success: boolean;
  txHash?: string;
  amount?: string;
  message: string;
}

export interface MarketInfo {
  address: string;
  question: string;
  isActive: boolean;
}

export interface UserBetHistory {
  marketAddresses: string[];
  yesAmounts: string[];
  noAmounts: string[];
  totalAmounts: string[];
}

export interface UserPendingClaims {
  marketAddresses: string[];
  claimAmounts: string[];
}

// BetFactory contract ABI (essential functions only)
const BET_FACTORY_ABI = [
  {
    inputs: [{ name: "question", type: "string" }],
    name: "createMarket",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveMarkets",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllMarkets",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserMarkets",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMarketCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveMarketCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "getMarketByIndex",
    outputs: [
      { name: "marketAddress", type: "address" },
      { name: "question", type: "string" },
      { name: "isActive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserBetHistory",
    outputs: [
      { name: "marketAddresses", type: "address[]" },
      { name: "yesAmounts", type: "uint256[]" },
      { name: "noAmounts", type: "uint256[]" },
      { name: "totalAmounts", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserPendingClaims",
    outputs: [
      { name: "marketAddresses", type: "address[]" },
      { name: "claimAmounts", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "claimAllRewards",
    outputs: [{ name: "totalClaimed", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "market", type: "address" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "question", type: "string" },
    ],
    name: "MarketCreated",
    type: "event",
  },
] as const;

export class BetFactoryService {
  private readonly publicClient;
  private readonly privyClient;
  private readonly contractAddress: `0x${string}`;
  private readonly chain;

  constructor(betFactoryConfig: BetFactoryConfig) {
    this.chain = monadTestnet;

    // Create public client for reading blockchain data
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(betFactoryConfig.rpcUrl || this.chain.rpcUrls.default.http[0]),
    });

    // Initialize Privy client
    this.privyClient = new PrivyClient(
      betFactoryConfig.privyAppId,
      betFactoryConfig.privyAppSecret
    );

    this.contractAddress = betFactoryConfig.contractAddress as `0x${string}`;
  }

  /**
   * Create a new betting market using Privy wallet
   */
  async createMarket(
    privyWalletId: string,
    question: string
  ): Promise<MarketCreationResult> {
    try {
      // Prepare market creation transaction data
      const createMarketData = encodeFunctionData({
        abi: BET_FACTORY_ABI,
        functionName: "createMarket",
        args: [question],
      });

      const transaction = {
        to: this.contractAddress,
        data: createMarketData,
        value: "0x0" as const,
        chainId: this.chain.id as number,
      };

      // Send transaction using Privy wallet API
      const result = await this.privyClient.walletApi.ethereum.sendTransaction({
        walletId: privyWalletId,
        transaction,
        caip2: `eip155:${this.chain.id}`,
      });

      console.log(`Market creation transaction sent. Hash: ${result.hash}`);

      return {
        success: true,
        txHash: result.hash,
        message: "Market creation transaction sent successfully",
      };
    } catch (error) {
      console.error("Market creation failed:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Market creation failed",
      };
    }
  }

  /**
   * Get all active markets
   */
  async getActiveMarkets(): Promise<string[]> {
    try {
      const activeMarkets = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: BET_FACTORY_ABI,
        functionName: "getActiveMarkets",
      });

      return activeMarkets as string[];
    } catch (error) {
      console.error("Failed to get active markets:", error);
      return [];
    }
  }

  /**
   * Get all markets (active and settled)
   */
  async getAllMarkets(): Promise<string[]> {
    try {
      const allMarkets = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: BET_FACTORY_ABI,
        functionName: "getAllMarkets",
      });

      return allMarkets as string[];
    } catch (error) {
      console.error("Failed to get all markets:", error);
      return [];
    }
  }

  /**
   * Get markets created by a specific user
   */
  async getUserMarkets(userAddress: string): Promise<string[]> {
    try {
      const userMarkets = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: BET_FACTORY_ABI,
        functionName: "getUserMarkets",
        args: [userAddress as `0x${string}`],
      });

      return userMarkets as string[];
    } catch (error) {
      console.error("Failed to get user markets:", error);
      return [];
    }
  }

  /**
   * Get total market count
   */
  async getMarketCount(): Promise<number> {
    try {
      const count = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: BET_FACTORY_ABI,
        functionName: "getMarketCount",
      });

      return Number(count);
    } catch (error) {
      console.error("Failed to get market count:", error);
      return 0;
    }
  }

  /**
   * Get active market count
   */
  async getActiveMarketCount(): Promise<number> {
    try {
      const count = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: BET_FACTORY_ABI,
        functionName: "getActiveMarketCount",
      });

      return Number(count);
    } catch (error) {
      console.error("Failed to get active market count:", error);
      return 0;
    }
  }

  /**
   * Get market details by index
   */
  async getMarketByIndex(index: number): Promise<MarketInfo | null> {
    try {
      const [marketAddress, question, isActive] = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: BET_FACTORY_ABI,
        functionName: "getMarketByIndex",
        args: [BigInt(index)],
      });

      return {
        address: marketAddress,
        question,
        isActive,
      };
    } catch (error) {
      console.error("Failed to get market by index:", error);
      return null;
    }
  }

  /**
   * Get user's bet history across all markets
   */
  async getUserBetHistory(userAddress: string): Promise<UserBetHistory> {
    try {
      const [marketAddresses, yesAmounts, noAmounts, totalAmounts] =
        await this.publicClient.readContract({
          address: this.contractAddress,
          abi: BET_FACTORY_ABI,
          functionName: "getUserBetHistory",
          args: [userAddress as `0x${string}`],
        });

      return {
        marketAddresses: marketAddresses as string[],
        yesAmounts: (yesAmounts as bigint[]).map((amount) => formatUnits(amount, 18)),
        noAmounts: (noAmounts as bigint[]).map((amount) => formatUnits(amount, 18)),
        totalAmounts: (totalAmounts as bigint[]).map((amount) => formatUnits(amount, 18)),
      };
    } catch (error) {
      console.error("Failed to get user bet history:", error);
      return {
        marketAddresses: [],
        yesAmounts: [],
        noAmounts: [],
        totalAmounts: [],
      };
    }
  }

  /**
   * Get user's pending claims across all markets
   */
  async getUserPendingClaims(userAddress: string): Promise<UserPendingClaims> {
    try {
      const [marketAddresses, claimAmounts] = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: BET_FACTORY_ABI,
        functionName: "getUserPendingClaims",
        args: [userAddress as `0x${string}`],
      });

      return {
        marketAddresses: marketAddresses as string[],
        claimAmounts: (claimAmounts as bigint[]).map((amount) => formatUnits(amount, 18)),
      };
    } catch (error) {
      console.error("Failed to get user pending claims:", error);
      return {
        marketAddresses: [],
        claimAmounts: [],
      };
    }
  }

  /**
   * Claim all pending rewards for a user using Privy wallet
   */
  async claimAllRewards(
    privyWalletId: string,
    userAddress: string
  ): Promise<BetResult> {
    try {
      // Prepare claim all rewards transaction data
      const claimData = encodeFunctionData({
        abi: BET_FACTORY_ABI,
        functionName: "claimAllRewards",
        args: [userAddress as `0x${string}`],
      });

      const transaction = {
        to: this.contractAddress,
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

      console.log(`Claim all rewards transaction sent. Hash: ${result.hash}`);

      return {
        success: true,
        txHash: result.hash,
        message: "Claim all rewards transaction sent successfully",
      };
    } catch (error) {
      console.error("Claim all rewards failed:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Claim all rewards failed",
      };
    }
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }

  /**
   * Get chain ID
   */
  getChainId(): number {
    return this.chain.id;
  }

  /**
   * Get chain name
   */
  getChainName(): string {
    return this.chain.name;
  }

  /**
   * Get RPC URL
   */
  getRpcUrl(): string {
    return this.chain.rpcUrls.default.http[0];
  }
}

/**
 * Factory function to create a BetFactoryService instance with default config
 */
export function createBetFactoryService(): BetFactoryService {
  const betFactoryConfig: BetFactoryConfig = {
    privyAppId: config.privy.appId,
    privyAppSecret: config.privy.appSecret,
    contractAddress: "0x7CE3FF595B5c2d3b8218A776965A8b6B543A40d4", // Deployed BetFactory address on Monad testnet
    rpcUrl: config.gasTank.rpcUrl, // Use the Monad testnet RPC URL from config
  };

  return new BetFactoryService(betFactoryConfig);
}

/**
 * Default export for the service instance
 */
export const betFactoryService = createBetFactoryService();

/**
 * Example usage:
 *
 * // 1. Create a new betting market
 * const marketResult = await betFactoryService.createMarket(
 *   'privy-wallet-id',
 *   'Will the price of Bitcoin exceed $100,000 by end of 2024?'
 * );
 *
 * // 2. Get all active markets
 * const activeMarkets = await betFactoryService.getActiveMarkets();
 *
 * // 3. Get user's markets
 * const userMarkets = await betFactoryService.getUserMarkets('0x...');
 *
 * // 4. Get user's bet history
 * const betHistory = await betFactoryService.getUserBetHistory('0x...');
 *
 * // 5. Get user's pending claims
 * const pendingClaims = await betFactoryService.getUserPendingClaims('0x...');
 *
 * // 6. Claim all rewards
 * const claimResult = await betFactoryService.claimAllRewards('privy-wallet-id', '0x...');
 *
 * // 7. Get contract info
 * console.log('Contract Address:', betFactoryService.getContractAddress());
 * console.log('Chain ID:', betFactoryService.getChainId());
 * console.log('Chain Name:', betFactoryService.getChainName());
 */