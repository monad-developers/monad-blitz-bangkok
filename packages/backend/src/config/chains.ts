import { defineChain } from "viem";

// Official Monad testnet chain configuration
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "MON",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
    public: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Testnet Explorer",
      url: "https://testnet-explorer.monad.xyz",
    },
  },
  testnet: true,
});

// Chain configuration for easy access
export const CHAIN_CONFIG = {
  MONAD_TESTNET: {
    id: 10143,
    name: "Monad Testnet",
    symbol: "MON",
    decimals: 18,
    rpcUrl: "https://testnet-rpc.monad.xyz",
    blockExplorer: "https://testnet-explorer.monad.xyz",
  },
} as const;