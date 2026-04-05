// ReviewHistory — scrollable list of past reviews, most recent first.
// Shows week date, wins summary (1 line), and priority area chip.

import type { Area, WeeklyReview } from '@/types';
import { weekLabel } from '@/utils/dates';

interface ReviewHistoryProps {
  reviews: WeeklyReview[];
  areas: Area[];
}

export function ReviewHistory({ reviews, areas }: ReviewHistoryProps) {
  if (reviews.length === 0) return null;

  const areaByName = new Map(areas.map(a => [a.name, a]));

  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3 px-0.5">
        Past reviews
      </p>
      <div className="flex flex-col gap-2">
        {reviews.map(review => {
          const priorityArea = review.focusAreaNextWeek
            ? areaByName.get(review.focusAreaNextWeek) ?? null
            : null;

          return (
            <div key={review.id}
                 className="bg-surface border border-border rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between gap-3 mb-1">
                <p className="text-xs font-semibold text-muted">
                  Week of {weekLabel(review.weekStart)}
                </p>
                {priorityArea && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                          style={{ background: priorityArea.color }} />
                    {priorityArea.name}
                  </span>
                )}
              </div>

              {review.wins ? (
                <p className="text-sm text-primary leading-snug truncate">{review.wins}</p>
              ) : (
                <p className="text-xs text-muted/40 italic">No wins recorded.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
