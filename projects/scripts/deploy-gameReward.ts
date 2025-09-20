// scripts/deploy-gamereward.ts
import { ethers } from "hardhat";

async function main() {
  const DIAMOND = process.env.DIAMOND as string; // address โทเค็น Diamond
  if (!DIAMOND) throw new Error("Please set env DIAMOND=<diamond_erc20_address>");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());

  const GameReward = await ethers.getContractFactory("GameReward");
  const gameReward = await GameReward.deploy(DIAMOND);
  await gameReward.deployed();

  console.log("GameReward deployed at:", gameReward.address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});