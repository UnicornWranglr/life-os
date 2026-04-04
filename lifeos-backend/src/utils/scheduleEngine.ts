// Schedule engine — resolves which life_tasks are due on a given date.
// Called by GET /api/life-tasks/today.

export interface ScheduleConfig {
  // days_of_week
  days?: string[];
  // every_n_weeks
  every?: number;
  // every_n_weeks + monthly_occurrence
  day?: string;
  // monthly_date
  date?: number;
  // monthly_occurrence
  occurrence?: 'first' | 'second' | 'third' | 'fourth' | 'last';
}

export interface ScheduledTask {
  id: string;
  scheduleType: string;
  scheduleConfig: unknown;
  scope: string;
  createdAt: Date | string;
}

// Returns the full lowercase weekday name for a given date (e.g. "monday").
function dayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

// Returns how many complete 7-day periods have elapsed since `from`.
function weeksSince(from: Date | string, to: Date): number {
  const fromMs = new Date(from).getTime();
  return Math.floor((to.getTime() - fromMs) / (7 * 24 * 60 * 60 * 1000));
}

// Returns true if `date` matches e.g. "first monday" or "last friday" of its month.
function matchesMonthlyOccurrence(
  date: Date,
  occurrence: string,
  targetDay: string,
): boolean {
  if (dayName(date) !== targetDay) return false;

  const dom = date.getDate();
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDow = firstOfMonth.getDay();
  const targetDow = date.getDay();

  // Build the list of dates in this month that fall on targetDay.
  const matchingDates: number[] = [];
  let d = 1 + ((targetDow - firstDow + 7) % 7);
  while (d <= 31) {
    const test = new Date(date.getFullYear(), date.getMonth(), d);
    if (test.getMonth() === date.getMonth()) matchingDates.push(d);
    d += 7;
  }

  const occurrenceIndex: Record<string, number> = {
    first: 0,
    second: 1,
    third: 2,
    fourth: 3,
    last: matchingDates.length - 1,
  };

  const idx = occurrenceIndex[occurrence];
  return idx !== undefined && matchingDates[idx] === dom;
}

// Core predicate — should this task appear in today's daily task list?
function isDueOn(task: ScheduledTask, date: Date): boolean {
  const cfg = task.scheduleConfig as ScheduleConfig;

  switch (task.scheduleType) {
    case 'daily':
      return true;

    case 'days_of_week':
      return (cfg.days ?? []).includes(dayName(date));

    case 'every_n_weeks': {
      if (!cfg.every || !cfg.day) return false;
      if (dayName(date) !== cfg.day) return false;
      return weeksSince(task.createdAt, date) % cfg.every === 0;
    }

    case 'monthly_date':
      return date.getDate() === cfg.date;

    case 'monthly_occurrence':
      if (!cfg.occurrence || !cfg.day) return false;
      return matchesMonthlyOccurrence(date, cfg.occurrence, cfg.day);

    case 'weekly_floating':
      return false; // handled separately via getWeeklyFloatingTasks

    default:
      return false;
  }
}

// Returns tasks whose schedule matches the given date (excludes weekly_floating).
export function getTasksDueOn(tasks: ScheduledTask[], date: Date): ScheduledTask[] {
  return tasks.filter(t => t.scope !== 'weekly' && isDueOn(t, date));
}

// Returns all weekly_floating tasks (due "this week", flexible on day).
export function getWeeklyFloatingTasks(tasks: ScheduledTask[]): ScheduledTask[] {
  return tasks.filter(t => t.scheduleType === 'weekly_floating');
}

// Returns the YYYY-MM-DD of the Monday that starts the week containing `date`.
export function getMondayOf(date: Date): string {
  const d = new Date(date.getTime());
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Returns today's local date as YYYY-MM-DD (server-local time).
export function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
