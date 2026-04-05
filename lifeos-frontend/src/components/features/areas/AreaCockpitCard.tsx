// AreaCockpitCard — one card in the Areas cockpit list.
// Shows: area colour + name, momentum chip, focus budget, first next action.

import { useNavigate } from 'react-router-dom';
import type { Area, AreaMomentum, ProjectItem } from '@/types';

interface AreaCockpitCardProps {
  area: Area;
  momentum: AreaMomentum;
  nextAction: ProjectItem | undefined;
}

const momentumStyles: Record<AreaMomentum['level'], { chip: string; dot: string }> = {
  green: { chip: 'bg-green/10 text-green border-green/20',   dot: 'bg-green' },
  amber: { chip: 'bg-amber/10 text-amber border-amber/20',   dot: 'bg-amber' },
  red:   { chip: 'bg-red/10   text-red   border-red/20',     dot: 'bg-red' },
};

export function AreaCockpitCard({ area, momentum, nextAction }: AreaCockpitCardProps) {
  const navigate = useNavigate();
  const styles   = momentumStyles[momentum.level];

  return (
    <button
      onClick={() => navigate(`/areas/${area.id}`)}
      className="w-full bg-surface border border-border rounded-2xl p-4 text-left
                 active:opacity-70 transition-opacity"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: colour dot + name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
            style={{ background: area.color }}
          />
          <p className="text-sm font-semibold text-primary leading-tight truncate">
            {area.name}
          </p>
        </div>

        {/* Right: momentum chip */}
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0
                          ${styles.chip}`}>
          {momentum.label}
        </span>
      </div>

      {/* Focus budget */}
      <p className="text-xs text-muted mt-1.5 ml-[22px]">
        {area.focusBudgetPct}% focus target
      </p>

      {/* Next action */}
      {nextAction ? (
        <p className="text-xs text-muted mt-1 ml-[22px] truncate">
          <span className="text-muted/60 mr-1">→</span>
          {nextAction.title}
        </p>
      ) : (
        <p className="text-xs text-muted/40 mt-1 ml-[22px]">No next action yet</p>
      )}

      {/* Momentum bar */}
      <div className="mt-3 ml-[22px] h-0.5 bg-surface2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${styles.dot}`}
          style={{
            width: momentum.level === 'green' ? '80%'
                 : momentum.level === 'amber' ? '40%'
                 : '15%',
          }}
        />
      </div>
    </button>
  );
}
