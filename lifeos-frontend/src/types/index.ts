// Shared TypeScript types — mirrors the Drizzle schema shapes returned by the API.

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Vision {
  id: string;
  userId: string;
  statement: string;
  updatedAt: string;
}

export type AreaType    = 'income_building' | 'project' | 'obligation' | 'vision';
export type AreaStatus  = 'active' | 'paused' | 'archived';

export interface Area {
  id: string;
  userId: string;
  name: string;
  type: AreaType;
  status: AreaStatus;
  focusBudgetPct: number;
  color: string;
  weekdaysOnly: boolean;
  createdAt: string;
}

export type RockStatus = 'on_track' | 'at_risk' | 'done';

export interface QuarterlyRock {
  id: string;
  userId: string;
  areaId: string;
  quarter: string;
  title: string;
  status: RockStatus;
  notes: string | null;
}

export type IntentionStatus = 'active' | 'done' | 'dropped';

export interface MonthlyIntention {
  id: string;
  userId: string;
  areaId: string;
  month: string;
  title: string;
  status: IntentionStatus;
}

export type SessionCompleted = 'yes' | 'partial' | 'no';

export interface Session {
  id: string;
  userId: string;
  areaId: string;
  sessionDate: string;
  plannedOutcome: string | null;
  actualOutcome: string | null;
  completed: SessionCompleted | null;
  energyOut: number | null;
  durationMins: number | null;
  blockers: string | null;
  createdAt: string;
}

export interface DailyLog {
  id: string;
  userId: string;
  logDate: string;
  wakeTime: string | null;
  sleepTarget: string | null;
  cookedDinner: boolean | null;
  workBlockDone: boolean | null;
  tomorrowOneThing: string | null;
  createdAt: string;
}

export interface WeeklyReview {
  id: string;
  userId: string;
  weekStart: string;
  wins: string | null;
  blockers: string | null;
  focusAreaNextWeek: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  areaId: string | null;
  name: string;
  active: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  logDate: string;
  completed: boolean;
}

export type ProjectItemStatus = 'next' | 'in_progress' | 'blocked' | 'done';
export type ProjectItemType   = 'action' | 'decision' | 'note';

export interface ProjectItem {
  id: string;
  userId: string;
  areaId: string;
  title: string;
  status: ProjectItemStatus;
  type: ProjectItemType;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
}

export type TaskScope        = 'daily' | 'weekly' | 'oneoff';
export type ScheduleType     = 'daily' | 'days_of_week' | 'every_n_weeks' | 'monthly_date' | 'monthly_occurrence' | 'weekly_floating';

export interface LifeTask {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  scheduleType: ScheduleType;
  scheduleConfig: Record<string, unknown>;
  scope: TaskScope;
  active: boolean;
  createdAt: string;
}

export interface LifeTaskLog {
  id: string;
  userId: string;
  taskId: string | null;
  logDate: string;
  note: string | null;
  completedAt: string;
  isOneoff: boolean;
}

export interface TodayTasks {
  due: LifeTask[];
  weekly: LifeTask[];
  completed: LifeTaskLog[];
}

// Insights
export interface FocusInsight {
  byArea: {
    areaId: string;
    name: string;
    color: string;
    focusBudgetPct: number;
    sessionCount: number;
    durationMins: number;
    pct: number;
  }[];
}

export interface HabitInsight {
  byHabit: {
    habitId: string;
    name: string;
    completionRate: number;
    weeklyRates: number[];
  }[];
}

export interface RoutineInsight {
  cookingRate: number;
  workBlockRate: number;
  sleepOnTargetRate: number;
  weeklyPatterns: {
    weekStart: string;
    cooking: boolean[];
    workBlock: boolean[];
  }[];
}

// Momentum — computed on the frontend from session data
export type MomentumLevel = 'green' | 'amber' | 'red';

export interface AreaMomentum {
  areaId: string;
  daysSinceLastSession: number | null;
  level: MomentumLevel;
  label: string;
}
