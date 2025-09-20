import { ethers } from 'ethers';
import { logger } from '../utils/logger';

// Import contract ABIs (these would be generated from the contracts)
const GameTokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const ArenaABI = [
  "function createMatch(uint8 mode, uint256 stakeAmount, bytes32 challengeHash, uint256 timeLimit) returns (bytes32)",
  "function joinMatch(bytes32 matchId) payable",
  "function resolveMatch(bytes32 matchId, address winner, bytes calldata signature)",
  "function getMatch(bytes32 matchId) view returns (tuple(bytes32 id, address creator, address opponent, uint8 mode, uint256 stakeAmount, bytes32 challengeHash, uint8 status, address winner, uint256 createdAt, uint256 resolvedAt, uint256 timeLimit))",
  "function cancelMatch(bytes32 matchId)",
  "function getEntryFee() view returns (uint256)",
  "function getMempool() view returns (address)",
  "function updateMempool(address newMempool)",
  "event MatchCreated(bytes32 indexed matchId, address indexed creator, uint8 mode, uint256 stakeAmount, bytes32 challengeHash)",
  "event MatchJoined(bytes32 indexed matchId, address indexed opponent)",
  "event MatchResolved(bytes32 indexed matchId, address indexed winner, address indexed loser, uint256 payout)",
  "event EntryFeePaid(address indexed player, bytes32 indexed matchId, uint256 amount)"
];

