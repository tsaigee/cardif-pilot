/**
 * Cardif Pilot API（Express）
 *
 * GET  /api/health
 * POST /api/v1/navi/sessions                     建立對話（帶入 channel）
 * POST /api/v1/navi/sessions/:id/messages        送出問題或選擇服務，取得回答卡
 * GET  /api/v1/navi/catalog/functions?q=         查詢服務功能目錄
 * GET  /api/v1/navi/sources                      官方資料來源（參考文獻）
 * POST /api/v1/navi/handoff                      轉真人／非營業時段預約回電
 * POST /api/v1/navi/feedback                     回答滿意度回饋
 * GET  /api/v1/navi/insights                     熱點與無解問題報表（需 ADMIN_KEY）
 *
 * 通路夥伴（channel=partner）須帶 X-Api-Key，金鑰由環境變數 PARTNER_API_KEYS 設定。
 */
import express, { type NextFunction, type Request, type Response } from 'express';
import type { AnswerCard, Channel, HandoffTicket, HealthInfo } from '../shared/types';
import { APP_VERSION } from '../shared/constants';
import { KNOWLEDGE_BASE } from '../data/knowledgeBase';
import { KNOWLEDGE_VERIFIED_AT, OFFICIAL_SOURCES } from '../data/officialSources';
import { navigate, retriever, type LlmAssistant } from '../core/navigator';
import { buildHandoff } from '../core/businessHours';
import { maskPii } from '../core/guardrails';
import { LruCache, OpsStore, RateLimiter, SessionStore } from './infra';

export interface AppOptions {
  llm?: LlmAssistant | null;
  partnerKeys?: string[];
  adminKey?: string;
  rateLimitPerMinute?: number;
}

const CHANNELS: Channel[] = ['web', 'app', 'partner'];
const MAX_QUERY_LENGTH = 300;

