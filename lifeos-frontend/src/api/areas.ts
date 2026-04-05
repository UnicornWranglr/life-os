import { client } from './client';
import type { Area, AreaStatus } from '@/types';

export const areasApi = {
  list: () =>
    client.get<Area[]>('/areas').then(r => r.data),

  create: (data: { name: string; type: Area['type']; focusBudgetPct: number; color: string; weekdaysOnly: boolean }) =>
    client.post<Area>('/areas', data).then(r => r.data),

  update: (id: string, data: Partial<Omit<Area, 'id' | 'userId' | 'createdAt'>>) =>
    client.put<Area>(`/areas/${id}`, data).then(r => r.data),

  updateStatus: (id: string, status: AreaStatus) =>
    client.patch<Area>(`/areas/${id}/status`, { status }).then(r => r.data),

  archive: (id: string) =>
    client.delete<Area>(`/areas/${id}`).then(r => r.data),
};
