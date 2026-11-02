/**
 * Cardif Pilot — 共用型別（前後端共用）
 * 原則：知識庫中每一句事實都必須帶有 sourceId，對應到可公開查證的官方頁面。
 */

/** 使用者所在的入口：官網訪客、My Cardif / App 會員、通路夥伴（銀行理專） */
export type Channel = 'web' | 'app' | 'partner';

export const CHANNEL_LABELS: Record<Channel, string> = {
  web: '官網（訪客）',
  app: 'My Cardif／App（會員）',
  partner: '通路夥伴（理專）',
};

export type StatusLabel = '已找到相關官方資訊' | '需要進一步確認' | '目前無法確認';

export type ServiceCategory =
  | '會員與登入'
  | '保單查詢'
  | '投資型保單'
  | '繳費與扣款'
  | '保單變更'
  | '借款與提領'
  | '理賠'
  | '其他服務';

/** 官方資料來源（附錄 A 的參考文獻即由此產生） */
export interface OfficialSource {
  id: string;
  title: string;
  url: string;
  /** 團隊最後一次人工核對頁面內容的日期 */
  verifiedAt: string;
}

/** 一句有出處的事實 */
export interface Fact {
  text: string;
  sourceId: string;
}

export interface ServiceAction {
  label: string;
  url: string;
  loginRequired: boolean;
  /** true＝直接到功能／表單頁；false＝到最接近的說明頁，需再依指引操作 */
  isDirectLink: boolean;
}

export interface ServiceEntry {
  id: string;
  name: string;
  category: ServiceCategory;
  summary: Fact[];
  steps: Fact[];
  documents: Fact[];
  notes: Fact[];
  /** 通路夥伴模式額外顯示的資訊 */
  partnerNotes?: Fact[];
  primaryAction: ServiceAction;
  secondaryActions?: ServiceAction[];
  channels: Channel[];
  /** 檢索用關鍵詞（含口語說法） */
  keywords: string[];
  /** 官方頁面資訊不足以完整回答時為 true，回答卡會主動建議轉真人 */
  needsHumanConfirmation?: boolean;
}

export type AnswerType = 'SERVICE' | 'CLARIFY' | 'NO_MATCH' | 'GUARDRAIL';

export interface Citation {
  sourceId: string;
  title: string;
  url: string;
  verifiedAt: string;
}

export interface HandoffInfo {
  recommended: boolean;
  isOpenNow: boolean;
  /** call：現在可直接撥打；callback：非營業時段，可留下預約回電 */
  mode: 'call' | 'callback';
  hotline: string;
  hoursText: string;
  reason: string;
}

export interface RetrievalHit {
  serviceId: string;
  score: number;
}

export interface AnswerCard {
  messageId: string;
  type: AnswerType;
  serviceId: string | null;
  serviceName?: string;
  category?: ServiceCategory;
  status: StatusLabel;
  headline: string;
  summary: string;
  steps: string[];
  documents: string[];
  notes: string[];
  primaryAction?: ServiceAction;
  secondaryActions: ServiceAction[];
  citations: Citation[];
  clarificationOptions?: { label: string; serviceId: string }[];
  handoff: HandoffInfo | null;
  /** 使用者輸入中偵測到並遮罩的個資種類 */
  maskedPiiTypes: string[];
  maskedQuery: string;
  engine: 'rules' | 'rules+gemini';
  model?: string;
  /** 伺服器實際處理時間（毫秒），不做任何寫死 */
  latencyMs: number;
  cached: boolean;
  retrieval: RetrievalHit[];
  disclosure: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  card?: AnswerCard;
}

export interface HealthInfo {
  status: 'ok';
  aiConnected: boolean;
  model: string | null;
  serviceCount: number;
  sourceCount: number;
  knowledgeVerifiedAt: string;
  version: string;
}

export interface HandoffTicket {
  ticketId: string;
  mode: 'call' | 'callback';
  message: string;
  hotline: string;
  hoursText: string;
}
