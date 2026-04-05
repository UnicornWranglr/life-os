// Areas cockpit — list of all active areas with momentum, focus budget, and next action.

import { useAreas } from '@/hooks/useAreas';
import { useRecentSessions } from '@/hooks/useSessions';
import { useAllProjectItems } from '@/hooks/useProjectItems';
import { getMomentum } from '@/utils/momentum';
import { AreaCockpitCard } from '@/components/features/areas/AreaCockpitCard';
import type { ProjectItem } from '@/types';

export function Areas() {
  const { data: areas    = [], isLoading: areasLoading    } = useAreas();
  const { data: sessions = [], isLoading: sessionsLoading } = useRecentSessions();
  const { data: items    = [], isLoading: itemsLoading    } = useAllProjectItems();

  const isLoading = areasLoading || sessionsLoading || itemsLoading;

  const active = areas.filter(a => a.status === 'active');

  // Build a map: areaId → first next action
  const nextActionMap = new Map<string, ProjectItem>();
  for (const item of items) {
    if (item.type === 'action' && item.status === 'next' && !nextActionMap.has(item.areaId)) {
      nextActionMap.set(item.areaId, item);
    }
  }

  return (
    <div className="page">
      <h1 className="text-[26px] font-semibold tracking-tight text-primary mb-0.5">Areas</h1>
      <p className="text-sm text-muted mb-6">Your active focus areas</p>

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
            />
          ))}
        </div>
      )}

      {areas.filter(a => a.status === 'paused').length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">Paused</p>
          <div className="flex flex-col gap-2">
            {areas.filter(a => a.status === 'paused').map(area => (
              <div key={area.id}
                   className="bg-surface border border-border rounded-2xl px-4 py-3
                              flex items-center gap-2.5 opacity-50">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                     style={{ background: area.color }} />
                <p className="text-sm text-muted">{area.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
