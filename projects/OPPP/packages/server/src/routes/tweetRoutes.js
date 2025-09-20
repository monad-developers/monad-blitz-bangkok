const express = require('express');
const router = express.Router();
const { fetchAndStoreTweet, getTweets } = require('../controllers/tweetController');

// POST /api/tweets/fetch - Fetch and store tweets by IDs
router.post('/fetch', fetchAndStoreTweet);

// GET /api/tweets - Get all stored tweets
router.get('/', getTweets);

module.exports = router;
