import type { OfficialSource } from '../shared/types';

/**
 * 官方資料來源清單。
 * 每一頁都由團隊人工開啟核對；更新知識庫時請同步更新 verifiedAt。
 */
export const KNOWLEDGE_VERIFIED_AT = '2026-11-03';

export const OFFICIAL_SOURCES: OfficialSource[] = [
  { id: 'f8', title: '法國巴黎人壽｜網路保險服務（服務項目、會員 FAQ、客服時間）', url: 'https://life.cardif.com.tw/f8', verifiedAt: KNOWLEDGE_VERIFIED_AT },
  { id: 'a311', title: '法國巴黎人壽｜常用表單下載', url: 'https://life.cardif.com.tw/a311', verifiedAt: KNOWLEDGE_VERIFIED_AT },
  { id: 'a312', title: '法國巴黎人壽｜保單變更', url: 'https://life.cardif.com.tw/a312', verifiedAt: KNOWLEDGE_VERIFIED_AT },
  { id: 'a313', title: '法國巴黎人壽｜保單借款', url: 'https://life.cardif.com.tw/a313', verifiedAt: KNOWLEDGE_VERIFIED_AT },
  { id: 'a314', title: '法國巴黎人壽｜理賠程序介紹', url: 'https://life.cardif.com.tw/a314', verifiedAt: KNOWLEDGE_VERIFIED_AT },
  { id: 'a315', title: '法國巴黎人壽｜海外急難救援', url: 'https://life.cardif.com.tw/a315', verifiedAt: KNOWLEDGE_VERIFIED_AT },
  { id: 'a316', title: '法國巴黎人壽｜電子單據服務', url: 'https://life.cardif.com.tw/a316', verifiedAt: KNOWLEDGE_VERIFIED_AT },
  { id: 'a330', title: '法國巴黎人壽｜最低保費繳交規範', url: 'https://life.cardif.com.tw/a330', verifiedAt: KNOWLEDGE_VERIFIED_AT },
];

export function getSource(id: string): OfficialSource | undefined {
  return OFFICIAL_SOURCES.find((s) => s.id === id);
}

/** 允許出現在回答中的官方網域（回答中的任何連結都必須以這些開頭） */
export const ALLOWED_URL_PREFIXES = [
  'https://life.cardif.com.tw/',
  'https://my.cardif.com.tw/',
  'https://cardif.moneydj.com/',
];

export function isOfficialUrl(url: string): boolean {
  return ALLOWED_URL_PREFIXES.some((p) => url.startsWith(p));
}
