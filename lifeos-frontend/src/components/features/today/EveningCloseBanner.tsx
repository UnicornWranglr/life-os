// EveningCloseBanner — shown after 18:00 if sleepTarget not yet set for today.
// Fields: tomorrow's one thing (tomorrowOneThing), cooked dinner, work block done, sleep target.

import { useState } from 'react';
import { useTodayLog, useUpsertTodayLog } from '@/hooks/useDailyLogs';

export function EveningCloseBanner() {
  const { data: todayLog, isLoading } = useTodayLog();
  const upsert = useUpsertTodayLog();

  const [dismissed,    setDismissed]    = useState(false);
  const [oneThing,     setOneThing]     = useState('');
  const [cooked,       setCooked]       = useState<boolean | null>(null);
  const [workDone,     setWorkDone]     = useState<boolean | null>(null);
  const [sleepTarget,  setSleepTarget]  = useState('');

  const hour = new Date().getHours();
  if (hour < 18) return null;
  if (isLoading || dismissed) return null;

  // Already closed if sleepTarget is set
  if (todayLog?.sleepTarget) return null;

  async function handleSave() {
    await upsert.mutateAsync({
      tomorrowOneThing: oneThing.trim() || null,
      cookedDinner:     cooked,
      workBlockDone:    workDone,
      sleepTarget:      sleepTarget || null,
    });
    setDismissed(true);
  }

  function BoolToggle({
    label, value, onChange,
  }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{label}</p>
        <div className="flex gap-1.5">
          <button
            onClick={() => onChange(true)}
            className={`text-xs px-3 py-1 rounded-lg border transition-colors
              ${value === true
                ? 'bg-green/10 border-green/30 text-green'
                : 'bg-surface2 border-border text-muted'}`}
          >
            Yes
          </button>
          <button
            onClick={() => onChange(false)}
            className={`text-xs px-3 py-1 rounded-lg border transition-colors
              ${value === false
                ? 'bg-red/10 border-red/30 text-red/80'
                : 'bg-surface2 border-border text-muted'}`}
          >
            No
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 mt-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Evening close</p>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted/50 hover:text-muted text-lg leading-none flex-shrink-0 -mt-0.5"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Tomorrow's one thing */}
        <div>
          <p className="text-xs text-muted mb-1.5">Tomorrow's one thing</p>
          <input
            value={oneThing}
            onChange={e => setOneThing(e.target.value)}
            placeholder="What's the most important thing tomorrow?"
            className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm
                       text-primary placeholder:text-muted/40 outline-none focus:border-accent transition-colors"
          />
        </div>

        <BoolToggle label="Cooked dinner?"    value={cooked}   onChange={v => setCooked(v)} />
        <BoolToggle label="Work block done?"  value={workDone} onChange={v => setWorkDone(v)} />

        {/* Sleep target */}
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted w-28 flex-shrink-0">Sleep target</p>
          <input
            type="time"
            value={sleepTarget}
            onChange={e => setSleepTarget(e.target.value)}
            className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2 text-sm
                       text-primary outline-none focus:border-accent transition-colors"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={upsert.isPending}
          className="w-full bg-surface2 border border-border text-sm font-medium text-primary
                     rounded-xl py-2.5 transition-opacity disabled:opacity-50 mt-1"
        >
          {upsert.isPending ? 'Saving…' : 'Close the day'}
        </button>
      </div>
    </div>
  );
}
