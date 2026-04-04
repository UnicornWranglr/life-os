import { useAreas } from '@/hooks/useAreas';
import { useRecentSessions } from '@/hooks/useSessions';
import { getMomentum } from '@/utils/momentum';
import { MomentumChip } from './MomentumChip';

export function MomentumCard() {
  const { data: areas   = [], isLoading: areasLoading  } = useAreas();
  const { data: sessions = [], isLoading: sessLoading  } = useRecentSessions();

  const loading = areasLoading || sessLoading;
  const active  = areas.filter(a => a.status === 'active');

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Momentum</p>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-surface2 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && active.length === 0 && (
        <p className="text-sm text-muted">No active areas yet.</p>
      )}

      {!loading && active.length > 0 && (
        <div className="flex flex-col gap-3">
          {active.map(area => (
            <MomentumChip
              key={area.id}
              area={area}
              momentum={getMomentum(area, sessions)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
