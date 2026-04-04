import { client } from './client';
import type { LifeTask, LifeTaskLog, TodayTasks } from '@/types';

export const lifeTasksApi = {
  today: () =>
    client.get<TodayTasks>('/life-tasks/today').then(r => r.data),

  list: () =>
    client.get<LifeTask[]>('/life-tasks').then(r => r.data),

  create: (data: Pick<LifeTask, 'name' | 'category' | 'scheduleType' | 'scheduleConfig' | 'scope'>) =>
    client.post<LifeTask>('/life-tasks', data).then(r => r.data),

  update: (id: string, data: Partial<Pick<LifeTask, 'name' | 'category' | 'scheduleType' | 'scheduleConfig' | 'scope'>>) =>
    client.put<LifeTask>(`/life-tasks/${id}`, data).then(r => r.data),

  setActive: (id: string, active: boolean) =>
    client.patch<LifeTask>(`/life-tasks/${id}/active`, { active }).then(r => r.data),

  delete: (id: string) =>
    client.delete(`/life-tasks/${id}`),

  getLogs: (from: string, to: string) =>
    client.get<LifeTaskLog[]>('/life-tasks/logs', { params: { from, to } }).then(r => r.data),

  // Tick off a recurring task
  complete: (taskId: string, logDate: string) =>
    client.post<LifeTaskLog>('/life-tasks/logs', { taskId, logDate, isOneoff: false }).then(r => r.data),

  // Add a one-off task and immediately complete it
  completeOneoff: (note: string, logDate: string) =>
    client.post<LifeTaskLog>('/life-tasks/logs', { note, logDate, isOneoff: true }).then(r => r.data),

  // Undo a tick
  deleteLog: (logId: string) =>
    client.delete(`/life-tasks/logs/${logId}`),
};
