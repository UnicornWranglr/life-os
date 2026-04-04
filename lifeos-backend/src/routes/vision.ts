import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { vision } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/vision
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const [row] = await db.select().from(vision).where(eq(vision.userId, req.userId!));
    res.json(row ?? null);
  } catch (err) {
    next(err);
  }
});

// PUT /api/vision  — upsert (create on first call, update thereafter)
router.put('/', async (req: AuthRequest, res, next) => {
  try {
    const { statement } = req.body;
    if (!statement) {
      res.status(400).json({ error: 'statement is required' });
      return;
    }

    const [existing] = await db.select().from(vision).where(eq(vision.userId, req.userId!));

    if (existing) {
      const [updated] = await db
        .update(vision)
        .set({ statement, updatedAt: new Date() })
        .where(eq(vision.userId, req.userId!))
        .returning();
      res.json(updated);
    } else {
      const [created] = await db
        .insert(vision)
        .values({ userId: req.userId!, statement })
        .returning();
      res.status(201).json(created);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
