import type { Habit, HabitLog } from '@/types';
import { todayString } from '@/utils/dates';

interface HabitRowProps {
  habit: Habit;
  logs: HabitLog[];
  onToggle: (habitId: string, completed: boolean) => void;
}

// Counts consecutive completed days ending yesterday (streak before today).
function calcStreak(habitId: string, logs: HabitLog[]): number {
  const completed = new Set(
    logs.filter(l => l.habitId === habitId && l.completed).map(l => l.logDate),
  );
  let streak = 0;
  const d = new Date(todayString() + 'T12:00');
  d.setDate(d.getDate() - 1); // start from yesterday
  while (true) {
    const stamp = d.toISOString().slice(0, 10);
    if (!completed.has(stamp)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// Returns how many consecutive days before today had no completed entry.
function missedDaysBefore(habitId: string, logs: HabitLog[]): number {
  const logMap = new Map(logs.filter(l => l.habitId === habitId).map(l => [l.logDate, l]));
  let missed = 0;
  const d = new Date(todayString() + 'T12:00');
  for (let i = 0; i < 7; i++) {
    d.setDate(d.getDate() - 1);
    const stamp = d.toISOString().slice(0, 10);
    const log   = logMap.get(stamp);
    if (log?.completed) break;
    missed++;
  }
  return missed;
}

export function HabitRow({ habit, logs, onToggle }: HabitRowProps) {
  const today   = todayString();
  const todayLog = logs.find(l => l.habitId === habit.id && l.logDate === today);
  const done    = todayLog?.completed ?? false;
  const streak  = calcStreak(habit.id, logs);
  const missed  = missedDaysBefore(habit.id, logs);

  // Nudge state per PRD section 9 — suppressed once ticked today
  const nudge2 = !done && missed >= 2 && missed < 3;
  const nudge3 = !done && missed >= 3;

  return (
    <div className={`rounded-xl transition-colors ${nudge3 ? 'bg-amber/10 border border-amber/20' : ''}`}>
      <div className="flex items-center gap-3 px-1 py-2">
        {/* Circular checkbox */}
        <button
          onClick={() => onToggle(habit.id, !done)}
          className="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center
                     transition-all duration-200 active:scale-90"
          style={{
            borderColor: done ? '#0F6E56' : '#2e2e2e',
            backgroundColor: done ? '#0F6E56' : 'transparent',
          }}
          aria-label={done ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`}
        >
          {done && (
            <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 stroke-white" fill="none"
                 strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2 6 5 9 10 3" />
            </svg>
          )}
        </button>

        {/* Name + streak */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight ${done ? 'line-through text-muted' : 'text-primary'}`}>
            {habit.name}
          </p>
          {streak > 0 && !done && (
            <p className="text-xs text-muted mt-0.5">{streak} day streak</p>
          )}
        </div>
      </div>

      {/* Inline nudge messages */}
      {nudge3 && (
        <p className="text-xs text-amber px-1 pb-2 -mt-1">
          Missed {missed} day{missed !== 1 ? 's' : ''} — worth getting back to today
        </p>
      )}
      {nudge2 && !nudge3 && (
        <p className="text-xs text-muted px-1 pb-2 -mt-1">
          Missed a couple of days
        </p>
      )}
    </div>
  );
}
