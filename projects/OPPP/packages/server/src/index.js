const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');
const userRoutes = require('./routes/users');
const transactionRoutes = require('./routes/transactions');
const tweetRoutes = require('./routes/tweetRoutes');

const app = express();
const PORT = process.env.PORT || 5143;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.API_RATE_LIMIT || 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'Sonad API Server',
    version: '1.0.0',
    status: 'running',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/tweets', tweetRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const startServer = async () => {
  try {
    await testConnection();

    app.listen(PORT, () => {
      console.log(`🚀 Sonad API Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API endpoints: http://localhost:${PORT}/api`);
      console.log(`🐦 Tweet endpoints:`);
      console.log(`   GET  ${PORT}/api/tweets - Get all tweets`);
      console.log(`   POST ${PORT}/api/tweets/fetch - Fetch tweets by IDs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();