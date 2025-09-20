import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { UserModel } from "../models/User";
import { PrivyService } from "../services/privy";
import { twitterOAuthService } from "../services/twitterOAuth";
import {
  ErrorResponse,
  TwitterOAuthLoginRequest,
  TwitterOAuthLoginResponse,
  TwitterOAuthRefreshRequest,
  TwitterOAuthRefreshResponse,
} from "../types";

export async function twitterOAuthRoutes(fastify: FastifyInstance) {
  const privyService = new PrivyService();

  // Generate Twitter OAuth 2.0 authorization URL
  fastify.get(
    "/twitter/oauth/url",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { url, codeVerifier, state } =
          twitterOAuthService.generateAuthUrl();

        // Store codeVerifier and state in session for later verification
        request.session.set("twitterCodeVerifier", codeVerifier);
        request.session.set("twitterState", state);

        return reply.code(200).send({
          success: true,
          url,
          state,
          message: "Authorization URL generated successfully",
        });
      } catch (error) {
        console.error("Error generating Twitter OAuth URL:", error);

        const errorResponse: ErrorResponse = {
          success: false,
          error: "OAUTH_URL_GENERATION_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate OAuth URL",
        };

        return reply.code(500).send(errorResponse);
      }
    }
  );

  // Handle Twitter OAuth 2.0 callback
  fastify.post<{
    Body: TwitterOAuthLoginRequest;
    Reply: TwitterOAuthLoginResponse | ErrorResponse;
  }>(
    "/twitter/oauth/callback",
    {
      schema: {
        body: {
          type: "object",
          required: ["code", "state"],
          properties: {
            code: { type: "string" },
            state: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              user: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  uid: { type: "string" },
                  email: { type: "string" },
                  displayName: { type: "string" },
                  photoURL: { type: "string" },
                  walletAddress: { type: "string" },
                  twitterId: { type: "string" },
                  twitterUsername: { type: "string" },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                },
              },
              accessToken: { type: "string" },
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
      request: FastifyRequest<{ Body: TwitterOAuthLoginRequest }>,
      reply: FastifyReply
    ) => {
      try {
        const { code, state } = request.body;

        // Verify state parameter
        const storedState = request.session.get("twitterState");
        if (!storedState || state !== storedState) {
          const errorResponse: ErrorResponse = {
            success: false,
            error: "INVALID_STATE",
            message: "Invalid state parameter",
          };
          return reply.code(400).send(errorResponse);
        }

        // Get stored code verifier
        const codeVerifier = request.session.get("twitterCodeVerifier");
        if (!codeVerifier) {
          const errorResponse: ErrorResponse = {
            success: false,
            error: "MISSING_CODE_VERIFIER",
            message: "Code verifier not found in session",
          };
          return reply.code(400).send(errorResponse);
        }

        // Exchange code for tokens and user info
        const { tokens, user: twitterUser } =
          await twitterOAuthService.exchangeCodeForTokens(
            code,
            codeVerifier,
            state
          );

        // Check if user already exists by Twitter ID
        let user = await UserModel.findByTwitterId(twitterUser.id);

        if (!user) {
          // Create new user
          const userData = {
            uid: `twitter_${twitterUser.id}`,
            email: twitterUser.email || "",
            displayName: twitterUser.name || twitterUser.username,
            photoURL: twitterUser.profile_image_url,
            twitterId: twitterUser.id,
            twitterUsername: twitterUser.username,
            twitterAccessToken: tokens.accessToken,
            twitterRefreshToken: tokens.refreshToken,
            twitterTokenExpiresAt: new Date(
              Date.now() + tokens.expiresIn * 1000
            ),
          };

          user = await UserModel.createOrUpdate(userData);

          // Create Privy wallet for new user
          try {
            const wallet = await privyService.createWallet(user._id!);
            console.log(
              `Created Privy wallet for user ${user._id}: ${wallet.address}`
            );
          } catch (walletError) {
            console.error("Failed to create Privy wallet:", walletError);
            // Don't fail the login if wallet creation fails
          }
        } else {
          // Update existing user with new tokens
          const { createdAt, ...userWithoutCreatedAt } = user;
          const updatedUserData = {
            ...userWithoutCreatedAt,
            twitterAccessToken: tokens.accessToken,
            twitterRefreshToken: tokens.refreshToken,
            twitterTokenExpiresAt: new Date(
              Date.now() + tokens.expiresIn * 1000
            ),
          };

          user = await UserModel.createOrUpdate(updatedUserData);
        }

        // Clear session data
        request.session.set("twitterCodeVerifier", undefined);
        request.session.set("twitterState", undefined);

        const response: TwitterOAuthLoginResponse = {
          success: true,
          user,
          accessToken: tokens.accessToken,
          message: "Twitter OAuth login successful",
        };

        return reply.code(200).send(response);
      } catch (error) {
        console.error("Twitter OAuth callback error:", error);

        const errorResponse: ErrorResponse = {
          success: false,
          error: "TWITTER_OAUTH_CALLBACK_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Twitter OAuth callback failed",
        };

        return reply.code(400).send(errorResponse);
      }
    }
  );

  // Refresh Twitter access token
  fastify.post<{
    Body: TwitterOAuthRefreshRequest;
    Reply: TwitterOAuthRefreshResponse | ErrorResponse;
  }>(
    "/twitter/oauth/refresh",
    {
      schema: {
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              accessToken: { type: "string" },
              refreshToken: { type: "string" },
              expiresIn: { type: "number" },
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
      request: FastifyRequest<{ Body: TwitterOAuthRefreshRequest }>,
      reply: FastifyReply
    ) => {
      try {
        const { refreshToken } = request.body;

        const tokens = await twitterOAuthService.refreshAccessToken(
          refreshToken
        );

        const response: TwitterOAuthRefreshResponse = {
          success: true,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          message: "Access token refreshed successfully",
        };

        return reply.code(200).send(response);
      } catch (error) {
        console.error("Token refresh error:", error);

        const errorResponse: ErrorResponse = {
          success: false,
          error: "TOKEN_REFRESH_FAILED",
          message:
            error instanceof Error ? error.message : "Token refresh failed",
        };

        return reply.code(400).send(errorResponse);
      }
    }
  );

  // Verify Twitter access token
  fastify.get(
    "/twitter/oauth/verify",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
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
        const twitterUser = await twitterOAuthService.verifyAccessToken(
          accessToken
        );

        // Find user by Twitter ID
        const user = await UserModel.findByTwitterId(twitterUser.id);

        if (!user) {
          const errorResponse: ErrorResponse = {
            success: false,
            error: "USER_NOT_FOUND",
            message: "User not found in database",
          };
          return reply.code(404).send(errorResponse);
        }

        return reply.code(200).send({
          success: true,
          user,
          message: "Token verification successful",
        });
      } catch (error) {
        console.error("Token verification error:", error);

        const errorResponse: ErrorResponse = {
          success: false,
          error: "TOKEN_VERIFICATION_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Token verification failed",
        };

        return reply.code(401).send(errorResponse);
      }
    }
  );

  // Get Twitter profile using access token
  fastify.get(
    "/twitter/profile",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
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
        const twitterUser = await twitterOAuthService.verifyAccessToken(
          accessToken
        );

        // Find user by Twitter ID
        const user = await UserModel.findByTwitterId(twitterUser.id);

        if (!user) {
          const errorResponse: ErrorResponse = {
            success: false,
            error: "USER_NOT_FOUND",
            message: "User not found in database",
          };
          return reply.code(404).send(errorResponse);
        }

        return reply.code(200).send({
          success: true,
          user,
          twitterProfile: {
            id: twitterUser.id,
            username: twitterUser.username,
            name: twitterUser.name,
            profile_image_url: twitterUser.profile_image_url
          },
          message: "Profile retrieved successfully",
        });
      } catch (error) {
        console.error("Profile retrieval error:", error);

        const errorResponse: ErrorResponse = {
          success: false,
          error: "PROFILE_RETRIEVAL_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Profile retrieval failed",
        };

        return reply.code(401).send(errorResponse);
      }
    }
  );
}
