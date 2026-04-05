// Areas cockpit — list of all active areas with momentum, focus budget, and next action.

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAreas } from '@/hooks/useAreas';
import { useRecentSessions } from '@/hooks/useSessions';
import { useAllProjectItems } from '@/hooks/useProjectItems';
import { getMomentum } from '@/utils/momentum';
import { AreaCockpitCard } from '@/components/features/areas/AreaCockpitCard';
import { RecentActivityCard } from '@/components/features/areas/RecentActivityCard';
import { AreaFormSheet } from '@/components/features/areas/AreaFormSheet';
import { areasApi } from '@/api/areas';
import type { Area, ProjectItem } from '@/types';

export function Areas() {
  const { data: areas    = [], isLoading: areasLoading    } = useAreas();
  const { data: sessions = [], isLoading: sessionsLoading } = useRecentSessions();
  const { data: items    = [], isLoading: itemsLoading    } = useAllProjectItems();
  const qc = useQueryClient();

  const [formOpen,    setFormOpen]    = useState(false);
  const [editingArea, setEditingArea] = useState<Area | undefined>(undefined);
  const [archiving,   setArchiving]   = useState<string | null>(null);

  const isLoading = areasLoading || sessionsLoading || itemsLoading;
  const active    = areas.filter(a => a.status === 'active');

  const nextActionMap = new Map<string, ProjectItem>();
  for (const item of items) {
    if (item.type === 'action' && item.status === 'next' && !nextActionMap.has(item.areaId)) {
      nextActionMap.set(item.areaId, item);
    }
  }

  function openAdd()         { setEditingArea(undefined); setFormOpen(true); }
  function openEdit(a: Area) { setEditingArea(a);         setFormOpen(true); }

  async function handleArchive(id: string) {
    setArchiving(id);
    try {
      await areasApi.archive(id);
      qc.invalidateQueries({ queryKey: ['areas'] });
    } finally {
      setArchiving(null);
    }
  }

  return (
    <div className="page">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-primary mb-0.5">Areas</h1>
          <p className="text-sm text-muted">Your active focus areas</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 text-xs font-medium text-accent-light
                     bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full
                     active:opacity-70 transition-opacity mt-1"
        >
          <span className="text-base leading-none">+</span>
          Add area
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-surface border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : active.length === 0 ? (
        <p className="text-sm text-muted text-center mt-16">No active areas configured.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map(area => (
            <AreaCockpitCard
              key={area.id}
              area={area}
              momentum={getMomentum(area, sessions)}
              nextAction={nextActionMap.get(area.id)}
              onEdit={() => openEdit(area)}
              onArchive={archiving === area.id ? undefined : () => handleArchive(area.id)}
            />
          ))}
        </div>
      )}

      {areas.filter(a => a.status === 'paused').length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">Paused</p>
          <div className="flex flex-col gap-2">
            {areas.filter(a => a.status === 'paused').map(area => (
              <div key={area.id}
                   className="bg-surface border border-border rounded-2xl px-4 py-3
                              flex items-center justify-between gap-2.5 opacity-60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                       style={{ background: area.color }} />
                  <p className="text-sm text-muted truncate">{area.name}</p>
                </div>
                <button
                  onClick={() => openEdit(area)}
                  className="text-xs text-muted active:opacity-70 flex-shrink-0"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <RecentActivityCard />
      </div>

      <AreaFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        area={editingArea}
      />
    </div>
  );
}
