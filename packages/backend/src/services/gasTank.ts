import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "../config/chains";

export interface GasTankConfig {
  privateKey: string;
  gasAmount: string; // Amount in MON to send (e.g., "0.001")
  rpcUrl?: string;
}

export interface GasSupportResult {
  success: boolean;
  txHash?: string;
  amount?: string;
  message: string;
}

export interface GasTankBalance {
  balance: string;
  address: string;
}

export class GasTankService {
  private readonly publicClient;
  private readonly gasTankAccount;
  private readonly gasAmount: bigint;
  private readonly chain = monadTestnet;

  constructor(config: GasTankConfig) {
    // Create public client for reading blockchain data
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(config.rpcUrl || this.chain.rpcUrls.default.http[0]),
    });

    // Create gas tank account from private key
    if (!config.privateKey) {
      throw new Error("Private key is required");
    }

    this.gasTankAccount = privateKeyToAccount(
      config.privateKey as `0x${string}`
    );
    this.gasAmount = parseEther(config.gasAmount);
  }

  /**
   * Get MON balance for any address
   */
  async getMonBalance(address: `0x${string}`): Promise<bigint> {
    return await this.publicClient.getBalance({ address });
  }

  /**
   * Send gas support to a recipient address
   * Only sends if recipient has less than the configured gas amount
   */
  async supportGas(address: string): Promise<GasSupportResult> {
    try {
      const recipientAddress = address as `0x${string}`;

      // Check gas tank balance
      const gasTankBalance = await this.getMonBalance(
        this.gasTankAccount.address
      );

      if (gasTankBalance === 0n) {
        return {
          success: false,
          message: "Gas tank is empty",
        };
      }

      // Check recipient balance
      const recipientBalance = await this.getMonBalance(recipientAddress);

      // Only send if recipient has less than gas amount
      if (recipientBalance >= this.gasAmount) {
        return {
          success: false,
          message: "Recipient already has sufficient gas",
        };
      }

      // Check if gas tank has enough balance
      if (gasTankBalance < this.gasAmount) {
        return {
          success: false,
          message: "Insufficient gas tank balance",
        };
      }

      // Create wallet client for transactions
      const walletClient = createWalletClient({
        account: this.gasTankAccount,
        chain: this.chain,
        transport: http(
          this.publicClient.transport.url || this.chain.rpcUrls.default.http[0]
        ),
      });

      // Send MON to the recipient
      const txHash = await walletClient.sendTransaction({
        account: this.gasTankAccount,
        to: recipientAddress,
        value: this.gasAmount,
      });

      const gasAmountFormatted = formatEther(this.gasAmount);

      console.log(
        `Sent ${gasAmountFormatted} MON gas support to ${address}. Transaction hash: ${txHash}`
      );

      return {
        success: true,
        txHash,
        amount: gasAmountFormatted,
        message: "Gas support sent successfully",
      };
    } catch (error) {
      console.error("Gas support failed:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Gas support failed",
      };
    }
  }

  /**
   * Get the current gas tank balance
   */
  async getGasTankBalance(): Promise<GasTankBalance> {
    try {
      const balance = await this.getMonBalance(this.gasTankAccount.address);

      return {
        balance: formatEther(balance),
        address: this.gasTankAccount.address,
      };
    } catch (error) {
      console.error("Failed to get gas tank balance:", error);
      throw error;
    }
  }

  /**
   * Check if an address needs gas support
   */
  async needsGasSupport(address: string): Promise<boolean> {
    try {
      const recipientBalance = await this.getMonBalance(
        address as `0x${string}`
      );
      return recipientBalance < this.gasAmount;
    } catch (error) {
      console.error("Failed to check gas support need:", error);
      return false;
    }
  }

  /**
   * Get gas tank account address
   */
  getGasTankAddress(): string {
    return this.gasTankAccount.address;
  }

  /**
   * Get the chain information
   */
  getChainInfo() {
    return {
      id: this.chain.id,
      name: this.chain.name,
      symbol: this.chain.nativeCurrency.symbol,
      rpcUrl: this.chain.rpcUrls.default.http[0],
      blockExplorer: this.chain.blockExplorers?.default?.url,
    };
  }
}

/**
 * Factory function to create a GasTankService instance
 */
export function createGasTankService(config: GasTankConfig): GasTankService {
  return new GasTankService(config);
}

/**
 * Example usage:
 *
 * const gasTank = createGasTankService({
 *   privateKey: '0x...',
 *   gasAmount: '0.001',
 *   rpcUrl: 'https://testnet-rpc.monad.xyz'
 * });
 *
 * // Check if address needs gas
 * const needsGas = await gasTank.needsGasSupport('0x...');
 *
 * // Send gas support
 * const result = await gasTank.supportGas('0x...');
 *
 * // Get gas tank balance
 * const balance = await gasTank.getGasTankBalance();
 */
