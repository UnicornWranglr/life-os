import { client } from './client';
import type { Vision } from '@/types';

export const visionApi = {
  get: () =>
    client.get<Vision | null>('/vision').then(r => r.data),

  update: (statement: string) =>
    client.put<Vision>('/vision', { statement }).then(r => r.data),
};
