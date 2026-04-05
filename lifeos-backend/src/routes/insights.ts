import { Router, Response, NextFunction } from 'express';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { sessions, areas, habits, habitLogs, dailyLogs } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/insights/focus?from=&to=
// Returns per-area session counts and durations as percentages.
router.get('/focus', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;

    const conditions = [eq(sessions.userId, req.userId!)];
    if (from) conditions.push(gte(sessions.sessionDate, from as string));
    if (to)   conditions.push(lte(sessions.sessionDate, to as string));

    const rows = await db
      .select({
        areaId:         areas.id,
        name:           areas.name,
        color:          areas.color,
        focusBudgetPct: areas.focusBudgetPct,
        sessionCount:   sql<number>`count(${sessions.id})::int`,
        durationMins:   sql<number>`coalesce(sum(${sessions.durationMins}), 0)::int`,
      })
      .from(sessions)
      .innerJoin(areas, eq(sessions.areaId, areas.id))
      .where(and(...conditions))
      .groupBy(areas.id, areas.name, areas.color, areas.focusBudgetPct);

    const totalSessions = rows.reduce((acc, r) => acc + r.sessionCount, 0);

    const byArea = rows.map(r => ({
      ...r,
      pct: totalSessions > 0 ? Math.round((r.sessionCount / totalSessions) * 100) : 0,
    }));

    res.json({ byArea });
  } catch (err) {
    next(err);
  }
});

// GET /api/insights/habits?from=&to=
// Returns per-habit completion rates and weekly breakdown.
router.get('/habits', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;
    const fromStr = (from as string) ?? '';
    const toStr   = (to as string) ?? '';

    const userHabits = await db
      .select()
      .from(habits)
      .where(eq(habits.userId, req.userId!));

    if (userHabits.length === 0) {
      res.json({ byHabit: [] });
      return;
    }

    const logConditions = [eq(habitLogs.userId, req.userId!)];
    if (fromStr) logConditions.push(gte(habitLogs.logDate, fromStr));
    if (toStr)   logConditions.push(lte(habitLogs.logDate, toStr));

    const logs = await db
      .select()
      .from(habitLogs)
      .where(and(...logConditions));

    // Calculate the total number of days in the range
    const fromDate = fromStr ? new Date(fromStr + 'T12:00') : new Date();
    const toDate   = toStr   ? new Date(toStr + 'T12:00')   : new Date();
    const totalDays = Math.max(
      1,
      Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)) + 1,
    );

    // Build 7-day week buckets within the range
    const weeks: Array<{ start: Date; end: Date }> = [];
    const cursor = new Date(fromDate);
    while (cursor <= toDate) {
      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weeks.push({ start: new Date(cursor), end: weekEnd > toDate ? new Date(toDate) : weekEnd });
      cursor.setDate(cursor.getDate() + 7);
    }

    const byHabit = userHabits.map(habit => {
      const habitLogEntries = logs.filter(l => l.habitId === habit.id);
      const completedCount  = habitLogEntries.filter(l => l.completed).length;
      const completionRate  = Math.round((completedCount / totalDays) * 100) / 100;

      const weeklyRates = weeks.map(week => {
        const weekDays = Math.round(
          (week.end.getTime() - week.start.getTime()) / (24 * 60 * 60 * 1000),
        ) + 1;
        const weekStart = week.start.toISOString().slice(0, 10);
        const weekEnd   = week.end.toISOString().slice(0, 10);
        const weekCompleted = habitLogEntries.filter(
          l => l.completed && l.logDate >= weekStart && l.logDate <= weekEnd,
        ).length;
        return Math.round((weekCompleted / weekDays) * 100) / 100;
      });

      return {
        habitId: habit.id,
        name: habit.name,
        completionRate,
        weeklyRates,
      };
    });

    res.json({ byHabit });
  } catch (err) {
    next(err);
  }
});

// GET /api/insights/routines?from=&to=
// Returns cooking/work-block rates and weekly dot patterns.
router.get('/routines', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;

    const conditions = [eq(dailyLogs.userId, req.userId!)];
    if (from) conditions.push(gte(dailyLogs.logDate, from as string));
    if (to)   conditions.push(lte(dailyLogs.logDate, to as string));

    const logs = await db
      .select()
      .from(dailyLogs)
      .where(and(...conditions));

    const totalLogged = logs.length;
    if (totalLogged === 0) {
      res.json({ cookingRate: 0, workBlockRate: 0, sleepOnTargetRate: 0, weeklyPatterns: [] });
      return;
    }

    const cookingRate      = logs.filter(l => l.cookedDinner).length / totalLogged;
    const workBlockRate    = logs.filter(l => l.workBlockDone).length / totalLogged;
    const sleepOnTargetRate = logs.filter(l => l.sleepTarget !== null).length / totalLogged;

    // Group into Mon-Sun weeks based on logDate
    const weekMap = new Map<string, typeof logs>();
    for (const log of logs) {
      const logDate  = new Date(log.logDate + 'T12:00');
      const dow      = logDate.getDay();
      const monday   = new Date(logDate);
      monday.setDate(logDate.getDate() + (dow === 0 ? -6 : 1 - dow));
      const weekKey  = monday.toISOString().slice(0, 10);
      if (!weekMap.has(weekKey)) weekMap.set(weekKey, []);
      weekMap.get(weekKey)!.push(log);
    }

    const weeklyPatterns = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, weekLogs]) => {
        // Build 7-element arrays (Mon=0 … Sun=6); default false
        const cooking   = Array(7).fill(false) as boolean[];
        const workBlock = Array(7).fill(false) as boolean[];

        for (const log of weekLogs) {
          const logDate = new Date(log.logDate + 'T12:00');
          const dow     = logDate.getDay();
          const idx     = dow === 0 ? 6 : dow - 1; // Mon=0 … Sun=6
          if (log.cookedDinner)  cooking[idx]   = true;
          if (log.workBlockDone) workBlock[idx] = true;
        }

        return { weekStart, cooking, workBlock };
      });

    res.json({
      cookingRate:      Math.round(cookingRate * 100) / 100,
      workBlockRate:    Math.round(workBlockRate * 100) / 100,
      sleepOnTargetRate: Math.round(sleepOnTargetRate * 100) / 100,
      weeklyPatterns,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
