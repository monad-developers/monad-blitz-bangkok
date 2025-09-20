// Configuration file for the frontend
// Update these values after deploying contracts

export const CONFIG = {
  // Contract addresses - update these after deployment
  LUCKYBOX_ADDRESS: "0xYourLuckyBox", // MemeRouletteLuckyBox
  USDT_ADDRESS: "0xYourUSDT", // USDT (6 decimals) on your network
  
  // Network configuration
  NETWORK: {
    name: "Monad Testnet",
    chainId: 41434,
    rpcUrl: "https://rpc.testnet.monad.xyz",
    blockExplorer: "https://testnet.monad.xyz"
  },
  
  // Game configuration
  GAME: {
    SPIN_PRICE_USDT: 1_000_000n, // 1 USDT (6 decimals)
    TEAM_FEE_PERCENTAGE: 5, // 5%
    REFILL_PERCENTAGE: 95, // 95%
    POOL_SIZE: 100, // 10 tokens * 10 pieces each
    PIECES_PER_TOKEN: 10
  },
  
  // UI configuration
  UI: {
    REFRESH_INTERVAL: 5000, // 5 seconds
    MAX_RETRIES: 3,
    TIMEOUT: 30000 // 30 seconds
  }
};

// Token symbols for display (update based on your pool)
export const TOKEN_SYMBOLS = [
  "BTC", "ETH", "XRP", "BNB", "SOL", 
  "DOGE", "ADA", "TRX", "HYPE", "LINK"
];

// Helper function to get token symbol by index
export function getTokenSymbol(index: number): string {
  return TOKEN_SYMBOLS[index] || `TOKEN${index}`;
}
