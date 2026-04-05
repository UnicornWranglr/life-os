import { client } from './client';
import type { FocusInsight, HabitInsight, RoutineInsight } from '@/types';

export const insightsApi = {
  focus: (from: string, to: string) =>
    client.get<FocusInsight>('/insights/focus', { params: { from, to } }).then(r => r.data),

  habits: (from: string, to: string) =>
    client.get<HabitInsight>('/insights/habits', { params: { from, to } }).then(r => r.data),

  routines: (from: string, to: string) =>
    client.get<RoutineInsight>('/insights/routines', { params: { from, to } }).then(r => r.data),
};
