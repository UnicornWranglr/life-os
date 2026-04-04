// FocusCard — shows the suggested focus area, a swap button, and a Log session CTA.
// Suggested area is whichever active area has the worst momentum (red > amber > green).

import { useState } from 'react';
import { useAreas } from '@/hooks/useAreas';
import { useRecentSessions } from '@/hooks/useSessions';
import { getMomentum, suggestFocusArea } from '@/utils/momentum';
import { LogSessionSheet } from './LogSessionSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { Area } from '@/types';

export function FocusCard() {
  const { data: areas   = [], isLoading: areasLoading  } = useAreas();
  const { data: sessions = [], isLoading: sessLoading  } = useRecentSessions();

  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [swapOpen,     setSwapOpen]     = useState(false);
  const [logOpen,      setLogOpen]      = useState(false);

  const loading  = areasLoading || sessLoading;
  const active   = areas.filter(a => a.status === 'active');
  const momentum = new Map(active.map(a => [a.id, getMomentum(a, sessions)]));
  const suggested = selectedArea ?? suggestFocusArea(active, momentum);

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Focus</p>
        <div className="h-16 bg-surface2 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!suggested) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">Focus</p>
        <p className="text-sm text-muted">No active areas yet. Add areas to get started.</p>
      </div>
    );
  }

  const m = momentum.get(suggested.id);
  const levelColor = m?.level === 'green' ? '#6fcf6f' : m?.level === 'amber' ? '#c4a05a' : '#e05555';

  return (
    <>
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Focus</p>
          <button
            onClick={() => setSwapOpen(true)}
            className="text-xs text-muted hover:text-primary transition-colors"
          >
            Swap ↕
          </button>
        </div>

        {/* Area name + momentum indicator */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: suggested.color }} />
          <p className="text-lg font-semibold text-primary">{suggested.name}</p>
          {m && (
            <span className="ml-auto text-xs font-medium" style={{ color: levelColor }}>
              {m.label}
            </span>
          )}
        </div>

        <button
          onClick={() => setLogOpen(true)}
          className="w-full bg-accent/10 border border-accent/25 text-accent-light font-semibold
                     text-sm rounded-xl py-3.5 transition-colors hover:bg-accent/20 active:opacity-70"
        >
          Log session →
        </button>
      </div>

      {/* Swap area sheet */}
      <BottomSheet open={swapOpen} onClose={() => setSwapOpen(false)} title="Choose focus area">
        <div className="flex flex-col gap-2">
          {active.map(area => {
            const m = momentum.get(area.id);
            const levelColor = m?.level === 'green' ? '#6fcf6f' : m?.level === 'amber' ? '#c4a05a' : '#e05555';
            const isSelected = (selectedArea ?? suggested)?.id === area.id;
            return (
              <button
                key={area.id}
                onClick={() => { setSelectedArea(area); setSwapOpen(false); }}
                className={`flex items-center gap-3 px-4 py-4 rounded-xl border text-left transition-colors
                  ${isSelected
                    ? 'bg-accent/10 border-accent/30'
                    : 'bg-surface2 border-border hover:border-accent/30'}`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: area.color }} />
                <p className="flex-1 text-sm font-medium text-primary">{area.name}</p>
                {m && <span className="text-xs" style={{ color: levelColor }}>{m.label}</span>}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Log session sheet */}
      {suggested && (
        <LogSessionSheet
          area={suggested}
          open={logOpen}
          onClose={() => setLogOpen(false)}
        />
      )}
    </>
  );
}
