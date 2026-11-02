/**
 * 安全防護：個資遮罩、敏感請求攔截、提示注入偵測
 * 對應金管會《金融業運用 AI 指引》隱私保護與穩健安全原則。
 */
import { normalize } from './text';

export interface PiiMaskResult {
  masked: string;
  types: string[];
}

const PII_RULES: { type: string; pattern: RegExp; replacement: string }[] = [
  { type: 'Email', pattern: /[\w.+-]+@[\w-]+(\.[\w-]+)+/g, replacement: '[已遮罩Email]' },
  // 身分證字號／居留證號（第二碼 1、2 或 8、9 及新式 A–D）
  { type: '身分證字號', pattern: /\b[A-Z][12890ABCD]\d{8}\b/gi, replacement: '[已遮罩身分證號]' },
  // 台灣手機
  { type: '手機號碼', pattern: /\b09\d{2}[- ]?\d{3}[- ]?\d{3}\b/g, replacement: '[已遮罩手機]' },
  // 信用卡號：4-4-4-(1~7) 碼，允許空白或連字號分隔
  { type: '信用卡號', pattern: /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{1,7}\b/g, replacement: '[已遮罩卡號]' },
  // 銀行帳號或保單號碼等長數字（10–16 碼）
  { type: '帳號／保單號碼', pattern: /\b\d{10,16}\b/g, replacement: '[已遮罩號碼]' },
];

export function maskPii(input: string): PiiMaskResult {
  let masked = input;
  const types: string[] = [];
  for (const rule of PII_RULES) {
    const next = masked.replace(rule.pattern, rule.replacement);
    if (next !== masked) types.push(rule.type);
    masked = next;
  }
  return { masked, types };
}

export type GuardrailKind = 'CLAIM_GUARANTEE' | 'INVESTMENT_ADVICE' | 'PROMPT_INJECTION';

export interface GuardrailHit {
  kind: GuardrailKind;
  relatedServiceId: string | null;
  headline: string;
  summary: string;
}

const CLAIM_GUARANTEE = /(保證|一定|確定|直接|幫我|馬上).{0,8}(核准|通過|賠|撥款|匯款)|核准.{0,6}(理賠|保險金)|(會不會|能不能|可不可以).{0,4}(賠|理賠)/;
const INVESTMENT_ADVICE = /(推薦|建議|該買|值得買|哪支|哪檔|會不會漲|會漲嗎|穩賺|報明牌|買哪).{0,8}(基金|標的|etf|股票|投資)?|(基金|標的|etf).{0,6}(推薦|會漲|穩賺|好不好|值得)/;
const PROMPT_INJECTION = /(忽略|無視|忘記).{0,10}(指示|規則|設定|提示)|system\s*prompt|系統提示|prompt\s*injection|你現在是|扮演.{0,6}(管理員|開發者)|開發者模式|jailbreak/;

export function detectGuardrail(query: string): GuardrailHit | null {
  const q = normalize(query);

  if (PROMPT_INJECTION.test(q)) {
    return {
      kind: 'PROMPT_INJECTION',
      relatedServiceId: null,
      headline: '我只能協助法國巴黎人壽的保戶服務導覽',
      summary: '這個請求不在服務範圍內。請告訴我您想辦理的保險服務，例如查保單、變更扣款信用卡或申請理賠。',
    };
  }
  if (CLAIM_GUARANTEE.test(q) && /(理賠|保險金|賠)/.test(q)) {
    return {
      kind: 'CLAIM_GUARANTEE',
      relatedServiceId: 'claim-application',
      headline: '理賠需由理賠人員依保單條款審核',
      summary: '本助手無法保證、預先核准或代為撥付任何理賠。以下是官方理賠申請方式與應備文件，送件後將由理賠人員審核。',
    };
  }
  if (INVESTMENT_ADVICE.test(q) && /(推薦|建議|該買|值得|哪支|哪檔|會漲|穩賺|明牌|買哪|好不好)/.test(q)) {
    return {
      kind: 'INVESTMENT_ADVICE',
      relatedServiceId: 'investment-inquiry',
      headline: '本助手不提供投資建議',
      summary: '投資標的選擇涉及個人風險屬性，本助手不推薦任何標的。您可以查詢投資表現、配息紀錄與公開的基金資訊，或洽詢您的理財專員。',
    };
  }
  return null;
}

/** 「我想改資料」這類沒有指明項目的變更請求 */
const VAGUE_CHANGE = /^(我|我想|我要|想|要|請|請幫我|幫我)?(改|變更|修改|更改|更新)(一下)?(我的)?(資料|個人資料|個資|內容|保單|保單資料|東西)?$/;

export function isVagueChangeRequest(query: string): boolean {
  const q = normalize(query).replace(/[，。！？,.!?\s]/g, '');
  return VAGUE_CHANGE.test(q);
}
