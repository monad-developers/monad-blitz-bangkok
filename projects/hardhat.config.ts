import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    // ถ้าสัญญาทั้งหมดใช้ ^0.8.28 ใช้อันเดียวพอ
    version: "0.8.28",
    settings: { optimizer: { enabled: true, runs: 200 } }
    // ถ้ามีหลาย pragma ค่อยเปลี่ยนเป็น compilers: [...] + overrides
  },
  networks: {
    monadTestnet: {
      url: process.env.MONAD_RPC || "https://10143.rpc.thirdweb.com",
      chainId: 10143,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    }
  }
};

export default config;