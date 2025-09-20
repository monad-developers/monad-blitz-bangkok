import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrivyService } from "../services/privy";
import { betFactoryService } from "../services/betFactory";
import { betMarketService } from "../services/betMarket";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../utils/mongodb";

const privyService = new PrivyService();

interface PollBetBody {
  pollId: string;
  betOnYes: boolean;
  userId: string;
}

interface CreatePollMarketBody {
  pollId: string;
  userId: string;
}

interface PollMarketsParams {
  pollId: string;
}

interface UserBetsParams {
  pollId: string;
  userId: string;
}

export async function pollBettingRoutes(fastify: FastifyInstance) {
  // Create a betting market for a poll
  fastify.post<{ Body: CreatePollMarketBody }>(
    "/poll/:pollId/create-market",
    async (request: FastifyRequest<{ Body: CreatePollMarketBody; Params: { pollId: string } }>, reply: FastifyReply) => {
      try {
        const { pollId } = request.params;
        const { userId } = request.body;

        if (!pollId || !userId) {
          return reply.status(400).send({
            success: false,
            message: "Poll ID and user ID are required",
          });
        }

        // Get database connection
        const db = await connectToDatabase();
        const pollsCollection = db.collection("polls");

        // Find the poll
        const poll = await pollsCollection.findOne({ _id: new ObjectId(pollId) });
        if (!poll) {
          return reply.status(404).send({
            success: false,
            message: "Poll not found",
          });
        }

        // Check if market already exists
        if (poll.marketAddress) {
          return reply.send({
            success: true,
            message: "Market already exists",
            data: {
              pollId,
              marketAddress: poll.marketAddress,
            },
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
          poll.description
        );

        if (!result.success) {
          return reply.status(500).send(result);
        }

        // Update poll with market address (we'll need to get it from the transaction receipt)
        // For now, we'll return the transaction hash and update later
        await pollsCollection.updateOne(
          { _id: new ObjectId(pollId) },
          {
            $set: {
              marketExists: true,
              marketCreationTx: result.txHash,
              updatedAt: new Date(),
            },
          }
        );

        return reply.send({
          success: true,
          message: "Market creation initiated",
          data: {
            pollId,
            txHash: result.txHash,
          },
        });
      } catch (error) {
        console.error("Create poll market error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Failed to create market",
        });
      }
    }
  );

  // Place a bet on a poll's market
  fastify.post<{ Body: PollBetBody }>(
    "/poll/:pollId/bet",
    async (request: FastifyRequest<{ Body: PollBetBody; Params: { pollId: string } }>, reply: FastifyReply) => {
      try {
        const { pollId } = request.params;
        const { betOnYes, userId } = request.body;

        if (!pollId || typeof betOnYes !== "boolean" || !userId) {
          return reply.status(400).send({
            success: false,
            message: "Poll ID, bet direction, and user ID are required",
          });
        }

        // Get database connection
        const db = await connectToDatabase();
        const pollsCollection = db.collection("polls");

        // Find the poll
        const poll = await pollsCollection.findOne({ _id: new ObjectId(pollId) });
        if (!poll) {
          return reply.status(404).send({
            success: false,
            message: "Poll not found",
          });
        }

        if (!poll.marketAddress) {
          return reply.status(400).send({
            success: false,
            message: "This poll doesn't have a betting market",
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
          poll.marketAddress,
          wallet.privyWalletId,
          betOnYes
        );

        if (result.success) {
          // Update poll statistics (optional - could be done by blockchain events)
          const updateData: any = {
            updatedAt: new Date(),
          };

          if (betOnYes) {
            updateData.$inc = { yesVotes: 1, totalVotes: 1 };
          } else {
            updateData.$inc = { noVotes: 1, totalVotes: 1 };
          }

          await pollsCollection.updateOne(
            { _id: new ObjectId(pollId) },
            updateData
          );
        }

        return reply.send({
          ...result,
          pollId,
          betDirection: betOnYes ? 'yes' : 'no',
        });
      } catch (error) {
        console.error("Poll bet error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Failed to place bet",
        });
      }
    }
  );

  // Get market statistics for a poll
  fastify.get<{ Params: PollMarketsParams }>(
    "/poll/:pollId/market-stats",
    async (request: FastifyRequest<{ Params: PollMarketsParams }>, reply: FastifyReply) => {
      try {
        const { pollId } = request.params;

        // Get database connection
        const db = await connectToDatabase();
        const pollsCollection = db.collection("polls");

        // Find the poll
        const poll = await pollsCollection.findOne({ _id: new ObjectId(pollId) });
        if (!poll) {
          return reply.status(404).send({
            success: false,
            message: "Poll not found",
          });
        }

        if (!poll.marketAddress) {
          return reply.send({
            success: true,
            data: {
              marketExists: false,
              pollId,
            },
          });
        }

        // Get market statistics from blockchain
        const [stats, question, creator] = await Promise.all([
          betMarketService.getMarketStats(poll.marketAddress),
          betMarketService.getQuestion(poll.marketAddress),
          betMarketService.getCreator(poll.marketAddress),
        ]);

        return reply.send({
          success: true,
          data: {
            marketExists: true,
            pollId,
            marketAddress: poll.marketAddress,
            question,
            creator,
            ...stats,
          },
        });
      } catch (error) {
        console.error("Get poll market stats error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Failed to fetch market statistics",
        });
      }
    }
  );

  // Get user's bets for a specific poll
  fastify.get<{ Params: UserBetsParams }>(
    "/poll/:pollId/user/:userId/bets",
    async (request: FastifyRequest<{ Params: UserBetsParams }>, reply: FastifyReply) => {
      try {
        const { pollId, userId } = request.params;

        // Get database connection
        const db = await connectToDatabase();
        const pollsCollection = db.collection("polls");

        // Find the poll
        const poll = await pollsCollection.findOne({ _id: new ObjectId(pollId) });
        if (!poll) {
          return reply.status(404).send({
            success: false,
            message: "Poll not found",
          });
        }

        if (!poll.marketAddress) {
          return reply.send({
            success: true,
            data: {
              hasVoted: false,
              yesAmount: "0",
              noAmount: "0",
              totalAmount: "0",
              canClaim: false,
            },
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

        // Get user's bets from blockchain
        const userBets = await betMarketService.getUserBets(poll.marketAddress, wallet.address);
        const pendingClaim = await betMarketService.getPendingClaim(poll.marketAddress, wallet.address);

        const hasVoted = parseFloat(userBets.totalAmount) > 0;
        const betOnYes = hasVoted ? parseFloat(userBets.yesAmount) > parseFloat(userBets.noAmount) : undefined;

        return reply.send({
          success: true,
          data: {
            pollId,
            marketAddress: poll.marketAddress,
            hasVoted,
            betOnYes,
            yesAmount: userBets.yesAmount,
            noAmount: userBets.noAmount,
            totalAmount: userBets.totalAmount,
            canClaim: parseFloat(pendingClaim) > 0,
            claimAmount: pendingClaim,
          },
        });
      } catch (error) {
        console.error("Get user poll bets error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Failed to fetch user bets",
        });
      }
    }
  );

  // Claim rewards for a poll
  fastify.post<{ Body: { userId: string } }>(
    "/poll/:pollId/claim",
    async (request: FastifyRequest<{ Body: { userId: string }; Params: { pollId: string } }>, reply: FastifyReply) => {
      try {
        const { pollId } = request.params;
        const { userId } = request.body;

        if (!userId) {
          return reply.status(400).send({
            success: false,
            message: "User ID is required",
          });
        }

        // Get database connection
        const db = await connectToDatabase();
        const pollsCollection = db.collection("polls");

        // Find the poll
        const poll = await pollsCollection.findOne({ _id: new ObjectId(pollId) });
        if (!poll) {
          return reply.status(404).send({
            success: false,
            message: "Poll not found",
          });
        }

        if (!poll.marketAddress) {
          return reply.status(400).send({
            success: false,
            message: "This poll doesn't have a betting market",
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
          poll.marketAddress,
          wallet.privyWalletId
        );

        return reply.send({
          ...result,
          pollId,
        });
      } catch (error) {
        console.error("Claim poll reward error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Failed to claim reward",
        });
      }
    }
  );

  // Calculate potential profit for a poll bet
  fastify.get<{ Params: { pollId: string; betOnYes: string; amount?: string } }>(
    "/poll/:pollId/profit/:betOnYes/:amount?",
    async (request: FastifyRequest<{ Params: { pollId: string; betOnYes: string; amount?: string } }>, reply: FastifyReply) => {
      try {
        const { pollId, betOnYes, amount } = request.params;
        const betOnYesBool = betOnYes.toLowerCase() === "true";
        const betAmount = amount || "0.01";

        // Get database connection
        const db = await connectToDatabase();
        const pollsCollection = db.collection("polls");

        // Find the poll
        const poll = await pollsCollection.findOne({ _id: new ObjectId(pollId) });
        if (!poll) {
          return reply.status(404).send({
            success: false,
            message: "Poll not found",
          });
        }

        if (!poll.marketAddress) {
          return reply.status(400).send({
            success: false,
            message: "This poll doesn't have a betting market",
          });
        }

        // Calculate profit using BetMarket service
        const profitCalculation = await betMarketService.calculatePotentialProfit(
          poll.marketAddress,
          betOnYesBool,
          betAmount
        );

        return reply.send({
          success: true,
          data: {
            pollId,
            marketAddress: poll.marketAddress,
            betOnYes: betOnYesBool,
            betAmount,
            ...profitCalculation,
          },
        });
      } catch (error) {
        console.error("Calculate poll profit error:", error);
        return reply.status(500).send({
          success: false,
          message: error instanceof Error ? error.message : "Failed to calculate profit",
        });
      }
    }
  );
}