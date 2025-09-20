import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Monad Code Arena contracts...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", await ethers.provider.getBalance(deployer.address));

  // Deploy GameToken
  console.log("\n1. Deploying GameToken...");
  const GameTokenFactory = await ethers.getContractFactory("GameToken");
  const gameToken = await GameTokenFactory.deploy();
  await gameToken.waitForDeployment();
  const gameTokenAddress = await gameToken.getAddress();
  console.log("GameToken deployed to:", gameTokenAddress);

  // Deploy Arena (using deployer as initial oracle for now)
  console.log("\n2. Deploying Arena...");
  const ArenaFactory = await ethers.getContractFactory("Arena");
  // Use deployer address as initial mempool address - can be updated later
  const arena = await ArenaFactory.deploy(gameTokenAddress, deployer.address, deployer.address);
  await arena.waitForDeployment();
  const arenaAddress = await arena.getAddress();
  console.log("Arena deployed to:", arenaAddress);

  // Deploy Badges
  console.log("\n3. Deploying Badges...");
  const BadgesFactory = await ethers.getContractFactory("Badges");
  const badges = await BadgesFactory.deploy("https://api.monadarena.com/badges/");
  await badges.waitForDeployment();
  const badgesAddress = await badges.getAddress();
  console.log("Badges deployed to:", badgesAddress);

  // Setup permissions
  console.log("\n4. Setting up permissions...");
  
  // Add Arena as minter for GameToken
  console.log("Adding Arena as GameToken minter...");
  await gameToken.addMinter(arenaAddress);
  
  // Add Arena as minter for Badges
  console.log("Adding Arena as Badges minter...");
  await badges.addMinter(arenaAddress);

  console.log("\n✅ Deployment completed successfully!");
  console.log("\nContract Addresses:");
  console.log("==================");
  console.log(`GameToken: ${gameTokenAddress}`);
  console.log(`Arena: ${arenaAddress}`);
  console.log(`Badges: ${badgesAddress}`);
  console.log(`Oracle: ${deployer.address}`);
  console.log(`Mempool: ${deployer.address}`);

  console.log("\nNext steps:");
  console.log("1. Update .env file with deployed contract addresses");
  console.log("2. Configure oracle service with the oracle private key");
  console.log("3. Set up a dedicated mempool address for entry fees (optional)");
  console.log("4. Start the backend service");
  console.log("5. Launch the frontend application");

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    gameToken: gameTokenAddress,
    arena: arenaAddress,
    badges: badgesAddress,
    oracle: deployer.address,
    mempool: deployer.address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  console.log("\nDeployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });