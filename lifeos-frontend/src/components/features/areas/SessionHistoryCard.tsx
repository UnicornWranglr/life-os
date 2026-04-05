// SessionHistoryCard — last 10 sessions for one area, shown in AreaDetail.

import { useAreaSessions } from '@/hooks/useSessions';
import { SessionRow } from './SessionRow';

interface SessionHistoryCardProps {
  areaId: string;
}

export function SessionHistoryCard({ areaId }: SessionHistoryCardProps) {
  const { data: sessions = [], isLoading } = useAreaSessions(areaId);
  const recent = sessions.slice(0, 10);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Session history
        </p>
        {sessions.length > 0 && (
          <span className="text-xs text-muted">{sessions.length} total</span>
        )}
      </div>

      <div className="px-4">
        {isLoading && (
          <div className="py-3 flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-surface2 rounded animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && recent.length === 0 && (
          <p className="text-xs text-muted/50 py-3">No sessions logged yet — tap "Log session" to start.</p>
        )}

        {!isLoading && recent.length > 0 && (
          <div className="divide-y divide-border/40">
            {recent.map(s => <SessionRow key={s.id} session={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
