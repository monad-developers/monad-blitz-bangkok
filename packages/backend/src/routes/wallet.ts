import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrivyService } from "../services/privy";
import { GasTankService, createGasTankService } from "../services/gasTank";
import { config } from "../config/env";
import { createPublicClient, http, formatEther } from "viem";
import { monadTestnet } from "../config/chains";

const privyService = new PrivyService();

// Initialize Gas Tank Service
const gasTankService = createGasTankService({
  privateKey: config.gasTank.privateKey,
  gasAmount: config.gasTank.amount,
  rpcUrl: config.gasTank.rpcUrl,
});

// Create public client for balance queries
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(config.gasTank.rpcUrl),
});

interface WalletBalanceParams {
  userId: string;
}

interface GasSupportBody {
  userId: string;
}

interface AddressBalanceParams {
  address: string;
}

export async function walletRoutes(fastify: FastifyInstance) {
  // Get wallet balance for a user by userId
  fastify.get<{ Params: WalletBalanceParams }>(
    "/balance/:userId",
    async (request: FastifyRequest<{ Params: WalletBalanceParams }>, reply: FastifyReply) => {
      try {
        const { userId } = request.params;

        if (!userId) {
          return reply.status(400).send({
            success: false,
            message: "User ID is required",
          });
        }

        // Get user's Privy wallet
        const wallet = await privyService.getWalletAccount(userId);
        if (!wallet) {
          return reply.status(404).send({
            success: false,
            message: "Wallet not found for user",
          });
        }

        // Get balance from blockchain
        const balanceWei = await publicClient.getBalance({
          address: wallet.address as `0x${string}`,
        });

        const balanceFormatted = formatEther(balanceWei);

        // Check if user needs gas support
        const needsGas = await gasTankService.needsGasSupport(wallet.address);

        return reply.send({
          success: true,
          data: {
            userId,
            address: wallet.address,
            balance: balanceFormatted,
            balanceWei: balanceWei.toString(),
            needsGasSupport: needsGas,
            chainId: monadTestnet.id,
            chainName: monadTestnet.name,
            symbol: monadTestnet.nativeCurrency.symbol,
          },
        });
      } catch (error) {
        console.error("Get wallet balance error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Failed to fetch wallet balance",
        });
      }
    }
  );

  // Get wallet balance by address (public endpoint)
  fastify.get<{ Params: AddressBalanceParams }>(
    "/balance/address/:address",
    async (request: FastifyRequest<{ Params: AddressBalanceParams }>, reply: FastifyReply) => {
      try {
        const { address } = request.params;

        if (!address) {
          return reply.status(400).send({
            success: false,
            message: "Address is required",
          });
        }

        // Validate address format
        if (!address.startsWith("0x") || address.length !== 42) {
          return reply.status(400).send({
            success: false,
            message: "Invalid address format",
          });
        }

        // Get balance from blockchain
        const balanceWei = await publicClient.getBalance({
          address: address as `0x${string}`,
        });

        const balanceFormatted = formatEther(balanceWei);

        // Check if address needs gas support
        const needsGas = await gasTankService.needsGasSupport(address);

        return reply.send({
          success: true,
          data: {
            address,
            balance: balanceFormatted,
            balanceWei: balanceWei.toString(),
            needsGasSupport: needsGas,
            chainId: monadTestnet.id,
            chainName: monadTestnet.name,
            symbol: monadTestnet.nativeCurrency.symbol,
          },
        });
      } catch (error) {
        console.error("Get address balance error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Failed to fetch address balance",
        });
      }
    }
  );

  // Request gas support for a user
  fastify.post<{ Body: GasSupportBody }>(
    "/gas-support",
    async (request: FastifyRequest<{ Body: GasSupportBody }>, reply: FastifyReply) => {
      try {
        const { userId } = request.body;

        if (!userId) {
          return reply.status(400).send({
            success: false,
            message: "User ID is required",
          });
        }

        // Get user's Privy wallet
        const wallet = await privyService.getWalletAccount(userId);
        if (!wallet) {
          return reply.status(404).send({
            success: false,
            message: "Wallet not found for user",
          });
        }

        // Request gas support from gas tank
        const result = await gasTankService.supportGas(wallet.address);

        return reply.send(result);
      } catch (error) {
        console.error("Gas support error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Failed to provide gas support",
        });
      }
    }
  );

  // Get wallet info for a user (address + basic info)
  fastify.get<{ Params: WalletBalanceParams }>(
    "/info/:userId",
    async (request: FastifyRequest<{ Params: WalletBalanceParams }>, reply: FastifyReply) => {
      try {
        const { userId } = request.params;

        if (!userId) {
          return reply.status(400).send({
            success: false,
            message: "User ID is required",
          });
        }

        // Get user's Privy wallet
        const wallet = await privyService.getWalletAccount(userId);
        if (!wallet) {
          return reply.status(404).send({
            success: false,
            message: "Wallet not found for user",
          });
        }

        return reply.send({
          success: true,
          data: {
            userId,
            privyWalletId: wallet.privyWalletId,
            address: wallet.address,
            chainType: wallet.chainType,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
          },
        });
      } catch (error) {
        console.error("Get wallet info error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Failed to fetch wallet info",
        });
      }
    }
  );

  // Get gas tank status (for admin/debugging)
  fastify.get("/gas-tank/status", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const gasTankBalance = await gasTankService.getGasTankBalance();
      const chainInfo = gasTankService.getChainInfo();

      return reply.send({
        success: true,
        data: {
          gasTank: {
            address: gasTankBalance.address,
            balance: gasTankBalance.balance,
            gasAmount: config.gasTank.amount,
          },
          chain: chainInfo,
        },
      });
    } catch (error) {
      console.error("Get gas tank status error:", error);
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch gas tank status",
      });
    }
  });

  // Create wallet for a user (if not exists)
  fastify.post<{ Body: { userId: string } }>(
    "/create",
    async (request: FastifyRequest<{ Body: { userId: string } }>, reply: FastifyReply) => {
      try {
        const { userId } = request.body;

        if (!userId) {
          return reply.status(400).send({
            success: false,
            message: "User ID is required",
          });
        }

        // Check if wallet already exists
        try {
          const existingWallet = await privyService.getWalletAccount(userId);
          if (existingWallet) {
            return reply.send({
              success: true,
              message: "Wallet already exists",
              data: {
                userId,
                address: existingWallet.address,
                privyWalletId: existingWallet.privyWalletId,
                chainType: existingWallet.chainType,
              },
            });
          }
        } catch (error) {
          // Wallet doesn't exist, continue to create
        }

        // Create new wallet
        const wallet = await privyService.createWallet(userId);

        // Automatically provide initial gas support for new wallets
        try {
          await gasTankService.supportGas(wallet.address);
          console.log(`Provided initial gas support to new wallet: ${wallet.address}`);
        } catch (gasError) {
          console.warn(`Failed to provide initial gas support: ${gasError}`);
          // Don't fail wallet creation if gas support fails
        }

        return reply.send({
          success: true,
          message: "Wallet created successfully",
          data: wallet,
        });
      } catch (error) {
        console.error("Create wallet error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Failed to create wallet",
        });
      }
    }
  );
}