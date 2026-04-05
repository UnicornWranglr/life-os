import { client } from './client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  action: { type: string; payload: Record<string, unknown> } | null;
  updatedData: Record<string, unknown> | null;
}

export const chatApi = {
  send: (message: string, conversationHistory: ChatMessage[]) =>
    client
      .post<ChatResponse>('/chat', { message, conversationHistory })
      .then(r => r.data),
};
