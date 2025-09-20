import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the betting contracts (BetFactory and BetMarket)
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployBettingContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying Betting Contracts...");

  // Deploy BetFactory contract
  await deploy("BetFactory", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Get the deployed contracts
  const betFactory = await hre.ethers.getContract<Contract>("BetFactory", deployer);

  console.log("✅ BetFactory deployed at:", await betFactory.getAddress());
  console.log("📊 Contract balance:", (await betFactory.getContractBalance()).toString());
};

export default deployBettingContracts;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags BettingContracts
deployBettingContracts.tags = ["BettingContracts"];
