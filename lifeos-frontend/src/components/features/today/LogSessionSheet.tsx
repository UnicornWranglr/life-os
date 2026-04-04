// Log session bottom sheet — opened from FocusCard's "Log session" CTA.

import { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useLogSession } from '@/hooks/useSessions';
import { todayString } from '@/utils/dates';
import type { Area, SessionCompleted } from '@/types';

interface LogSessionSheetProps {
  area: Area;
  open: boolean;
  onClose: () => void;
}

const ENERGY_LABELS = ['', 'Low', 'Below avg', 'Average', 'Good', 'Great'];

export function LogSessionSheet({ area, open, onClose }: LogSessionSheetProps) {
  const logSession = useLogSession();

  const [plannedOutcome, setPlannedOutcome] = useState('');
  const [actualOutcome,  setActualOutcome]  = useState('');
  const [completed,      setCompleted]      = useState<SessionCompleted>('yes');
  const [energyOut,      setEnergyOut]      = useState(3);
  const [durationMins,   setDurationMins]   = useState('');
  const [blockers,       setBlockers]       = useState('');

  function reset() {
    setPlannedOutcome('');
    setActualOutcome('');
    setCompleted('yes');
    setEnergyOut(3);
    setDurationMins('');
    setBlockers('');
  }

  async function handleSubmit() {
    await logSession.mutateAsync({
      areaId: area.id,
      sessionDate: todayString(),
      plannedOutcome: plannedOutcome || null,
      actualOutcome:  actualOutcome  || null,
      completed,
      energyOut,
      durationMins: durationMins ? parseInt(durationMins, 10) : null,
      blockers: blockers || null,
    });
    reset();
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Log session">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: area.color }} />
        <p className="text-sm font-medium text-primary">{area.name}</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Completed toggle */}
        <div>
          <p className="text-xs text-muted mb-2">Session completed?</p>
          <div className="flex gap-2">
            {(['yes', 'partial', 'no'] as SessionCompleted[]).map(v => (
              <button
                key={v}
                onClick={() => setCompleted(v)}
                className={`flex-1 text-xs font-medium py-2 rounded-xl border transition-colors capitalize
                  ${completed === v
                    ? 'bg-accent/15 border-accent/40 text-accent-light'
                    : 'bg-surface2 border-border text-muted'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Planned outcome */}
        <div>
          <p className="text-xs text-muted mb-1.5">Planned outcome</p>
          <input
            value={plannedOutcome}
            onChange={e => setPlannedOutcome(e.target.value)}
            placeholder="What did you set out to do?"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm
                       text-primary placeholder-border outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Actual outcome */}
        <div>
          <p className="text-xs text-muted mb-1.5">Actual outcome</p>
          <input
            value={actualOutcome}
            onChange={e => setActualOutcome(e.target.value)}
            placeholder="What actually happened?"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm
                       text-primary placeholder-border outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Energy + duration row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted mb-1.5">Energy out: <span className="text-primary">{ENERGY_LABELS[energyOut]}</span></p>
            <input
              type="range" min={1} max={5} value={energyOut}
              onChange={e => setEnergyOut(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
          <div className="w-24">
            <p className="text-xs text-muted mb-1.5">Duration (min)</p>
            <input
              type="number" min={1} max={480} value={durationMins}
              onChange={e => setDurationMins(e.target.value)}
              placeholder="60"
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-sm
                         text-primary placeholder-border outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Blockers */}
        <div>
          <p className="text-xs text-muted mb-1.5">Blockers (optional)</p>
          <input
            value={blockers}
            onChange={e => setBlockers(e.target.value)}
            placeholder="Anything that got in the way?"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm
                       text-primary placeholder-border outline-none focus:border-accent transition-colors"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={logSession.isPending}
          className="mt-1 w-full bg-accent text-white font-semibold text-sm rounded-xl py-4
                     transition-opacity disabled:opacity-50"
        >
          {logSession.isPending ? 'Saving…' : 'Save session'}
        </button>
      </div>
    </BottomSheet>
  );
}
