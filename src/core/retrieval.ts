/**
 * 混合式檢索：關鍵詞片語比對（精確）＋ BM25（字元 bigram，處理口語與換句話說）
 *
 * 分數 = 2 × 片語分數 + BM25 分數
 * - 片語分數：使用者問句中出現的關鍵詞，依長度加權（長詞比短詞更有鑑別度）。
 * - BM25：以服務名稱、關鍵詞、摘要建立索引。
 */
import type { Channel, RetrievalHit, ServiceEntry } from '../shared/types';
import { compact, tokenize } from './text';

const K1 = 1.2;
const B = 0.75;

/** 問句中常見、但對意圖沒有鑑別度的 bigram */
const STOP_BIGRAMS = new Set([
  '我想', '想要', '請問', '怎麼', '如何', '可以', '要怎', '麼辦', '怎樣', '一下', '幫我', '我要', '的保', '我的', '是否', '什麼', '需要', '準備', '問一',
]);

interface IndexedDoc {
  service: ServiceEntry;
  tf: Map<string, number>;
  length: number;
  keywords: string[];
}

export class ServiceRetriever {
  private docs: IndexedDoc[];
  private df = new Map<string, number>();
  private avgLength: number;

  constructor(services: ServiceEntry[]) {
    this.docs = services.map((service) => {
      const text = [service.name, service.name, ...service.keywords, ...service.summary.map((f) => f.text)].join(' ');
      const tokens = tokenize(text).filter((t) => !STOP_BIGRAMS.has(t));
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      return { service, tf, length: tokens.length, keywords: service.keywords.map(compact) };
    });
    for (const d of this.docs) for (const t of d.tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
    this.avgLength = this.docs.reduce((sum, d) => sum + d.length, 0) / Math.max(this.docs.length, 1);
  }

  private idf(term: string): number {
    const n = this.docs.length;
    const df = this.df.get(term) ?? 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  search(query: string, channel: Channel, limit = 5): RetrievalHit[] {
    const q = compact(query);
    const qTokens = [...new Set(tokenize(query).filter((t) => !STOP_BIGRAMS.has(t)))];

    const hits: RetrievalHit[] = [];
    for (const doc of this.docs) {
      if (!doc.service.channels.includes(channel)) continue;

      let phrase = 0;
      for (const kw of doc.keywords) if (kw && q.includes(kw)) phrase += kw.length;

      let bm25 = 0;
      for (const t of qTokens) {
        const f = doc.tf.get(t);
        if (!f) continue;
        bm25 += this.idf(t) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * doc.length) / this.avgLength)));
      }

      const score = 2 * phrase + bm25;
      if (score > 0) hits.push({ serviceId: doc.service.id, score: Math.round(score * 100) / 100 });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

/** 低於此分數視為沒有可信的對應服務 */
export const MIN_CONFIDENT_SCORE = 6;
/** 第一名與第二名分數比例高於此值，且屬於不同服務時，請使用者選擇 */
export const AMBIGUITY_RATIO = 0.9;
