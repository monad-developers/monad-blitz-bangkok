import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import session from "@fastify/session";
import Fastify from "fastify";
import { config, logConfig } from "./config/env";
import { authRoutes } from "./routes/auth";
import { betFactoryRoutes } from "./routes/betFactory";
import { pollBettingRoutes } from "./routes/pollBetting";
import { pollRoutes } from "./routes/polls";
import { twitterOAuthRoutes } from "./routes/twitterOAuth";
import { walletRoutes } from "./routes/wallet";
import { betFactoryService } from "./services/betFactory";
import { privyClient } from "./services/privy";
import { closeDatabaseConnection, connectToDatabase } from "./utils/mongodb";

const fastify = Fastify({
  logger: {
    level: config.logLevel,
  },
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: config.cors.origin,
    credentials: true,
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Cookie support
  await fastify.register(cookie, {
    secret: config.session.secret,
  });

  // Session support
  await fastify.register(session, {
    secret: config.session.secret,
    cookie: {
      secure: config.isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  });
}

// Register routes
async function registerRoutes() {
  // Health check
  fastify.get("/", async (request, reply) => {
    return {
      message: "BetNad Backend API",
      version: "1.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
    };
  });

  // API routes
  await fastify.register(authRoutes, { prefix: "/api/auth" });
  await fastify.register(twitterOAuthRoutes, { prefix: "/api" });
  await fastify.register(betFactoryRoutes, { prefix: "/api/betting" });
  await fastify.register(pollBettingRoutes, { prefix: "/api/betting" });
  await fastify.register(pollRoutes, { prefix: "/api" });
  await fastify.register(walletRoutes, { prefix: "/api/wallet" });
}

// Graceful shutdown
async function gracefulShutdown() {
  console.log("🛑 Graceful shutdown initiated...");

  try {
    await closeDatabaseConnection();
    await fastify.close();
    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during graceful shutdown:", error);
    process.exit(1);
  }
}

// Start server
async function start() {
  try {
    // Initialize services
    console.log("🚀 Starting BetNad Backend...");

    // Connect to MongoDB
    await connectToDatabase();

    // Log configuration
    logConfig();

    // Initialize Twitter service
    console.log("🐦 Twitter service initialized");

    // Make Privy client and BetFactory service available globally
    fastify.decorate("privy", privyClient);
    fastify.decorate("betFactory", betFactoryService);

    // Register plugins and routes
    await registerPlugins();
    await registerRoutes();

    // Start server
    const port = config.port;
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });

    console.log(`✅ Server running on http://${host}:${port}`);
    console.log(`📚 API Documentation: http://${host}:${port}/docs`);

    // Handle graceful shutdown
    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
start();
