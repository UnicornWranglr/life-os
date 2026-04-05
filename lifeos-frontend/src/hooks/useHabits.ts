import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsApi } from '@/api/habits';
import { todayString, daysBeforeToday } from '@/utils/dates';

// Fetch all habit definitions (active + inactive) — used for config
export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: habitsApi.list,
  });
}

export function useAddHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; areaId?: string }) => habitsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; areaId?: string; active?: boolean }) =>
      habitsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

// Fetch habit logs for the last 30 days — used for streak + nudge calculations.
// Refetches on window focus so today's ticks are always fresh.
export function useHabitLogs() {
  const from = daysBeforeToday(30);
  const to   = todayString();
  return useQuery({
    queryKey: ['habit-logs', { from, to }],
    queryFn: () => habitsApi.getLogs(from, to),
    refetchOnWindowFocus: true,
  });
}

// Toggle a habit log for today — upserts via the backend.
// Optimistically updates the cache so the UI responds instantly.
export function useToggleHabit() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, completed }: { habitId: string; completed: boolean }) =>
      habitsApi.logHabit(habitId, todayString(), completed),

    onMutate: async ({ habitId, completed }) => {
      const today = todayString();
      const from  = daysBeforeToday(30);
      const key   = ['habit-logs', { from, to: today }];

      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);

      qc.setQueryData(key, (old: ReturnType<typeof habitsApi.getLogs> extends Promise<infer T> ? T : never) => {
        if (!old) return old;
        const existing = old.find(l => l.habitId === habitId && l.logDate === today);
        if (existing) return old.map(l => l.habitId === habitId && l.logDate === today ? { ...l, completed } : l);
        return [...old, { id: 'optimistic', habitId, userId: '', logDate: today, completed }];
      });

      return { previous, key };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.previous);
    },

    onSettled: () => {
      const key = ['habit-logs', { from: daysBeforeToday(30), to: todayString() }];
      qc.invalidateQueries({ queryKey: key });
    },
  });
}
