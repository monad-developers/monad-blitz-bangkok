// Static collection of cryptocurrency logos with metadata
export const CRYPTO_LOGOS = {
  bitcoin: {
    url: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    symbol: "BTC",
    name: "Bitcoin",
    color: "text-orange-600",
  },
  ethereum: {
    url: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    symbol: "ETH",
    name: "Ethereum",
    color: "text-blue-600",
  },
  binance: {
    url: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    symbol: "BNB",
    name: "Binance Coin",
    color: "text-yellow-600",
  },
  cardano: {
    url: "https://cryptologos.cc/logos/cardano-ada-logo.png",
    symbol: "ADA",
    name: "Cardano",
    color: "text-blue-500",
  },
  solana: {
    url: "https://cryptologos.cc/logos/solana-sol-logo.png",
    symbol: "SOL",
    name: "Solana",
    color: "text-purple-600",
  },
  polkadot: {
    url: "https://cryptologos.cc/logos/polkadot-new-dot-logo.png",
    symbol: "DOT",
    name: "Polkadot",
    color: "text-pink-600",
  },
  chainlink: {
    url: "https://cryptologos.cc/logos/chainlink-link-logo.png",
    symbol: "LINK",
    name: "Chainlink",
    color: "text-blue-400",
  },
  litecoin: {
    url: "https://cryptologos.cc/logos/litecoin-ltc-logo.png",
    symbol: "LTC",
    name: "Litecoin",
    color: "text-gray-600",
  },
  dogecoin: {
    url: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
    symbol: "DOGE",
    name: "Dogecoin",
    color: "text-yellow-500",
  },
  ripple: {
    url: "https://cryptologos.cc/logos/xrp-xrp-logo.png",
    symbol: "XRP",
    name: "Ripple",
    color: "text-blue-700",
  },
  avalanche: {
    url: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
    symbol: "AVAX",
    name: "Avalanche",
    color: "text-red-600",
  },
  polygon: {
    url: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    symbol: "MATIC",
    name: "Polygon",
    color: "text-purple-500",
  },
  cosmos: {
    url: "https://cryptologos.cc/logos/cosmos-atom-logo.png",
    symbol: "ATOM",
    name: "Cosmos",
    color: "text-indigo-600",
  },
  algorand: {
    url: "https://cryptologos.cc/logos/algorand-algo-logo.png",
    symbol: "ALGO",
    name: "Algorand",
    color: "text-gray-700",
  },
  stellar: {
    url: "https://cryptologos.cc/logos/stellar-xlm-logo.png",
    symbol: "XLM",
    name: "Stellar",
    color: "text-purple-700",
  },
} as const;

export type CryptoLogoName = keyof typeof CRYPTO_LOGOS;

// Helper function to get logo URL with cache busting
export const getCryptoLogoUrl = (
  name: CryptoLogoName,
  size?: number
): string => {
  const timestamp = Date.now();
  const baseUrl = CRYPTO_LOGOS[name].url;
  return size
    ? `${baseUrl}?v=${timestamp}&size=${size}`
    : `${baseUrl}?v=${timestamp}`;
};

// Helper function to get crypto metadata
export const getCryptoInfo = (name: CryptoLogoName) => {
  return CRYPTO_LOGOS[name];
};

// Get all available crypto names
export const getCryptoNames = (): CryptoLogoName[] => {
  return Object.keys(CRYPTO_LOGOS) as CryptoLogoName[];
};
