require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    testnet: {
      url: process.env.TESTNET_RPC_URL || "https://rpc.testnet.monad.xyz",
      chainId: parseInt(process.env.TESTNET_CHAIN_ID || "41434"),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://rpc.monad.xyz",
      chainId: parseInt(process.env.MAINNET_CHAIN_ID || "1"),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      testnet: process.env.ETHERSCAN_API_KEY || "",
      mainnet: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "testnet",
        chainId: parseInt(process.env.TESTNET_CHAIN_ID || "41434"),
        urls: {
          apiURL: process.env.TESTNET_API_URL || "https://api.testnet.monad.xyz/api",
          browserURL: process.env.TESTNET_BROWSER_URL || "https://testnet.monad.xyz",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

