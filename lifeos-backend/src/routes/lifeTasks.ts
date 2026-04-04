import { Router } from 'express';
import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { lifeTasks, lifeTaskLogs } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getTasksDueOn,
  getWeeklyFloatingTasks,
  getMondayOf,
  todayString,
} from '../utils/scheduleEngine';

const router = Router();
router.use(authenticate);

// ── Life task log sub-routes (/logs/*, /today) must come before /:id ─────

// GET /api/life-tasks/today
// Runs the schedule engine and returns { due, weekly, completed }
router.get('/today', async (req: AuthRequest, res, next) => {
  try {
    const today = todayString();
    const now = new Date();

    // All active task definitions for this user
    const allTasks = await db
      .select()
      .from(lifeTasks)
      .where(and(eq(lifeTasks.userId, req.userId!), eq(lifeTasks.active, true)));

    // Today's completed logs (recurring tasks, not one-offs)
    const todayLogs = await db
      .select()
      .from(lifeTaskLogs)
      .where(and(
        eq(lifeTaskLogs.userId, req.userId!),
        eq(lifeTaskLogs.logDate, today),
      ));

    const completedTodayIds = new Set(
      todayLogs.filter(l => !l.isOneoff && l.taskId).map(l => l.taskId!),
    );

    // Run schedule engine
    const dueTasks = getTasksDueOn(allTasks, now);
    const weeklyTasks = getWeeklyFloatingTasks(allTasks);

    // For weekly_floating: check completed any time this week (Mon–today)
    const monday = getMondayOf(now);
    const weekLogs = await db
      .select()
      .from(lifeTaskLogs)
      .where(and(
        eq(lifeTaskLogs.userId, req.userId!),
        gte(lifeTaskLogs.logDate, monday),
        lte(lifeTaskLogs.logDate, today),
        eq(lifeTaskLogs.isOneoff, false),
      ));
    const completedThisWeekIds = new Set(weekLogs.filter(l => l.taskId).map(l => l.taskId!));

    res.json({
      due:      dueTasks.filter(t => !completedTodayIds.has(t.id)),
      weekly:   weeklyTasks.filter(t => !completedThisWeekIds.has(t.id)),
      completed: todayLogs,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/life-tasks/logs?from=&to=
router.get('/logs', async (req: AuthRequest, res, next) => {
  try {
    const { from, to } = req.query;

    const conditions = [eq(lifeTaskLogs.userId, req.userId!)];
    if (from) conditions.push(gte(lifeTaskLogs.logDate, from as string));
    if (to)   conditions.push(lte(lifeTaskLogs.logDate, to as string));

    const result = await db.select().from(lifeTaskLogs).where(and(...conditions));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/life-tasks/logs  — tick off a task (recurring or one-off)
router.post('/logs', async (req: AuthRequest, res, next) => {
  try {
    const { taskId, logDate, note, isOneoff } = req.body;
    if (!logDate) {
      res.status(400).json({ error: 'logDate is required' });
      return;
    }
    if (!isOneoff && !taskId) {
      res.status(400).json({ error: 'taskId is required for recurring tasks' });
      return;
    }

    const [created] = await db
      .insert(lifeTaskLogs)
      .values({
        userId: req.userId!,
        taskId: isOneoff ? null : taskId,
        logDate,
        note,
        completedAt: new Date(),
        isOneoff: isOneoff ?? false,
      })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/life-tasks/logs/:id  — undo a tick
router.delete('/logs/:id', async (req: AuthRequest, res, next) => {
  try {
    const [deleted] = await db
      .delete(lifeTaskLogs)
      .where(and(
        eq(lifeTaskLogs.id, req.params.id),
        eq(lifeTaskLogs.userId, req.userId!),
      ))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'Log entry not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ── Task definition routes ────────────────────────────────────────────────

// GET /api/life-tasks
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const result = await db
      .select()
      .from(lifeTasks)
      .where(eq(lifeTasks.userId, req.userId!));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/life-tasks
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { name, category, scheduleType, scheduleConfig, scope } = req.body;
    if (!name || !scheduleType || scheduleConfig === undefined) {
      res.status(400).json({ error: 'name, scheduleType, and scheduleConfig are required' });
      return;
    }

    const [created] = await db
      .insert(lifeTasks)
      .values({ userId: req.userId!, name, category, scheduleType, scheduleConfig, scope })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/life-tasks/:id
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { name, category, scheduleType, scheduleConfig, scope } = req.body;

    const [updated] = await db
      .update(lifeTasks)
      .set({ name, category, scheduleType, scheduleConfig, scope })
      .where(and(eq(lifeTasks.id, req.params.id), eq(lifeTasks.userId, req.userId!)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Life task not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/life-tasks/:id/active
router.patch('/:id/active', async (req: AuthRequest, res, next) => {
  try {
    const { active } = req.body;
    if (typeof active !== 'boolean') {
      res.status(400).json({ error: 'active (boolean) is required' });
      return;
    }

    const [updated] = await db
      .update(lifeTasks)
      .set({ active })
      .where(and(eq(lifeTasks.id, req.params.id), eq(lifeTasks.userId, req.userId!)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Life task not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/life-tasks/:id
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const [deleted] = await db
      .delete(lifeTasks)
      .where(and(eq(lifeTasks.id, req.params.id), eq(lifeTasks.userId, req.userId!)))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'Life task not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
