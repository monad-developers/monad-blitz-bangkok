-- Create tweets table
CREATE TABLE IF NOT EXISTS tweets (
    id VARCHAR(50) PRIMARY KEY,
    author_id VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retweet_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    quote_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    impression_count INTEGER DEFAULT 0,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tweet_authors table
CREATE TABLE IF NOT EXISTS tweet_authors (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    profile_image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tweet_media table
CREATE TABLE IF NOT EXISTS tweet_media (
    media_key VARCHAR(50) PRIMARY KEY,
    tweet_id VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    url TEXT,
    preview_image_url TEXT,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tweet_id) REFERENCES tweets(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tweets_author_id ON tweets(author_id);
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at);
CREATE INDEX IF NOT EXISTS idx_tweet_media_tweet_id ON tweet_media(tweet_id);
