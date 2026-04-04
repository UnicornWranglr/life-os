import type { Area, AreaMomentum } from '@/types';

interface MomentumChipProps {
  area: Area;
  momentum: AreaMomentum;
}

const levelStyles: Record<AreaMomentum['level'], { bar: string; label: string }> = {
  green: { bar: 'bg-green',  label: 'text-green' },
  amber: { bar: 'bg-amber',  label: 'text-amber' },
  red:   { bar: 'bg-red',    label: 'text-red' },
};

export function MomentumChip({ area, momentum }: MomentumChipProps) {
  const styles = levelStyles[momentum.level];

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Area colour dot */}
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: area.color }} />
          <p className="text-sm font-medium text-primary truncate">{area.name}</p>
        </div>
        <span className={`text-xs font-medium flex-shrink-0 ${styles.label}`}>
          {momentum.label}
        </span>
      </div>

      {/* Momentum bar — fills based on urgency: green=wide, red=narrow (showing decay) */}
      <div className="h-1 bg-surface2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
          style={{
            width: momentum.level === 'green' ? '80%'
                 : momentum.level === 'amber' ? '40%'
                 : '15%',
          }}
        />
      </div>
    </div>
  );
}
