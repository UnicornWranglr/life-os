import { useTodayTasks, useCompleteTask, useUndoTask, useAddOneoff } from '@/hooks/useLifeTasks';
import { TaskRow } from './TaskRow';
import { OneOffAddRow } from './OneOffAddRow';
import { CompletedSection } from './CompletedSection';

export function LifeTasksCard() {
  const { data, isLoading } = useTodayTasks();
  const complete = useCompleteTask();
  const undo     = useUndoTask();
  const addOneoff = useAddOneoff();

  const due     = data?.due     ?? [];
  const weekly  = data?.weekly  ?? [];
  const completed = data?.completed ?? [];
  const allPending = [...due, ...weekly];

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Life tasks</p>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-surface2 animate-pulse flex-shrink-0" />
              <div className="h-4 bg-surface2 rounded animate-pulse flex-1" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && allPending.length === 0 && completed.length === 0 && (
        <p className="text-sm text-muted mb-3">Nothing scheduled for today.</p>
      )}

      {!isLoading && (
        <div className="flex flex-col divide-y divide-border/40">
          {/* Weekly floating tasks shown first with a subtle label */}
          {weekly.length > 0 && (
            <div className="pb-2 mb-1">
              <p className="text-[10px] uppercase tracking-widest text-muted mb-1">This week</p>
              {weekly.map(task => (
                <TaskRow key={task.id} task={task} onComplete={id => complete.mutate(id)} />
              ))}
            </div>
          )}

          {due.map(task => (
            <TaskRow key={task.id} task={task} onComplete={id => complete.mutate(id)} />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          <div className="mt-2">
            <OneOffAddRow
              onAdd={note => addOneoff.mutate(note)}
              disabled={addOneoff.isPending}
            />
          </div>

          <CompletedSection
            completed={completed}
            onUndo={logId => undo.mutate(logId)}
          />
        </>
      )}
    </div>
  );
}
