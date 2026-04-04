import { client } from './client';
import type { Habit, HabitLog } from '@/types';

export const habitsApi = {
  list: () =>
    client.get<Habit[]>('/habits').then(r => r.data),

  create: (data: { name: string; areaId?: string }) =>
    client.post<Habit>('/habits', data).then(r => r.data),

  update: (id: string, data: { name?: string; areaId?: string; active?: boolean }) =>
    client.put<Habit>(`/habits/${id}`, data).then(r => r.data),

  getLogs: (from: string, to: string) =>
    client.get<HabitLog[]>('/habits/logs', { params: { from, to } }).then(r => r.data),

  // Upsert: one log per habit per day
  logHabit: (habitId: string, logDate: string, completed: boolean) =>
    client.post<HabitLog>('/habits/logs', { habitId, logDate, completed }).then(r => r.data),

  updateLog: (logId: string, completed: boolean) =>
    client.put<HabitLog>(`/habits/logs/${logId}`, { completed }).then(r => r.data),
};
