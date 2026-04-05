import { useState, useEffect } from 'react';
import type { LifeTask } from '@/types';

interface TaskRowProps {
  task: LifeTask;
  onComplete: (taskId: string) => void;
}

// Human-readable schedule label shown below the task name
function scheduleLabel(task: LifeTask): string {
  const cfg = task.scheduleConfig as Record<string, unknown>;
  switch (task.scheduleType) {
    case 'daily':
      return 'Daily';
    case 'days_of_week': {
      const days = (cfg.days as string[] ?? []).map(d => d.slice(0, 3));
      return days.join(' · ');
    }
    case 'every_n_weeks':
      return `Every ${cfg.every} week${Number(cfg.every) !== 1 ? 's' : ''}`;
    case 'monthly_date':
      return `Monthly (${cfg.date}${ordinal(Number(cfg.date))})`;
    case 'monthly_occurrence':
      return `${String(cfg.occurrence)} ${String(cfg.day)} of month`;
    case 'weekly_floating':
      return 'This week';
    default:
      return '';
  }
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

export function TaskRow({ task, onComplete }: TaskRowProps) {
  // Local completing state drives the CSS animation.
  // When true: line-through + fade out. After 300ms: parent callback fires.
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!completing) return;
    const t = setTimeout(() => onComplete(task.id), 300);
    return () => clearTimeout(t);
  }, [completing, onComplete, task.id]);

  return (
    <div className={`flex items-center gap-3 py-2.5 transition-all duration-300
                     ${completing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex-1 min-w-0">
        <p className={`text-sm text-primary leading-tight ${completing ? 'line-through text-muted' : ''}`}>
          {task.name}
        </p>
        <p className="text-xs text-muted mt-0.5">{scheduleLabel(task)}</p>
      </div>

      {/* Square checkbox — right-aligned */}
      <button
        onClick={() => setCompleting(true)}
        disabled={completing}
        className="flex-shrink-0 w-6 h-6 rounded-md border-2 border-border flex items-center
                   justify-center transition-all duration-200 active:scale-90 hover:border-accent"
        aria-label={`Complete ${task.name}`}
      >
        {completing && (
          <svg viewBox="0 0 12 12" className="w-3 h-3 stroke-accent" fill="none"
               strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </button>
    </div>
  );
}
