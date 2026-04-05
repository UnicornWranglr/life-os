// CompletedReview — read-only display of a submitted weekly review.
// Shows the 3 computed sections (live data) + the stored free-text answers.

import type { Area, DailyLog, QuarterlyRock, Session, WeeklyReview } from '@/types';
import { MomentumSection, AllocationSection, RoutineSection } from './ReadOnlySections';

interface CompletedReviewProps {
  review: WeeklyReview;
  sessions: Session[];
  logMap: Record<string, DailyLog>;
  areas: Area[];
  rocks: QuarterlyRock[];
  weekDates: string[];
  onEdit: () => void;
}

const rockStatusStyle: Record<string, string> = {
  on_track: 'bg-green/10  text-green  border-green/20',
  at_risk:  'bg-amber/10  text-amber  border-amber/20',
  done:     'bg-accent/10 text-accent-light border-accent/20',
};

const rockStatusLabel: Record<string, string> = {
  on_track: 'On track',
  at_risk:  'At risk',
  done:     'Done',
};

function TextSection({ title, content }: { title: string; content: string | null }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">{title}</p>
      {content ? (
        <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{content}</p>
      ) : (
        <p className="text-sm text-muted/40 italic">Nothing recorded.</p>
      )}
    </div>
  );
}

export function CompletedReview({
  review, sessions, logMap, areas, rocks, weekDates, onEdit,
}: CompletedReviewProps) {
  const active = areas.filter(a => a.status === 'active');

  const priorityArea = review.focusAreaNextWeek
    ? active.find(a => a.name === review.focusAreaNextWeek) ?? null
    : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Edit button */}
      <div className="flex justify-end">
        <button
          onClick={onEdit}
          className="text-xs font-medium text-accent-light bg-accent/10 border border-accent/20
                     px-3 py-1.5 rounded-full transition-colors active:opacity-70"
        >
          Edit review
        </button>
      </div>

      {/* Computed sections */}
      <MomentumSection  sessions={sessions} areas={areas} />
      <AllocationSection sessions={sessions} areas={areas} />
      <RoutineSection   logMap={logMap} weekDates={weekDates} />

      {/* Wins */}
      <TextSection title="Wins this week" content={review.wins} />

      {/* Blockers */}
      <TextSection title="What got in the way" content={review.blockers} />

      {/* Priority area */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
          Next week's priority area
        </p>
        {priorityArea ? (
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                 style={{ background: priorityArea.color }} />
            <p className="text-sm font-medium text-primary">{priorityArea.name}</p>
          </div>
        ) : review.focusAreaNextWeek ? (
          <p className="text-sm text-primary">{review.focusAreaNextWeek}</p>
        ) : (
          <p className="text-sm text-muted/40 italic">Not set.</p>
        )}
      </div>

      {/* Rock progress */}
      {rocks.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
            Rock progress
          </p>
          <div className="flex flex-col gap-3">
            {rocks.map(rock => (
              <div key={rock.id} className="flex items-start justify-between gap-3">
                <p className="text-sm text-primary flex-1 leading-snug">{rock.title}</p>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0
                                  ${rockStatusStyle[rock.status] ?? 'bg-surface2 text-muted border-border'}`}>
                  {rockStatusLabel[rock.status] ?? rock.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
