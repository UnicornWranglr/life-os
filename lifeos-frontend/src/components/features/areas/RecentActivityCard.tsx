// RecentActivityCard — last 14 days of sessions across all areas, shown in Areas cockpit.

import { useRecentActivity } from '@/hooks/useSessions';
import { useAreas } from '@/hooks/useAreas';
import { SessionRow } from './SessionRow';

export function RecentActivityCard() {
  const { data: sessions = [], isLoading: sessLoading } = useRecentActivity();
  const { data: areas   = [], isLoading: areasLoading } = useAreas();

  const isLoading = sessLoading || areasLoading;
  const areaMap   = new Map(areas.map(a => [a.id, a]));

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Recent activity
        </p>
        <span className="text-xs text-muted">Last 14 days</span>
      </div>

      <div className="px-4">
        {isLoading && (
          <div className="py-3 flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-surface2 rounded animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <p className="text-xs text-muted/50 py-3">No sessions in the last 14 days.</p>
        )}

        {!isLoading && sessions.length > 0 && (
          <div className="divide-y divide-border/40">
            {sessions.map(s => {
              const area = areaMap.get(s.areaId);
              return (
                <SessionRow
                  key={s.id}
                  session={s}
                  areaName={area?.name}
                  areaColor={area?.color}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
