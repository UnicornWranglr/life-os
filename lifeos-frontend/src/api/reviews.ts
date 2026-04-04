import { client } from './client';
import type { WeeklyReview } from '@/types';

export const reviewsApi = {
  list: () =>
    client.get<WeeklyReview[]>('/reviews').then(r => r.data),

  get: (weekStart: string) =>
    client.get<WeeklyReview | null>(`/reviews/${weekStart}`).then(r => r.data),

  create: (data: Omit<WeeklyReview, 'id' | 'userId' | 'createdAt'>) =>
    client.post<WeeklyReview>('/reviews', data).then(r => r.data),

  update: (weekStart: string, data: Partial<Omit<WeeklyReview, 'id' | 'userId' | 'createdAt' | 'weekStart'>>) =>
    client.put<WeeklyReview>(`/reviews/${weekStart}`, data).then(r => r.data),
};
