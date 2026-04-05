import { client } from './client';
import type { MonthlyIntention, IntentionStatus } from '@/types';

export const intentionsApi = {
  list: (month: string) =>
    client.get<MonthlyIntention[]>('/intentions', { params: { month } }).then(r => r.data),

  create: (data: { areaId: string; month: string; title: string }) =>
    client.post<MonthlyIntention>('/intentions', data).then(r => r.data),

  update: (id: string, data: { title?: string; status?: IntentionStatus }) =>
    client.put<MonthlyIntention>(`/intentions/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    client.delete(`/intentions/${id}`),
};
