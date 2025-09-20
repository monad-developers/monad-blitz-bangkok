const { run } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔍 Starting contract verification process...\n");

  // Read deployment info
  const deploymentFile = path.join(__dirname, '..', 'deployment.json');
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ deployment.json not found. Please run deployment first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const contracts = deploymentInfo.contracts;
  const deployer = deploymentInfo.deployer;

  console.log("📋 Network:", deploymentInfo.network.name);
  console.log("🔗 Chain ID:", deploymentInfo.network.chainId);
  console.log("👤 Deployer:", deployer);
  console.log("");

  // Contract verification configurations
  const verifyConfigs = [
    {
      name: "OnceToken",
      address: contracts.onceToken,
      contract: "contracts/OnceToken.sol:OnceToken",
      constructorArgs: [deployer, deployer],
      argsFile: "verify-args/onceToken.js"
    },
    {
      name: "BatchManager",
      address: contracts.batchManager,
      contract: "contracts/BatchManager.sol:BatchManager",
      constructorArgs: [],
      argsFile: "verify-args/batchManager.js"
    },
    {
      name: "Once721TemplateV2",
      address: contracts.once721Template,
      contract: "contracts/Once721TemplateV2.sol:Once721TemplateV2",
      constructorArgs: [],
      argsFile: "verify-args/once721Template.js"
    },
    {
      name: "Once1155TemplateV2",
      address: contracts.once1155Template,
      contract: "contracts/Once1155TemplateV2.sol:Once1155TemplateV2",
      constructorArgs: [],
      argsFile: "verify-args/once1155Template.js"
    },
    {
      name: "BatchFactory",
      address: contracts.batchFactory,
      contract: "contracts/BatchFactory.sol:BatchFactory",
      constructorArgs: [
        contracts.batchManager,
        contracts.once721Template,
        contracts.once1155Template,
        contracts.onceToken
      ],
      argsFile: "verify-args/batchFactory.js"
    }
  ];

  let successCount = 0;
  let failedContracts = [];

  // Verify each contract
  for (const config of verifyConfigs) {
    console.log(`🔍 Verifying ${config.name}...`);
    console.log(`   Address: ${config.address}`);
    console.log(`   Contract: ${config.contract}`);
    
    try {
      await run("verify:verify", {
        address: config.address,
        contract: config.contract,
        constructorArguments: config.constructorArgs,
      });
      
      console.log(`   ✅ ${config.name} verified successfully!\n`);
      successCount++;
      
    } catch (error) {
      console.log(`   ❌ Failed to verify ${config.name}`);
      console.log(`   Error: ${error.message}\n`);
      
      failedContracts.push({
        name: config.name,
        address: config.address,
        error: error.message,
        manualCommand: `npx hardhat verify --network ${deploymentInfo.network.name} ${config.address} --constructor-args ${config.argsFile}`
      });
    }
    
    // Add delay between verifications to avoid rate limiting
    if (config !== verifyConfigs[verifyConfigs.length - 1]) {
      console.log("⏳ Waiting 5 seconds before next verification...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Summary
  console.log("=" .repeat(60));
  console.log("📊 VERIFICATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successfully verified: ${successCount}/${verifyConfigs.length}`);
  
  if (failedContracts.length > 0) {
    console.log(`❌ Failed to verify: ${failedContracts.length}/${verifyConfigs.length}\n`);
    
    console.log("🔧 Manual verification commands:");
    console.log("─".repeat(50));
    
    for (const failed of failedContracts) {
      console.log(`\n${failed.name}:`);
      console.log(`Error: ${failed.error}`);
      console.log(`Command: ${failed.manualCommand}`);
    }
  } else {
    console.log("🎉 All contracts verified successfully!");
  }

  console.log("\n📖 Verification URLs:");
  console.log("─".repeat(50));
  
  // Generate explorer URLs based on network
  const explorerUrls = {
    "10143": "https://testnet.monadexplorer.com", // Monad Testnet
  };
  
  const explorerUrl = explorerUrls[deploymentInfo.network.chainId];
  
  if (explorerUrl) {
    for (const config of verifyConfigs) {
      console.log(`${config.name}: ${explorerUrl}/address/${config.address}`);
    }
  } else {
    console.log("Explorer URLs not configured for this network");
  }
}

main()
  .then(() => {
    console.log("\n✨ Verification script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Verification script failed:");
    console.error(error);
    process.exit(1);
  });