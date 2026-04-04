import { client } from './client';
import type { Session } from '@/types';

export const sessionsApi = {
  list: (params?: { areaId?: string; from?: string; to?: string }) =>
    client.get<Session[]>('/sessions', { params }).then(r => r.data),

  recent: () =>
    client.get<Session[]>('/sessions/recent').then(r => r.data),

  create: (data: Omit<Session, 'id' | 'userId' | 'createdAt'>) =>
    client.post<Session>('/sessions', data).then(r => r.data),

  update: (id: string, data: Partial<Omit<Session, 'id' | 'userId' | 'createdAt'>>) =>
    client.put<Session>(`/sessions/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    client.delete(`/sessions/${id}`),
};
