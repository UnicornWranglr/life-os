import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '@/api/sessions';
import { daysBeforeToday, todayString } from '@/utils/dates';
import type { Session } from '@/types';

// Recent sessions (last 30 days) — used by MomentumCard
export function useRecentSessions() {
  const from = daysBeforeToday(30);
  const to   = todayString();
  return useQuery({
    queryKey: ['sessions', { from, to }],
    queryFn: () => sessionsApi.list({ from, to }),
  });
}

// Log a new work session
export function useLogSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Session, 'id' | 'userId' | 'createdAt'>) =>
      sessionsApi.create(data),
    onSuccess: () => {
      // Invalidate both the recent sessions cache and areas (momentum recomputes)
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
