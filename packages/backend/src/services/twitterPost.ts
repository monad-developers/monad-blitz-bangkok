import { TwitterApi } from "twitter-api-v2";
import { config } from "../config/env";
import { Poll } from "../types";

export class TwitterPostService {
  private client: TwitterApi;

  constructor() {
    this.client = new TwitterApi({
      appKey: config.twitter.appKey,
      appSecret: config.twitter.appSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    });
  }

  /**
   * Post a poll to Twitter
   */
  async postPoll(poll: Poll, customText?: string): Promise<string> {
    try {
      // Use custom text if provided, otherwise format the poll text
      const pollText = customText || this.formatPollText(poll);

      // Post the tweet
      const tweet = await this.client.v2.tweet({
        text: pollText,
        poll: {
          duration_minutes: this.calculateDurationMinutes(poll.expiresAt),
          options: ["Yes", "No"]
        }
      });

      if (!tweet.data?.id) {
        throw new Error("Failed to get tweet ID from Twitter response");
      }

      return tweet.data.id;
    } catch (error) {
      console.error("Error posting poll to Twitter:", error);
      throw new Error(`Failed to post poll to Twitter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Post a campaign-style tweet for a poll (without Twitter poll feature)
   */
  async postPollCampaign(poll: Poll, campaignText: string): Promise<string> {
    try {
      // Ensure the campaign text fits within Twitter's character limit
      const finalText = campaignText.length > 280
        ? campaignText.substring(0, 277) + "..."
        : campaignText;

      const tweet = await this.client.v2.tweet({ text: finalText });

      if (!tweet.data?.id) {
        throw new Error("Failed to get tweet ID from Twitter response");
      }

      return tweet.data.id;
    } catch (error) {
      console.error("Error posting poll campaign to Twitter:", error);
      throw new Error(`Failed to post poll campaign to Twitter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Post a regular tweet (without poll)
   */
  async postTweet(text: string): Promise<string> {
    try {
      const tweet = await this.client.v2.tweet({ text });

      if (!tweet.data?.id) {
        throw new Error("Failed to get tweet ID from Twitter response");
      }

      return tweet.data.id;
    } catch (error) {
      console.error("Error posting tweet:", error);
      throw new Error(`Failed to post tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get tweet by ID
   */
  async getTweet(tweetId: string) {
    try {
      return await this.client.v2.singleTweet(tweetId, {
        'tweet.fields': ['created_at', 'public_metrics', 'context_annotations']
      });
    } catch (error) {
      console.error("Error fetching tweet:", error);
      throw new Error(`Failed to fetch tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a tweet
   */
  async deleteTweet(tweetId: string): Promise<boolean> {
    try {
      const result = await this.client.v2.deleteTweet(tweetId);
      return result.data?.deleted || false;
    } catch (error) {
      console.error("Error deleting tweet:", error);
      return false;
    }
  }

  /**
   * Format poll text for Twitter
   */
  private formatPollText(poll: Poll): string {
    let text = `🗳️ New Poll: ${poll.description}`;

    if (poll.category) {
      text += `\n\n📊 Category: #${poll.category.replace(/\s+/g, '')}`;
    }

    if (poll.verifierRule && poll.verifierRule.trim() !== '') {
      text += `\n\n✅ Verification Rule: ${poll.verifierRule}`;
    }

    // Add hashtags
    text += `\n\n#BetNad #Poll #Voting`;

    if (poll.expiresAt) {
      const expiryDate = new Date(poll.expiresAt);
      text += `\n\n⏰ Expires: ${expiryDate.toLocaleString()}`;
    }

    // Ensure tweet doesn't exceed Twitter's character limit (280 chars)
    if (text.length > 280) {
      // Truncate description to fit
      const maxDescLength = 280 - (text.length - poll.description.length) - 3; // -3 for "..."
      const truncatedDesc = poll.description.length > maxDescLength
        ? poll.description.substring(0, maxDescLength) + "..."
        : poll.description;

      text = text.replace(poll.description, truncatedDesc);
    }

    return text;
  }

  /**
   * Calculate poll duration in minutes for Twitter API
   */
  private calculateDurationMinutes(expiresAt?: Date): number {
    if (!expiresAt) {
      // Default to 24 hours if no expiry set
      return 24 * 60; // 1440 minutes
    }

    const now = new Date();
    const diffMs = new Date(expiresAt).getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Twitter polls must be between 5 minutes and 7 days (10080 minutes)
    const minDuration = 5;
    const maxDuration = 7 * 24 * 60; // 10080 minutes

    if (diffMinutes < minDuration) {
      return minDuration;
    }

    if (diffMinutes > maxDuration) {
      return maxDuration;
    }

    return diffMinutes;
  }

  /**
   * Verify Twitter API credentials
   */
  async verifyCredentials(): Promise<boolean> {
    try {
      const user = await this.client.v2.me();
      return !!user.data;
    } catch (error) {
      console.error("Twitter credentials verification failed:", error);
      return false;
    }
  }
}

export const twitterPostService = new TwitterPostService();