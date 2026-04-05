// FocusChart — horizontal bar chart showing actual session % vs budget target per area.
// Uses Recharts BarChart. Target shown as a reference line on each bar.

import {
  BarChart, Bar, XAxis, YAxis, Cell,
  ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts';
import type { FocusInsight } from '@/types';

interface FocusChartProps {
  data: FocusInsight | undefined;
  isLoading: boolean;
}

interface TooltipPayload {
  value: number;
  payload: { name: string; pct: number; focusBudgetPct: number; color: string };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-primary mb-1">{d.name}</p>
      <p className="text-muted">Actual: <span className="text-primary font-medium">{d.pct}%</span></p>
      <p className="text-muted">Target: <span className="text-muted font-medium">{d.focusBudgetPct}%</span></p>
    </div>
  );
}

export function FocusChart({ data, isLoading }: FocusChartProps) {
  if (isLoading) {
    return <div className="h-48 bg-surface2 rounded-xl animate-pulse" />;
  }

  const rows = data?.byArea ?? [];

  if (rows.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-xs text-muted/50">No sessions logged in this period.</p>
      </div>
    );
  }

  // Sort by actual pct desc for visual clarity
  const sorted = [...rows].sort((a, b) => b.pct - a.pct);

  return (
    <div>
      <ResponsiveContainer width="100%" height={sorted.length * 44 + 16}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 48, bottom: 4, left: 4 }}
          barCategoryGap="30%"
        >
          <CartesianGrid horizontal={false} stroke="#2e2e2e" strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fill: '#888', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: '#f0f0f0', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {sorted.map(entry => (
              <Cell key={entry.areaId} fill={entry.color} fillOpacity={0.75} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Target markers — drawn as a separate legend row below the chart */}
      <div className="flex flex-col gap-1.5 mt-3">
        {sorted.map(entry => {
          const delta = entry.pct - entry.focusBudgetPct;
          return (
            <div key={entry.areaId} className="flex items-center gap-2 text-[11px]">
              <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: entry.color, opacity: 0.8 }} />
              <span className="text-muted flex-1 truncate">{entry.name}</span>
              <span className={`font-medium flex-shrink-0 ${
                delta > 5 ? 'text-amber' : delta < -5 ? 'text-red/70' : 'text-accent-light'
              }`}>
                {entry.pct}%
              </span>
              <span className="text-muted flex-shrink-0">/ {entry.focusBudgetPct}% target</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
