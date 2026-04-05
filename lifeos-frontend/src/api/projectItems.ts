import { client } from './client';
import type { ProjectItem, ProjectItemStatus, ProjectItemType } from '@/types';

export const projectItemsApi = {
  list: (params?: { areaId?: string }) =>
    client.get<ProjectItem[]>('/project-items', { params }).then(r => r.data),

  create: (data: {
    areaId: string;
    title: string;
    type: ProjectItemType;
    status?: ProjectItemStatus;
    notes?: string;
  }) => client.post<ProjectItem>('/project-items', data).then(r => r.data),

  update: (id: string, data: Partial<Pick<ProjectItem, 'title' | 'status' | 'type' | 'notes'>>) =>
    client.put<ProjectItem>(`/project-items/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    client.delete(`/project-items/${id}`),
};
