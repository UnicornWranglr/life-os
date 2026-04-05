// Insights — Phase 7.
// Date range picker → Focus allocation chart, Habit heatmap, Routine pattern grid, Rocks status.

import { useState } from 'react';
import { DateRangePicker, rangeToFromTo } from '@/components/features/insights/DateRangePicker';
import { FocusChart } from '@/components/features/insights/FocusChart';
import { HabitHeatmap } from '@/components/features/insights/HabitHeatmap';
import { RoutinePatternGrid } from '@/components/features/insights/RoutinePatternGrid';
import { RocksStatusCard } from '@/components/features/insights/RocksStatusCard';
import { useFocusInsight, useHabitInsight, useRoutineInsight } from '@/hooks/useInsights';
import type { RangeKey } from '@/components/features/insights/DateRangePicker';

function SectionCard({ title, sub, children }: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">{title}</p>
        {sub && <p className="text-xs text-muted/60 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Insights() {
  const [range, setRange] = useState<RangeKey>('4weeks');
  const { from, to } = rangeToFromTo(range);

  const focusQ   = useFocusInsight(from, to);
  const habitsQ  = useHabitInsight(from, to);
  const routines = useRoutineInsight(from, to);

  return (
    <div className="page">
      <h1 className="text-[26px] font-semibold tracking-tight text-primary mb-0.5">Insights</h1>
      <p className="text-sm text-muted mb-5">How you're spending your time</p>

      {/* Date range picker */}
      <div className="mb-5">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <div className="flex flex-col gap-4">
        {/* Focus allocation */}
        <SectionCard
          title="Focus allocation"
          sub="Actual sessions vs budget target per area"
        >
          <FocusChart data={focusQ.data} isLoading={focusQ.isLoading} />
        </SectionCard>

        {/* Habit completion heatmap */}
        <SectionCard
          title="Habit completion"
          sub="Weekly completion rate — darker = more consistent"
        >
          <HabitHeatmap data={habitsQ.data} isLoading={habitsQ.isLoading} />
        </SectionCard>

        {/* Routine pattern */}
        <SectionCard
          title="Routine patterns"
          sub="Daily cooking and work block — green dot = logged"
        >
          <RoutinePatternGrid data={routines.data} isLoading={routines.isLoading} />
        </SectionCard>

        {/* Quarterly rocks — not date-range filtered */}
        <RocksStatusCard />
      </div>
    </div>
  );
}