const BadgesABI = [
  "function mintBadge(address player, uint256 badgeId)",
  "function mintBadgesBatch(address player, uint256[] calldata badgeIds)",
  "function hasBadge(address player, uint256 badgeId) view returns (bool)",
  "function getPlayerBadges(address player) view returns (uint256[])",
  "function getBadgeInfo(uint256 badgeId) view returns (tuple(string name, string description, string imageUri, uint8 rarity, bool exists, uint256 totalMinted, uint256 maxSupply))"
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private gameToken: ethers.Contract;
  private arena: ethers.Contract;
  private badges: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.MONAD_TESTNET_RPC_URL;
    const privateKey = process.env.ORACLE_PRIVATE_KEY;

    if (!rpcUrl) {
      throw new Error('Missing MONAD_TESTNET_RPC_URL in environment variables');
    }

    if (!privateKey) {
      throw new Error('Missing ORACLE_PRIVATE_KEY in environment variables');
    }

    // Check for placeholder values
    if (privateKey.includes('your_') || privateKey.includes('_here')) {
      throw new Error('ORACLE_PRIVATE_KEY contains placeholder value. Please set a real private key in your .env file.');
    }

    // Validate private key format
    const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    if (cleanPrivateKey.length !== 64 || !/^[a-fA-F0-9]{64}$/.test(cleanPrivateKey)) {
      throw new Error('ORACLE_PRIVATE_KEY must be a valid 64-character hexadecimal string');
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      logger.info('Blockchain service initialized', {
        oracleAddress: this.wallet.address,
        network: rpcUrl
      });
    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      throw new Error(`Invalid private key format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async initialize(): Promise<void> {
    try {
      // Check connection
      const network = await this.provider.getNetwork();
      logger.info('Connected to blockchain network:', {
        name: network.name,
        chainId: network.chainId.toString()
      });

      // Initialize contracts (if addresses are available)
      const gameTokenAddress = process.env.GAME_TOKEN_ADDRESS;
      const arenaAddress = process.env.ARENA_CONTRACT_ADDRESS;
      const badgesAddress = process.env.BADGES_CONTRACT_ADDRESS;

      if (!gameTokenAddress || !arenaAddress || !badgesAddress) {
        logger.warn('Contract addresses not found in environment. Running in limited mode.');
        logger.warn('To enable full blockchain functionality:');
        logger.warn('1. Deploy contracts with: cd contracts && npm run deploy:testnet');
        logger.warn('2. Update .env with the deployed contract addresses');
        return;
      }

      // Check for placeholder values
      if (gameTokenAddress.includes('your_') || arenaAddress.includes('your_') || badgesAddress.includes('your_')) {
        logger.warn('Contract addresses contain placeholder values. Please deploy contracts and update .env file.');
        return;
      }

      this.gameToken = new ethers.Contract(gameTokenAddress, GameTokenABI, this.wallet);
      this.arena = new ethers.Contract(arenaAddress, ArenaABI, this.wallet);
      this.badges = new ethers.Contract(badgesAddress, BadgesABI, this.wallet);

      logger.info('Contracts initialized:', {
        gameToken: gameTokenAddress,
        arena: arenaAddress,
        badges: badgesAddress
      });

      // Start listening for events
      this.setupEventListeners();

    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.arena) {
      logger.warn('Arena contract not initialized, skipping event listeners');
      return;
    }

    // Listen for match events
    this.arena.on('MatchCreated', (matchId, creator, mode, stakeAmount, challengeHash, event) => {
      logger.info('Match created on-chain:', {
        matchId,
        creator,
        mode: mode.toString(),
        stakeAmount: stakeAmount.toString(),
        challengeHash,
        blockNumber: event.blockNumber
      });
    });

    this.arena.on('MatchJoined', (matchId, opponent, event) => {
      logger.info('Match joined on-chain:', {
        matchId,
        opponent,
        blockNumber: event.blockNumber
      });
    });

    this.arena.on('MatchResolved', (matchId, winner, loser, payout, event) => {
      logger.info('Match resolved on-chain:', {
        matchId,
        winner,
        loser,
        payout: payout.toString(),
        blockNumber: event.blockNumber
      });
    });

    this.arena.on('EntryFeePaid', (player, matchId, amount, event) => {
      logger.info('Entry fee paid on-chain:', {
        player,
        matchId,
        amount: amount.toString(),
        blockNumber: event.blockNumber
      });
    });

    logger.info('Event listeners set up for Arena contract');
  }

  async getMatchFromChain(matchId: string): Promise<any> {
    if (!this.arena) {
      throw new Error('Arena contract not initialized. Please deploy contracts first.');
    }

    try {
      const match = await this.arena.getMatch(matchId);
      return {
        id: match.id,
        creator: match.creator,
        opponent: match.opponent,
        mode: match.mode,
        stakeAmount: match.stakeAmount.toString(),
        challengeHash: match.challengeHash,
        status: match.status,
        winner: match.winner,
        createdAt: Number(match.createdAt),
        resolvedAt: Number(match.resolvedAt),
        timeLimit: Number(match.timeLimit)
      };
    } catch (error) {
      logger.error('Error fetching match from chain:', { matchId, error });
      throw error;
    }
  }

  async resolveMatch(matchId: string, winner: string): Promise<string> {
    if (!this.arena) {
      throw new Error('Arena contract not initialized. Please deploy contracts first.');
    }

    try {
      // Create message hash for signature
      const messageHash = ethers.solidityPackedKeccak256(
        ['bytes32', 'address'],
        [matchId, winner]
      );

      // Sign the message
      const signature = await this.wallet.signMessage(ethers.getBytes(messageHash));

      // Submit resolution to contract
      const tx = await this.arena.resolveMatch(matchId, winner, signature);
      await tx.wait();

      logger.info('Match resolved on blockchain:', {
        matchId,
        winner,
        txHash: tx.hash
      });

      return tx.hash;
    } catch (error) {
      logger.error('Error resolving match on blockchain:', { matchId, winner, error });
      throw error;
    }
  }

  async mintBadge(playerAddress: string, badgeId: number): Promise<string> {
    if (!this.badges) {
      logger.warn('Badges contract not initialized. Badge minting skipped.');
      return '';
    }

    try {
      // Check if player already has the badge
      const hasBadge = await this.badges.hasBadge(playerAddress, badgeId);
      if (hasBadge) {
        logger.warn('Player already has badge:', { playerAddress, badgeId });
        return '';
      }

      const tx = await this.badges.mintBadge(playerAddress, badgeId);
      await tx.wait();

      logger.info('Badge minted:', {
        playerAddress,
        badgeId,
        txHash: tx.hash
      });

      return tx.hash;
    } catch (error) {
      logger.error('Error minting badge:', { playerAddress, badgeId, error });
      throw error;
    }
  }

  async getPlayerBadges(playerAddress: string): Promise<number[]> {
    if (!this.badges) {
      logger.warn('Badges contract not initialized. Returning empty badges list.');
      return [];
    }

    try {
      const badges = await this.badges.getPlayerBadges(playerAddress);
      return badges.map((badge: any) => Number(badge));
    } catch (error) {
      logger.error('Error fetching player badges:', { playerAddress, error });
      throw error;
    }
  }

  async getPlayerBalance(playerAddress: string): Promise<string> {
    if (!this.gameToken) {
      logger.warn('GameToken contract not initialized. Returning 0 balance.');
      return '0';
    }

    try {
      const balance = await this.gameToken.balanceOf(playerAddress);
      return balance.toString();
    } catch (error) {
      logger.error('Error fetching player balance:', { playerAddress, error });
      throw error;
    }
  }

  async checkPlayerAllowance(playerAddress: string): Promise<string> {
    if (!this.gameToken || !this.arena) {
      logger.warn('Contracts not initialized. Returning 0 allowance.');
      return '0';
    }

    try {
      const allowance = await this.gameToken.allowance(
        playerAddress,
        await this.arena.getAddress()
      );
      return allowance.toString();
    } catch (error) {
      logger.error('Error checking player allowance:', { playerAddress, error });
      throw error;
    }
  }

  isConnected(): boolean {
    return this.provider !== null && this.wallet !== null;
  }

  areContractsInitialized(): boolean {
    return this.gameToken !== null && this.arena !== null && this.badges !== null;
  }

  getOracleAddress(): string {
    return this.wallet.address;
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async estimateGas(to: string, data: string): Promise<string> {
    try {
      const gasEstimate = await this.provider.estimateGas({ to, data });
      return gasEstimate.toString();
    } catch (error) {
      logger.error('Error estimating gas:', { to, data, error });
      throw error;
    }
  }

  async getEntryFee(): Promise<string> {
    if (!this.arena) {
      logger.warn('Arena contract not initialized. Returning default entry fee.');
      return '25000000000000000'; // 0.025 ETH in wei
    }

    try {
      const entryFee = await this.arena.getEntryFee();
      return entryFee.toString();
    } catch (error) {
      logger.error('Error fetching entry fee:', error);
      throw error;
    }
  }

  async getMempoolAddress(): Promise<string> {
    if (!this.arena) {
      logger.warn('Arena contract not initialized. Returning zero address.');
      return '0x0000000000000000000000000000000000000000';
    }

    try {
      const mempool = await this.arena.getMempool();
      return mempool;
    } catch (error) {
      logger.error('Error fetching mempool address:', error);
      throw error;
    }
  }
}