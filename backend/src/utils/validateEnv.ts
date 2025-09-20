import { logger } from './logger';

interface EnvironmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvironmentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  const requiredVars = {
    MONAD_TESTNET_RPC_URL: process.env.MONAD_TESTNET_RPC_URL,
    ORACLE_PRIVATE_KEY: process.env.ORACLE_PRIVATE_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  // Optional but recommended variables
  const optionalVars = {
    GAME_TOKEN_ADDRESS: process.env.GAME_TOKEN_ADDRESS,
    ARENA_CONTRACT_ADDRESS: process.env.ARENA_CONTRACT_ADDRESS,
    BADGES_CONTRACT_ADDRESS: process.env.BADGES_CONTRACT_ADDRESS,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
  };

  // Check required variables
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
    } else if (value.includes('your_') || value.includes('_here')) {
      errors.push(`Environment variable ${key} contains placeholder value. Please set a real value.`);
    }
  }

  // Check private key format
  if (requiredVars.ORACLE_PRIVATE_KEY) {
    const privateKey = requiredVars.ORACLE_PRIVATE_KEY;
    if (privateKey.startsWith('0x')) {
      if (privateKey.length !== 66) {
        errors.push('ORACLE_PRIVATE_KEY must be 64 characters (plus 0x prefix)');
      }
    } else {
      if (privateKey.length !== 64) {
        errors.push('ORACLE_PRIVATE_KEY must be 64 characters');
      }
    }
    
    // Check if it's a placeholder
    if (privateKey.includes('your_') || privateKey.includes('_here')) {
      errors.push('ORACLE_PRIVATE_KEY contains placeholder value. Please use a real private key.');
    }
  }

  // Check JWT secret strength
  if (requiredVars.JWT_SECRET && requiredVars.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters long for security');
  }

  // Check optional variables
  for (const [key, value] of Object.entries(optionalVars)) {
    if (!value) {
      warnings.push(`Optional environment variable not set: ${key}`);
    } else if (value.includes('your_') || value.includes('_here')) {
      warnings.push(`Environment variable ${key} contains placeholder value`);
    }
  }

  // Check RPC URL format
  if (requiredVars.MONAD_TESTNET_RPC_URL) {
    const rpcUrl = requiredVars.MONAD_TESTNET_RPC_URL;
    if (!rpcUrl.startsWith('http://') && !rpcUrl.startsWith('https://')) {
      errors.push('MONAD_TESTNET_RPC_URL must be a valid HTTP/HTTPS URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function logValidationResults(validation: EnvironmentValidation): void {
  if (validation.errors.length > 0) {
    logger.error('Environment validation failed:');
    validation.errors.forEach(error => logger.error(`  ❌ ${error}`));
  }

  if (validation.warnings.length > 0) {
    logger.warn('Environment validation warnings:');
    validation.warnings.forEach(warning => logger.warn(`  ⚠️  ${warning}`));
  }

  if (validation.isValid) {
    logger.info('✅ Environment validation passed');
  }
}

export function requireValidEnvironment(): void {
  const validation = validateEnvironment();
  logValidationResults(validation);

  if (!validation.isValid) {
    logger.error('❌ Environment validation failed. Please check your .env file.');
    logger.error('   Run the following to see the template:');
    logger.error('   cat .env.example');
    process.exit(1);
  }
}