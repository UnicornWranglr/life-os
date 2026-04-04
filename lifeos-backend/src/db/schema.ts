import {
  pgTable, uuid, text, integer, boolean,
  date, time, timestamp, json, pgEnum,
} from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────────────────────────

export const areaTypeEnum = pgEnum('area_type', [
  'income_building', 'project', 'obligation', 'vision',
]);

export const areaStatusEnum = pgEnum('area_status', [
  'active', 'paused', 'archived',
]);

export const rockStatusEnum = pgEnum('rock_status', [
  'on_track', 'at_risk', 'done',
]);

export const intentionStatusEnum = pgEnum('intention_status', [
  'active', 'done', 'dropped',
]);

export const sessionCompletedEnum = pgEnum('session_completed', [
  'yes', 'partial', 'no',
]);

export const projectItemStatusEnum = pgEnum('project_item_status', [
  'next', 'in_progress', 'blocked', 'done',
]);

export const projectItemTypeEnum = pgEnum('project_item_type', [
  'action', 'decision', 'note',
]);

export const taskScopeEnum = pgEnum('task_scope', [
  'daily', 'weekly', 'oneoff',
]);

export const scheduleTypeEnum = pgEnum('schedule_type', [
  'daily',
  'days_of_week',
  'every_n_weeks',
  'monthly_date',
  'monthly_occurrence',
  'weekly_floating',
]);

// ── Tables ─────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});

export const vision = pgTable('vision', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id),
  statement: text('statement').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const areas = pgTable('areas', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').notNull().references(() => users.id),
  name:           text('name').notNull(),
  type:           areaTypeEnum('type').notNull(),
  status:         areaStatusEnum('status').default('active').notNull(),
  focusBudgetPct: integer('focus_budget_pct').default(20).notNull(),
  color:          text('color').notNull(),
  weekdaysOnly:   boolean('weekdays_only').default(false).notNull(),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
});

export const quarterlyRocks = pgTable('quarterly_rocks', {
  id:      uuid('id').primaryKey().defaultRandom(),
  userId:  uuid('user_id').notNull().references(() => users.id),
  areaId:  uuid('area_id').notNull().references(() => areas.id),
  quarter: text('quarter').notNull(),   // e.g. "2026-Q2"
  title:   text('title').notNull(),
  status:  rockStatusEnum('status').default('on_track').notNull(),
  notes:   text('notes'),
});

export const monthlyIntentions = pgTable('monthly_intentions', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  areaId: uuid('area_id').notNull().references(() => areas.id),
  month:  text('month').notNull(),      // e.g. "2026-04"
  title:  text('title').notNull(),
  status: intentionStatusEnum('status').default('active').notNull(),
});

export const sessions = pgTable('sessions', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').notNull().references(() => users.id),
  areaId:         uuid('area_id').notNull().references(() => areas.id),
  sessionDate:    date('session_date').notNull(),
  plannedOutcome: text('planned_outcome'),
  actualOutcome:  text('actual_outcome'),
  completed:      sessionCompletedEnum('completed'),
  energyOut:      integer('energy_out'),    // 1-5
  durationMins:   integer('duration_mins'),
  blockers:       text('blockers'),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
});

export const dailyLogs = pgTable('daily_logs', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').notNull().references(() => users.id),
  logDate:          date('log_date').notNull(),
  wakeTime:         time('wake_time'),
  sleepTarget:      time('sleep_target'),
  cookedDinner:     boolean('cooked_dinner'),
  workBlockDone:    boolean('work_block_done'),
  tomorrowOneThing: text('tomorrow_one_thing'),
  createdAt:        timestamp('created_at').defaultNow().notNull(),
});

export const weeklyReviews = pgTable('weekly_reviews', {
  id:                uuid('id').primaryKey().defaultRandom(),
  userId:            uuid('user_id').notNull().references(() => users.id),
  weekStart:         date('week_start').notNull(), // always Monday
  wins:              text('wins'),
  blockers:          text('blockers'),
  focusAreaNextWeek: uuid('focus_area_next_week').references(() => areas.id),
  notes:             text('notes'),
  createdAt:         timestamp('created_at').defaultNow().notNull(),
});

export const habits = pgTable('habits', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  areaId: uuid('area_id').references(() => areas.id),
  name:   text('name').notNull(),
  active: boolean('active').default(true).notNull(),
});

export const habitLogs = pgTable('habit_logs', {
  id:        uuid('id').primaryKey().defaultRandom(),
  habitId:   uuid('habit_id').notNull().references(() => habits.id),
  userId:    uuid('user_id').notNull().references(() => users.id),
  logDate:   date('log_date').notNull(),
  completed: boolean('completed').default(false).notNull(),
});

export const projectItems = pgTable('project_items', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id),
  areaId:      uuid('area_id').notNull().references(() => areas.id),
  title:       text('title').notNull(),
  status:      projectItemStatusEnum('status').default('next').notNull(),
  type:        projectItemTypeEnum('type').default('action').notNull(),
  notes:       text('notes'),
  completedAt: timestamp('completed_at'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

export const lifeTasks = pgTable('life_tasks', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').notNull().references(() => users.id),
  name:           text('name').notNull(),
  category:       text('category'),
  scheduleType:   scheduleTypeEnum('schedule_type').notNull(),
  scheduleConfig: json('schedule_config').notNull(),
  scope:          taskScopeEnum('scope').default('daily').notNull(),
  active:         boolean('active').default(true).notNull(),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
});

export const lifeTaskLogs = pgTable('life_task_logs', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id),
  taskId:      uuid('task_id').references(() => lifeTasks.id),
  logDate:     date('log_date').notNull(),
  note:        text('note'),
  completedAt: timestamp('completed_at').notNull(),
  isOneoff:    boolean('is_oneoff').default(false).notNull(),
});
