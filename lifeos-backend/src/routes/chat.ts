import { Router, Response, NextFunction } from 'express';
import { and, eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db';
import {
  dailyLogs, areas, quarterlyRocks, monthlyIntentions, habits, habitLogs,
  sessions, projectItems,
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

## Available action types

**UPDATE_DAILY_LOG** — update fields on today's daily log.
{ "type": "UPDATE_DAILY_LOG", "payload": { "tomorrowOneThing": "...", "wakeTime": "HH:MM:SS", "sleepTarget": "HH:MM:SS", "cookedDinner": true/false, "workBlockDone": true/false } }
Use when the user asks to update or set something in their daily log. Only include the fields they want to change.

**LOG_SESSION** — record a work session the user just completed or is describing.
{ "type": "LOG_SESSION", "payload": { "areaId": "<uuid>", "plannedOutcome": "...", "actualOutcome": "...", "completed": "yes"|"partial"|"no", "energyOut": 1-5, "durationMins": 60 } }
Use proactively when the user describes work they've done — e.g. "I just finished a 90-minute coding session" or "I worked on X for an hour". Match the area by name from the active areas list above. plannedOutcome and actualOutcome can be the same if only one is mentioned. completed is "yes" unless they say it was partial or they ran out of time.

**CREATE_PROJECT_ITEM** — add a next action, decision, or note to an area's project board.
{ "type": "CREATE_PROJECT_ITEM", "payload": { "areaId": "<uuid>", "title": "...", "type": "action"|"decision"|"note", "status": "next"|"in_progress"|"blocked"|"done", "notes": "..." } }
Use proactively when the user mentions a task, next step, or thing they want to track — e.g. "I need to email the accountant" or "remind me to review the contract". Default type to "action" and status to "next" unless context suggests otherwise. notes is optional.

**CREATE_ROCK** — add a new quarterly rock (major goal) for an area.
{ "type": "CREATE_ROCK", "payload": { "areaId": "<uuid>", "quarter": "${quarter}", "title": "...", "status": "on_track"|"at_risk"|"done" } }
Use when the user describes a significant goal they want to commit to this quarter — e.g. "I want to make launching the app a goal this quarter". Default status to "on_track".

## Action selection rules
- Use an action whenever the user's message naturally calls for it — don't wait to be explicitly asked.
- Only emit ONE action per response. If multiple things could be logged, pick the most important one and mention the others in your reply.
- Always resolve area names to their UUID from the active areas list. If the area is ambiguous, pick the best match and note it in your reply.
- Set action to null for purely conversational messages, questions, or advice.
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

    if (action?.type === 'LOG_SESSION' && action.payload) {
      const {
        areaId, plannedOutcome, actualOutcome, completed, energyOut, durationMins,
      } = action.payload as {
        areaId: string;
        plannedOutcome?: string;
        actualOutcome?: string;
        completed?: 'yes' | 'partial' | 'no';
        energyOut?: number;
        durationMins?: number;
      };

      const [created] = await db
        .insert(sessions)
        .values({
          userId,
          areaId,
          sessionDate: today,
          plannedOutcome,
          actualOutcome,
          completed,
          energyOut,
          durationMins,
        })
        .returning();
      updatedData = { session: created };
    }

    if (action?.type === 'CREATE_PROJECT_ITEM' && action.payload) {
      const {
        areaId, title, type, status, notes,
      } = action.payload as {
        areaId: string;
        title: string;
        type?: 'action' | 'decision' | 'note';
        status?: 'next' | 'in_progress' | 'blocked' | 'done';
        notes?: string;
      };

      const [created] = await db
        .insert(projectItems)
        .values({
          userId,
          areaId,
          title,
          type:   type   ?? 'action',
          status: status ?? 'next',
          notes,
        })
        .returning();
      updatedData = { projectItem: created };
    }

    if (action?.type === 'CREATE_ROCK' && action.payload) {
      const {
        areaId, quarter: rockQuarter, title, status,
      } = action.payload as {
        areaId: string;
        quarter: string;
        title: string;
        status?: 'on_track' | 'at_risk' | 'done';
      };

      const [created] = await db
        .insert(quarterlyRocks)
        .values({
          userId,
          areaId,
          quarter: rockQuarter ?? quarter,
          title,
          status: status ?? 'on_track',
        })
        .returning();
      updatedData = { rock: created };
    }

    res.json({ reply, action, updatedData });
  } catch (err) {
    next(err);
  }
});

export default router;
