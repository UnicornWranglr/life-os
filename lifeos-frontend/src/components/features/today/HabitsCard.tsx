import { useHabits, useHabitLogs, useToggleHabit } from '@/hooks/useHabits';
import { HabitRow } from './HabitRow';

export function HabitsCard() {
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: logs   = [], isLoading: logsLoading } = useHabitLogs();
  const toggle = useToggleHabit();

  const loading = habitsLoading || logsLoading;
  const active  = (habits ?? []).filter(h => h.active);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Habits</p>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-surface2 animate-pulse flex-shrink-0" />
              <div className="h-4 bg-surface2 rounded animate-pulse flex-1" />
            </div>
          ))}
        </div>
      )}

      {!loading && active.length === 0 && (
        <p className="text-sm text-muted">No habits configured yet.</p>
      )}

      {!loading && active.length > 0 && (
        <div className="flex flex-col divide-y divide-border/40">
          {active.map(habit => (
            <HabitRow
              key={habit.id}
              habit={habit}
              logs={logs}
              onToggle={(habitId, completed) => toggle.mutate({ habitId, completed })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
