import { Router } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { dailyLogs } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/daily-logs/:date  — returns the log for a specific date (or null)
router.get('/:date', async (req: AuthRequest, res, next) => {
  try {
    const [row] = await db
      .select()
      .from(dailyLogs)
      .where(and(
        eq(dailyLogs.userId, req.userId!),
        eq(dailyLogs.logDate, req.params.date),
      ));

    res.json(row ?? null);
  } catch (err) {
    next(err);
  }
});

// POST /api/daily-logs
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { logDate, wakeTime, sleepTarget, cookedDinner, workBlockDone, tomorrowOneThing } = req.body;
    if (!logDate) {
      res.status(400).json({ error: 'logDate is required' });
      return;
    }

    // One log per user per day — reject duplicate
    const [existing] = await db
      .select()
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, req.userId!), eq(dailyLogs.logDate, logDate)));

    if (existing) {
      res.status(409).json({ error: 'A log for this date already exists. Use PUT to update it.' });
      return;
    }

    const [created] = await db
      .insert(dailyLogs)
      .values({ userId: req.userId!, logDate, wakeTime, sleepTarget, cookedDinner, workBlockDone, tomorrowOneThing })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/daily-logs/:date  — update (or upsert) a log for a given date
router.put('/:date', async (req: AuthRequest, res, next) => {
  try {
    const { wakeTime, sleepTarget, cookedDinner, workBlockDone, tomorrowOneThing } = req.body;
    const logDate = req.params.date;

    const [existing] = await db
      .select()
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, req.userId!), eq(dailyLogs.logDate, logDate)));

    if (existing) {
      const [updated] = await db
        .update(dailyLogs)
        .set({ wakeTime, sleepTarget, cookedDinner, workBlockDone, tomorrowOneThing })
        .where(and(eq(dailyLogs.userId, req.userId!), eq(dailyLogs.logDate, logDate)))
        .returning();
      res.json(updated);
    } else {
      const [created] = await db
        .insert(dailyLogs)
        .values({ userId: req.userId!, logDate, wakeTime, sleepTarget, cookedDinner, workBlockDone, tomorrowOneThing })
        .returning();
      res.status(201).json(created);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
