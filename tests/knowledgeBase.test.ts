/** 知識庫合規檢查：每句事實都有出處、所有連結都是官方網域、聯絡資訊正確 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { KNOWLEDGE_BASE } from '../src/data/knowledgeBase';
import { OFFICIAL_SOURCES, getSource, isOfficialUrl } from '../src/data/officialSources';
import { CARDIF_ADDRESS, CARDIF_HOURS_TEXT } from '../src/shared/constants';

test('服務 ID 不重複', () => {
  const ids = KNOWLEDGE_BASE.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('每一句事實都引用存在的官方來源', () => {
  for (const s of KNOWLEDGE_BASE) {
    const facts = [...s.summary, ...s.steps, ...s.documents, ...s.notes, ...(s.partnerNotes ?? [])];
    assert.ok(s.summary.length > 0, `${s.id} 缺少摘要`);
    for (const f of facts) assert.ok(getSource(f.sourceId), `${s.id} 引用了不存在的來源 ${f.sourceId}`);
  }
});

test('所有按鈕連結都指向官方網域', () => {
  for (const s of KNOWLEDGE_BASE) {
    for (const a of [s.primaryAction, ...(s.secondaryActions ?? [])]) {
      assert.ok(isOfficialUrl(a.url), `${s.id} 的連結 ${a.url} 不是官方網域`);
    }
  }
  for (const src of OFFICIAL_SOURCES) assert.ok(isOfficialUrl(src.url));
});

test('客服時間與地址與官網一致（f8：平日 9–20、週六 9–12；79 樓）', () => {
  assert.match(CARDIF_HOURS_TEXT, /9:00–20:00/);
  assert.match(CARDIF_HOURS_TEXT, /週六 9:00–12:00/);
  assert.match(CARDIF_ADDRESS, /79 樓/);
  const allText = JSON.stringify(KNOWLEDGE_BASE);
  assert.ok(!allText.includes('71樓') && !allText.includes('71 樓'), '不得出現錯誤的 71 樓地址');
  assert.ok(!allText.includes('09:00 - 18:00（例假日除外）'));
});

test('a330 只用於最低保費與復效金額，不用來說明寬限期', () => {
  for (const s of KNOWLEDGE_BASE) {
    for (const f of [...s.summary, ...s.steps, ...s.notes]) {
      if (f.sourceId === 'a330') assert.ok(!f.text.includes('寬限期'), `${s.id}: a330 頁面沒有寬限期內容`);
    }
  }
});
