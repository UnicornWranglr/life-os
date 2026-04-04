import { Router, Response, NextFunction } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { areas } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/areas
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.select().from(areas).where(eq(areas.userId, req.userId!));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/areas
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, type, focusBudgetPct, color, weekdaysOnly } = req.body;
    if (!name || !type || !color) {
      res.status(400).json({ error: 'name, type, and color are required' });
      return;
    }

    const [created] = await db
      .insert(areas)
      .values({ userId: req.userId!, name, type, focusBudgetPct, color, weekdaysOnly })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/areas/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, type, focusBudgetPct, color, weekdaysOnly } = req.body;

    const [updated] = await db
      .update(areas)
      .set({ name, type, focusBudgetPct, color, weekdaysOnly })
      .where(and(eq(areas.id, req.params.id), eq(areas.userId, req.userId!)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Area not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/areas/:id/status
router.patch('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    const [updated] = await db
      .update(areas)
      .set({ status })
      .where(and(eq(areas.id, req.params.id), eq(areas.userId, req.userId!)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Area not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
