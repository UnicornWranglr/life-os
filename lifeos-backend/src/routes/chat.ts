import { Router, Response, NextFunction } from 'express';
import { and, asc, eq, sql } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db';
import {
  dailyLogs, areas, quarterlyRocks, monthlyIntentions, habits, habitLogs,
  sessions, projectItems, chatMemories,
} from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const MEMORY_LIMIT = 20;

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

    // ── Fetch context + memory in parallel ────────────────────────────────
    const [
      [todayLog],
      activeAreas,
      currentRocks,
      currentIntentions,
      todayHabitLogs,
      activeHabits,
      persistedHistory,
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

      // Last MEMORY_LIMIT messages across all past sessions, oldest first
      db.select({ role: chatMemories.role, content: chatMemories.content })
        .from(chatMemories)
        .where(eq(chatMemories.userId, userId))
        .orderBy(asc(chatMemories.createdAt))
        .limit(MEMORY_LIMIT),
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
${activeAreas.length ? activeAreas.map(a => `- id: '${a.id}'  name: '${a.name}'  (${a.type}, ${a.focusBudgetPct}% budget)`).join('\n') : 'None'}

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

## How LifeOS is designed to work

### Purpose
LifeOS connects day-to-day structure to long-term goals. Every daily action should be traceable to the life being built. The two problems it solves: macro drift (effort spread thin across competing projects) and micro chaos (days without structure). The system is not punitive — it should feel satisfying to use, never stressful.

### Goal hierarchy
The system has four layers, from long-term to immediate:
1. **North Star** — a single life vision statement (e.g. "Full-time digital nomad swing trader by Q2 2028"). Everything else serves this.
2. **Areas** — the active domains of life (income-building projects, obligations, vision areas). Each has a focus budget (target % of discretionary time) and a momentum state based on recency of sessions.
3. **Quarterly Rocks** — the 2-4 major outcomes that would make this quarter a success for each area. Rocks should be ambitious but completable in 90 days. Status: on_track / at_risk / done.
4. **Monthly Intentions** — smaller commitments that move a rock forward this month. More granular than rocks, reviewed monthly.
5. **Sessions** — the atomic unit of work. Every focused work block is logged as a session against an area. Sessions are what drive momentum scores and focus allocation insights.

### Daily flow
A well-used day in LifeOS looks like:
- **Morning** (before noon): open the Today screen, check which area has focus, review habits and life tasks due. The morning anchor prompt (if daily log not yet created) asks for wake time and sets intention.
- **Throughout the day**: tick off habits and life tasks as they're done. Log sessions after focused work blocks — outcome, duration, energy level.
- **Evening** (after 6pm): the evening close prompt appears to log sleep target and set tomorrow's one thing. This closes the daily log.

### The Today screen
Five cards, each serving a different function:
- **Focus card**: shows which area is in focus today (highest momentum priority). Has a "Log session" CTA — this is the primary action the system wants the user to take every day.
- **Habits card**: daily habits with streak tracking. Circular checkboxes. Missing 2+ days triggers a soft nudge; 3+ days turns the row amber.
- **Life tasks card**: recurring household/admin tasks due today (schedule-engine driven) plus one-off tasks. Square checkboxes. Tasks disappear on tick with no nudge — purely satisfying.
- **Routines card**: tracks four daily patterns — wake time, sleep target, cooked dinner, work block done. Shows a 7-dot weekly pattern (green/amber/red/grey). These feed into the weekly review.
- **Momentum card**: coloured chips per area showing days since last session. Green (<2 days), amber (3-5 days), red (6+ days or never). This is the system's main anti-drift mechanism.

### Sessions and momentum
Sessions are how progress is measured. An area with no session in 4+ days (on expected active days) turns amber; 7+ days turns red. The user should log a session whenever they do any focused work — even 20 minutes counts. Session fields: area, date, planned outcome, actual outcome, completed (yes/partial/no), energy (1-5), duration in minutes.

### Project boards
Each area has a project board (accessed from the area detail screen). Items are typed as actions, decisions, or notes. The board has four states: next → in_progress → (blocked) → done. WIP cap of 3 items in_progress at once — this is intentional to prevent overcommitment. The top "next action" item surfaces on the area cockpit card.

### Weekly review (Review tab)
Done once a week, ideally Sunday evening. The review form shows read-only computed sections (momentum per area, focus allocation actual vs budget, routine patterns) then asks for: wins, blockers, next week's priority area, and rock status updates. Completing a weekly review is how the user stays calibrated at the macro level.

### Insights tab
Shows focus allocation (sessions per area as % of total, vs the budget target), habit completion rates, and routine patterns over configurable date ranges. The key question it answers: "Is my time actually going where I said it should?"

### Me tab
Configuration hub: north star, quarterly rocks, monthly intentions, habit setup, life task schedules, account settings. The user visits Me to set direction (rocks, intentions) and configure the system. They visit Today to execute.

### Habits vs life tasks — the distinction
- **Habits**: identity-level behaviours the user is building. They have streaks, nudges, and are linked to areas. Failing them matters.
- **Life tasks**: recurring household and admin tasks. They have flexible schedules. Missing them has no consequence — the point is they surface at the right time so the user doesn't have to remember them.

### How to guide the user
- When they describe completing work → suggest logging a session (or log it via action)
- When they mention a goal or commitment → suggest creating a rock or project item
- When their momentum is red on an area → acknowledge it and ask what's blocking them
- When habits are incomplete → be encouraging, not judgmental
- When they ask "what should I do today" → look at their focus area, incomplete habits, and any rocks that are at_risk
- When they ask about a feature → explain it in plain terms using the context above, not technical details

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
- **areaId MUST be the exact UUID string from the 'id' field in the Active Areas list above.** Never use an area name, slug, or any other string as the areaId. For example: if the list shows  id: '4f87b888-306e-4792-b696-350e1df388a8'  name: 'Life OS'  then areaId must be '4f87b888-306e-4792-b696-350e1df388a8' — not 'life-os', not 'Life OS', not any other value. If you cannot find an exact UUID match, set action to null and ask the user to clarify.
- Set action to null for purely conversational messages, questions, or advice.
Keep your reply focused, warm, and under 200 words unless more detail is genuinely needed.`;

    // ── Call Claude ────────────────────────────────────────────────────────
    // DB memory is the source of truth for history. The frontend's
    // conversationHistory covers the current in-flight session (messages
    // exchanged since the page loaded that haven't been persisted yet).
    // We merge: persisted past + current session + new message, deduplicating
    // by only taking current-session messages that aren't already in persisted.
    const persistedContents = new Set(persistedHistory.map(m => m.content));
    const dedupedSession = (conversationHistory ?? []).filter(
      m => !persistedContents.has(m.content),
    );

    const messages: Anthropic.MessageParam[] = [
      ...persistedHistory,
      ...dedupedSession,
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
    let reply  = '';
    let action: { type: string; payload: Record<string, unknown> } | null = null;

    try {
      // Strip markdown code fences if present
      const jsonStr = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      const parsed  = JSON.parse(jsonStr);
      reply  = typeof parsed.reply === 'string' ? parsed.reply : '';
      action = parsed.action ?? null;
    } catch {
      // AI didn't return valid JSON — surface raw text as a plain reply
      reply = rawContent;
    }

    // ── Sanitise reply — strip any JSON artifacts the AI leaked ───────────
    // Remove leading { "reply": " wrapper (with any quote style / spacing)
    reply = reply.replace(/^\s*\{\s*"reply"\s*:\s*"/, '');
    // Truncate at the start of any trailing JSON keys (, "action" / , "updatedData")
    reply = reply.replace(/,\s*"(?:action|updatedData)"\s*:[\s\S]*$/, '');
    // Remove a bare trailing closing brace left after the above strip
    reply = reply.replace(/"\s*\}\s*$/, '').replace(/\s*\}\s*$/, '');
    reply = reply.trim();

    // ── Execute action ────────────────────────────────────���────────────────
    let updatedData: Record<string, unknown> | null = null;

    // Guard: actions that write to a specific area must use a valid UUID that
    // belongs to this user. Catches hallucinated slugs / names from the AI.
    const areaRequiringActions = ['LOG_SESSION', 'CREATE_PROJECT_ITEM', 'CREATE_ROCK'];
    if (action && areaRequiringActions.includes(action.type)) {
      const areaId = action.payload?.areaId as string | undefined;
      const validIds = new Set(activeAreas.map(a => a.id));
      if (!areaId || !validIds.has(areaId)) {
        res.json({
          reply: `I wasn't able to match that to one of your areas — could you clarify which area this belongs to? Your active areas are: ${activeAreas.map(a => a.name).join(', ')}.`,
          action: null,
          updatedData: null,
        });
        return;
      }
    }

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

    // ── Persist conversation turn + trim to MEMORY_LIMIT ──────────────────
    // Run after responding so it never delays the client.
    // Two inserts (user message + assistant reply), then prune oldest rows
    // beyond the limit. Fire-and-forget — errors are logged, not surfaced.
    db.insert(chatMemories)
      .values([
        { userId, role: 'user',      content: message },
        { userId, role: 'assistant', content: reply   },
      ])
      .then(() =>
        db.execute(sql`
          DELETE FROM chat_memories
          WHERE user_id = ${userId}
            AND id NOT IN (
              SELECT id FROM chat_memories
              WHERE user_id = ${userId}
              ORDER BY created_at DESC
              LIMIT ${MEMORY_LIMIT}
            )
        `),
      )
      .catch(err => console.error('chat_memories persist error:', err));
  } catch (err) {
    next(err);
  }
});

export default router;
