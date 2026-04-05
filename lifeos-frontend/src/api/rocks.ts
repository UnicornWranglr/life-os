import { client } from './client';
import type { QuarterlyRock, RockStatus } from '@/types';

export const rocksApi = {
  list: (quarter?: string) =>
    client.get<QuarterlyRock[]>('/rocks', { params: quarter ? { quarter } : {} }).then(r => r.data),

  create: (data: { areaId: string; quarter: string; title: string }) =>
    client.post<QuarterlyRock>('/rocks', data).then(r => r.data),

  update: (id: string, data: { title?: string; status?: RockStatus; notes?: string }) =>
    client.put<QuarterlyRock>(`/rocks/${id}`, data).then(r => r.data),
};
