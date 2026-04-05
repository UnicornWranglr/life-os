// AreaDetail — project board for a single area.
// Sections: Next actions | In progress (WIP≤3) | Decisions needed | Done this quarter | Notes & reference

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAreas } from '@/hooks/useAreas';
import { useRecentSessions } from '@/hooks/useSessions';
import { useProjectItems } from '@/hooks/useProjectItems';
import { getMomentum } from '@/utils/momentum';
import { BoardSection } from '@/components/features/areas/BoardSection';
import { AddItemSheet } from '@/components/features/areas/AddItemSheet';
import { LogSessionSheet } from '@/components/features/today/LogSessionSheet';
import type { ProjectItem, ProjectItemStatus, ProjectItemType } from '@/types';

// Returns the start of the current calendar quarter as a Date
function quarterStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
}

type AddContext = { defaultType: ProjectItemType; defaultStatus: ProjectItemStatus };

const momentumBadge: Record<string, string> = {
  green: 'bg-green/10 text-green border-green/20',
  amber: 'bg-amber/10 text-amber border-amber/20',
  red:   'bg-red/10   text-red   border-red/20',
};

export function AreaDetail() {
  const { areaId }  = useParams<{ areaId: string }>();
  const navigate    = useNavigate();

  const { data: areas    = [] } = useAreas();
  const { data: sessions = [] } = useRecentSessions();
  const { data: items    = [], isLoading } = useProjectItems(areaId ?? '');

  const [addCtx,       setAddCtx]       = useState<AddContext | null>(null);
  const [logOpen,      setLogOpen]      = useState(false);

  const area = areas.find(a => a.id === areaId);

  if (!area) {
    return (
      <div className="page flex items-center justify-center">
        <p className="text-muted text-sm">Area not found.</p>
      </div>
    );
  }

  const momentum = getMomentum(area, sessions);

  // Partition items into board sections
  const nextActions  = items.filter(i => i.type === 'action'   && i.status === 'next');
  const inProgress   = items.filter(i => i.status === 'in_progress');
  const decisions    = items.filter(i => i.type === 'decision' && i.status !== 'done');
  const doneItems    = items.filter(i => i.status === 'done' && isDoneThisQuarter(i));
  const notes        = items.filter(i => i.type === 'note');

  function openAdd(defaultType: ProjectItemType, defaultStatus: ProjectItemStatus) {
    setAddCtx({ defaultType, defaultStatus });
  }

  return (
    <div className="page">
      {/* Back button */}
      <button
        onClick={() => navigate('/areas')}
        className="flex items-center gap-1.5 text-xs text-muted mb-5 -ml-0.5 active:opacity-60"
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 stroke-current" fill="none"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="10 4 6 8 10 12" />
        </svg>
        Areas
      </button>

      {/* Area header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
               style={{ background: area.color }} />
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight text-primary leading-tight">
              {area.name}
            </h1>
            <p className="text-xs text-muted mt-0.5">{area.focusBudgetPct}% focus target</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border
                            ${momentumBadge[momentum.level]}`}>
            {momentum.label}
          </span>
          <button
            onClick={() => setLogOpen(true)}
            className="text-xs font-medium text-accent-light bg-accent/10 border border-accent/20
                       px-3 py-1.5 rounded-full transition-colors active:opacity-70"
          >
            Log session
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-surface border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Next actions */}
          <BoardSection
            title="Next actions"
            items={nextActions}
            onAdd={() => openAdd('action', 'next')}
            emptyText="No next actions — add one to get started"
          />

          {/* In progress — WIP capped at 3 */}
          <BoardSection
            title="In progress"
            items={inProgress}
            wipCap={3}
            onAdd={() => openAdd('action', 'in_progress')}
            emptyText="Nothing in progress"
          />

          {/* Decisions needed */}
          <BoardSection
            title="Decisions needed"
            items={decisions}
            onAdd={() => openAdd('decision', 'next')}
            emptyText="No open decisions"
          />

          {/* Done this quarter — no add button, shows most recent 10 */}
          <BoardSection
            title="Done this quarter"
            items={doneItems.slice(0, 10)}
            showComplete={false}
            emptyText="Nothing completed yet this quarter"
          />

          {/* Notes & reference */}
          <BoardSection
            title="Notes & reference"
            items={notes}
            showComplete={false}
            onAdd={() => openAdd('note', 'next')}
            emptyText="No notes yet"
          />
        </div>
      )}

      {/* Add item sheet */}
      {addCtx && (
        <AddItemSheet
          areaId={area.id}
          open={!!addCtx}
          onClose={() => setAddCtx(null)}
          defaultType={addCtx.defaultType}
          defaultStatus={addCtx.defaultStatus}
        />
      )}

      {/* Log session sheet */}
      <LogSessionSheet
        area={area}
        open={logOpen}
        onClose={() => setLogOpen(false)}
      />
    </div>
  );
}

function isDoneThisQuarter(item: ProjectItem): boolean {
  if (!item.completedAt) return false;
  return new Date(item.completedAt) >= quarterStart();
}
