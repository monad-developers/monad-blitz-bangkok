import { ENV } from '@/utils/ENV';
import { createPublicClient, defineChain } from 'viem';
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, monadTestnet } from 'wagmi/chains';

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}

export const Nerd3LabChain = defineChain({
  id: 31337,
  name: 'Nerd3Lab',
  blockTime: 400,
  nativeCurrency: {
    name: 'NADX_TEST',
    symbol: 'NADXT',
    decimals: 18,
  },
  iconUrl:
    'https://pbs.twimg.com/profile_images/1876899096122015744/Mobpk-4o_400x400.jpg',
  rpcUrls: {
    default: {
      http: ['https://test-evm.nadx.app'],
    },
  },

  contracts: {
    // multicall3: {
    //   address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    //   blockCreated: 251449,
    // },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [sepolia, monadTestnet, Nerd3LabChain],
  transports: {
    // [mainnet.id]: http(),
    [sepolia.id]: http(),
    [monadTestnet.id]: http(),
    [Nerd3LabChain.id]: http(),
  },
});


export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http()
})