import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Twitter API credentials (v1.1 - for existing functionality)
  X_APP_KEY: z.string().min(1, "X_APP_KEY is required"),
  X_APP_SECRET: z.string().min(1, "X_APP_SECRET is required"),
  X_USER_ACCESS_TOKEN: z.string().min(1, "X_USER_ACCESS_TOKEN is required"),
  X_USER_ACCESS_SECRET: z.string().min(1, "X_USER_ACCESS_SECRET is required"),
  X_BOT_USER_ID: z.string().min(1, "X_BOT_USER_ID is required"),

  // Twitter OAuth 2.0 credentials (for login with X)
  X_CLIENT_ID: z.string().min(1, "X_CLIENT_ID is required"),
  X_CLIENT_SECRET: z.string().min(1, "X_CLIENT_SECRET is required"),
  X_CALLBACK_URL: z
    .string()
    .url("X_CALLBACK_URL must be a valid URL")
    .default("http://localhost:3001/callback"),
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),

  // Server configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default("4000"),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Optional Twitter settings
  MENTION_POLLING_INTERVAL: z.string().transform(Number).default("20000"),
  MAX_MENTION_RESULTS: z.string().transform(Number).default("100"),

  // MongoDB settings
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DATABASE: z.string().default("betnad"),

  // CORS settings
  CORS_ORIGIN: z.string().default("http://localhost:4000"),

  // Frontend URL for poll links
  FRONTEND_URL: z.string().default("http://localhost:3001"),

  // Privy configuration (optional)
  PRIVY_APP_ID: z.string().default(""),
  PRIVY_APP_SECRET: z.string().default(""),

  // Gas Tank configuration (optional)
  GAS_TANK_PRIVATE_KEY: z.string().default(""),
  GAS_TANK_AMOUNT: z.string().default("0.001"),
  GAS_TANK_RPC_URL: z.string().default("https://testnet-rpc.monad.xyz"),
});

// Validate and parse environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter((err: any) => err.code === "too_small" && err.minimum === 1)
        .map((err: any) => err.path.join("."));

      const invalidVars = error.errors
        .filter((err: any) => err.code !== "too_small")
        .map((err: any) => `${err.path.join(".")}: ${err.message}`);

      console.error("❌ Environment validation failed:");

      if (missingVars.length > 0) {
        console.error("Missing required variables:");
        missingVars.forEach((varName: string) =>
          console.error(`  - ${varName}`)
        );
      }

      if (invalidVars.length > 0) {
        console.error("Invalid variables:");
        invalidVars.forEach((varName: string) =>
          console.error(`  - ${varName}`)
        );
      }

      console.error(
        "\nPlease check your .env file and ensure all required variables are set."
      );
      process.exit(1);
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type for environment variables
export type Env = z.infer<typeof envSchema>;

// Environment utilities
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

// Secret management utilities
export class SecretManager {
  private static instance: SecretManager;
  private secrets: Map<string, string> = new Map();

  private constructor() {
    this.loadSecrets();
  }

  public static getInstance(): SecretManager {
    if (!SecretManager.instance) {
      SecretManager.instance = new SecretManager();
    }
    return SecretManager.instance;
  }

  private loadSecrets(): void {
    // Load from environment variables
    this.secrets.set("X_APP_KEY", env.X_APP_KEY);
    this.secrets.set("X_APP_SECRET", env.X_APP_SECRET);
    this.secrets.set("X_USER_ACCESS_TOKEN", env.X_USER_ACCESS_TOKEN);
    this.secrets.set("X_USER_ACCESS_SECRET", env.X_USER_ACCESS_SECRET);
    this.secrets.set("X_BOT_USER_ID", env.X_BOT_USER_ID);
    this.secrets.set("X_CLIENT_ID", env.X_CLIENT_ID);
    this.secrets.set("X_CLIENT_SECRET", env.X_CLIENT_SECRET);
    this.secrets.set("SESSION_SECRET", env.SESSION_SECRET);
  }

  public getSecret(key: string): string | undefined {
    return this.secrets.get(key);
  }

  public setSecret(key: string, value: string): void {
    this.secrets.set(key, value);
  }

  public hasSecret(key: string): boolean {
    return this.secrets.has(key);
  }

