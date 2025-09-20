const fs = require("fs");
const path = require("path");

/**
 * Script to automatically update frontend configuration with deployed contract addresses
 * Run this after deployment to update the frontend with correct addresses
 */

async function main() {
  console.log("🔄 Updating frontend configuration...");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", `${hre.network.name}.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found. Please run deploy.js first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  // Update main.ts
  const mainTsPath = path.join(__dirname, "..", "frontend", "src", "main.ts");
  if (fs.existsSync(mainTsPath)) {
    let mainTsContent = fs.readFileSync(mainTsPath, "utf8");
    
    // Replace contract addresses
    mainTsContent = mainTsContent.replace(
      /const LUCKYBOX_ADDRESS = "0xYourLuckyBox";/,
      `const LUCKYBOX_ADDRESS = "${deployment.contracts.MemeRouletteLuckyBox}";`
    );
    
    mainTsContent = mainTsContent.replace(
      /const USDT_ADDRESS = "0xYourUSDT";/,
      `const USDT_ADDRESS = "${deployment.contracts.MockUSDT}";`
    );
    
    fs.writeFileSync(mainTsPath, mainTsContent);
    console.log("✅ Updated frontend/src/main.ts");
  }

  // Update config.ts
  const configTsPath = path.join(__dirname, "..", "frontend", "src", "config.ts");
  if (fs.existsSync(configTsPath)) {
    let configTsContent = fs.readFileSync(configTsPath, "utf8");
    
    // Replace contract addresses
    configTsContent = configTsContent.replace(
      /LUCKYBOX_ADDRESS: "0xYourLuckyBox",/,
      `LUCKYBOX_ADDRESS: "${deployment.contracts.MemeRouletteLuckyBox}",`
    );
    
    configTsContent = configTsContent.replace(
      /USDT_ADDRESS: "0xYourUSDT",/,
      `USDT_ADDRESS: "${deployment.contracts.MockUSDT}",`
    );
    
    fs.writeFileSync(configTsPath, configTsContent);
    console.log("✅ Updated frontend/src/config.ts");
  }

  // Create a simple config file for easy access
  const frontendConfigPath = path.join(__dirname, "..", "frontend", "contract-addresses.json");
  const frontendConfig = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contracts: {
      MemeRouletteLuckyBox: deployment.contracts.MemeRouletteLuckyBox,
      MockUSDT: deployment.contracts.MockUSDT,
      MockRefiller: deployment.contracts.MockRefiller,
      tokens: deployment.contracts.tokens
    },
    rpcUrl: hre.network.config.url,
    blockExplorer: hre.network.config.etherscan?.customChains?.[0]?.urls?.browserURL || "Unknown",
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));
  console.log("✅ Created frontend/contract-addresses.json");

  console.log("\n🎉 Frontend configuration updated successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("MemeRouletteLuckyBox:", deployment.contracts.MemeRouletteLuckyBox);
  console.log("MockUSDT:", deployment.contracts.MockUSDT);
  console.log("MockRefiller:", deployment.contracts.MockRefiller);
  
  console.log("\n🚀 Next steps:");
  console.log("1. Start the frontend: npm run frontend:dev");
  console.log("2. Open http://localhost:3000 in your browser");
  console.log("3. Connect your wallet and start playing!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Update failed:", error);
    process.exit(1);
  });
