import { Router } from 'express';
import { and, eq, gte, lte, desc } from 'drizzle-orm';
import { db } from '../db';
import { sessions } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';
import { todayString } from '../utils/scheduleEngine';

const router = Router();
router.use(authenticate);

// GET /api/sessions/recent  — last 14 days, all areas
// Must be declared before /:id to avoid "recent" matching as an id param.
router.get('/recent', async (req: AuthRequest, res, next) => {
  try {
    const today = todayString();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const from = twoWeeksAgo.toISOString().slice(0, 10);

    const result = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.userId, req.userId!),
        gte(sessions.sessionDate, from),
        lte(sessions.sessionDate, today),
      ))
      .orderBy(desc(sessions.sessionDate));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions?areaId=&from=&to=
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { areaId, from, to } = req.query;

    const conditions = [eq(sessions.userId, req.userId!)];
    if (areaId) conditions.push(eq(sessions.areaId, areaId as string));
    if (from)   conditions.push(gte(sessions.sessionDate, from as string));
    if (to)     conditions.push(lte(sessions.sessionDate, to as string));

    const result = await db
      .select()
      .from(sessions)
      .where(and(...conditions))
      .orderBy(desc(sessions.sessionDate));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const {
      areaId, sessionDate, plannedOutcome, actualOutcome,
      completed, energyOut, durationMins, blockers,
    } = req.body;

    if (!areaId || !sessionDate) {
      res.status(400).json({ error: 'areaId and sessionDate are required' });
      return;
    }

    const [created] = await db
      .insert(sessions)
      .values({
        userId: req.userId!, areaId, sessionDate, plannedOutcome,
        actualOutcome, completed, energyOut, durationMins, blockers,
      })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/sessions/:id
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const {
      areaId, sessionDate, plannedOutcome, actualOutcome,
      completed, energyOut, durationMins, blockers,
    } = req.body;

    const [updated] = await db
      .update(sessions)
      .set({ areaId, sessionDate, plannedOutcome, actualOutcome, completed, energyOut, durationMins, blockers })
      .where(and(eq(sessions.id, req.params.id), eq(sessions.userId, req.userId!)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sessions/:id
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const [deleted] = await db
      .delete(sessions)
      .where(and(eq(sessions.id, req.params.id), eq(sessions.userId, req.userId!)))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
