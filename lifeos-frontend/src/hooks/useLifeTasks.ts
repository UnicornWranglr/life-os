import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lifeTasksApi } from '@/api/lifeTasks';
import { todayString } from '@/utils/dates';
import type { TodayTasks } from '@/types';

const TODAY_KEY = ['life-tasks', 'today'] as const;

// Today's task list — refetches on window focus (PRD 6.3)
export function useTodayTasks() {
  return useQuery({
    queryKey: TODAY_KEY,
    queryFn: lifeTasksApi.today,
    refetchOnWindowFocus: true,
  });
}

// Tick off a recurring task.
// Optimistic update moves the task immediately from `due`/`weekly` into `completed`.
export function useCompleteTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      lifeTasksApi.complete(taskId, todayString()),

    onMutate: async (taskId: string) => {
      await qc.cancelQueries({ queryKey: TODAY_KEY });
      const previous = qc.getQueryData<TodayTasks>(TODAY_KEY);

      qc.setQueryData<TodayTasks>(TODAY_KEY, old => {
        if (!old) return old;
        const task = old.due.find(t => t.id === taskId) ?? old.weekly.find(t => t.id === taskId);
        return {
          due:       old.due.filter(t => t.id !== taskId),
          weekly:    old.weekly.filter(t => t.id !== taskId),
          completed: task
            ? [...old.completed, {
                id: 'optimistic', userId: '', taskId, logDate: todayString(),
                note: null, completedAt: new Date().toISOString(), isOneoff: false,
              }]
            : old.completed,
        };
      });

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(TODAY_KEY, ctx.previous);
    },

    onSettled: () => qc.invalidateQueries({ queryKey: TODAY_KEY }),
  });
}

// Undo a tick (delete a log entry).
export function useUndoTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) => lifeTasksApi.deleteLog(logId),
    onSettled: () => qc.invalidateQueries({ queryKey: TODAY_KEY }),
  });
}

// Add a one-off task and immediately mark it complete.
export function useAddOneoff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => lifeTasksApi.completeOneoff(note, todayString()),
    onSettled: () => qc.invalidateQueries({ queryKey: TODAY_KEY }),
  });
}
