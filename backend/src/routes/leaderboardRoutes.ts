import { Router } from 'express';

const router = Router();

// Get leaderboard
router.get('/', (req: any, res: any) => {
  res.json({ leaderboard: [] });
});

export { router as leaderboardRoutes };