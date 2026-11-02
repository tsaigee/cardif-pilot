/** API 整合測試：以隨機埠啟動 Express，不需要 Gemini 金鑰 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/server/app';

process.env.NODE_ENV = 'test';

let server: Server;
let base = '';

before(async () => {
  const app = createApp({ llm: null, partnerKeys: ['test-partner'], adminKey: 'test-admin', rateLimitPerMinute: 1000 });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

test('GET /api/health', async () => {
  const res = await fetch(`${base}/api/health`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.aiConnected, false);
  assert.ok(body.serviceCount >= 15);
});

test('建立對話 → 提問 → 回答卡；相同問題第二次走快取', async () => {
  const s = await (await post('/api/v1/navi/sessions', { channel: 'web' })).json();
  assert.ok(s.sessionId);
  const r1 = await (await post(`/api/v1/navi/sessions/${s.sessionId}/messages`, { query: '我想部分提領' })).json();
  assert.equal(r1.card.serviceId, 'partial-withdrawal');
  assert.equal(r1.card.cached, false);
  const r2 = await (await post(`/api/v1/navi/sessions/${s.sessionId}/messages`, { query: '我想部分提領' })).json();
  assert.equal(r2.card.cached, true);
  assert.notEqual(r2.card.messageId, r1.card.messageId);
});

test('輸入驗證：空白、過長、不存在的對話', async () => {
  const s = await (await post('/api/v1/navi/sessions', { channel: 'web' })).json();
  assert.equal((await post(`/api/v1/navi/sessions/${s.sessionId}/messages`, { query: '   ' })).status, 400);
  assert.equal((await post(`/api/v1/navi/sessions/${s.sessionId}/messages`, { query: '字'.repeat(301) })).status, 400);
  assert.equal((await post('/api/v1/navi/sessions/ses_nope/messages', { query: 'hi' })).status, 404);
  assert.equal((await post('/api/v1/navi/sessions', { channel: 'bad' })).status, 400);
});

test('通路夥伴模式需要 X-Api-Key', async () => {
  assert.equal((await post('/api/v1/navi/sessions', { channel: 'partner' })).status, 401);
  assert.equal((await post('/api/v1/navi/sessions', { channel: 'partner' }, { 'X-Api-Key': 'wrong' })).status, 401);
  const ok = await post('/api/v1/navi/sessions', { channel: 'partner' }, { 'X-Api-Key': 'test-partner' });
  assert.equal(ok.status, 201);
});

test('服務目錄搜尋、來源清單', async () => {
  const cat = await (await fetch(`${base}/api/v1/navi/catalog/functions?q=${encodeURIComponent('提領')}`)).json();
  assert.equal(cat.functions[0].id, 'partial-withdrawal');
  const src = await (await fetch(`${base}/api/v1/navi/sources`)).json();
  assert.ok(src.sources.length >= 8);
});

test('回饋、預約回電、洞察報表（需管理金鑰）', async () => {
  assert.equal((await post('/api/v1/navi/feedback', { messageId: 'm1', rating: 'meh' })).status, 400);
  assert.equal((await post('/api/v1/navi/feedback', { messageId: 'm1', rating: 'down' })).status, 201);
  const h = await post('/api/v1/navi/handoff', { sessionId: 's', reason: '我的身分證 A123456789' });
  assert.ok([200, 201].includes(h.status));
  assert.equal((await fetch(`${base}/api/v1/navi/insights`)).status, 401);
  const ins = await (await fetch(`${base}/api/v1/navi/insights`, { headers: { 'X-Admin-Key': 'test-admin' } })).json();
  assert.ok(ins.totalAnswers >= 1);
  assert.equal(ins.feedback.down, 1);
});

test('速率限制回傳 429', async () => {
  const app = createApp({ rateLimitPerMinute: 2 });
  const srv = app.listen(0);
  await new Promise((r) => srv.once('listening', r));
  const url = `http://127.0.0.1:${(srv.address() as AddressInfo).port}/api/v1/navi/sources`;
  const codes = [];
  for (let i = 0; i < 3; i++) codes.push((await fetch(url)).status);
  srv.close();
  assert.deepEqual(codes, [200, 200, 429]);
});
