import { TwitterApi } from "twitter-api-v2";
import { config, validateSecrets } from "../config/env";
import { logger } from "./logger";

export class TwitterService {
  private client: TwitterApi;
  private botUserId: string;
  private sinceId: string | undefined;
  private mentionInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Validate secrets before initializing
    if (!validateSecrets()) {
      throw new Error("Missing required Twitter API credentials");
    }

    this.client = new TwitterApi({
      appKey: config.twitter.appKey,
      appSecret: config.twitter.appSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    });

    this.botUserId = config.twitter.botUserId;

    // Log configuration in development
    if (config.isDevelopment) {
      this.logConfig();
    }
  }

  /**
   * Post a new tweet
   * @param text - The tweet content
   * @returns Promise with tweet ID
   */
  async postTweet(text: string): Promise<string> {
    try {
      const res = await this.client.v2.tweet({ text });
      logger.info(`Tweet posted successfully: ${res.data.id}`);
      return res.data.id;
    } catch (error) {
      logger.error("Error posting tweet:", error);
      throw error;
    }
  }

  /**
   * Quote tweet an existing tweet
   * @param text - Your comment on the quoted tweet
   * @param quoteTweetId - ID of the tweet to quote
   * @returns Promise with new tweet ID
   */
  async quoteTweet(text: string, quoteTweetId: string): Promise<string> {
    try {
      const res = await this.client.v2.tweet({
        text,
        quote_tweet_id: quoteTweetId,
      });
      logger.info(`Quote tweet posted successfully: ${res.data.id}`);
      return res.data.id;
    } catch (error) {
      logger.error("Error posting quote tweet:", error);
      throw error;
    }
  }

  /**
   * Reply to a specific tweet
   * @param tweetId - ID of the tweet to reply to
   * @param text - The reply text
   * @returns Promise with new tweet ID
   */
  async replyToTweet(tweetId: string, text: string): Promise<string> {
    try {
      const res = await this.client.v2.tweet({
        text,
        reply: { in_reply_to_tweet_id: tweetId },
      });
      logger.info(`Reply posted successfully: ${res.data.id}`);
      return res.data.id;
    } catch (error) {
      logger.error("Error posting reply:", error);
      throw error;
    }
  }

  /**
   * Add to a thread (reply to your own tweet)
   * @param previousTweetId - ID of the previous tweet in the thread
   * @param text - The new tweet text
   * @returns Promise with new tweet ID
   */
  async threadNext(previousTweetId: string, text: string): Promise<string> {
    try {
      const res = await this.client.v2.tweet({
        text,
        reply: { in_reply_to_tweet_id: previousTweetId },
      });
      logger.info(`Thread tweet posted successfully: ${res.data.id}`);
      return res.data.id;
    } catch (error) {
      logger.error("Error posting thread tweet:", error);
      throw error;
    }
  }

  /**
   * Check for new mentions
   * @returns Promise with array of mention tweets
   */
  async checkMentions(): Promise<any[]> {
    try {
      const resp = await this.client.v2.userMentionTimeline(this.botUserId, {
        since_id: this.sinceId,
        "tweet.fields": ["author_id", "created_at", "text"],
        max_results: config.twitter.maxMentionResults,
      });

      const tweets = resp.tweets ?? [];

      // Process newest first
      for (const tweet of tweets.reverse()) {
        logger.info(
          `@mention ${tweet.id} from ${tweet.author_id}: ${tweet.text}`
        );

        // TODO: Add your bot logic here
        await this.handleMention(tweet);
      }

      // Update sinceId to the most recent tweet
      if (tweets.length > 0 && tweets[0]) {
        this.sinceId = tweets[0].id;
      }

      return tweets;
    } catch (error) {
      logger.error("Error checking mentions:", error);
      throw error;
    }
  }

  /**
   * Handle individual mention - override this method for custom logic
   * @param tweet - The mention tweet
   */
  protected async handleMention(tweet: any): Promise<void> {
    try {
      // Avoid replying to ourselves
      if (tweet.author_id === this.botUserId) {
        logger.info(`Skipping self-mention: ${tweet.id}`);
        return;
      }

      // Fetch user to get their @username
      const user = await this.client.v2.user(tweet.author_id);
      const handle = user.data?.username ? `@${user.data.username}` : "";

      const replyText = `${handle} thanks for the mention! 🚀`;

      // Reply to the mention
      await this.replyToTweet(tweet.id, replyText);
      logger.info(`Replied to mention ${tweet.id} from ${handle}`);
    } catch (error) {
      logger.error(`Error handling mention ${tweet.id}:`, error);
    }
  }

  /**
   * Start polling for mentions
   * @param intervalMs - Polling interval in milliseconds (default: from config)
   */
  startMentionPolling(
    intervalMs: number = config.twitter.mentionPollingInterval
  ): void {
    if (this.mentionInterval) {
      logger.info("Mention polling already started");
      return;
    }

    logger.info(`Starting mention polling every ${intervalMs}ms`);

    // Initial check
    this.checkMentions().catch((error) =>
      logger.error("Initial mention check failed:", error)
    );

    // Set up interval
    this.mentionInterval = setInterval(() => {
      this.checkMentions().catch((error) =>
        logger.error("Mention check failed:", error)
      );
    }, intervalMs);
  }

  /**
   * Stop polling for mentions
   */
  stopMentionPolling(): void {
    if (this.mentionInterval) {
      clearInterval(this.mentionInterval);
      this.mentionInterval = null;
      logger.info("Mention polling stopped");
    }
  }

  /**
   * Get bot user info
   */
  async getBotInfo(): Promise<any> {
    try {
      const user = await this.client.v2.user(this.botUserId);
      return user.data;
    } catch (error) {
      logger.error("Error getting bot info:", error);
      throw error;
    }
  }

  /**
   * Verify Twitter user authentication
   * @param accessToken - User's access token
   * @param accessSecret - User's access secret
   * @returns Promise with user data
   */
  async verifyUserAuth(
    accessToken: string,
    accessSecret: string
  ): Promise<any> {
    try {
      const userClient = new TwitterApi({
        appKey: config.twitter.appKey,
        appSecret: config.twitter.appSecret,
        accessToken,
        accessSecret,
      });

      const user = await userClient.v2.me();
      return user.data;
    } catch (error) {
      logger.error("Error verifying user auth:", error);
      throw new Error("Invalid Twitter credentials");
    }
  }

  /**
   * Log configuration (with masked secrets)
   */
  private logConfig(): void {
    logger.info("🔧 Twitter configuration loaded:");
    logger.info(`  Bot User ID: ${config.twitter.botUserId}`);
    logger.info(
      `  Mention Polling Interval: ${config.twitter.mentionPollingInterval}ms`
    );
    logger.info(`  Max Mention Results: ${config.twitter.maxMentionResults}`);
  }
}

// Export singleton instance
export const twitterService = new TwitterService();
