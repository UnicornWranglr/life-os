// RocksStatusCard — active quarterly rocks with current status badges.

import { useCurrentRocks } from '@/hooks/useRocks';
import { useAreas } from '@/hooks/useAreas';

const statusStyle: Record<string, string> = {
  on_track: 'bg-green/10  text-green  border-green/20',
  at_risk:  'bg-amber/10  text-amber  border-amber/20',
  done:     'bg-accent/10 text-accent-light border-accent/20',
};

const statusLabel: Record<string, string> = {
  on_track: 'On track',
  at_risk:  'At risk',
  done:     'Done',
};

export function RocksStatusCard() {
  const { data: rocks = [], isLoading: rocksLoading } = useCurrentRocks();
  const { data: areas = [], isLoading: areasLoading } = useAreas();

  const isLoading = rocksLoading || areasLoading;
  const areaMap   = new Map(areas.map(a => [a.id, a]));

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
        Quarterly rocks
      </p>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => (
            <div key={i} className="h-10 bg-surface2 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && rocks.length === 0 && (
        <p className="text-xs text-muted/50">No quarterly rocks configured yet.</p>
      )}

      {!isLoading && rocks.length > 0 && (
        <div className="flex flex-col gap-3">
          {rocks.map(rock => {
            const area = areaMap.get(rock.areaId);
            return (
              <div key={rock.id} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {area && (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 inline-block"
                            style={{ background: area.color }} />
                      <span className="text-[10px] text-muted">{area.name}</span>
                    </div>
                  )}
                  <p className="text-sm text-primary leading-snug">{rock.title}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5
                                  ${statusStyle[rock.status] ?? 'bg-surface2 text-muted border-border'}`}>
                  {statusLabel[rock.status] ?? rock.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
