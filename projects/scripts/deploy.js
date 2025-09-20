const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment of MemeRoulette Lucky Box...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy MockUSDT first
  console.log("\n📄 Deploying MockUSDT...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy(deployer.address);
  await mockUSDT.waitForDeployment();
  const usdtAddress = await mockUSDT.getAddress();
  console.log("MockUSDT deployed to:", usdtAddress);

  // Deploy MockRefiller
  console.log("\n🔄 Deploying MockRefiller...");
  const MockRefiller = await ethers.getContractFactory("MockRefiller");
  const mockRefiller = await MockRefiller.deploy(deployer.address);
  await mockRefiller.waitForDeployment();
  const refillerAddress = await mockRefiller.getAddress();
  console.log("MockRefiller deployed to:", refillerAddress);

  // Deploy MemeRouletteLuckyBox
  console.log("\n🎰 Deploying MemeRouletteLuckyBox...");
  const MemeRouletteLuckyBox = await ethers.getContractFactory("MemeRouletteLuckyBox");
  const luckyBox = await MemeRouletteLuckyBox.deploy(deployer.address, usdtAddress, deployer.address);
  await luckyBox.waitForDeployment();
  const luckyBoxAddress = await luckyBox.getAddress();
  console.log("MemeRouletteLuckyBox deployed to:", luckyBoxAddress);

  // Set refiller in lucky box
  console.log("\n⚙️  Configuring Lucky Box...");
  await luckyBox.setRefiller(refillerAddress);
  console.log("Refiller set to:", refillerAddress);

  // Create mock tokens for the pool (10 tokens)
  console.log("\n🪙 Creating mock tokens for pool...");
  const MockToken = await ethers.getContractFactory("MockUSDT");
  const tokenAddresses = [];
  const tokenSymbols = ["BTC", "ETH", "XRP", "BNB", "SOL", "DOGE", "ADA", "TRX", "HYPE", "LINK"];
  
  for (let i = 0; i < 10; i++) {
    const token = await MockToken.deploy(deployer.address);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    tokenAddresses.push(tokenAddress);
    console.log(`${tokenSymbols[i]} token deployed to:`, tokenAddress);
  }

  // Configure pool with mock amounts (1 token per piece for simplicity)
  console.log("\n🎯 Configuring pool...");
  const slotAmounts = new Array(10).fill(ethers.parseUnits("1", 6)); // 1 token per piece
  await luckyBox.configurePool(tokenAddresses, slotAmounts);
  console.log("Pool configured with 10 tokens");

  // Fund the refiller with tokens
  console.log("\n💰 Funding refiller with tokens...");
  for (let i = 0; i < tokenAddresses.length; i++) {
    const token = await ethers.getContractAt("MockUSDT", tokenAddresses[i]);
    const amount = ethers.parseUnits("100", 6); // 100 tokens per type
    await token.transfer(refillerAddress, amount);
    console.log(`Funded refiller with 100 ${tokenSymbols[i]}`);
  }

  // Fund the refiller with USDT
  const usdtAmount = ethers.parseUnits("1000", 6); // 1000 USDT
  await mockUSDT.transfer(refillerAddress, usdtAmount);
  console.log("Funded refiller with 1000 USDT");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      MockUSDT: usdtAddress,
      MockRefiller: refillerAddress,
      MemeRouletteLuckyBox: luckyBoxAddress,
      tokens: tokenAddresses.map((addr, i) => ({
        address: addr,
        symbol: tokenSymbols[i]
      }))
    },
    timestamp: new Date().toISOString()
  };

  const deploymentPath = path.join(__dirname, "..", "deployments", `${hre.network.name}.json`);
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("MockUSDT:", usdtAddress);
  console.log("MockRefiller:", refillerAddress);
  console.log("MemeRouletteLuckyBox:", luckyBoxAddress);
  console.log("\n🪙 Token Addresses:");
  tokenAddresses.forEach((addr, i) => {
    console.log(`${tokenSymbols[i]}:`, addr);
  });

  console.log("\n📄 Deployment info saved to:", deploymentPath);
  
  // Verify contracts if on testnet/mainnet
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Verifying contracts...");
    try {
      await hre.run("verify:verify", {
        address: usdtAddress,
        constructorArguments: [deployer.address],
      });
      console.log("MockUSDT verified");
    } catch (error) {
      console.log("MockUSDT verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: refillerAddress,
        constructorArguments: [deployer.address],
      });
      console.log("MockRefiller verified");
    } catch (error) {
      console.log("MockRefiller verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: luckyBoxAddress,
        constructorArguments: [deployer.address, usdtAddress, deployer.address],
      });
      console.log("MemeRouletteLuckyBox verified");
    } catch (error) {
      console.log("MemeRouletteLuckyBox verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
