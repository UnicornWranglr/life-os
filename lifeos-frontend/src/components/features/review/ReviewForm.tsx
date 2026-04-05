// ReviewForm — weekly review form with 7 sections.
// Sections 1-3 are read-only computed; 4-7 are free text / selectors.

import { useState } from 'react';
import type { Area, DailyLog, QuarterlyRock, Session, WeeklyReview, RockStatus } from '@/types';
import { useSaveReview } from '@/hooks/useReviews';
import { rocksApi } from '@/api/rocks';
import { useQueryClient } from '@tanstack/react-query';
import { MomentumSection, AllocationSection, RoutineSection } from './ReadOnlySections';

interface ReviewFormProps {
  weekStart: string;
  sessions: Session[];
  logMap: Record<string, DailyLog>;
  areas: Area[];
  rocks: QuarterlyRock[];
  weekDates: string[];
  initialValues: WeeklyReview | null;
  onSaved: () => void;
}

const rockStatusOptions: { value: RockStatus; label: string; style: string }[] = [
  { value: 'on_track', label: 'On track', style: 'bg-green/10  text-green  border-green/20' },
  { value: 'at_risk',  label: 'At risk',  style: 'bg-amber/10  text-amber  border-amber/20' },
  { value: 'done',     label: 'Done',     style: 'bg-accent/10 text-accent-light border-accent/20' },
];

export function ReviewForm({
  weekStart, sessions, logMap, areas, rocks, weekDates, initialValues, onSaved,
}: ReviewFormProps) {
  const saveReview = useSaveReview();
  const qc = useQueryClient();

  const active = areas.filter(a => a.status === 'active');

  // Pre-fill from existing review if editing
  const [wins,           setWins]           = useState(initialValues?.wins ?? '');
  const [blockers,       setBlockers]       = useState(initialValues?.blockers ?? '');
  const [priorityAreaId, setPriorityAreaId] = useState<string>(() => {
    if (!initialValues?.focusAreaNextWeek) return '';
    return active.find(a => a.name === initialValues.focusAreaNextWeek)?.id ?? '';
  });
  const [rockStatuses,   setRockStatuses]   = useState<Record<string, RockStatus>>(() =>
    Object.fromEntries(rocks.map(r => [r.id, r.status])),
  );
  const [error,          setError]          = useState('');

  async function handleSubmit() {
    setError('');
    try {
      const priorityAreaName = active.find(a => a.id === priorityAreaId)?.name ?? null;

      await saveReview.mutateAsync({
        weekStart,
        wins:              wins.trim() || null,
        blockers:          blockers.trim() || null,
        focusAreaNextWeek: priorityAreaName,
        notes:             null,
      });

      // Update any changed rock statuses in parallel
      const updates = rocks
        .filter(r => rockStatuses[r.id] !== r.status)
        .map(r => rocksApi.update(r.id, { status: rockStatuses[r.id] }));

      if (updates.length > 0) {
        await Promise.all(updates);
        qc.invalidateQueries({ queryKey: ['rocks'] });
      }

      onSaved();
    } catch {
      setError('Failed to save. Please try again.');
    }
  }

  const isSaving = saveReview.isPending;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Read-only computed sections ── */}
      <MomentumSection  sessions={sessions} areas={areas} />
      <AllocationSection sessions={sessions} areas={areas} />
      <RoutineSection   logMap={logMap} weekDates={weekDates} />

      {/* ── Wins ── */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
          Wins this week
        </p>
        <textarea
          value={wins}
          onChange={e => setWins(e.target.value)}
          placeholder="What went well? What are you proud of?"
          rows={3}
          className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm
                     text-primary placeholder:text-muted/40 outline-none focus:border-accent
                     transition-colors resize-none"
        />
      </div>

      {/* ── Blockers ── */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
          What got in the way
        </p>
        <textarea
          value={blockers}
          onChange={e => setBlockers(e.target.value)}
          placeholder="Any friction, blockers, or distractions?"
          rows={3}
          className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm
                     text-primary placeholder:text-muted/40 outline-none focus:border-accent
                     transition-colors resize-none"
        />
      </div>

      {/* ── Priority area next week ── */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
          Next week's priority area
        </p>
        {active.length === 0 ? (
          <p className="text-xs text-muted/50">No active areas configured.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {active.map(area => (
              <button
                key={area.id}
                onClick={() => setPriorityAreaId(priorityAreaId === area.id ? '' : area.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors
                  ${priorityAreaId === area.id
                    ? 'bg-accent/10 border-accent/30'
                    : 'bg-surface2 border-border hover:border-accent/20'}`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                     style={{ background: area.color }} />
                <p className="text-sm font-medium text-primary">{area.name}</p>
                {priorityAreaId === area.id && (
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 stroke-accent ml-auto flex-shrink-0"
                       fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 8 6.5 11.5 13 4" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Rock progress ── */}
      {rocks.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
            Rock progress
          </p>
          <div className="flex flex-col gap-4">
            {rocks.map(rock => (
              <div key={rock.id}>
                <p className="text-sm text-primary mb-2 leading-snug">{rock.title}</p>
                <div className="flex gap-2">
                  {rockStatusOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRockStatuses(prev => ({ ...prev, [rock.id]: opt.value }))}
                      className={`flex-1 text-xs font-medium py-2 rounded-xl border transition-colors
                        ${rockStatuses[rock.id] === opt.value
                          ? opt.style
                          : 'bg-surface2 border-border text-muted'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red px-1">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isSaving}
        className="w-full bg-accent text-white font-semibold text-sm rounded-xl py-4
                   transition-opacity disabled:opacity-50"
      >
        {isSaving ? 'Saving…' : initialValues ? 'Update review' : 'Save review'}
      </button>
    </div>
  );
}
