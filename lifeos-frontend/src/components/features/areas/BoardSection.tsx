// BoardSection — one collapsible section in the project board.
// Header shows title, item count (with WIP cap for in_progress), and an add (+) button.

import type { ProjectItem } from '@/types';
import { ItemRow } from './ItemRow';

interface BoardSectionProps {
  title: string;
  items: ProjectItem[];
  wipCap?: number;             // set to 3 for in_progress section
  showComplete?: boolean;      // false for done/notes sections
  onAdd?: () => void;          // undefined = no add button (e.g. done section)
  emptyText?: string;
}

export function BoardSection({
  title,
  items,
  wipCap,
  showComplete = true,
  onAdd,
  emptyText = 'Nothing here yet',
}: BoardSectionProps) {
  const atCap = wipCap !== undefined && items.length >= wipCap;

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {title}
          </p>
          {/* Count badge */}
          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full
            ${atCap
              ? 'bg-amber/10 text-amber border border-amber/20'
              : 'bg-surface2 text-muted'}`}>
            {wipCap !== undefined ? `${items.length}/${wipCap}` : items.length}
          </span>
        </div>

        {onAdd && (
          <button
            onClick={onAdd}
            disabled={atCap}
            className={`w-6 h-6 rounded-full flex items-center justify-center
                        border transition-colors
                        ${atCap
                          ? 'border-border text-muted/30 cursor-not-allowed'
                          : 'border-border text-muted hover:border-accent hover:text-accent active:scale-90'}`}
            aria-label={`Add to ${title}`}
            title={atCap ? 'WIP limit reached (max 3)' : undefined}
          >
            <svg viewBox="0 0 16 16" className="w-3 h-3 stroke-current" fill="none"
                 strokeWidth="2" strokeLinecap="round">
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
          </button>
        )}
      </div>

      {/* Items */}
      <div className="px-4">
        {items.length === 0 ? (
          <p className="text-xs text-muted/50 py-3">{emptyText}</p>
        ) : (
          <div className="divide-y divide-border/40">
            {items.map(item => (
              <ItemRow key={item.id} item={item} showComplete={showComplete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
