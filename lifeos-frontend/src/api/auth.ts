import { client } from './client';
import type { User } from '@/types';

export interface LoginResponse {
  token: string;
  user: Pick<User, 'id' | 'email'>;
}

export const authApi = {
  login: (email: string, password: string) =>
    client.post<LoginResponse>('/auth/login', { email, password }).then(r => r.data),

  refresh: (token: string) =>
    client.post<{ token: string }>('/auth/refresh', { token }).then(r => r.data),

  me: () =>
    client.get<User>('/auth/me').then(r => r.data),

  changeEmail: (email: string, password: string) =>
    client.put<{ id: string; email: string }>('/auth/email', { email, password }).then(r => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    client.put<{ ok: boolean }>('/auth/password', { currentPassword, newPassword }).then(r => r.data),
};