export function createApp(options: AppOptions = {}) {
  const app = express();
  const llm = options.llm ?? null;
  const partnerKeys = new Set(options.partnerKeys ?? []);
  const sessions = new SessionStore();
  const ops = new OpsStore();
  const cache = new LruCache<AnswerCard>(500, 60 * 60 * 1000);
  const limiter = new RateLimiter(options.rateLimitPerMinute ?? 30, 60 * 1000);

  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  // 速率限制（僅限 API）
  app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? 'unknown';
    if (!limiter.allow(key)) {
      res.status(429).json({ error: 'RATE_LIMITED', message: '請求過於頻繁，請稍後再試。' });
      return;
    }
    next();
  });

  const requirePartnerKey = (channel: Channel, req: Request): boolean => {
    if (channel !== 'partner') return true;
    const key = req.header('x-api-key');
    return Boolean(key && partnerKeys.has(key));
  };

  app.get('/api/health', (_req, res) => {
    const body: HealthInfo = {
      status: 'ok',
      aiConnected: Boolean(llm),
      model: llm?.model ?? null,
      serviceCount: KNOWLEDGE_BASE.length,
      sourceCount: OFFICIAL_SOURCES.length,
      knowledgeVerifiedAt: KNOWLEDGE_VERIFIED_AT,
      version: APP_VERSION,
    };
    res.json(body);
  });

  app.post('/api/v1/navi/sessions', (req, res) => {
    const channel = (req.body?.channel ?? 'web') as Channel;
    if (!CHANNELS.includes(channel)) {
      res.status(400).json({ error: 'INVALID_CHANNEL', message: 'channel 必須是 web、app 或 partner。' });
      return;
    }
    if (!requirePartnerKey(channel, req)) {
      res.status(401).json({ error: 'PARTNER_KEY_REQUIRED', message: '通路夥伴模式需要有效的 X-Api-Key。' });
      return;
    }
    const session = sessions.create(channel);
    res.status(201).json({ sessionId: session.id, channel: session.channel });
  });

  app.post('/api/v1/navi/sessions/:id/messages', async (req, res) => {
    const session = sessions.touch(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'SESSION_NOT_FOUND', message: '對話已過期，請重新開始。' });
      return;
    }
    if (!requirePartnerKey(session.channel, req)) {
      res.status(401).json({ error: 'PARTNER_KEY_REQUIRED', message: '通路夥伴模式需要有效的 X-Api-Key。' });
      return;
    }

    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    const selectedServiceId = typeof req.body?.selectedServiceId === 'string' ? req.body.selectedServiceId : undefined;
    if (!query && !selectedServiceId) {
      res.status(400).json({ error: 'EMPTY_QUERY', message: '請輸入問題或選擇服務。' });
      return;
    }
    if (query.length > MAX_QUERY_LENGTH) {
      res.status(400).json({ error: 'QUERY_TOO_LONG', message: `問題請在 ${MAX_QUERY_LENGTH} 字以內。` });
      return;
    }

    try {
      const startedAt = Date.now();
      const cacheKey = selectedServiceId ? null : `${session.channel}|${maskPii(query).masked.toLowerCase()}`;
      let card = cacheKey ? cache.get(cacheKey) : undefined;

      if (card) {
        card = { ...card, messageId: `${card.messageId}_c${Date.now().toString(36)}`, cached: true, latencyMs: Date.now() - startedAt };
      } else {
        const out = await navigate({ query, selectedServiceId, channel: session.channel }, llm);
        card = out.card;
        if (cacheKey && out.cacheable) cache.set(cacheKey, card);
      }

      ops.logAnswer({
        at: new Date().toISOString(),
        sessionId: session.id,
        channel: session.channel,
        messageId: card.messageId,
        maskedQuery: card.maskedQuery,
        type: card.type,
        serviceId: card.serviceId,
        engine: card.engine,
        latencyMs: card.latencyMs,
        cached: card.cached,
      });
      res.json({ sessionId: session.id, card });
    } catch (err) {
      console.error('navigate failed', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: '系統暫時無法處理，請稍後再試或撥打客服 0800-012-899。' });
    }
  });

  app.get('/api/v1/navi/catalog/functions', (req, res) => {
    const channel = (typeof req.query.channel === 'string' ? req.query.channel : 'web') as Channel;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const services = KNOWLEDGE_BASE.filter((s) => s.channels.includes(CHANNELS.includes(channel) ? channel : 'web'));
    const ranked = q ? retriever.search(q, CHANNELS.includes(channel) ? channel : 'web', 20).map((h) => services.find((s) => s.id === h.serviceId)!).filter(Boolean) : services;
    res.json({
      knowledgeVerifiedAt: KNOWLEDGE_VERIFIED_AT,
      total: ranked.length,
      functions: ranked.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        summary: s.summary.map((f) => f.text).join(''),
        primaryAction: s.primaryAction,
        needsHumanConfirmation: Boolean(s.needsHumanConfirmation),
        sourceIds: [...new Set([...s.summary, ...s.steps, ...s.documents, ...s.notes].map((f) => f.sourceId))],
      })),
    });
  });

  app.get('/api/v1/navi/sources', (_req, res) => {
    res.json({ knowledgeVerifiedAt: KNOWLEDGE_VERIFIED_AT, sources: OFFICIAL_SOURCES });
  });

  app.post('/api/v1/navi/handoff', (req, res) => {
    const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : '';
    const reason = maskPii(typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 200) : '').masked;
    const preferredTime = typeof req.body?.preferredTime === 'string' ? req.body.preferredTime.slice(0, 50) : undefined;
    const info = buildHandoff(true, reason);

    if (info.mode === 'call') {
      const body: HandoffTicket = {
        ticketId: '',
        mode: 'call',
        message: `目前為客服服務時間，請直接撥打 ${info.hotline}，由專人協助。`,
        hotline: info.hotline,
        hoursText: info.hoursText,
      };
      res.json(body);
      return;
    }
    const ticket = ops.addTicket(sessionId, reason, preferredTime);
    const body: HandoffTicket = {
      ticketId: ticket.ticketId,
      mode: 'callback',
      message: `已建立預約回電單 ${ticket.ticketId}（原型示範，未串接法巴客服系統）。正式導入後，客服將於下一個服務時段依留存的聯絡方式回電。`,
      hotline: info.hotline,
      hoursText: info.hoursText,
    };
    res.status(201).json(body);
  });

  app.post('/api/v1/navi/feedback', (req, res) => {
    const messageId = typeof req.body?.messageId === 'string' ? req.body.messageId : '';
    const rating = req.body?.rating;
    if (!messageId || (rating !== 'up' && rating !== 'down')) {
      res.status(400).json({ error: 'INVALID_FEEDBACK', message: '需要 messageId 與 rating（up 或 down）。' });
      return;
    }
    const reason = typeof req.body?.reason === 'string' ? maskPii(req.body.reason.slice(0, 200)).masked : undefined;
    ops.addFeedback({ at: new Date().toISOString(), messageId, rating, reason });
    res.status(201).json({ ok: true });
  });

  app.get('/api/v1/navi/insights', (req, res) => {
    if (!options.adminKey || req.header('x-admin-key') !== options.adminKey) {
      res.status(401).json({ error: 'ADMIN_KEY_REQUIRED', message: '需要有效的 X-Admin-Key。' });
      return;
    }
    res.json(ops.insights());
  });

  return app;
}
