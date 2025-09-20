import { TwitterApi } from "twitter-api-v2";
import { config } from "../config/env";

export interface TwitterOAuthUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  profile_image_url?: string;
}

export interface TwitterOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export class TwitterOAuthService {
  private client: TwitterApi;

  constructor() {
    this.client = new TwitterApi({
      clientId: config.twitter.clientId,
      clientSecret: config.twitter.clientSecret
    });
  }

  /**
   * Generate OAuth 2.0 authorization URL with PKCE
   */
  generateAuthUrl(): { url: string; codeVerifier: string; state: string } {
    const scopes = ["tweet.read", "users.read", "offline.access"];

    const { url, codeVerifier, state } = this.client.generateOAuth2AuthLink(
      config.twitter.callbackUrl,
      {
        scope: scopes,
      }
    );

    return { url, codeVerifier, state };
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    state: string
  ): Promise<{ tokens: TwitterOAuthTokens; user: TwitterOAuthUser }> {
    try {
      const {
        accessToken,
        refreshToken,
        expiresIn,
        client: loggedClient,
      } = await this.client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: config.twitter.callbackUrl,
      });

      // Get user profile
      const { data: userData } = await loggedClient.v2.me({
        "user.fields": ["id", "name", "username", "profile_image_url"],
      });

      const tokens: TwitterOAuthTokens = {
        accessToken,
        refreshToken,
        expiresIn,
      };

      const user: TwitterOAuthUser = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: undefined, // Email is not available in UserV2 type
        profile_image_url: userData.profile_image_url,
      };

      return { tokens, user };
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      console.error("Request details:", {
        code: code.substring(0, 10) + "...",
        codeVerifier: codeVerifier.substring(0, 10) + "...",
        redirectUri: config.twitter.callbackUrl,
        clientId: config.twitter.clientId.substring(0, 10) + "..."
      });
      throw new Error("Failed to exchange authorization code for tokens");
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TwitterOAuthTokens> {
    try {
      const {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
      } = await this.client.refreshOAuth2Token(refreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
      };
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw new Error("Failed to refresh access token");
    }
  }

  /**
   * Verify access token and get user info
   */
  async verifyAccessToken(accessToken: string): Promise<TwitterOAuthUser> {
    try {
      const client = new TwitterApi(accessToken);
      const { data: userData } = await client.v2.me({
        "user.fields": ["id", "name", "username", "profile_image_url"],
      });

      return {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: undefined, // Email is not available in UserV2 type
        profile_image_url: userData.profile_image_url,
      };
    } catch (error) {
      console.error("Error verifying access token:", error);
      throw new Error("Invalid access token");
    }
  }
}

export const twitterOAuthService = new TwitterOAuthService();
