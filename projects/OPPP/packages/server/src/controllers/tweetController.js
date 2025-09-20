const { db, dbType } = require('../config/database');
const XService = require('../services/xService');

const fetchAndStoreTweet = async (req, res) => {
  try {
    const { tweetIds } = req.body;
    
    if (!tweetIds || (Array.isArray(tweetIds) && tweetIds.length === 0)) {
      return res.status(400).json({ error: 'Tweet IDs are required' });
    }

    // Fetch tweet data from X API
    const tweetData = await XService.getTweetsByIds(tweetIds);
    
    if (!tweetData.data || tweetData.data.length === 0) {
      return res.status(404).json({ error: 'No tweets found' });
    }

    // Store tweets and related data in database
    const storedTweets = [];
    
    for (const tweet of tweetData.data) {
      // Store author if exists
      if (tweetData.includes?.users) {
        const author = tweetData.includes.users.find(user => user.id === tweet.author_id);
        if (author) {
          await storeAuthor(author);
        }
      }
      
      // Store tweet
      const storedTweet = await storeTweet(tweet);
      
      // Store media if exists
      if (tweet.attachments?.media_keys && tweetData.includes?.media) {
        for (const mediaKey of tweet.attachments.media_keys) {
          const media = tweetData.includes.media.find(m => m.media_key === mediaKey);
          if (media) {
            await storeMedia(media, tweet.id);
          }
        }
      }
      
      // Get complete tweet with author and media information
      const completeTweet = await getTweetWithDetails(tweet.id);
      storedTweets.push(completeTweet);
    }
    
    res.status(201).json({ 
      message: 'Tweets stored successfully', 
      tweets: storedTweets,
      count: storedTweets.length
    });
  } catch (error) {
    console.error('Error fetching and storing tweet:', error);
    if (error.message.includes('Rate limit exceeded')) {
      return res.status(429).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch and store tweet' });
  }
};

const getTweetWithDetails = async (tweetId) => {
  if (dbType === 'postgres') {
    const result = await db.query(`
      SELECT 
        t.*, 
        ta.username, 
        ta.name, 
        ta.profile_image_url,
        COALESCE(
          JSON_AGG(
            CASE WHEN tm.media_key IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'media_key', tm.media_key,
                'type', tm.type,
                'url', tm.url,
                'preview_image_url', tm.preview_image_url,
                'width', tm.width,
                'height', tm.height
              )
            END
          ) FILTER (WHERE tm.media_key IS NOT NULL), 
          '[]'::json
        ) as media
      FROM tweets t
      LEFT JOIN tweet_authors ta ON t.author_id = ta.id
      LEFT JOIN tweet_media tm ON t.id = tm.tweet_id
      WHERE t.id = $1
      GROUP BY t.id, ta.id
    `, [tweetId]);
    return result.rows[0];
  } else if (dbType === 'mysql') {
    const connection = await db.createConnection();
    const [rows] = await connection.execute(`
      SELECT 
        t.*, 
        ta.username, 
        ta.name, 
        ta.profile_image_url,
        GROUP_CONCAT(
          CASE WHEN tm.media_key IS NOT NULL THEN
            CONCAT('{"media_key":"', tm.media_key, 
                   '","type":"', tm.type, 
                   '","url":"', tm.url, 
                   '","preview_image_url":"', IFNULL(tm.preview_image_url, ''), 
                   '","width":', IFNULL(tm.width, 0), 
                   ',"height":', IFNULL(tm.height, 0), '}')
          END
        ) as media_json
      FROM tweets t
      LEFT JOIN tweet_authors ta ON t.author_id = ta.id
      LEFT JOIN tweet_media tm ON t.id = tm.tweet_id
      WHERE t.id = ?
      GROUP BY t.id, ta.id
    `, [tweetId]);
    
    const tweet = rows[0];
    if (tweet && tweet.media_json) {
      tweet.media = tweet.media_json.split(',').map(item => JSON.parse(item));
      delete tweet.media_json;
    } else {
      tweet.media = [];
    }
    
    await connection.end();
    return tweet;
  }
};

const storeAuthor = async (author) => {
  if (dbType === 'postgres') {
    await db.query(`
      INSERT INTO tweet_authors (id, username, name, profile_image_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        profile_image_url = EXCLUDED.profile_image_url,
        updated_at = CURRENT_TIMESTAMP
    `, [author.id, author.username, author.name, author.profile_image_url]);
  } else if (dbType === 'mysql') {
    const connection = await db.createConnection();
    await connection.execute(`
      INSERT INTO tweet_authors (id, username, name, profile_image_url)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        name = VALUES(name),
        profile_image_url = VALUES(profile_image_url),
        updated_at = CURRENT_TIMESTAMP
    `, [author.id, author.username, author.name, author.profile_image_url]);
    await connection.end();
  }
};

const storeTweet = async (tweet) => {
  const metrics = tweet.public_metrics;
  
  if (dbType === 'postgres') {
    const result = await db.query(`
      INSERT INTO tweets (id, author_id, text, retweet_count, reply_count, like_count, quote_count, bookmark_count, impression_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        text = EXCLUDED.text,
        retweet_count = EXCLUDED.retweet_count,
        reply_count = EXCLUDED.reply_count,
        like_count = EXCLUDED.like_count,
        quote_count = EXCLUDED.quote_count,
        bookmark_count = EXCLUDED.bookmark_count,
        impression_count = EXCLUDED.impression_count,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [tweet.id, tweet.author_id, tweet.text, metrics.retweet_count, metrics.reply_count, metrics.like_count, metrics.quote_count, metrics.bookmark_count, metrics.impression_count]);
    return result.rows[0];
  } else if (dbType === 'mysql') {
    const connection = await db.createConnection();
    await connection.execute(`
      INSERT INTO tweets (id, author_id, text, retweet_count, reply_count, like_count, quote_count, bookmark_count, impression_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        text = VALUES(text),
        retweet_count = VALUES(retweet_count),
        reply_count = VALUES(reply_count),
        like_count = VALUES(like_count),
        quote_count = VALUES(quote_count),
        bookmark_count = VALUES(bookmark_count),
        impression_count = VALUES(impression_count),
        updated_at = CURRENT_TIMESTAMP
    `, [tweet.id, tweet.author_id, tweet.text, metrics.retweet_count, metrics.reply_count, metrics.like_count, metrics.quote_count, metrics.bookmark_count, metrics.impression_count]);
    
    const [rows] = await connection.execute('SELECT * FROM tweets WHERE id = ?', [tweet.id]);
    await connection.end();
    return rows[0];
  }
};

const storeMedia = async (media, tweetId) => {
  if (dbType === 'postgres') {
    await db.query(`
      INSERT INTO tweet_media (media_key, tweet_id, type, url, preview_image_url, width, height)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (media_key) DO UPDATE SET
        tweet_id = EXCLUDED.tweet_id,
        type = EXCLUDED.type,
        url = EXCLUDED.url,
        preview_image_url = EXCLUDED.preview_image_url,
        width = EXCLUDED.width,
        height = EXCLUDED.height
    `, [media.media_key, tweetId, media.type, media.url, media.preview_image_url, media.width, media.height]);
  } else if (dbType === 'mysql') {
    const connection = await db.createConnection();
    await connection.execute(`
      INSERT INTO tweet_media (media_key, tweet_id, type, url, preview_image_url, width, height)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        tweet_id = VALUES(tweet_id),
        type = VALUES(type),
        url = VALUES(url),
        preview_image_url = VALUES(preview_image_url),
        width = VALUES(width),
        height = VALUES(height)
    `, [media.media_key, tweetId, media.type, media.url, media.preview_image_url, media.width, media.height]);
    await connection.end();
  }
};

const getTweets = async (req, res) => {
  try {
    let result;
    
    if (dbType === 'postgres') {
      result = await db.query(`
        SELECT 
          t.*, 
          ta.username, 
          ta.name, 
          ta.profile_image_url,
          COALESCE(
            JSON_AGG(
              CASE WHEN tm.media_key IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'media_key', tm.media_key,
                  'type', tm.type,
                  'url', tm.url,
                  'preview_image_url', tm.preview_image_url,
                  'width', tm.width,
                  'height', tm.height
                )
              END
            ) FILTER (WHERE tm.media_key IS NOT NULL), 
            '[]'::json
          ) as media
        FROM tweets t
        LEFT JOIN tweet_authors ta ON t.author_id = ta.id
        LEFT JOIN tweet_media tm ON t.id = tm.tweet_id
        GROUP BY t.id, ta.id
        ORDER BY t.created_at DESC
      `);
      return res.json(result.rows);
    } else if (dbType === 'mysql') {
      const connection = await db.createConnection();
      const [rows] = await connection.execute(`
        SELECT 
          t.*, 
          ta.username, 
          ta.name, 
          ta.profile_image_url,
          GROUP_CONCAT(
            CASE WHEN tm.media_key IS NOT NULL THEN
              CONCAT('{"media_key":"', tm.media_key, 
                     '","type":"', tm.type, 
                     '","url":"', tm.url, 
                     '","preview_image_url":"', IFNULL(tm.preview_image_url, ''), 
                     '","width":', IFNULL(tm.width, 0), 
                     ',"height":', IFNULL(tm.height, 0), '}')
            END
          ) as media_json
        FROM tweets t
        LEFT JOIN tweet_authors ta ON t.author_id = ta.id
        LEFT JOIN tweet_media tm ON t.id = tm.tweet_id
        GROUP BY t.id, ta.id
        ORDER BY t.created_at DESC
      `);
      
      // Parse media JSON for each tweet
      const tweetsWithMedia = rows.map(tweet => {
        if (tweet.media_json) {
          tweet.media = tweet.media_json.split(',').map(item => JSON.parse(item));
          delete tweet.media_json;
        } else {
          tweet.media = [];
        }
        return tweet;
      });
      
      await connection.end();
      return res.json(tweetsWithMedia);
    }
  } catch (error) {
    console.error('Error fetching tweets:', error);
    res.status(500).json({ error: 'Failed to fetch tweets' });
  }
};

module.exports = {
  fetchAndStoreTweet,
  getTweets
};