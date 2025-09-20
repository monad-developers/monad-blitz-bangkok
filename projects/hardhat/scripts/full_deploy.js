const { ethers } = require("hardhat");

// Helper function to add delay between operations
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry function for deployment operations
async function deployWithRetry(deploymentFunction, maxRetries = 3, delayMs = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`   Attempt ${i + 1}/${maxRetries}...`);
      const result = await deploymentFunction();
      return result;
    } catch (error) {
      console.log(`   ❌ Attempt ${i + 1} failed:`, error.message);

      if (i === maxRetries - 1) {
        throw error; // Re-throw on last attempt
      }

      console.log(`   ⏳ Waiting ${delayMs / 1000}s before retry...`);
      await delay(delayMs);
    }
  }
}

async function main() {
  console.log("🚀 Starting full deployment process...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer account:", deployer.address);

  // Get balance with retry
  let balance;
  try {
    balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");
  } catch (error) {
    console.log("⚠️ Could not fetch balance, continuing with deployment...\n");
  }

  let deployedContracts = {};

  try {
    // ===== Step 1: Deploy OnceToken =====
    console.log("📦 Step 1: Deploying OnceToken...");
    const { onceToken, onceTokenAddress } = await deployWithRetry(async () => {
      const OnceToken = await ethers.getContractFactory("OnceToken");
      const contract = await OnceToken.deploy(
        deployer.address,  // defaultAdmin
        deployer.address   // minter
      );
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      return { onceToken: contract, onceTokenAddress: address };
    });
    deployedContracts.onceToken = onceTokenAddress;
    console.log("✅ OnceToken deployed to:", deployedContracts.onceToken);
    console.log("   - Default Admin:", deployer.address);
    console.log("   - Minter:", deployer.address, "\n");

    // Add delay between deployments
    await delay(3000);

    // ===== Step 2: Deploy BatchManager =====
    console.log("📦 Step 2: Deploying BatchManager...");
    const { batchManager, batchManagerAddress } = await deployWithRetry(async () => {
      const BatchManager = await ethers.getContractFactory("BatchManager");
      const contract = await BatchManager.deploy();
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      return { batchManager: contract, batchManagerAddress: address };
    });
    deployedContracts.batchManager = batchManagerAddress;
    console.log("✅ BatchManager deployed to:", deployedContracts.batchManager);
    console.log("   - Default Admin:", deployer.address);
    console.log("   - System Admin:", deployer.address, "\n");

    // Add delay between deployments
    await delay(3000);

    // ===== Step 3: Deploy Once721TemplateV2 =====
    console.log("📦 Step 3: Deploying Once721TemplateV2 (Template)...");
    const { once721Template, once721TemplateAddress } = await deployWithRetry(async () => {
      const Once721TemplateV2 = await ethers.getContractFactory("Once721TemplateV2");
      const contract = await Once721TemplateV2.deploy();
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      return { once721Template: contract, once721TemplateAddress: address };
    });
    deployedContracts.once721Template = once721TemplateAddress;
    console.log("✅ Once721TemplateV2 deployed to:", deployedContracts.once721Template);
    console.log("   - This is a template contract for cloning\n");

    // Add delay between deployments
    await delay(3000);

    // ===== Step 4: Deploy Once1155TemplateV2 =====
    console.log("📦 Step 4: Deploying Once1155TemplateV2 (Template)...");
    const { once1155Template, once1155TemplateAddress } = await deployWithRetry(async () => {
      const Once1155TemplateV2 = await ethers.getContractFactory("Once1155TemplateV2");
      const contract = await Once1155TemplateV2.deploy();
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      return { once1155Template: contract, once1155TemplateAddress: address };
    });
    deployedContracts.once1155Template = once1155TemplateAddress;
    console.log("✅ Once1155TemplateV2 deployed to:", deployedContracts.once1155Template);
    console.log("   - This is a template contract for cloning\n");

    // Add delay between deployments
    await delay(3000);

    // ===== Step 5: Deploy BatchFactory =====
    console.log("📦 Step 5: Deploying BatchFactory...");
    const { batchFactory, batchFactoryAddress } = await deployWithRetry(async () => {
      const BatchFactory = await ethers.getContractFactory("BatchFactory");
      const contract = await BatchFactory.deploy(
        deployedContracts.batchManager,      // BatchManager address
        deployedContracts.once721Template,   // ERC721 template address
        deployedContracts.once1155Template,  // ERC1155 template address
        deployedContracts.onceToken         // Payment token address
      );
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      return { batchFactory: contract, batchFactoryAddress: address };
    });
    deployedContracts.batchFactory = batchFactoryAddress;
    console.log("✅ BatchFactory deployed to:", deployedContracts.batchFactory);
    console.log("   - BatchManager:", deployedContracts.batchManager);
    console.log("   - ERC721 Template:", deployedContracts.once721Template);
    console.log("   - ERC1155 Template:", deployedContracts.once1155Template);
    console.log("   - Payment Token:", deployedContracts.onceToken, "\n");

    // Add delay before permissions setup
    await delay(3000);

    // ===== Step 6: Setup Permissions =====
    console.log("🔐 Step 6: Setting up permissions...");

    // Grant BatchFactory the BATCH_FACTORY_ROLE in BatchManager
    console.log("   Granting BATCH_FACTORY_ROLE to BatchFactory...");
    await deployWithRetry(async () => {
      const tx1 = await batchManager.setBatchFactory(deployedContracts.batchFactory);
      await tx1.wait();
    });
    console.log("   ✅ BatchFactory granted BATCH_FACTORY_ROLE");

    // Add delay between transactions
    await delay(2000);

    // Grant BatchFactory as trusted spender for OnceToken (for payment collection)
    console.log("   Setting BatchFactory as trusted spender for OnceToken...");
    await deployWithRetry(async () => {
      const tx2 = await onceToken.setTrustedSpender(deployedContracts.batchFactory);
      await tx2.wait();
    });
    console.log("   ✅ BatchFactory set as trusted spender");

    // ===== Step 7: Configuration =====
    console.log("\n⚙️ Step 7: Initial configuration...");

    // Add delay before configuration
    await delay(2000);

    // Set initial configuration for BatchFactory
    console.log("   Setting tokens per code to 10 (can be adjusted later)...");
    await deployWithRetry(async () => {
      const tx3 = await batchFactory.setTokensPerCode(ethers.parseEther("1"));
      await tx3.wait();
    });
    console.log("   ✅ Tokens per code set to 1 ONCT");

    // Add delay between transactions
    await delay(2000);

    console.log("   Setting minimum codes per batch to 10...");
    await deployWithRetry(async () => {
      const tx4 = await batchFactory.setMinCodesPerBatch(10);
      await tx4.wait();
    });
    console.log("   ✅ Minimum codes per batch set to 10");

    // ===== Step 8: Mint initial tokens for testing =====
    console.log("\n🪙 Step 8: Minting initial tokens for testing...");

    // Add delay before minting
    await delay(2000);

    const initialSupply = ethers.parseEther("1000000"); // 1M tokens
    await deployWithRetry(async () => {
      const tx5 = await onceToken.mint(deployer.address, initialSupply);
      await tx5.wait();
    });
    console.log("   ✅ Minted", ethers.formatEther(initialSupply), "ONCT to deployer");

    // ===== Deployment Summary =====
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("\n📋 Contract Addresses:");
    console.log("┌─────────────────────────┬──────────────────────────────────────────────┐");
    console.log("│ Contract                │ Address                                      │");
    console.log("├─────────────────────────┼──────────────────────────────────────────────┤");
    console.log(`│ OnceToken               │ ${deployedContracts.onceToken}              │`);
    console.log(`│ BatchManager            │ ${deployedContracts.batchManager}           │`);
    console.log(`│ Once721TemplateV2       │ ${deployedContracts.once721Template}        │`);
    console.log(`│ Once1155TemplateV2      │ ${deployedContracts.once1155Template}       │`);
    console.log(`│ BatchFactory            │ ${deployedContracts.batchFactory}           │`);
    console.log("└─────────────────────────┴──────────────────────────────────────────────┘");

    console.log("\n📋 Configuration:");
    console.log("┌─────────────────────────┬──────────────────────────────────────────────┐");
    console.log("│ Setting                 │ Value                                        │");
    console.log("├─────────────────────────┼──────────────────────────────────────────────┤");
    console.log("│ Tokens per Code         │ 10 ONCT                                      │");
    console.log("│ Min Codes per Batch     │ 10 codes                                     │");
    console.log("│ Payment Token           │ OnceToken (ONCT)                             │");
    console.log("│ Initial Supply          │ 1,000,000 ONCT                               │");
    console.log("└─────────────────────────┴──────────────────────────────────────────────┘");

    console.log("\n🔐 Permissions:");
    console.log("• BatchFactory has BATCH_FACTORY_ROLE in BatchManager");
    console.log("• BatchFactory is trusted spender for OnceToken");
    console.log("• Deployer is admin of all contracts");

    console.log("\n📖 Next Steps:");
    console.log("1. Add trusted signers to BatchManager and BatchFactory");
    console.log("2. Configure base URIs for NFT templates");
    console.log("3. Adjust token pricing and batch limits as needed");
    console.log("4. Verify contracts on block explorer");

    // Save deployment info to JSON file
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      network: await ethers.provider.getNetwork(),
      deployer: deployer.address,
      contracts: deployedContracts,
      configuration: {
        tokensPerCode: "10",
        minCodesPerBatch: "10",
        initialSupply: "1000000"
      }
    };

    const fs = require('fs');
    const path = require('path');
    const deploymentFile = path.join(__dirname, '..', 'deployment.json');
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => {
    console.log("\n✨ Deployment script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:");
    console.error(error);
    process.exit(1);
  });