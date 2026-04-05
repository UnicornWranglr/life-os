// Review — weekly review page.
// Opens form if no review for current week. Shows completed view if one exists (with Edit button).
// Past reviews listed below.

import { useState } from 'react';
import { useAllReviews } from '@/hooks/useReviews';
import { useWeekSessions } from '@/hooks/useSessions';
import { useWeekLogs } from '@/hooks/useDailyLogs';
import { useAreas } from '@/hooks/useAreas';
import { useCurrentRocks } from '@/hooks/useRocks';
import { getMondayOf, getCurrentWeekDates, weekEndOf, weekLabel } from '@/utils/dates';
import { ReviewForm } from '@/components/features/review/ReviewForm';
import { CompletedReview } from '@/components/features/review/CompletedReview';
import { ReviewHistory } from '@/components/features/review/ReviewHistory';

export function Review() {
  const weekStart  = getMondayOf();
  const weekEnd    = weekEndOf(weekStart);
  const weekDates  = getCurrentWeekDates();

  const { data: allReviews = [], isLoading: reviewsLoading } = useAllReviews();
  const { data: sessions   = []                             } = useWeekSessions(weekStart, weekEnd);
  const { data: logMap     = {}                             } = useWeekLogs();
  const { data: areas      = []                             } = useAreas();
  const { data: rocks      = []                             } = useCurrentRocks();

  const [editing, setEditing] = useState(false);

  const currentReview = allReviews.find(r => r.weekStart === weekStart) ?? null;
  const pastReviews   = allReviews.filter(r => r.weekStart !== weekStart);

  const showForm = !currentReview || editing;

  return (
    <div className="page">
      <h1 className="text-[26px] font-semibold tracking-tight text-primary mb-0.5">Review</h1>
      <p className="text-sm text-muted mb-6">Week of {weekLabel(weekStart)}</p>

      {reviewsLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-surface border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : showForm ? (
        <ReviewForm
          weekStart={weekStart}
          sessions={sessions}
          logMap={logMap}
          areas={areas}
          rocks={rocks}
          weekDates={weekDates}
          initialValues={currentReview}
          onSaved={() => setEditing(false)}
        />
      ) : (
        <CompletedReview
          review={currentReview}
          sessions={sessions}
          logMap={logMap}
          areas={areas}
          rocks={rocks}
          weekDates={weekDates}
          onEdit={() => setEditing(true)}
        />
      )}

      <ReviewHistory reviews={pastReviews} areas={areas} />
    </div>
  );
}
