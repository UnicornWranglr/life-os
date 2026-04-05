// RoutinePatternGrid — dot grid for cooking, work block, sleep rows.
// Each week is a column of 7 dots (Mon–Sun); colour = green/grey based on dailyLogs data.
// Backend returns weeklyPatterns with only weeks that have at least one log,
// so we display each week as a compact column.

import type { RoutineInsight } from '@/types';
import { shortDateLabel } from '@/utils/dates';

interface RoutinePatternGridProps {
  data: RoutineInsight | undefined;
  isLoading: boolean;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function RateChip({ label, rate }: { label: string; rate: number }) {
  const pct = Math.round(rate * 100);
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
      pct >= 70 ? 'bg-green/10  text-green  border-green/20'
        : pct >= 40 ? 'bg-amber/10  text-amber  border-amber/20'
        : 'bg-surface2 text-muted border-border'
    }`}>
      {label} {pct}%
    </span>
  );
}

export function RoutinePatternGrid({ data, isLoading }: RoutinePatternGridProps) {
  if (isLoading) {
    return <div className="h-32 bg-surface2 rounded-xl animate-pulse" />;
  }

  if (!data || data.weeklyPatterns.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center">
        <p className="text-xs text-muted/50">No routine logs in this period.</p>
      </div>
    );
  }

  const { weeklyPatterns, cookingRate, workBlockRate } = data;

  const rows: { label: string; key: 'cooking' | 'workBlock' }[] = [
    { label: 'Cooked dinner', key: 'cooking' },
    { label: 'Work block',    key: 'workBlock' },
  ];

  return (
    <div>
      {/* Summary rate chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        <RateChip label="Cooking"    rate={cookingRate} />
        <RateChip label="Work block" rate={workBlockRate} />
      </div>

      {/* Grid: rows = routines, columns = weeks */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div style={{ minWidth: `${weeklyPatterns.length * 32 + 100}px` }}>
          {/* Week header */}
          <div className="flex mb-2" style={{ paddingLeft: '100px' }}>
            {weeklyPatterns.map(w => (
              <div key={w.weekStart} className="flex-shrink-0 w-8 text-center">
                <p className="text-[9px] text-muted/60 leading-none">
                  {shortDateLabel(w.weekStart).split(' ')[1]}
                </p>
              </div>
            ))}
          </div>

          {/* Routine rows */}
          {rows.map(row => (
            <div key={row.key} className="flex items-center mb-3">
              <p className="text-xs text-muted w-[100px] flex-shrink-0 pr-2 leading-tight">
                {row.label}
              </p>
              <div className="flex gap-0">
                {weeklyPatterns.map(week => (
                  <div key={week.weekStart}
                       className="flex-shrink-0 w-8 flex flex-col gap-0.5 items-center">
                    {(week[row.key] as boolean[]).map((done, dayIdx) => (
                      <div
                        key={dayIdx}
                        className={`w-4 h-4 rounded-full ${done ? 'bg-green/70' : 'bg-surface2'}`}
                        title={`${DAY_LABELS[dayIdx]}: ${done ? 'done' : 'not logged'}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Day labels column (shown once on the left of first data column) */}
          <div className="flex" style={{ paddingLeft: '100px' }}>
            <div className="flex-shrink-0 w-8 flex flex-col gap-0.5 items-center">
              {DAY_LABELS.map((d, i) => (
                <p key={i} className="text-[9px] text-muted/40 leading-none h-4 flex items-center">
                  {d}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
