const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("⚙️  Setting up MemeRoulette Lucky Box...");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", `${hre.network.name}.json`);
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found. Please run deploy.js first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const [deployer] = await ethers.getSigners();

  console.log("Using deployment from:", deploymentPath);
  console.log("Deployer:", deployer.address);

  // Get contract instances
  const luckyBox = await ethers.getContractAt("MemeRouletteLuckyBox", deployment.contracts.MemeRouletteLuckyBox);
  const mockUSDT = await ethers.getContractAt("MockUSDT", deployment.contracts.MockUSDT);
  const mockRefiller = await ethers.getContractAt("MockRefiller", deployment.contracts.MockRefiller);

  console.log("\n🎯 Setting up initial pool...");

  // Check if pool is already configured
  const tokens = await luckyBox.getTokens();
  if (tokens.length > 0) {
    console.log("Pool already configured with", tokens.length, "tokens");
  } else {
    console.log("Pool not configured yet. Please run deploy.js first.");
    return;
  }

  // Check if initial deposit is needed
  const poolSnapshot = await luckyBox.getPoolSnapshot();
  console.log("Pool target size:", poolSnapshot.poolTargetSize.toString());

  // Approve tokens for initial deposit
  console.log("\n💰 Approving tokens for initial deposit...");
  for (let i = 0; i < deployment.contracts.tokens.length; i++) {
    const tokenInfo = deployment.contracts.tokens[i];
    const token = await ethers.getContractAt("MockUSDT", tokenInfo.address);
    const slotAmount = ethers.parseUnits("1", 6); // 1 token per piece
    const totalAmount = slotAmount * 10n; // 10 pieces per token

    // Check allowance
    const allowance = await token.allowance(deployer.address, deployment.contracts.MemeRouletteLuckyBox);
    if (allowance < totalAmount) {
      console.log(`Approving ${tokenInfo.symbol}...`);
      await token.approve(deployment.contracts.MemeRouletteLuckyBox, totalAmount);
    } else {
      console.log(`${tokenInfo.symbol} already approved`);
    }
  }

  // Perform initial deposit
  console.log("\n📦 Performing initial deposit...");
  try {
    const tx = await luckyBox.depositInitial();
    await tx.wait();
    console.log("✅ Initial deposit completed!");
  } catch (error) {
    console.log("Initial deposit failed:", error.message);
  }

  // Check final state
  console.log("\n📊 Final state check:");
  const usdtBalance = await mockUSDT.balanceOf(deployer.address);
  console.log("Deployer USDT balance:", ethers.formatUnits(usdtBalance, 6));

  for (let i = 0; i < deployment.contracts.tokens.length; i++) {
    const tokenInfo = deployment.contracts.tokens[i];
    const token = await ethers.getContractAt("MockUSDT", tokenInfo.address);
    const balance = await token.balanceOf(deployment.contracts.MemeRouletteLuckyBox);
    console.log(`${tokenInfo.symbol} in Lucky Box:`, ethers.formatUnits(balance, 6));
  }

  console.log("\n✅ Setup completed!");
  console.log("\n🎮 Ready to play! Users can now:");
  console.log("1. Approve 1 USDT to the Lucky Box");
  console.log("2. Call spin() to play");
  console.log("3. Win random tokens from the pool!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
