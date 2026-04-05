import { Router, Response, NextFunction } from 'express';
import { and, eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db';
import {
  dailyLogs, areas, quarterlyRocks, monthlyIntentions, habits, habitLogs,
} from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/chat
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message, conversationHistory } = req.body as {
      message: string;
      conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const userId = req.userId!;
    const today  = new Date().toISOString().slice(0, 10);           // YYYY-MM-DD
    const month  = today.slice(0, 7);                                // YYYY-MM
    const year   = today.slice(0, 4);
    const quarter = `${year}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;

    // ── Fetch context in parallel ──────────────────────────────────────────
    const [
      [todayLog],
      activeAreas,
      currentRocks,
      currentIntentions,
      todayHabitLogs,
      activeHabits,
    ] = await Promise.all([
      db.select().from(dailyLogs)
        .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.logDate, today))),

      db.select().from(areas)
        .where(and(eq(areas.userId, userId), eq(areas.status, 'active'))),

      db.select().from(quarterlyRocks)
        .where(and(eq(quarterlyRocks.userId, userId), eq(quarterlyRocks.quarter, quarter))),

      db.select().from(monthlyIntentions)
        .where(and(eq(monthlyIntentions.userId, userId), eq(monthlyIntentions.month, month), eq(monthlyIntentions.status, 'active'))),

      db.select().from(habitLogs)
        .where(and(eq(habitLogs.userId, userId), eq(habitLogs.logDate, today))),

      db.select().from(habits)
        .where(and(eq(habits.userId, userId), eq(habits.active, true))),
    ]);

    // Join today's habit logs with habit names
    const todayHabits = activeHabits.map(h => ({
      name:      h.name,
      completed: todayHabitLogs.find(l => l.habitId === h.id)?.completed ?? false,
    }));

    // ── Build system prompt ────────────────────────────────────────────────
    const systemPrompt = `You are the user's personal LifeOS assistant — a focused, practical coach who knows their goals, areas, and daily context. Be concise and actionable.

Today's date: ${today}
Current quarter: ${quarter}
Current month: ${month}

## Active Areas
${activeAreas.length ? activeAreas.map(a => `- ${a.name} (${a.type}, ${a.focusBudgetPct}% budget)`).join('\n') : 'None'}

## Quarterly Rocks (${quarter})
${currentRocks.length ? currentRocks.map(r => {
  const areaName = activeAreas.find(a => a.id === r.areaId)?.name ?? 'Unknown';
  return `- [${r.status}] ${r.title} (${areaName})${r.notes ? ` — ${r.notes}` : ''}`;
}).join('\n') : 'None set'}

## Monthly Intentions (${month})
${currentIntentions.length ? currentIntentions.map(i => {
  const areaName = activeAreas.find(a => a.id === i.areaId)?.name ?? 'Unknown';
  return `- ${i.title} (${areaName})`;
}).join('\n') : 'None set'}

## Today's Daily Log
${todayLog ? `- Wake time: ${todayLog.wakeTime ?? 'not logged'}
- Sleep target: ${todayLog.sleepTarget ?? 'not set'}
- Cooked dinner: ${todayLog.cookedDinner ?? 'not logged'}
- Work block done: ${todayLog.workBlockDone ?? 'not logged'}
- Tomorrow's one thing: ${todayLog.tomorrowOneThing ?? 'not set'}` : 'No log for today yet'}

## Today's Habits
${todayHabits.length ? todayHabits.map(h => `- ${h.name}: ${h.completed ? 'done' : 'not done'}`).join('\n') : 'No habits tracked'}

---

When responding, always reply in this exact JSON format:
{
  "reply": "<your natural language response>",
  "action": <null OR a structured action object>
}

Available action types:
- { "type": "UPDATE_DAILY_LOG", "payload": { "tomorrowOneThing": "...", "wakeTime": "HH:MM:SS", "sleepTarget": "HH:MM:SS", "cookedDinner": true/false, "workBlockDone": true/false } }
  Use when the user asks to update or set something in their daily log. Only include the fields they want to change.

Only include an action if the user is explicitly asking to update data. Otherwise set action to null.
Keep your reply focused, warm, and under 200 words unless more detail is genuinely needed.`;

    // ── Call Claude ────────────────────────────────────────────────────────
    const messages: Anthropic.MessageParam[] = [
      ...(conversationHistory ?? []),
      { role: 'user', content: message },
    ];

    const aiResponse = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system:     systemPrompt,
      messages,
    });

    const rawContent = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';

    // Parse the JSON response from the AI
    let reply  = rawContent;
    let action: { type: string; payload: Record<string, unknown> } | null = null;

    try {
      // Strip markdown code fences if present
      const jsonStr = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      const parsed  = JSON.parse(jsonStr);
      reply  = parsed.reply  ?? rawContent;
      action = parsed.action ?? null;
    } catch {
      // AI didn't return valid JSON — use raw text as reply, no action
    }

    // ── Execute action ─────────────────────────────────────────────────────
    let updatedData: Record<string, unknown> | null = null;

    if (action?.type === 'UPDATE_DAILY_LOG' && action.payload) {
      const {
        tomorrowOneThing, wakeTime, sleepTarget, cookedDinner, workBlockDone,
      } = action.payload as {
        tomorrowOneThing?: string;
        wakeTime?: string;
        sleepTarget?: string;
        cookedDinner?: boolean;
        workBlockDone?: boolean;
      };

      const updateFields: Partial<typeof dailyLogs.$inferInsert> = {};
      if (tomorrowOneThing !== undefined) updateFields.tomorrowOneThing = tomorrowOneThing;
      if (wakeTime         !== undefined) updateFields.wakeTime         = wakeTime;
      if (sleepTarget      !== undefined) updateFields.sleepTarget      = sleepTarget;
      if (cookedDinner     !== undefined) updateFields.cookedDinner     = cookedDinner;
      if (workBlockDone    !== undefined) updateFields.workBlockDone    = workBlockDone;

      if (Object.keys(updateFields).length > 0) {
        if (todayLog) {
          const [updated] = await db
            .update(dailyLogs)
            .set(updateFields)
            .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.logDate, today)))
            .returning();
          updatedData = { dailyLog: updated };
        } else {
          const [created] = await db
            .insert(dailyLogs)
            .values({ userId, logDate: today, ...updateFields })
            .returning();
          updatedData = { dailyLog: created };
        }
      }
    }

    res.json({ reply, action, updatedData });
  } catch (err) {
    next(err);
  }
});

export default router;
