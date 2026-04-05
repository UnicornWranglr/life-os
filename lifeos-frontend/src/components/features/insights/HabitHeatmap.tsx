// HabitHeatmap — one row per habit, one cell per week bucket.
// Cell opacity scales with weeklyRates[i] (0..1).

import type { HabitInsight } from '@/types';

interface HabitHeatmapProps {
  data: HabitInsight | undefined;
  isLoading: boolean;
}

// Heatmap colour: accent green scaled by completion rate
function cellStyle(rate: number): React.CSSProperties {
  if (rate === 0) return { background: '#242424' };
  // interpolate from surface2 to accent at full rate
  const opacity = 0.15 + rate * 0.85;
  return { background: `rgba(23, 163, 122, ${opacity})` };
}

function rateLabel(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function HabitHeatmap({ data, isLoading }: HabitHeatmapProps) {
  if (isLoading) {
    return <div className="h-32 bg-surface2 rounded-xl animate-pulse" />;
  }

  const habits = data?.byHabit ?? [];

  if (habits.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center">
        <p className="text-xs text-muted/50">No habits configured.</p>
      </div>
    );
  }

  const maxWeeks = Math.max(...habits.map(h => h.weeklyRates.length), 1);

  return (
    <div className="flex flex-col gap-3">
      {habits.map(habit => (
        <div key={habit.habitId}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-primary truncate flex-1 min-w-0 pr-2">
              {habit.name}
            </p>
            <span className={`text-[11px] font-medium flex-shrink-0 ${
              habit.completionRate >= 0.7 ? 'text-accent-light'
                : habit.completionRate >= 0.4 ? 'text-amber'
                : 'text-red/70'
            }`}>
              {rateLabel(habit.completionRate)} avg
            </span>
          </div>
          <div className="flex gap-1">
            {habit.weeklyRates.map((rate, i) => (
              <div
                key={i}
                className="flex-1 h-6 rounded"
                style={cellStyle(rate)}
                title={`Week ${i + 1}: ${rateLabel(rate)}`}
              />
            ))}
            {/* Pad to consistent width if fewer weeks than max */}
            {Array.from({ length: maxWeeks - habit.weeklyRates.length }).map((_, i) => (
              <div key={`pad-${i}`} className="flex-1 h-6 rounded bg-surface2 opacity-20" />
            ))}
          </div>
        </div>
      ))}

      {/* Week labels: W1 … Wn */}
      {maxWeeks > 1 && (
        <div className="flex gap-1 mt-0.5">
          {Array.from({ length: maxWeeks }).map((_, i) => (
            <p key={i} className="flex-1 text-center text-[9px] text-muted/50">
              {i === 0 ? 'W1' : i === maxWeeks - 1 ? `W${maxWeeks}` : ''}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
