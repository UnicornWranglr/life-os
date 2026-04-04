import { useState } from 'react';
import type { LifeTaskLog, TodayTasks } from '@/types';

interface CompletedSectionProps {
  completed: TodayTasks['completed'];
  onUndo: (logId: string) => void;
}

export function CompletedSection({ completed, onUndo }: CompletedSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (completed.length === 0) return null;

  return (
    <div className="mt-2 border-t border-border pt-3">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 text-xs text-muted w-full text-left py-1"
      >
        <svg viewBox="0 0 12 12" className="w-3 h-3 stroke-current" fill="none"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points={expanded ? '2 8 6 4 10 8' : '2 4 6 8 10 4'} />
        </svg>
        {completed.length} completed
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-0.5">
          {completed.map((log: LifeTaskLog) => (
            <div key={log.id} className="flex items-center gap-3 py-1.5">
              {/* Filled square */}
              <div className="flex-shrink-0 w-6 h-6 rounded-md bg-accent/20 border border-accent/30
                              flex items-center justify-center">
                <svg viewBox="0 0 12 12" className="w-3 h-3 stroke-accent" fill="none"
                     strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              </div>
              <p className="flex-1 text-sm text-muted line-through truncate">
                {log.note ?? log.taskId ?? '—'}
              </p>
              <button
                onClick={() => onUndo(log.id)}
                className="text-xs text-muted hover:text-primary transition-colors px-1"
              >
                Undo
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
