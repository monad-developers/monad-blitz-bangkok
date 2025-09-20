require('dotenv').config();
const needle = require('needle');

const token = process.env.X_BEARER_TOKEN;
const endpointURL = "https://api.twitter.com/2/tweets";

class XService {
  static async getTweetsByIds(tweetIds) {
    if (!token) {
      throw new Error('X_BEARER_TOKEN environment variable is required');
    }

    const ids = Array.isArray(tweetIds) ? tweetIds.join(',') : tweetIds;
    
    const params = {
      "ids": ids,
      "tweet.fields": "public_metrics,author_id,created_at,attachments,edit_history_tweet_ids",
      "media.fields": "type,url,preview_image_url,public_metrics,width,height,media_key",
      "user.fields": "id,name,username,profile_image_url,public_metrics,verified",
      "expansions": "attachments.media_keys,author_id"
    };

    const res = await needle('get', endpointURL, params, {
      headers: {
        "User-Agent": "v2TweetLookupJS",
        "authorization": `Bearer ${token}`
      }
    });

    console.log('Rate limit remaining:', res.headers['x-rate-limit-remaining']);
    console.log('Rate limit reset:', new Date(res.headers['x-rate-limit-reset'] * 1000));

    if (res.statusCode === 429) {
      const resetTime = new Date(res.headers['x-rate-limit-reset'] * 1000);
      const waitTime = resetTime - new Date();
      throw new Error(`Rate limit exceeded. Try again after ${resetTime.toLocaleString()} (in ${Math.ceil(waitTime / 60000)} minutes)`);
    }

    if (res.statusCode !== 200) {
      throw new Error(`Twitter API error: ${res.statusCode} - ${res.body?.title || 'Unknown error'}`);
    }

    if (!res.body) {
      throw new Error('Unsuccessful request');
    }

    // Log the full response with expanded includes
    console.log('=== TWEET DATA ===');
    console.log(JSON.stringify(res.body.data, null, 2));
    
    if (res.body.includes) {
      console.log('=== INCLUDES ===');
      
      if (res.body.includes.users) {
        console.log('--- USERS ---');
        console.log(JSON.stringify(res.body.includes.users, null, 2));
      }
      
      if (res.body.includes.media) {
        console.log('--- MEDIA ---');
        console.log(JSON.stringify(res.body.includes.media, null, 2));
      }
    }

    // Return the complete response structure
    return {
      data: res.body.data,
      includes: {
        users: res.body.includes?.users || [],
        media: res.body.includes?.media || []
      },
      meta: res.body.meta,
      // Add raw response for debugging
      _raw: res.body
    };
  }
}

module.exports = XService;