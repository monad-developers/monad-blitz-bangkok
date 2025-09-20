import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PollModel } from "../models/Poll";
import { UserModel } from "../models/User";
import { twitterPostService } from "../services/twitterPost";
import {
  CategoryListResponse,
  CreatePollRequest,
  CreatePollResponse,
  ErrorResponse,
  FetchPollsRequest,
  FetchPollsResponse,
  Poll,
} from "../types";

export async function pollRoutes(fastify: FastifyInstance) {
  // Create a new poll
  fastify.post<{
    Body: CreatePollRequest;
    Reply: CreatePollResponse | ErrorResponse;
  }>(
    "/polls",
    {
      schema: {
        body: {
          type: "object",
          required: ["description", "verifierRule"],
          properties: {
            description: { type: "string", minLength: 1, maxLength: 500 },
            category: { type: "string", maxLength: 50 },
            verifierRule: { type: "string", minLength: 1, maxLength: 200 },
            expiresAt: { type: "string", format: "date-time" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              poll: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  verifierRule: { type: "string" },
                  createdBy: { type: "string" },
                  twitterPostId: { type: "string" },
                  status: {
                    type: "string",
                    enum: ["active", "closed", "draft"],
                  },
                  totalVotes: { type: "number" },
                  yesVotes: { type: "number" },
                  noVotes: { type: "number" },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                  expiresAt: { type: "string" },
                },
              },
              twitterPostId: { type: "string" },
              message: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CreatePollRequest }>,
      reply: FastifyReply
    ) => {
      try {
        // Get user from session/auth header
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          const errorResponse: ErrorResponse = {
            success: false,
            error: "MISSING_AUTH_HEADER",
            message: "Authorization header with Bearer token is required",
          };
          return reply.code(401).send(errorResponse);
        }

        const accessToken = authHeader.substring(7);

        // Verify the access token and get user
        let user;
        try {
          const { twitterOAuthService } = await import(
            "../services/twitterOAuth"
          );
          const twitterUser = await twitterOAuthService.verifyAccessToken(
            accessToken
          );
          user = await UserModel.findByTwitterId(twitterUser.id);
        } catch (error) {
          const errorResponse: ErrorResponse = {
            success: false,
            error: "INVALID_TOKEN",
            message: "Invalid or expired access token",
          };
          return reply.code(401).send(errorResponse);
        }

        if (!user) {
          const errorResponse: ErrorResponse = {
            success: false,
            error: "USER_NOT_FOUND",
            message: "User not found",
          };
          return reply.code(404).send(errorResponse);
        }

        const { description, category, verifierRule, expiresAt } = request.body;

        // Parse expiry date if provided
        let expiryDate: Date | undefined;
        if (expiresAt) {
          expiryDate = new Date(expiresAt);
          if (isNaN(expiryDate.getTime())) {
            const errorResponse: ErrorResponse = {
              success: false,
              error: "INVALID_DATE",
              message: "Invalid expiry date format",
            };
            return reply.code(400).send(errorResponse);
          }

          // Check if expiry date is in the future
          if (expiryDate <= new Date()) {
            const errorResponse: ErrorResponse = {
              success: false,
              error: "INVALID_EXPIRY",
              message: "Expiry date must be in the future",
            };
            return reply.code(400).send(errorResponse);
          }
        }

        // Create poll in database
        const pollData = {
          description,
          category: category || "General",
          verifierRule,
          createdBy: user._id!,
          status: "active" as const,
          expiresAt: expiryDate,
        };

        const poll = await PollModel.create(pollData);

        // Post to Twitter
        let twitterPostId: string | undefined;
        try {
          twitterPostId = await twitterPostService.postPoll(poll);

          // Update poll with Twitter post ID
          await PollModel.updateById(poll._id!, { twitterPostId });
          poll.twitterPostId = twitterPostId;
        } catch (twitterError) {
          console.error("Failed to post to Twitter:", twitterError);
          // Don't fail the poll creation if Twitter posting fails
          // The poll is still created successfully
        }

        const response: CreatePollResponse = {
          success: true,
          poll,
          twitterPostId,
          message: twitterPostId
            ? "Poll created and posted to Twitter successfully"
            : "Poll created successfully (Twitter posting failed)",
        };

        return reply.code(200).send(response);
      } catch (error) {
        console.error("Poll creation error:", error);

        const errorResponse: ErrorResponse = {
          success: false,
          error: "POLL_CREATION_FAILED",
          message:
            error instanceof Error ? error.message : "Failed to create poll",
        };

        return reply.code(500).send(errorResponse);
      }
    }
  );

  // Fetch all polls with optional filters
  fastify.get<{
    Querystring: FetchPollsRequest;
    Reply: FetchPollsResponse | ErrorResponse;
  }>(
    "/polls",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            category: { type: "string" },
            status: { type: "string", enum: ["active", "closed", "draft"] },
            limit: { type: "number", minimum: 1, maximum: 100, default: 20 },
            offset: { type: "number", minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              polls: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    _id: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                    verifierRule: { type: "string" },
                    createdBy: { type: "string" },
                    twitterPostId: { type: "string" },
                    status: { type: "string" },
                    totalVotes: { type: "number" },
                    yesVotes: { type: "number" },
                    noVotes: { type: "number" },
                    createdAt: { type: "string" },
                    updatedAt: { type: "string" },
                    expiresAt: { type: "string" },
                  },
                },
              },
              total: { type: "number" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: FetchPollsRequest }>,
      reply: FastifyReply
    ) => {
      try {
        const { category, status, limit = 20, offset = 0 } = request.query;

        const { polls, total } = await PollModel.findAll({
          category,
          status,
          limit,
          offset,
        });

        const response: FetchPollsResponse = {
          success: true,
          polls,
          total,
          message: "Polls fetched successfully",
        };

        return reply.code(200).send(response);
      } catch (error) {
        console.error("Fetch polls error:", error);

        const errorResponse: ErrorResponse = {
          success: false,
          error: "FETCH_POLLS_FAILED",
          message:
            error instanceof Error ? error.message : "Failed to fetch polls",
        };

        return reply.code(500).send(errorResponse);
      }
    }
  );

  // Get categories list
  fastify.get<{
    Reply: CategoryListResponse | ErrorResponse;
  }>(
    "/polls/categories",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              categories: {
                type: "array",
                items: { type: "string" },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const categories = await PollModel.getCategories();

        const response: CategoryListResponse = {
          success: true,
          categories,
          message: "Categories fetched successfully",
        };

        return reply.code(200).send(response);
      } catch (error) {
        console.error("Fetch categories error:", error);

        const errorResponse: ErrorResponse = {
          success: false,
          error: "FETCH_CATEGORIES_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch categories",
        };

        return reply.code(500).send(errorResponse);
      }
    }
  );

  // Get single poll by ID
  fastify.get<{
    Params: { id: string };
    Reply: { success: boolean; poll?: Poll; message?: string } | ErrorResponse;
  }>(
    "/polls/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        const poll = await PollModel.findById(id);

        if (!poll) {
          const errorResponse: ErrorResponse = {
            success: false,
            error: "POLL_NOT_FOUND",
            message: "Poll not found",
          };
          return reply.code(404).send(errorResponse);
        }

        return reply.code(200).send({
          success: true,
          poll,
          message: "Poll fetched successfully",
        });
      } catch (error) {
        console.error("Fetch poll error:", error);

        const errorResponse: ErrorResponse = {
          success: false,
          error: "FETCH_POLL_FAILED",
          message:
            error instanceof Error ? error.message : "Failed to fetch poll",
        };

        return reply.code(500).send(errorResponse);
      }
    }
  );

  // Close expired polls (utility endpoint)
  fastify.post(
    "/polls/close-expired",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const closedCount = await PollModel.closeExpiredPolls();

        return reply.code(200).send({
          success: true,
          closedCount,
          message: `Closed ${closedCount} expired polls`,
        });
      } catch (error) {
        console.error("Close expired polls error:", error);

        const errorResponse: ErrorResponse = {
          success: false,
          error: "CLOSE_EXPIRED_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to close expired polls",
        };

        return reply.code(500).send(errorResponse);
      }
    }
  );

  // Swipe action endpoint (like/dislike with Twitter reply)
  fastify.post<{
    Body: {
      pollId: string;
      action: "like" | "dislike";
      userId: string;
    };
    Reply:
      | {
          success: boolean;
          message: string;
          twitterReplyId?: string;
        }
      | ErrorResponse;
  }>(
    "/polls/swipe",
    {
      schema: {
        body: {
          type: "object",
          required: ["pollId", "action", "userId"],
          properties: {
            pollId: { type: "string" },
            action: { type: "string", enum: ["like", "dislike"] },
            userId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              twitterReplyId: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: { pollId: string; action: "like" | "dislike"; userId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { pollId, action, userId } = request.body;

        // Find the poll
        const poll = await PollModel.findById(pollId);
        if (!poll) {
          const errorResponse: ErrorResponse = {
            success: false,
            error: "POLL_NOT_FOUND",
            message: "Poll not found",
          };
          return reply.code(404).send(errorResponse);
        }

        // Check if poll has a Twitter post ID, create one if it doesn't exist
        let createdNewTwitterPost = false;
        if (!poll.twitterPostId) {
          try {
            // Create a Twitter post for this poll first
            const { twitterPostService } = await import(
              "../services/twitterPost"
            );
            const twitterPostId = await twitterPostService.postPoll(poll);

            // Update poll with the new Twitter post ID
            await PollModel.updateById(pollId, { twitterPostId });
            poll.twitterPostId = twitterPostId;
            createdNewTwitterPost = true;

            console.log(
              `Created Twitter post for poll ${pollId}: ${twitterPostId}`
            );
          } catch (twitterError) {
            console.error(
              "Failed to create Twitter post for poll:",
              twitterError
            );
            const errorResponse: ErrorResponse = {
              success: false,
              error: "TWITTER_POST_CREATION_FAILED",
              message: "Failed to create Twitter post for this poll",
            };
            return reply.code(500).send(errorResponse);
          }
        }

        // Get user information for the reply
        let user;
        try {
          const { PrivyService } = await import("../services/privy");
          const privyService = new PrivyService();
          user = await privyService.getUser(userId);
        } catch (error) {
          console.error("Error fetching user:", error);
          // Continue without user info if not available
        }

        // Create reply text based on action and bet status
        const actionEmoji = action === "like" ? "👍" : "👎";
        const actionText = action === "like" ? "liked" : "disliked";

        // Check if user has bet on this poll
        let betStatus = "";
        if (poll.marketAddress) {
          try {
            const { PrivyService } = await import("../services/privy");
            const { betMarketService } = await import("../services/betMarket");
            const privyService = new PrivyService();
            const wallet = await privyService.getWalletAccount(userId);

            if (wallet) {
              const userBets = await betMarketService.getUserBets(
                poll.marketAddress,
                wallet.address
              );
              const hasVoted = parseFloat(userBets.totalAmount) > 0;

              if (hasVoted) {
                const betOnYes =
                  parseFloat(userBets.yesAmount) >
                  parseFloat(userBets.noAmount);
                betStatus = ` and bet ${betOnYes ? "YES" : "NO"}`;
              } else {
                betStatus = " (no bet placed)";
              }
            }
          } catch (error) {
            console.error("Error checking bet status:", error);
            betStatus = " (bet status unknown)";
          }
        } else {
          betStatus = " (no betting market)";
        }

        // Create reply text
        const replyText = `${actionEmoji} ${actionText} this poll${betStatus}! #BetNad #PollVote`;

        // Reply to the Twitter post
        let twitterReplyId: string | undefined;
        try {
          const { twitterService } = await import("../services/twitter");
          twitterReplyId = await twitterService.replyToTweet(
            poll.twitterPostId,
            replyText
          );
        } catch (twitterError) {
          console.error("Failed to reply to Twitter:", twitterError);
          // Don't fail the request if Twitter reply fails
        }

        // Update poll statistics (optional - track likes/dislikes)
        try {
          const updateData: any = {
            updatedAt: new Date(),
          };

          if (action === "like") {
            updateData.$inc = { likes: 1 };
          } else {
            updateData.$inc = { dislikes: 1 };
          }

          await PollModel.updateById(pollId, updateData);
        } catch (updateError) {
          console.error("Error updating poll statistics:", updateError);
          // Don't fail the request if stats update fails
        }

        const response = {
          success: true,
          message: `Successfully ${actionText} poll and replied to Twitter${
            createdNewTwitterPost ? " (created new Twitter post)" : ""
          }`,
          twitterReplyId,
        };

        return reply.code(200).send(response);
      } catch (error) {
        console.error("Swipe action error:", error);

        const errorResponse: ErrorResponse = {
          success: false,
          error: "SWIPE_ACTION_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to process swipe action",
        };

        return reply.code(500).send(errorResponse);
      }
    }
  );

  // Create mock poll (no auth required for testing)
  fastify.post<{
    Body?: any;
    Reply: CreatePollResponse | ErrorResponse;
  }>(
    "/polls/mock",
    {
      schema: {
        body: {
          type: "object",
          properties: {},
          additionalProperties: true,
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              poll: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  verifierRule: { type: "string" },
                  createdBy: { type: "string" },
                  status: { type: "string" },
                  totalVotes: { type: "number" },
                  yesVotes: { type: "number" },
                  noVotes: { type: "number" },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                  expiresAt: { type: "string" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Mock poll data templates
        const mockPollTemplates = [
          {
            description:
              "Should AI-generated content be clearly labeled on social media?",
            category: "Tech",
            verifierRule: "Must be a verified social media user",
          },
          {
            description:
              "Will virtual reality replace traditional video conferencing within 3 years?",
            category: "Technology",
            verifierRule: "Must work in tech industry",
          },
          {
            description:
              "Should cryptocurrency be accepted as payment in all retail stores?",
            category: "Crypto",
            verifierRule: "Must hold cryptocurrency",
          },
          {
            description:
              "Will remote work become permanent for most knowledge workers?",
            category: "Business",
            verifierRule: "Must be employed full-time",
          },
          {
            description:
              "Should online education replace traditional classroom learning?",
            category: "Education",
            verifierRule: "Must be a student or educator",
          },
          {
            description:
              "Will electric vehicles make up 50% of new car sales by 2030?",
            category: "Environment",
            verifierRule: "Must be a licensed driver",
          },
          {
            description:
              "Should social media platforms ban political advertising completely?",
            category: "Politics",
            verifierRule: "Must be a registered voter",
          },
          {
            description:
              "Will lab-grown meat become mainstream within the next decade?",
            category: "Food",
            verifierRule: "Must be a consumer of meat products",
          },
          {
            description:
              "Will 'Squid Game' season 2 surpass the popularity of season 1?",
            category: "K-series",
            verifierRule: "Must have watched at least 3 K-dramas",
          },
          {
            description:
              "Should K-drama series have mandatory English subtitles for global releases?",
            category: "K-series",
            verifierRule: "Must be a K-drama fan",
          },
          {
            description:
              "Will BTS members' solo careers be more successful than the group?",
            category: "K-series",
            verifierRule: "Must follow Korean entertainment",
          },
          {
            description:
              "Should Korean webtoons be the primary source for K-drama adaptations?",
            category: "K-series",
            verifierRule: "Must read webtoons or watch K-dramas",
          },
          {
            description:
              "Will Thai BL dramas become as globally popular as K-dramas by 2026?",
            category: "Thai-drama",
            verifierRule: "Must have watched Thai dramas",
          },
          {
            description:
              "Should Thai dramas focus more on international co-productions?",
            category: "Thai-drama",
            verifierRule: "Must be familiar with Thai entertainment industry",
          },
          {
            description:
              "Will '2gether: The Series' get a season 3 within the next 2 years?",
            category: "Thai-drama",
            verifierRule: "Must have watched Thai BL series",
          },
          {
            description:
              "Should Thai lakorn (soap operas) modernize their storytelling approach?",
            category: "Thai-drama",
            verifierRule: "Must watch Thai television content",
          },
          {
            description:
              "Will Netflix cancel more shows after only one season in 2025?",
            category: "Netflix",
            verifierRule: "Must have active Netflix subscription",
          },
          {
            description:
              "Should Netflix bring back 'Stranger Things' for a 6th season?",
            category: "Netflix",
            verifierRule: "Must have watched Stranger Things",
          },
          {
            description:
              "Will Netflix's password sharing crackdown increase subscriber numbers?",
            category: "Netflix",
            verifierRule: "Must use streaming services",
          },
          {
            description:
              "Should Netflix invest more in non-English original content?",
            category: "Netflix",
            verifierRule: "Must watch international content on Netflix",
          },
        ];

        // Select random template
        const randomTemplate =
          mockPollTemplates[
            Math.floor(Math.random() * mockPollTemplates.length)
          ];

        // Create mock user ID (in a real scenario, you'd use actual user authentication)
        const mockUserId = "mock_user_" + Date.now();

        // Add some variability to expiry date
        const expiryHours = 24 + Math.floor(Math.random() * 72); // 24-96 hours
        const expiryDate = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        const pollData = {
          description: randomTemplate.description,
          category: randomTemplate.category,
          verifierRule: randomTemplate.verifierRule,
          createdBy: mockUserId,
          status: "active" as const,
          expiresAt: expiryDate,
        };

        const poll = await PollModel.create(pollData);

        // Generate some random votes for the mock poll
        const totalMockVotes = Math.floor(Math.random() * 2000) + 100; // 100-2100 votes
        const yesVotes = Math.floor(Math.random() * totalMockVotes);
        const noVotes = totalMockVotes - yesVotes;

        // Update poll with mock votes
        await PollModel.updateById(poll._id!, {
          totalVotes: totalMockVotes,
          yesVotes,
          noVotes,
        });

        // Update the poll object to reflect the vote counts
        poll.totalVotes = totalMockVotes;
        poll.yesVotes = yesVotes;
        poll.noVotes = noVotes;

        // Post to Twitter with campaign format
        let twitterPostId: string | undefined;
        let twitterMessage = "Mock poll created successfully with random votes";

        try {
          // First verify if Twitter credentials are valid
          const isTwitterConfigured =
            await twitterPostService.verifyCredentials();

          if (!isTwitterConfigured) {
            console.warn(
              "Twitter API credentials not properly configured, skipping Twitter post"
            );
            twitterMessage =
              "Mock poll created successfully (Twitter API not configured)";
          } else {
            // Create a campaign-style Twitter post
            const { config } = await import("../config/env");
            const pollUrl = `${config.frontend.url}/polls`; // Link to polls page

            const twitterPost = `🚀 NEW POLL CAMPAIGN 🚀

${poll.description}

📊 Vote now and make your voice heard!
✅ Verification: ${poll.verifierRule}
📱 Category: #${poll.category.replace(/\s+/g, "")}

👉 Cast your vote: ${pollUrl}

#Poll #${poll.category.replace(/\s+/g, "")}Campaign #YourVoiceMatters`;

            console.log("Attempting to post to Twitter:", {
              pollId: poll._id,
              category: poll.category,
              tweetLength: twitterPost.length,
            });

            // Use Twitter posting service for campaign-style post
            twitterPostId = await twitterPostService.postPollCampaign(
              poll,
              twitterPost
            );

            // Update poll with Twitter post ID
            await PollModel.updateById(poll._id!, { twitterPostId });
            poll.twitterPostId = twitterPostId;

            twitterMessage =
              "Mock poll created and posted to Twitter successfully";
            console.log("Successfully posted to Twitter:", {
              twitterPostId,
              pollId: poll._id,
            });
          }
        } catch (twitterError) {
          console.error("Failed to post mock poll to Twitter:", twitterError);
          // Don't fail the poll creation if Twitter posting fails
          twitterMessage =
            "Mock poll created successfully (Twitter posting failed)";
        }

        const response: CreatePollResponse = {
          success: true,
          poll,
          twitterPostId,
          message: twitterMessage,
        };

        return reply.code(200).send(response);
      } catch (error) {
        console.error("Mock poll creation error:", error);

        const errorResponse: ErrorResponse = {
          success: false,
          error: "MOCK_POLL_CREATION_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create mock poll",
        };

        return reply.code(500).send(errorResponse);
      }
    }
  );
}
