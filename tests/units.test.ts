/** 單元測試：個資遮罩、營業時間、Gemini 改寫事實檢查、LRU 快取、速率限制 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { maskPii, isVagueChangeRequest } from '../src/core/guardrails';
import { isServiceOpen, buildHandoff } from '../src/core/businessHours';
import { isGroundedRewrite } from '../src/server/geminiService';
import { LruCache, RateLimiter } from '../src/server/infra';
import { getService } from '../src/data/knowledgeBase';

test('個資遮罩：身分證、手機、卡號、Email、長數字', () => {
  const r = maskPii('A123456789 0912-345-678 4111 1111 1111 1111 test@example.com 12345678901');
  assert.ok(!/A123456789|0912|4111|test@example|12345678901/.test(r.masked), r.masked);
  assert.equal(r.types.length, 5);
  assert.deepEqual(maskPii('我想部分提領').types, []);
});

test('模糊變更請求判斷', () => {
  for (const q of ['我想改資料', '改資料', '我要變更', '幫我更新資料']) assert.ok(isVagueChangeRequest(q), q);
  for (const q of ['我想改地址', '我想改信用卡']) assert.ok(!isVagueChangeRequest(q), q);
});

test('客服時間（台北時間）：平日 9–20、週六 9–12、週日休息', () => {
  // 2026-11-02 為週一
  assert.equal(isServiceOpen(new Date('2026-11-02T01:00:00Z')), true); // 週一 09:00
  assert.equal(isServiceOpen(new Date('2026-11-02T11:59:00Z')), true); // 週一 19:59
  assert.equal(isServiceOpen(new Date('2026-11-02T12:00:00Z')), false); // 週一 20:00
  assert.equal(isServiceOpen(new Date('2026-11-07T03:30:00Z')), true); // 週六 11:30
  assert.equal(isServiceOpen(new Date('2026-11-07T04:00:00Z')), false); // 週六 12:00
  assert.equal(isServiceOpen(new Date('2026-11-08T03:00:00Z')), false); // 週日
  assert.equal(buildHandoff(true, 'x', new Date('2026-11-02T15:00:00Z')).mode, 'callback'); // 週一 23:00
});

test('Gemini 改寫事實檢查：不得新增數字或網址', () => {
  const loan = getService('policy-loan')!;
  assert.ok(isGroundedRewrite({ headline: '想辦保單借款？', summary: '線上借款單筆上限新台幣 50 萬元，審核後約 5 至 7 個工作天撥款。' }, loan));
  assert.ok(!isGroundedRewrite({ headline: '想辦保單借款？', summary: '最快 1 個工作天撥款。' }, loan), '編造的天數必須被擋下');
  assert.ok(!isGroundedRewrite({ headline: '保單借款', summary: '請至 https://example.com 申請' }, loan));
  assert.ok(!isGroundedRewrite({ headline: '', summary: 'x' }, loan));
});

test('LRU 快取會淘汰最舊項目並遵守 TTL', () => {
  const c = new LruCache<number>(2, 1000);
  c.set('a', 1);
  c.set('b', 2);
  c.get('a');
  c.set('c', 3);
  assert.equal(c.get('b'), undefined);
  assert.equal(c.get('a'), 1);
  const expired = new LruCache<number>(2, -1);
  expired.set('x', 1);
  assert.equal(expired.get('x'), undefined);
});

test('速率限制', () => {
  const r = new RateLimiter(2, 1000);
  assert.ok(r.allow('ip', 0));
  assert.ok(r.allow('ip', 1));
  assert.ok(!r.allow('ip', 2));
  assert.ok(r.allow('ip', 1001));
});
