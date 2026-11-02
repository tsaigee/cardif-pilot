import type { AnswerCard, Channel, HandoffTicket, HealthInfo, OfficialSource, ServiceAction, ServiceCategory } from '../shared/types';

/**
 * 示範用通路金鑰。正式環境中，通路夥伴應由自家伺服器呼叫 API，金鑰不應放在瀏覽器。
 */
const PARTNER_DEMO_KEY = (import.meta.env.VITE_PARTNER_DEMO_KEY as string | undefined) ?? 'demo-partner-key';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(url: string, init: RequestInit = {}, channel?: Channel): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (channel === 'partner') headers['X-Api-Key'] = PARTNER_DEMO_KEY;
  const res = await fetch(url, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.message ?? `伺服器回應 ${res.status}`);
  return data as T;
}

export const api = {
  health: () => request<HealthInfo>('/api/health'),

  createSession: (channel: Channel) =>
    request<{ sessionId: string; channel: Channel }>('/api/v1/navi/sessions', { method: 'POST', body: JSON.stringify({ channel }) }, channel),

  sendMessage: (sessionId: string, channel: Channel, body: { query?: string; selectedServiceId?: string }) =>
    request<{ sessionId: string; card: AnswerCard }>(`/api/v1/navi/sessions/${sessionId}/messages`, { method: 'POST', body: JSON.stringify(body) }, channel),

  catalog: (channel: Channel, q = '') =>
    request<{
      knowledgeVerifiedAt: string;
      functions: { id: string; name: string; category: ServiceCategory; summary: string; primaryAction: ServiceAction; needsHumanConfirmation: boolean; sourceIds: string[] }[];
    }>(`/api/v1/navi/catalog/functions?channel=${channel}&q=${encodeURIComponent(q)}`),

  sources: () => request<{ knowledgeVerifiedAt: string; sources: OfficialSource[] }>('/api/v1/navi/sources'),

  handoff: (sessionId: string, reason: string) =>
    request<HandoffTicket>('/api/v1/navi/handoff', { method: 'POST', body: JSON.stringify({ sessionId, reason }) }),

  feedback: (messageId: string, rating: 'up' | 'down') =>
    request<{ ok: boolean }>('/api/v1/navi/feedback', { method: 'POST', body: JSON.stringify({ messageId, rating }) }),
};
