// MorningAnchorBanner — shown before 12:00 if today's log has no wakeTime.
// Fields: wake time, planned work block (boolean). Dismissible until page reload or save.

import { useState } from 'react';
import { useTodayLog, useUpsertTodayLog } from '@/hooks/useDailyLogs';
import { useAreas } from '@/hooks/useAreas';
import { useRecentSessions } from '@/hooks/useSessions';
import { getMomentum, suggestFocusArea } from '@/utils/momentum';

export function MorningAnchorBanner() {
  const { data: todayLog, isLoading } = useTodayLog();
  const { data: areas    = [] }       = useAreas();
  const { data: sessions = [] }       = useRecentSessions();
  const upsert = useUpsertTodayLog();

  const [dismissed,   setDismissed]   = useState(false);
  const [wakeTime,    setWakeTime]    = useState('');
  const [workPlanned, setWorkPlanned] = useState(true);

  // Time check — only show before noon
  const hour = new Date().getHours();
  if (hour >= 12) return null;

  // Don't show if loading or already dismissed
  if (isLoading || dismissed) return null;

  // Already anchored if wakeTime is already logged
  if (todayLog?.wakeTime) return null;

  // Suggest focus area for context
  const active   = areas.filter(a => a.status === 'active');
  const momentum = new Map(active.map(a => [a.id, getMomentum(a, sessions)]));
  const suggested = suggestFocusArea(active, momentum);

  async function handleSave() {
    await upsert.mutateAsync({
      wakeTime:     wakeTime || null,
      workBlockDone: workPlanned ? null : false, // don't mark done yet, just acknowledge plan
    });
    setDismissed(true);
  }

  return (
    <div className="bg-accent/10 border border-accent/25 rounded-2xl p-4 mb-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-light">
            Morning anchor
          </p>
          {suggested && (
            <p className="text-xs text-muted mt-0.5">
              Suggested focus today:{' '}
              <span className="text-primary font-medium">{suggested.name}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted/50 hover:text-muted text-lg leading-none flex-shrink-0 -mt-0.5"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {/* Wake time */}
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted w-24 flex-shrink-0">Wake time</p>
          <input
            type="time"
            value={wakeTime}
            onChange={e => setWakeTime(e.target.value)}
            className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2 text-sm
                       text-primary outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Work block planned */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted">Work block planned today?</p>
          <button
            onClick={() => setWorkPlanned(p => !p)}
            className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
              workPlanned ? 'bg-accent' : 'bg-surface2 border border-border'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
              workPlanned ? 'left-5' : 'left-1'
            }`} />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={upsert.isPending}
          className="w-full bg-accent text-white text-sm font-semibold rounded-xl py-2.5
                     transition-opacity disabled:opacity-50 mt-1"
        >
          {upsert.isPending ? 'Saving…' : 'Start the day'}
        </button>
      </div>
    </div>
  );
}
