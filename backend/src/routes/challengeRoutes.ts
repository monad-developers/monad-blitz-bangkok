import { Router } from 'express';

const router = Router();

// Get all challenges
router.get('/', (req: any, res: any) => {
  res.json({ challenges: [] });
});

// Get challenge by ID
router.get('/:id', (req: any, res: any) => {
  res.json({ challenge: null });
});

export { router as challengeRoutes };