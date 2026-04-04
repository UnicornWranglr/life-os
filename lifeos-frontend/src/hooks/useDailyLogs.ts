import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyLogsApi } from '@/api/dailyLogs';
import { todayString, getMondayOf, getCurrentWeekDates } from '@/utils/dates';
import type { DailyLog } from '@/types';

// Today's single log entry
export function useTodayLog() {
  const today = todayString();
  return useQuery({
    queryKey: ['daily-log', today],
    queryFn: () => dailyLogsApi.get(today),
  });
}

// All daily logs for the current Mon–Sun week
export function useWeekLogs() {
  const monday = getMondayOf();
  const dates  = getCurrentWeekDates();
  const to     = dates[dates.length - 1]; // Sunday (or today if mid-week)

  return useQuery({
    queryKey: ['daily-logs-week', monday],
    queryFn: () => dailyLogsApi.range(monday, to),
    // Returns a map of date → DailyLog for easy lookup in RoutinesCard
    select: (logs: DailyLog[]) =>
      Object.fromEntries(logs.map(l => [l.logDate, l])) as Record<string, DailyLog>,
  });
}

// Upsert today's log (PUT handles create-or-update on the backend)
export function useUpsertTodayLog() {
  const qc    = useQueryClient();
  const today = todayString();

  return useMutation({
    mutationFn: (data: Partial<Omit<DailyLog, 'id' | 'userId' | 'createdAt' | 'logDate'>>) =>
      dailyLogsApi.update(today, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-log', today] });
      qc.invalidateQueries({ queryKey: ['daily-logs-week', getMondayOf()] });
    },
  });
}
