// ItemRow — one project item in a board section.
// Actions/decisions: circle check on right marks as done.
// Notes: display only, with delete.

import type { ProjectItem } from '@/types';
import { useUpdateProjectItem, useDeleteProjectItem } from '@/hooks/useProjectItems';

interface ItemRowProps {
  item: ProjectItem;
  showComplete?: boolean; // show the check button (false for done/note sections)
}

// Subtle type icon shown on the left
function TypeIcon({ type }: { type: ProjectItem['type'] }) {
  if (type === 'decision') {
    return (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 stroke-amber flex-shrink-0" fill="none"
           strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6" />
        <line x1="8" y1="5" x2="8" y2="8.5" />
        <circle cx="8" cy="11" r="0.5" fill="currentColor" className="stroke-amber" />
      </svg>
    );
  }
  if (type === 'note') {
    return (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 stroke-muted flex-shrink-0" fill="none"
           strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="12" height="12" rx="2" />
        <line x1="5" y1="6" x2="11" y2="6" />
        <line x1="5" y1="9" x2="9" y2="9" />
      </svg>
    );
  }
  // action
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 stroke-muted flex-shrink-0" fill="none"
         strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 8 7 12 13 4" />
    </svg>
  );
}

export function ItemRow({ item, showComplete = true }: ItemRowProps) {
  const update = useUpdateProjectItem();
  const remove = useDeleteProjectItem();

  function markDone() {
    update.mutate({ id: item.id, status: 'done' });
  }

  function handleDelete() {
    remove.mutate(item.id);
  }

  const isPending = update.isPending || remove.isPending;

  return (
    <div className={`flex items-center gap-2.5 py-2.5 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      {/* Type icon */}
      <TypeIcon type={item.type} />

      {/* Title + optional notes preview */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-primary leading-tight">{item.title}</p>
        {item.notes && (
          <p className="text-xs text-muted mt-0.5 truncate">{item.notes}</p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {showComplete && item.type !== 'note' && (
          <button
            onClick={markDone}
            disabled={isPending}
            className="w-6 h-6 rounded-full border-2 flex items-center justify-center
                       transition-all duration-200 active:scale-90"
            style={{ borderColor: '#6b7280' }}
            aria-label={`Complete ${item.title}`}
          />
        )}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="w-6 h-6 flex items-center justify-center rounded-lg
                     text-muted/40 hover:text-red transition-colors active:scale-90"
          aria-label={`Delete ${item.title}`}
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 stroke-current" fill="none"
               strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
