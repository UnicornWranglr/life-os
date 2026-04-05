import { useQuery } from '@tanstack/react-query';
import { insightsApi } from '@/api/insights';

export function useFocusInsight(from: string, to: string) {
  return useQuery({
    queryKey: ['insights', 'focus', from, to],
    queryFn: () => insightsApi.focus(from, to),
    enabled: !!(from && to),
  });
}

export function useHabitInsight(from: string, to: string) {
  return useQuery({
    queryKey: ['insights', 'habits', from, to],
    queryFn: () => insightsApi.habits(from, to),
    enabled: !!(from && to),
  });
}

export function useRoutineInsight(from: string, to: string) {
  return useQuery({
    queryKey: ['insights', 'routines', from, to],
    queryFn: () => insightsApi.routines(from, to),
    enabled: !!(from && to),
  });
}
