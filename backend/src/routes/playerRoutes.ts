import { Router } from 'express';

const router = Router();

// Get player profile
router.get('/:address', (req: any, res: any) => {
  res.json({ player: null });
});

// Update player profile
router.put('/:address', (req: any, res: any) => {
  res.json({ success: true });
});

export { router as playerRoutes };