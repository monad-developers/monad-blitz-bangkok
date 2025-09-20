import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { Database } from '../database/Database';
import { ChallengeService } from '../services/ChallengeService';
import { JudgeService } from '../services/JudgeService';
import { BlockchainService } from '../services/BlockchainService';

const router = Router();

// Get all available matches
router.get('/', asyncHandler(async (req: any, res: any) => {
  const database: Database = req.app.locals.database;
  
  // This would get matches from database
  // For now, return empty array
  res.json({
    matches: [],
    total: 0
  });
}));

// Create a new match
router.post('/create', asyncHandler(async (req: any, res: any) => {
  const { mode, stakeAmount, difficulty, timeLimit } = req.body;
  const { player } = req.user || { player: '0x123...' }; // Would come from auth middleware
  
  const database: Database = req.app.locals.database;
  const challengeService: ChallengeService = req.app.locals.challenges;
  const blockchain: BlockchainService = req.app.locals.blockchain;

  if (!mode || !stakeAmount) {
    throw createError('Missing required fields: mode, stakeAmount', 400);
  }

  // Get random challenge
  const challenge = challengeService.getRandomChallenge(difficulty, mode);
  if (!challenge) {
    throw createError('No suitable challenge found', 404);
  }

  // Create challenge hash
  const challengeHash = challengeService.getChallengeHash(challenge);

  // For now, just return the match details
  // In full implementation, this would call blockchain
  const matchId = `match_${Date.now()}`;
  
  res.json({
    matchId,
    challenge: {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      timeLimit: challenge.timeLimit,
      testCases: challengeService.getVisibleTestCases(challenge)
    },
    challengeHash,
    creator: player,
    mode,
    stakeAmount,
    timeLimit: timeLimit || challenge.timeLimit,
    status: 'CREATED'
  });
}));

// Join a match
router.post('/:matchId/join', asyncHandler(async (req: any, res: any) => {
  const { matchId } = req.params;
  const { player } = req.user || { player: '0x456...' };
  
  const database: Database = req.app.locals.database;
  const blockchain: BlockchainService = req.app.locals.blockchain;

  // Get match from database
  const match = await database.getMatch(matchId);
  if (!match) {
    throw createError('Match not found', 404);
  }

  if (match.opponent) {
    throw createError('Match already has an opponent', 400);
  }

  if (match.creator === player) {
    throw createError('Cannot join your own match', 400);
  }

  // For now, just return success
  res.json({
    success: true,
    matchId,
    message: 'Successfully joined match'
  });
}));

// Submit solution
router.post('/:matchId/submit', asyncHandler(async (req: any, res: any) => {
  const { matchId } = req.params;
  const { code, language } = req.body;
  const { player } = req.user || { player: '0x123...' };

  if (!code || !language) {
    throw createError('Missing code or language', 400);
  }

  const database: Database = req.app.locals.database;
  const challengeService: ChallengeService = req.app.locals.challenges;
  const judgeService: JudgeService = req.app.locals.judge;

  // Get match
  const match = await database.getMatch(matchId);
  if (!match) {
    throw createError('Match not found', 404);
  }

  // Get challenge
  const challenge = challengeService.getChallengeById(match.challengeHash);
  if (!challenge) {
    throw createError('Challenge not found', 404);
  }

  // Save submission
  await database.saveSubmission(matchId, player, code, language);

  res.json({
    success: true,
    message: 'Solution submitted successfully',
    submittedAt: new Date().toISOString()
  });
}));

// Get match details
router.get('/:matchId', asyncHandler(async (req: any, res: any) => {
  const { matchId } = req.params;
  
  const database: Database = req.app.locals.database;
  const challengeService: ChallengeService = req.app.locals.challenges;

  const match = await database.getMatch(matchId);
  if (!match) {
    throw createError('Match not found', 404);
  }

  // Get challenge details
  const challenge = challengeService.getChallengeById(match.challengeHash);
  
  res.json({
    match,
    challenge: challenge ? {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      timeLimit: challenge.timeLimit,
      testCases: challengeService.getVisibleTestCases(challenge)
    } : null
  });
}));

export { router as matchRoutes };