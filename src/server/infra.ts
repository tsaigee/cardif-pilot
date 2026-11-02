/**
 * 伺服器基礎元件：LRU 快取、速率限制、記憶體儲存（工作階段、預約回電、回饋、稽核紀錄）
 * 原型使用記憶體；正式環境請改用 Redis／資料庫。
 */
import { randomUUID } from 'node:crypto';
import type { AnswerCard, Channel } from '../shared/types';

// ───────────── LRU 快取 ─────────────
export class LruCache<V> {
  private map = new Map<string, { value: V; expiresAt: number }>();
  constructor(private maxEntries: number, private ttlMs: number) {}

  get(key: string): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.value;
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    while (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }

  get size(): number {
    return this.map.size;
  }
}

// ───────────── 速率限制（固定視窗） ─────────────
export class RateLimiter {
  private hits = new Map<string, { count: number; windowStart: number }>();
  constructor(private limit: number, private windowMs: number) {}

  allow(key: string, now = Date.now()): boolean {
    const entry = this.hits.get(key);
    if (!entry || now - entry.windowStart >= this.windowMs) {
      this.hits.set(key, { count: 1, windowStart: now });
      if (this.hits.size > 10_000) this.hits.clear();
      return true;
    }
    entry.count += 1;
    return entry.count <= this.limit;
  }
}

// ───────────── 工作階段 ─────────────
export interface Session {
  id: string;
  channel: Channel;
  createdAt: number;
  lastActiveAt: number;
  turns: number;
}

const SESSION_TTL_MS = 30 * 60 * 1000;

export class SessionStore {
  private sessions = new Map<string, Session>();

  create(channel: Channel): Session {
    this.sweep();
    const session: Session = { id: `ses_${randomUUID()}`, channel, createdAt: Date.now(), lastActiveAt: Date.now(), turns: 0 };
    this.sessions.set(session.id, session);
    return session;
  }

  touch(id: string): Session | undefined {
    const s = this.sessions.get(id);
    if (!s) return undefined;
    if (Date.now() - s.lastActiveAt > SESSION_TTL_MS) {
      this.sessions.delete(id);
      return undefined;
    }
    s.lastActiveAt = Date.now();
    s.turns += 1;
    return s;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [id, s] of this.sessions) if (now - s.lastActiveAt > SESSION_TTL_MS) this.sessions.delete(id);
  }
}

// ───────────── 稽核紀錄與營運洞察 ─────────────
export interface AuditEntry {
  at: string;
  sessionId: string;
  channel: Channel;
  messageId: string;
  maskedQuery: string;
  type: AnswerCard['type'];
  serviceId: string | null;
  engine: AnswerCard['engine'];
  latencyMs: number;
  cached: boolean;
}

export interface FeedbackEntry {
  at: string;
  messageId: string;
  rating: 'up' | 'down';
  reason?: string;
}

export interface CallbackTicket {
  ticketId: string;
  at: string;
  sessionId: string;
  reason: string;
  preferredTime?: string;
}

export class OpsStore {
  private audit: AuditEntry[] = [];
  private feedback: FeedbackEntry[] = [];
  private tickets: CallbackTicket[] = [];
  private readonly max = 5000;

  logAnswer(entry: AuditEntry): void {
    this.audit.push(entry);
    if (this.audit.length > this.max) this.audit.shift();
    // 只記錄遮罩後的問句
    if (process.env.NODE_ENV !== 'test') console.log(JSON.stringify({ kind: 'answer', ...entry }));
  }

  hasMessage(messageId: string): boolean {
    return this.audit.some((a) => a.messageId === messageId);
  }

  addFeedback(entry: FeedbackEntry): void {
    this.feedback.push(entry);
    if (this.feedback.length > this.max) this.feedback.shift();
  }

  addTicket(sessionId: string, reason: string, preferredTime?: string): CallbackTicket {
    const ticket: CallbackTicket = {
      ticketId: `CB-${Date.now().toString(36).toUpperCase()}`,
      at: new Date().toISOString(),
      sessionId,
      reason,
      preferredTime,
    };
    this.tickets.push(ticket);
    if (this.tickets.length > this.max) this.tickets.shift();
    return ticket;
  }

  insights() {
    const byService = new Map<string, number>();
    const unanswered = new Map<string, number>();
    for (const a of this.audit) {
      if (a.serviceId) byService.set(a.serviceId, (byService.get(a.serviceId) ?? 0) + 1);
      if (a.type === 'NO_MATCH') unanswered.set(a.maskedQuery, (unanswered.get(a.maskedQuery) ?? 0) + 1);
    }
    const sortDesc = (m: Map<string, number>) => [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, 20);
    const negative = this.feedback.filter((f) => f.rating === 'down');
    return {
      totalAnswers: this.audit.length,
      topServices: sortDesc(byService).map(([serviceId, count]) => ({ serviceId, count })),
      unansweredQueries: sortDesc(unanswered).map(([query, count]) => ({ query, count })),
      feedback: { up: this.feedback.length - negative.length, down: negative.length, recentNegative: negative.slice(-10) },
      callbackTickets: this.tickets.length,
      avgLatencyMs: this.audit.length ? Math.round(this.audit.reduce((s, a) => s + a.latencyMs, 0) / this.audit.length) : 0,
    };
  }
}
