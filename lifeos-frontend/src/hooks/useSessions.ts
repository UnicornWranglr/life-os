import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '@/api/sessions';
import { daysBeforeToday, todayString } from '@/utils/dates';
import type { Session } from '@/types';

// Recent sessions (last 30 days, all areas) — used by MomentumCard and FocusCard
export function useRecentSessions() {
  const from = daysBeforeToday(30);
  const to   = todayString();
  return useQuery({
    queryKey: ['sessions', { from, to }],
    queryFn: () => sessionsApi.list({ from, to }),
  });
}

// Sessions for a specific Mon–Sun week — used by the weekly review
export function useWeekSessions(monday: string, sunday: string) {
  return useQuery({
    queryKey: ['sessions', { from: monday, to: sunday }],
    queryFn: () => sessionsApi.list({ from: monday, to: sunday }),
    enabled: !!(monday && sunday),
  });
}

// All sessions for one area — used by SessionHistoryCard in AreaDetail
export function useAreaSessions(areaId: string) {
  return useQuery({
    queryKey: ['sessions', { areaId }],
    queryFn: () => sessionsApi.list({ areaId }),
    enabled: !!areaId,
  });
}

// Last 14 days across all areas — used by RecentActivityCard in Areas cockpit
export function useRecentActivity() {
  return useQuery({
    queryKey: ['sessions', 'recent'],
    queryFn: sessionsApi.recent,
  });
}

// Log a new work session
export function useLogSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Session, 'id' | 'userId' | 'createdAt'>) =>
      sessionsApi.create(data),
    onSuccess: () => {
      // Invalidate all session queries so history + momentum + recent activity all refresh
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
