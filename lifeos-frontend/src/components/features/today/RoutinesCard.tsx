// RoutinesCard — weekly dot pattern for 4 tracked routines.
// Dots: green = done, red = explicitly not done, grey = no log yet.
// Amber = logged but slightly off target (only applies to sleep, checked by 30min window).

import { useWeekLogs, useUpsertTodayLog } from '@/hooks/useDailyLogs';
import { getCurrentWeekDates, todayString, weekdayShort } from '@/utils/dates';
import type { DailyLog } from '@/types';

type DotStatus = 'done' | 'missed' | 'off' | 'none' | 'future';

function sleepDot(log: DailyLog | undefined, isFuture: boolean): DotStatus {
  if (isFuture) return 'future';
  if (!log?.sleepTarget) return 'none';
  return 'done';
}

function boolDot(value: boolean | null | undefined, isFuture: boolean): DotStatus {
  if (isFuture)        return 'future';
  if (value === true)  return 'done';
  if (value === false) return 'missed';
  return 'none';
}

const dotClass: Record<DotStatus, string> = {
  done:   'bg-green',
  missed: 'bg-red',
  off:    'bg-amber',
  none:   'bg-surface2 border border-border',
  future: 'bg-surface2 opacity-30',
};

interface RoutineRowProps {
  label: string;
  dots: DotStatus[];
  weekDates: string[];
}

function RoutineRow({ label, dots, weekDates }: RoutineRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-primary w-32 flex-shrink-0">{label}</p>
      <div className="flex gap-1.5">
        {dots.map((status, i) => (
          <div key={weekDates[i]} className="flex flex-col items-center gap-1">
            <div className={`w-5 h-5 rounded-full ${dotClass[status]}`} />
            <span className="text-[9px] text-muted">{weekdayShort(weekDates[i]).slice(0, 1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RoutinesCard() {
  const { data: logMap = {}, isLoading } = useWeekLogs();
  const upsert = useUpsertTodayLog();
  const today  = todayString();
  const weekDates = getCurrentWeekDates();

  // Quick-log toggles for today's routines
  function toggleRoutine(field: 'cookedDinner' | 'workBlockDone', current: boolean | null) {
    upsert.mutate({ [field]: !current });
  }

  const rows: { label: string; dots: DotStatus[] }[] = [
    {
      label: 'Cooked dinner',
      dots: weekDates.map(d => boolDot(logMap[d]?.cookedDinner, d > today)),
    },
    {
      label: 'Work block done',
      dots: weekDates.map(d => boolDot(logMap[d]?.workBlockDone, d > today)),
    },
    {
      label: 'Sleep target set',
      dots: weekDates.map(d => sleepDot(logMap[d], d > today)),
    },
    {
      label: 'Wake logged',
      dots: weekDates.map(d => {
        if (d > today) return 'future';
        return logMap[d]?.wakeTime ? 'done' : 'none';
      }),
    },
  ];

  const todayLog = logMap[today];

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-5">Routines</p>

      {isLoading ? (
        <div className="h-24 bg-surface2 rounded-xl animate-pulse" />
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map(r => (
            <RoutineRow key={r.label} label={r.label} dots={r.dots} weekDates={weekDates} />
          ))}

          {/* Quick-log row for today's boolean routines */}
          <div className="border-t border-border pt-4 flex gap-2 flex-wrap">
            <button
              onClick={() => toggleRoutine('cookedDinner', todayLog?.cookedDinner ?? null)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                ${todayLog?.cookedDinner
                  ? 'bg-green/10 border-green/30 text-green'
                  : 'bg-surface2 border-border text-muted hover:text-primary'}`}
            >
              {todayLog?.cookedDinner ? '✓ Cooked' : 'Cooked dinner?'}
            </button>
            <button
              onClick={() => toggleRoutine('workBlockDone', todayLog?.workBlockDone ?? null)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                ${todayLog?.workBlockDone
                  ? 'bg-green/10 border-green/30 text-green'
                  : 'bg-surface2 border-border text-muted hover:text-primary'}`}
            >
              {todayLog?.workBlockDone ? '✓ Work block' : 'Work block done?'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
