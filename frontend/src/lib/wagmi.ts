import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { createConfig, configureChains } from 'wagmi'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { publicProvider } from 'wagmi/providers/public'

// Monad testnet configuration - Updated for September 2025
const monadTestnet = {
  id: 10143, // Correct chain ID (0x279f in hex)
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
}

// Export chains for RainbowKit
export const chains = [monadTestnet]

// Configure chains with providers
const { publicClient, webSocketPublicClient } = configureChains(
  chains,
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: chain.rpcUrls.default.http[0],
      }),
    }),
    publicProvider(),
  ]
)

// Get default wallets configuration
const { connectors } = getDefaultWallets({
  appName: 'BlitzNad',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id',
  chains,
})

// Create the wagmi config
export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})