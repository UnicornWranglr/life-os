import { Router } from 'express';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { weeklyReviews } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/reviews
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const result = await db
      .select()
      .from(weeklyReviews)
      .where(eq(weeklyReviews.userId, req.userId!))
      .orderBy(desc(weeklyReviews.weekStart));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/reviews/:weekStart  — e.g. /reviews/2026-03-30
router.get('/:weekStart', async (req: AuthRequest, res, next) => {
  try {
    const [row] = await db
      .select()
      .from(weeklyReviews)
      .where(and(
        eq(weeklyReviews.userId, req.userId!),
        eq(weeklyReviews.weekStart, req.params.weekStart),
      ));
    res.json(row ?? null);
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { weekStart, wins, blockers, focusAreaNextWeek, notes } = req.body;
    if (!weekStart) {
      res.status(400).json({ error: 'weekStart is required' });
      return;
    }

    const [existing] = await db
      .select()
      .from(weeklyReviews)
      .where(and(
        eq(weeklyReviews.userId, req.userId!),
        eq(weeklyReviews.weekStart, weekStart),
      ));

    if (existing) {
      res.status(409).json({ error: 'Review for this week already exists. Use PUT to update.' });
      return;
    }

    const [created] = await db
      .insert(weeklyReviews)
      .values({ userId: req.userId!, weekStart, wins, blockers, focusAreaNextWeek, notes })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/reviews/:weekStart
router.put('/:weekStart', async (req: AuthRequest, res, next) => {
  try {
    const { wins, blockers, focusAreaNextWeek, notes } = req.body;

    const [existing] = await db
      .select()
      .from(weeklyReviews)
      .where(and(
        eq(weeklyReviews.userId, req.userId!),
        eq(weeklyReviews.weekStart, req.params.weekStart),
      ));

    if (existing) {
      const [updated] = await db
        .update(weeklyReviews)
        .set({ wins, blockers, focusAreaNextWeek, notes })
        .where(eq(weeklyReviews.id, existing.id))
        .returning();
      res.json(updated);
    } else {
      const [created] = await db
        .insert(weeklyReviews)
        .values({
          userId: req.userId!,
          weekStart: req.params.weekStart,
          wins, blockers, focusAreaNextWeek, notes,
        })
        .returning();
      res.status(201).json(created);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
