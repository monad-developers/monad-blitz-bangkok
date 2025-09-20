import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { logger } from './utils/logger';
import { requireValidEnvironment } from './utils/validateEnv';
import { Database } from './database/Database';
import { BlockchainService } from './services/BlockchainService';
import { JudgeService } from './services/JudgeService';
import { ChallengeService } from './services/ChallengeService';
import { matchRoutes } from './routes/matchRoutes';
import { challengeRoutes } from './routes/challengeRoutes';
import { playerRoutes } from './routes/playerRoutes';
import { leaderboardRoutes } from './routes/leaderboardRoutes';
import { errorHandler } from './middleware/errorHandler';
import { setupWebSocket } from './websocket/matchUpdates';

// Load environment variables
dotenv.config({ path: '../.env' });

// Validate environment before starting
requireValidEnvironment();

class App {
  private app: express.Application;
  private server: any;
  private database: Database;
  private blockchainService: BlockchainService;
  private judgeService: JudgeService;
  private challengeService: ChallengeService;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.initializeServices();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize database
      this.database = new Database();
      await this.database.initialize();
      logger.info('Database initialized');

      // Initialize blockchain service
      this.blockchainService = new BlockchainService();
      await this.blockchainService.initialize();
      logger.info('Blockchain service initialized');

      // Initialize judge service
      this.judgeService = new JudgeService();
      logger.info('Judge service initialized');

      // Initialize challenge service
      this.challengeService = new ChallengeService();
      await this.challengeService.initialize();
      logger.info('Challenge service initialized');

      // Make services available to routes
      this.app.locals.database = this.database;
      this.app.locals.blockchain = this.blockchainService;
      this.app.locals.judge = this.judgeService;
      this.app.locals.challenges = this.challengeService;

    } catch (error) {
      logger.error('Failed to initialize services:', error);
      process.exit(1);
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: this.database.isConnected(),
          blockchain: this.blockchainService.isConnected(),
          contracts: this.blockchainService.areContractsInitialized()
        }
      });
    });

    // API routes
    this.app.use('/api/matches', matchRoutes);
    this.app.use('/api/challenges', challengeRoutes);
    this.app.use('/api/players', playerRoutes);
    this.app.use('/api/leaderboard', leaderboardRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    const PORT = process.env.PORT || 3001;
    
    this.server = createServer(this.app);
    
    // Setup WebSocket for real-time updates
    setupWebSocket(this.server);

    return new Promise((resolve) => {
      this.server.listen(PORT, () => {
        logger.info(`🚀 Monad Arena Backend running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const app = new App();
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await app.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await app.stop();
    process.exit(0);
  });

  // Start the application
  app.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { App };