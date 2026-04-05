// SessionRow — one logged session, used in both SessionHistoryCard and RecentActivityCard.

import type { Session } from '@/types';
import { relativeDay } from '@/utils/dates';

const completedStyles: Record<string, string> = {
  yes:     'bg-green/10  text-green  border-green/20',
  partial: 'bg-amber/10  text-amber  border-amber/20',
  no:      'bg-red/10    text-red    border-red/20',
};

const completedLabel: Record<string, string> = {
  yes: 'Done', partial: 'Partial', no: 'No',
};

function EnergyPips({ energy }: { energy: number }) {
  return (
    <span className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            i <= energy ? 'bg-accent-light' : 'bg-surface2'
          }`}
        />
      ))}
    </span>
  );
}

interface SessionRowProps {
  session: Session;
  // Pass these when showing sessions across multiple areas (RecentActivityCard)
  areaName?: string;
  areaColor?: string;
}

export function SessionRow({ session, areaName, areaColor }: SessionRowProps) {
  return (
    <div className="py-2.5">
      {/* Line 1: area (if cross-area) + date + completed badge + energy + duration */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {areaColor && areaName && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0 inline-block"
                  style={{ background: areaColor }} />
            <span className="text-xs font-medium text-primary">{areaName}</span>
          </span>
        )}

        <span className="text-xs text-muted">{relativeDay(session.sessionDate)}</span>

        {session.completed && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border
                            ${completedStyles[session.completed]}`}>
            {completedLabel[session.completed] ?? session.completed}
          </span>
        )}

        {session.energyOut != null && <EnergyPips energy={session.energyOut} />}

        {session.durationMins != null && (
          <span className="text-xs text-muted">{session.durationMins} min</span>
        )}
      </div>

      {/* Line 2: actual outcome summary */}
      {session.actualOutcome && (
        <p className="text-xs text-muted mt-0.5 truncate leading-snug">
          {session.actualOutcome}
        </p>
      )}
    </div>
  );
}
