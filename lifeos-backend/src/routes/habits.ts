import { Router, Response, NextFunction } from 'express';
import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { habits, habitLogs } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ── Habit log sub-routes (/logs/*) must come before /:id ─────────────────

// GET /api/habits/logs?from=&to=
router.get('/logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;

    const conditions = [eq(habitLogs.userId, req.userId!)];
    if (from) conditions.push(gte(habitLogs.logDate, from as string));
    if (to)   conditions.push(lte(habitLogs.logDate, to as string));

    const result = await db.select().from(habitLogs).where(and(...conditions));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/habits/logs  — upsert: one log per habit per day
router.post('/logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { habitId, logDate, completed } = req.body;
    if (!habitId || !logDate) {
      res.status(400).json({ error: 'habitId and logDate are required' });
      return;
    }

    const [existing] = await db
      .select()
      .from(habitLogs)
      .where(and(
        eq(habitLogs.habitId, habitId),
        eq(habitLogs.logDate, logDate),
        eq(habitLogs.userId, req.userId!),
      ));

    if (existing) {
      const [updated] = await db
        .update(habitLogs)
        .set({ completed })
        .where(eq(habitLogs.id, existing.id))
        .returning();
      res.json(updated);
    } else {
      const [created] = await db
        .insert(habitLogs)
        .values({ habitId, logDate, completed, userId: req.userId! })
        .returning();
      res.status(201).json(created);
    }
  } catch (err) {
    next(err);
  }
});

// PUT /api/habits/logs/:id
router.put('/logs/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { completed } = req.body;

    const [updated] = await db
      .update(habitLogs)
      .set({ completed })
      .where(and(eq(habitLogs.id, req.params.id), eq(habitLogs.userId, req.userId!)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Habit log not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── Habit definition routes ───────────────────────────────────────────────

// GET /api/habits
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.select().from(habits).where(eq(habits.userId, req.userId!));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/habits
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, areaId } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const [created] = await db
      .insert(habits)
      .values({ userId: req.userId!, name, areaId })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/habits/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, areaId, active } = req.body;

    const [updated] = await db
      .update(habits)
      .set({ name, areaId, active })
      .where(and(eq(habits.id, req.params.id), eq(habits.userId, req.userId!)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
