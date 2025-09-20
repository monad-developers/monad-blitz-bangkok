import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { betFactoryService } from "../services/betFactory";
import { betMarketService } from "../services/betMarket";
import { PrivyService } from "../services/privy";

const privyService = new PrivyService();

interface CreateMarketBody {
  question: string;
  userId: string;
}

interface ClaimRewardsBody {
  userId: string;
}

interface UserMarketsParams {
  address: string;
}

interface UserAddressParams {
  userAddress: string;
}

interface MarketIndexParams {
  index: string;
}

interface MarketAddressParams {
  address: string;
}

interface PlaceBetBody {
  marketAddress: string;
  betOnYes: boolean;
  userId: string;
}

interface SettleMarketBody {
  marketAddress: string;
  winner: boolean;
  userId: string;
}

interface ClaimRewardBody {
  marketAddress: string;
  userId: string;
}

interface ProfitCalculationParams {
  address: string;
  betOnYes: string;
  amount?: string;
}

export async function betFactoryRoutes(fastify: FastifyInstance) {
  // Create a new betting market
  fastify.post<{ Body: CreateMarketBody }>(
    "/market/create",
    async (request: FastifyRequest<{ Body: CreateMarketBody }>, reply: FastifyReply) => {
      try {
        const { question, userId } = request.body;

        if (!question || !userId) {
          return reply.status(400).send({
            success: false,
            message: "Question and userId are required",
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

        // Create market using BetFactory service
        const result = await betFactoryService.createMarket(
          wallet.privyWalletId,
          question
        );

        return reply.send(result);
      } catch (error) {
        console.error("Create market error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  );

  // Get all active markets
  fastify.get("/markets/active", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const activeMarkets = await betFactoryService.getActiveMarkets();

      return reply.send({
        success: true,
        data: activeMarkets,
        count: activeMarkets.length,
      });
    } catch (error) {
      console.error("Get active markets error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch active markets",
      });
    }
  });

  // Get all markets
  fastify.get("/markets", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const allMarkets = await betFactoryService.getAllMarkets();

      return reply.send({
        success: true,
        data: allMarkets,
        count: allMarkets.length,
      });
    } catch (error) {
      console.error("Get all markets error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch all markets",
      });
    }
  });

  // Get markets created by a specific user
  fastify.get<{ Params: UserMarketsParams }>(
    "/markets/user/:address",
    async (request: FastifyRequest<{ Params: UserMarketsParams }>, reply: FastifyReply) => {
      try {
        const { address } = request.params;

        if (!address) {
          return reply.status(400).send({
            success: false,
            message: "User address is required",
          });
        }

        const userMarkets = await betFactoryService.getUserMarkets(address);

        return reply.send({
          success: true,
          data: userMarkets,
          count: userMarkets.length,
        });
      } catch (error) {
        console.error("Get user markets error:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to fetch user markets",
        });
      }
    }
  );

  // Get market statistics
  fastify.get("/markets/stats", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [totalCount, activeCount] = await Promise.all([
        betFactoryService.getMarketCount(),
        betFactoryService.getActiveMarketCount(),
      ]);

      return reply.send({
        success: true,
        data: {
          totalMarkets: totalCount,
          activeMarkets: activeCount,
          settledMarkets: totalCount - activeCount,
        },
      });
    } catch (error) {
      console.error("Get market stats error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch market statistics",
      });
    }
  });

  // Get market details by index
  fastify.get<{ Params: MarketIndexParams }>(
    "/market/:index",
    async (request: FastifyRequest<{ Params: MarketIndexParams }>, reply: FastifyReply) => {
      try {
        const { index } = request.params;
        const marketIndex = parseInt(index);

        if (isNaN(marketIndex) || marketIndex < 0) {
          return reply.status(400).send({
            success: false,
            message: "Valid market index is required",
          });
        }

        const marketInfo = await betFactoryService.getMarketByIndex(marketIndex);

        if (!marketInfo) {
          return reply.status(404).send({
            success: false,
            message: "Market not found",
          });
        }

        return reply.send({
          success: true,
          data: marketInfo,
        });
      } catch (error) {
        console.error("Get market by index error:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to fetch market details",
        });
      }
    }
  );

  // Get user's bet history
  fastify.get<{ Params: UserMarketsParams }>(
    "/user/:address/bets",
    async (request: FastifyRequest<{ Params: UserMarketsParams }>, reply: FastifyReply) => {
      try {
        const { address } = request.params;

        if (!address) {
          return reply.status(400).send({
            success: false,
            message: "User address is required",
          });
        }

        const betHistory = await betFactoryService.getUserBetHistory(address);

        return reply.send({
          success: true,
          data: betHistory,
        });
      } catch (error) {
        console.error("Get user bet history error:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to fetch user bet history",
        });
      }
    }
  );

  // Get user's pending claims
  fastify.get<{ Params: UserMarketsParams }>(
    "/user/:address/claims",
    async (request: FastifyRequest<{ Params: UserMarketsParams }>, reply: FastifyReply) => {
      try {
        const { address } = request.params;

        if (!address) {
          return reply.status(400).send({
            success: false,
            message: "User address is required",
          });
        }

        const pendingClaims = await betFactoryService.getUserPendingClaims(address);

        return reply.send({
          success: true,
          data: pendingClaims,
        });
      } catch (error) {
        console.error("Get user pending claims error:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to fetch user pending claims",
        });
      }
    }
  );

  // Claim all rewards for a user
  fastify.post<{ Body: ClaimRewardsBody }>(
    "/user/claim-rewards",
    async (request: FastifyRequest<{ Body: ClaimRewardsBody }>, reply: FastifyReply) => {
      try {
        const { userId } = request.body;

        if (!userId) {
          return reply.status(400).send({
            success: false,
            message: "UserId is required",
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

        // Claim all rewards using BetFactory service
        const result = await betFactoryService.claimAllRewards(
          wallet.privyWalletId,
          wallet.address
        );

        return reply.send(result);
      } catch (error) {
        console.error("Claim rewards error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  );

  // Get contract information
  fastify.get("/contract/info", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      return reply.send({
        success: true,
        data: {
          contractAddress: betFactoryService.getContractAddress(),
          chainId: betFactoryService.getChainId(),
          chainName: betFactoryService.getChainName(),
          rpcUrl: betFactoryService.getRpcUrl(),
        },
      });
    } catch (error) {
      console.error("Get contract info error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch contract information",
      });
    }
  });

  // ===== Individual Market Interactions =====

  // Get market statistics (current yes/no votes, odds, etc.)
  fastify.get<{ Params: MarketAddressParams }>(
    "/market/:address/stats",
    async (request: FastifyRequest<{ Params: MarketAddressParams }>, reply: FastifyReply) => {
      try {
        const { address } = request.params;

        if (!address) {
          return reply.status(400).send({
            success: false,
            message: "Market address is required",
          });
        }

        const [stats, question, creator] = await Promise.all([
          betMarketService.getMarketStats(address),
          betMarketService.getQuestion(address),
          betMarketService.getCreator(address),
        ]);

        return reply.send({
          success: true,
          data: {
            address,
            question,
            creator,
            ...stats,
          },
        });
      } catch (error) {
        console.error("Get market stats error:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to fetch market statistics",
        });
      }
    }
  );

  // Calculate potential profit before placing bet
  fastify.get<{ Params: ProfitCalculationParams }>(
    "/market/:address/profit/:betOnYes/:amount?",
    async (request: FastifyRequest<{ Params: ProfitCalculationParams }>, reply: FastifyReply) => {
      try {
        const { address, betOnYes, amount } = request.params;
        const betOnYesBool = betOnYes.toLowerCase() === "true";
        const betAmount = amount || "0.01";

        if (!address) {
          return reply.status(400).send({
            success: false,
            message: "Market address is required",
          });
        }

        const profitCalculation = await betMarketService.calculatePotentialProfit(
          address,
          betOnYesBool,
          betAmount
        );

        return reply.send({
          success: true,
          data: {
            marketAddress: address,
            betOnYes: betOnYesBool,
            betAmount,
            ...profitCalculation,
          },
        });
      } catch (error) {
        console.error("Calculate profit error:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to calculate potential profit",
        });
      }
    }
  );

  // Place a bet on a specific market
  fastify.post<{ Body: PlaceBetBody }>(
    "/market/bet",
    async (request: FastifyRequest<{ Body: PlaceBetBody }>, reply: FastifyReply) => {
      try {
        const { marketAddress, betOnYes, userId } = request.body;

        if (!marketAddress || typeof betOnYes !== "boolean" || !userId) {
          return reply.status(400).send({
            success: false,
            message: "Market address, bet choice (betOnYes), and userId are required",
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

        // Place bet using BetMarket service
        const result = await betMarketService.placeBet(
          marketAddress,
          wallet.privyWalletId,
          betOnYes
        );

        return reply.send(result);
      } catch (error) {
        console.error("Place bet error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  );

  // Settle a market (only for market creator)
  fastify.post<{ Body: SettleMarketBody }>(
    "/market/settle",
    async (request: FastifyRequest<{ Body: SettleMarketBody }>, reply: FastifyReply) => {
      try {
        const { marketAddress, winner, userId } = request.body;

        if (!marketAddress || typeof winner !== "boolean" || !userId) {
          return reply.status(400).send({
            success: false,
            message: "Market address, winner outcome, and userId are required",
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

        // Settle market using BetMarket service
        const result = await betMarketService.settleMarket(
          marketAddress,
          wallet.privyWalletId,
          winner
        );

        return reply.send(result);
      } catch (error) {
        console.error("Settle market error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  );

  // Claim rewards from a specific market
  fastify.post<{ Body: ClaimRewardBody }>(
    "/market/claim",
    async (request: FastifyRequest<{ Body: ClaimRewardBody }>, reply: FastifyReply) => {
      try {
        const { marketAddress, userId } = request.body;

        if (!marketAddress || !userId) {
          return reply.status(400).send({
            success: false,
            message: "Market address and userId are required",
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

        // Claim reward using BetMarket service
        const result = await betMarketService.claimReward(
          marketAddress,
          wallet.privyWalletId
        );

        return reply.send(result);
      } catch (error) {
        console.error("Claim reward error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  );

  // Get user's bets for a specific market
  fastify.get<{ Params: MarketAddressParams & UserAddressParams }>(
    "/market/:address/user/:userAddress/bets",
    async (request: FastifyRequest<{ Params: MarketAddressParams & UserAddressParams }>, reply: FastifyReply) => {
      try {
        const { address, userAddress } = request.params;

        if (!address || !userAddress) {
          return reply.status(400).send({
            success: false,
            message: "Market address and user address are required",
          });
        }

        const userBets = await betMarketService.getUserBets(address, userAddress);

        return reply.send({
          success: true,
          data: {
            marketAddress: address,
            userAddress,
            ...userBets,
          },
        });
      } catch (error) {
        console.error("Get user bets error:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to fetch user bets",
        });
      }
    }
  );

  // Get pending claim for a user in a specific market
  fastify.get<{ Params: MarketAddressParams & UserAddressParams }>(
    "/market/:address/user/:userAddress/claim",
    async (request: FastifyRequest<{ Params: MarketAddressParams & UserAddressParams }>, reply: FastifyReply) => {
      try {
        const { address, userAddress } = request.params;

        if (!address || !userAddress) {
          return reply.status(400).send({
            success: false,
            message: "Market address and user address are required",
          });
        }

        const pendingClaim = await betMarketService.getPendingClaim(address, userAddress);

        return reply.send({
          success: true,
          data: {
            marketAddress: address,
            userAddress,
            pendingClaim,
          },
        });
      } catch (error) {
        console.error("Get pending claim error:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to fetch pending claim",
        });
      }
    }
  );
}