import { client } from './client';
import type { DailyLog } from '@/types';

export const dailyLogsApi = {
  // Single date — returns DailyLog or null
  get: (date: string) =>
    client.get<DailyLog | null>(`/daily-logs/${date}`).then(r => r.data),

  // Range query — used by RoutinesCard to fetch the whole week at once
  range: (from: string, to: string) =>
    client.get<DailyLog[]>('/daily-logs', { params: { from, to } }).then(r => r.data),

  create: (data: Omit<DailyLog, 'id' | 'userId' | 'createdAt'>) =>
    client.post<DailyLog>('/daily-logs', data).then(r => r.data),

  // PUT upserts — safe to call whether or not a log already exists for that date
  update: (date: string, data: Partial<Omit<DailyLog, 'id' | 'userId' | 'createdAt' | 'logDate'>>) =>
    client.put<DailyLog>(`/daily-logs/${date}`, data).then(r => r.data),
};
