// Shared read-only computed sections for both ReviewForm and CompletedReview:
//   1. Area momentum — session count per area this week
//   2. Focus allocation — actual % vs target
//   3. Routine pattern — Mon–Sun dots for 4 tracked routines

import type { Area, Session, DailyLog } from '@/types';
import { weekdayShort, todayString } from '@/utils/dates';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReadOnlySectionsProps {
  sessions: Session[];
  areas: Area[];
  logMap: Record<string, DailyLog>;
  weekDates: string[];  // Mon[0] … Sun[6]
}

// ─── Routine dots ─────────────────────────────────────────────────────────────

type DotStatus = 'done' | 'missed' | 'none' | 'future';

const dotClass: Record<DotStatus, string> = {
  done:   'bg-green',
  missed: 'bg-red',
  none:   'bg-surface2 border border-border',
  future: 'bg-surface2 opacity-30',
};

function boolDot(value: boolean | null | undefined, isFuture: boolean): DotStatus {
  if (isFuture)        return 'future';
  if (value === true)  return 'done';
  if (value === false) return 'missed';
  return 'none';
}

function wakeOrSleepDot(value: string | null | undefined, isFuture: boolean): DotStatus {
  if (isFuture) return 'future';
  return value ? 'done' : 'none';
}

function DotGrid({ label, dots, weekDates }: { label: string; dots: DotStatus[]; weekDates: string[] }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-muted w-28 flex-shrink-0 leading-tight">{label}</p>
      <div className="flex gap-1.5">
        {dots.map((status, i) => (
          <div key={weekDates[i]} className="flex flex-col items-center gap-0.5">
            <div className={`w-4 h-4 rounded-full ${dotClass[status]}`} />
            <span className="text-[8px] text-muted leading-none">
              {weekdayShort(weekDates[i]).slice(0, 1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">{title}</p>
      {children}
    </div>
  );
}

// ─── Exported sections ────────────────────────────────────────────────────────

export function MomentumSection({ sessions, areas }: Pick<ReadOnlySectionsProps, 'sessions' | 'areas'>) {
  const active = areas.filter(a => a.status === 'active');
  const counts = new Map(active.map(a => [a.id, 0]));
  for (const s of sessions) {
    if (counts.has(s.areaId)) counts.set(s.areaId, (counts.get(s.areaId) ?? 0) + 1);
  }

  return (
    <SectionCard title="Area momentum">
      {active.length === 0 ? (
        <p className="text-xs text-muted/50">No active areas.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {active.map(area => {
            const n = counts.get(area.id) ?? 0;
            return (
              <div key={area.id} className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: area.color }} />
                <p className="text-sm text-primary flex-1 truncate">{area.name}</p>
                <span className={`text-xs font-medium flex-shrink-0 ${n > 0 ? 'text-accent-light' : 'text-muted/50'}`}>
                  {n} {n === 1 ? 'session' : 'sessions'}
                </span>
              </div>
            );
          })}
          {sessions.length === 0 && (
            <p className="text-xs text-muted/50 mt-1">No sessions logged this week.</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

export function AllocationSection({ sessions, areas }: Pick<ReadOnlySectionsProps, 'sessions' | 'areas'>) {
  const active = areas.filter(a => a.status === 'active');
  const total  = sessions.length;

  if (total === 0) {
    return (
      <SectionCard title="Focus allocation">
        <p className="text-xs text-muted/50">No sessions this week — nothing to compare yet.</p>
      </SectionCard>
    );
  }

  const counts = new Map(active.map(a => [a.id, 0]));
  for (const s of sessions) {
    if (counts.has(s.areaId)) counts.set(s.areaId, (counts.get(s.areaId) ?? 0) + 1);
  }

  return (
    <SectionCard title="Focus allocation">
      <div className="flex flex-col gap-3">
        {active.map(area => {
          const n      = counts.get(area.id) ?? 0;
          const actual = Math.round((n / total) * 100);
          const target = area.focusBudgetPct;
          const delta  = actual - target;
          return (
            <div key={area.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: area.color }} />
                  <p className="text-xs text-primary truncate">{area.name}</p>
                </div>
                <span className={`text-[11px] font-medium flex-shrink-0 ml-2 ${
                  delta > 5 ? 'text-amber' : delta < -5 ? 'text-muted' : 'text-accent-light'
                }`}>
                  {actual}% <span className="text-muted">/ {target}% target</span>
                </span>
              </div>
              {/* Progress bar: actual fill on top of target marker */}
              <div className="relative h-1.5 bg-surface2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${actual}%`, background: area.color, opacity: 0.7 }}
                />
                {/* Target marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-border"
                  style={{ left: `${target}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

export function RoutineSection({ logMap, weekDates }: Pick<ReadOnlySectionsProps, 'logMap' | 'weekDates'>) {
  const today = todayString();

  const rows: { label: string; dots: DotStatus[] }[] = [
    {
      label: 'Cooked dinner',
      dots: weekDates.map(d => boolDot(logMap[d]?.cookedDinner, d > today)),
    },
    {
      label: 'Work block',
      dots: weekDates.map(d => boolDot(logMap[d]?.workBlockDone, d > today)),
    },
    {
      label: 'Sleep target',
      dots: weekDates.map(d => wakeOrSleepDot(logMap[d]?.sleepTarget, d > today)),
    },
    {
      label: 'Wake logged',
      dots: weekDates.map(d => wakeOrSleepDot(logMap[d]?.wakeTime, d > today)),
    },
  ];

  return (
    <SectionCard title="Routine pattern">
      <div className="flex flex-col gap-3">
        {rows.map(r => (
          <DotGrid key={r.label} label={r.label} dots={r.dots} weekDates={weekDates} />
        ))}
      </div>
    </SectionCard>
  );
}