  public getAllSecrets(): Record<string, string> {
    return Object.fromEntries(this.secrets);
  }

  // Mask sensitive values for logging
  public getMaskedSecret(key: string): string | undefined {
    const value = this.getSecret(key);
    if (!value) return undefined;

    if (value.length <= 8) {
      return "*".repeat(value.length);
    }

    return (
      value.substring(0, 4) +
      "*".repeat(value.length - 8) +
      value.substring(value.length - 4)
    );
  }
}

// Export secret manager instance
export const secretManager = SecretManager.getInstance();

// Configuration object with all settings
export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  host: env.HOST,
  logLevel: env.LOG_LEVEL,
  mongodb: {
    uri: env.MONGODB_URI,
    database: env.MONGODB_DATABASE,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
  frontend: {
    url: env.FRONTEND_URL,
  },
  twitter: {
    appKey: env.X_APP_KEY,
    appSecret: env.X_APP_SECRET,
    accessToken: env.X_USER_ACCESS_TOKEN,
    accessSecret: env.X_USER_ACCESS_SECRET,
    botUserId: env.X_BOT_USER_ID,
    mentionPollingInterval: env.MENTION_POLLING_INTERVAL,
    maxMentionResults: env.MAX_MENTION_RESULTS,
    // OAuth 2.0 credentials
    clientId: env.X_CLIENT_ID,
    clientSecret: env.X_CLIENT_SECRET,
    callbackUrl: env.X_CALLBACK_URL,
  },
  session: {
    secret: env.SESSION_SECRET,
  },
  privy: {
    appId: env.PRIVY_APP_ID,
    appSecret: env.PRIVY_APP_SECRET,
  },
  gasTank: {
    privateKey: env.GAS_TANK_PRIVATE_KEY,
    amount: env.GAS_TANK_AMOUNT,
    rpcUrl: env.GAS_TANK_RPC_URL,
  },
  isDevelopment,
  isProduction,
  isTest,
} as const;

// Utility function to check if all required secrets are present
export function validateSecrets(): boolean {
  const requiredSecrets = [
    "X_APP_KEY",
    "X_APP_SECRET",
    "X_USER_ACCESS_TOKEN",
    "X_USER_ACCESS_SECRET",
    "X_BOT_USER_ID",
    "X_CLIENT_ID",
    "X_CLIENT_SECRET",
    "SESSION_SECRET",
  ];

  const missingSecrets = requiredSecrets.filter(
    (secret) => !secretManager.hasSecret(secret)
  );

  if (missingSecrets.length > 0) {
    console.error("❌ Missing required secrets:", missingSecrets);
    return false;
  }

  return true;
}

// Utility function to log configuration (with masked secrets)
export function logConfig(): void {
  console.log("🔧 Configuration loaded:");
  console.log(`  Environment: ${config.env}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Host: ${config.host}`);
  console.log(`  Log Level: ${config.logLevel}`);
  console.log(`  MongoDB URI: ${config.mongodb.uri}`);
  console.log(`  MongoDB Database: ${config.mongodb.database}`);
  console.log(`  CORS Origin: ${config.cors.origin}`);
  console.log(`  Twitter Bot User ID: ${config.twitter.botUserId}`);
  console.log(
    `  Mention Polling Interval: ${config.twitter.mentionPollingInterval}ms`
  );
  console.log(`  Max Mention Results: ${config.twitter.maxMentionResults}`);
  console.log(`  Gas Tank Amount: ${config.gasTank.amount} MON`);
  console.log(`  Gas Tank RPC URL: ${config.gasTank.rpcUrl}`);

  if (isDevelopment) {
    console.log("🔑 Twitter API Keys (masked):");
    console.log(`  App Key: ${secretManager.getMaskedSecret("X_APP_KEY")}`);
    console.log(
      `  App Secret: ${secretManager.getMaskedSecret("X_APP_SECRET")}`
    );
    console.log(
      `  Access Token: ${secretManager.getMaskedSecret("X_USER_ACCESS_TOKEN")}`
    );
    console.log(
      `  Access Secret: ${secretManager.getMaskedSecret(
        "X_USER_ACCESS_SECRET"
      )}`
    );
  }
}

// Default export for backward compatibility
export default config;
