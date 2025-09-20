import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const owner  = process.env.OWNER  ?? (await deployer.getAddress());
  const server = process.env.SERVER ?? owner;
  const baseURI = process.env.DICER_BASE_URI!;
  if (!baseURI || !baseURI.endsWith("/")) throw new Error("DICER_BASE_URI must end with '/'");

  console.log("Deploying with:", await deployer.getAddress());

  // Diamond (ERC20)
  const Diamond = await ethers.getContractFactory("Diamond");
  const diamond = await Diamond.deploy(owner);
  await diamond.deployed();

  // GameAssets (NFT vault/controller side)
  const GameAssets = await ethers.getContractFactory("GameAssets");
  const gameAssets = await GameAssets.deploy(owner);
  await gameAssets.deployed();

  // GameBank (vault)
  const GameBank = await ethers.getContractFactory("GameBank");
  const gameBank = await GameBank.deploy(owner);
  await gameBank.deployed();

  // Dicer (ERC721)
  const Dicer = await ethers.getContractFactory("Dicer");
  const dicer = await Dicer.deploy(owner, baseURI);
  await dicer.deployed();

  // GameAssetManager (wires assets/bank ops)
  const GameAssetManager = await ethers.getContractFactory("GameAssetManager");
  const assetManager = await GameAssetManager.deploy(
    owner, diamond.address, gameAssets.address, gameBank.address
  );
  await assetManager.deployed();

  // GameLogic (pays rewards from bank)
  const GameLogic = await ethers.getContractFactory("GameLogic");
  const gameLogic = await GameLogic.deploy(owner, diamond.address, gameBank.address, server);
  await gameLogic.deployed();

  // Wire permissions (สำคัญ)
  await (await gameAssets.setManager(assetManager.address)).wait();
  await (await gameBank.setManager(gameLogic.address)).wait();

  // ── ถ้า GameReward ต้องเป็น manager ของ GameBank ด้วย ให้ปลดคอมเมนต์บรรทัดล่างนี้ ──
  // await (await gameBank.setManager(gameReward.address)).wait();

  console.log("Diamond         :", diamond.address);
  console.log("GameAssets      :", gameAssets.address);
  console.log("GameBank        :", gameBank.address);
  console.log("Dicer           :", dicer.address);
  console.log("GameAssetManager:", assetManager.address);
  console.log("GameLogic       :", gameLogic.address);

  // Quick sanity checks (optional)
  const readBankMgr = await (await ethers.getContractAt("GameBank", gameBank.address)).manager();
  console.log("GameBank.manager:", readBankMgr);
}

main().catch((e) => { console.error(e); process.exit(1); });