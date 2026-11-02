/**
 * 對話編排：個資遮罩 → 安全防護 → 模糊請求澄清 → 混合檢索 →（可選）LLM 意圖判斷與改寫 → 組成回答卡
 *
 * 回答卡中的步驟、文件、注意事項、連結與來源一律來自知識庫；
 * LLM 只能（1）在候選服務中挑選一個，（2）改寫標題與摘要，且改寫內容須通過事實檢查。
 */
import type { AnswerCard, Channel, Citation, ServiceEntry, StatusLabel } from '../shared/types';
import { AI_DISCLOSURE, CARDIF_OVERVIEW_URL } from '../shared/constants';
import { CHANGE_CLARIFICATION_IDS, KNOWLEDGE_BASE, getService } from '../data/knowledgeBase';
import { getSource, isOfficialUrl } from '../data/officialSources';
import { AMBIGUITY_RATIO, MIN_CONFIDENT_SCORE, ServiceRetriever } from './retrieval';
import { detectGuardrail, isVagueChangeRequest, maskPii } from './guardrails';
import { buildHandoff } from './businessHours';

/** LLM 介面：由伺服器注入（Gemini），測試時可替換 */
export interface LlmAssistant {
  model: string;
  /** 從候選服務中選出最符合的一個；回傳 null 表示都不符合 */
  chooseService(query: string, candidates: ServiceEntry[]): Promise<string | null>;
  /** 依知識庫事實改寫標題與摘要 */
  rewrite(query: string, service: ServiceEntry): Promise<{ headline: string; summary: string } | null>;
}

export interface NavigateInput {
  query?: string;
  selectedServiceId?: string;
  channel: Channel;
  now?: Date;
}

export interface NavigateOutput {
  card: AnswerCard;
  /** 是否可安全快取（LLM 呼叫失敗時不快取，避免把降級結果固定一小時） */
  cacheable: boolean;
}

const retriever = new ServiceRetriever(KNOWLEDGE_BASE);

let counter = 0;
function newMessageId(): string {
  counter = (counter + 1) % 1_000_000;
  return `msg_${Date.now().toString(36)}_${counter.toString(36)}`;
}

function citationsFor(service: ServiceEntry, channel: Channel): Citation[] {
  const facts = [
    ...service.summary,
    ...service.steps,
    ...service.documents,
    ...service.notes,
    ...(channel === 'partner' ? service.partnerNotes ?? [] : []),
  ];
  const ids = [...new Set(facts.map((f) => f.sourceId))];
  return ids
    .map((id) => getSource(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({ sourceId: s.id, title: s.title, url: s.url, verifiedAt: s.verifiedAt }));
}

function baseCard(
  partial: Partial<AnswerCard> & Pick<AnswerCard, 'type' | 'status' | 'headline' | 'summary'>,
  maskedQuery: string,
  piiTypes: string[],
  _startedAt: number,
): AnswerCard {
  return {
    messageId: newMessageId(),
    serviceId: null,
    steps: [],
    documents: [],
    notes: [],
    secondaryActions: [],
    citations: [],
    handoff: null,
    maskedPiiTypes: piiTypes,
    maskedQuery,
    engine: 'rules',
    latencyMs: 0,
    cached: false,
    retrieval: [],
    disclosure: AI_DISCLOSURE,
    ...partial,
  };
}

export function buildServiceCard(service: ServiceEntry, channel: Channel, opts: { status?: StatusLabel; headline?: string; summary?: string; now?: Date } = {}): Omit<AnswerCard, 'messageId' | 'maskedQuery' | 'maskedPiiTypes' | 'engine' | 'latencyMs' | 'cached' | 'retrieval' | 'disclosure'> {
  const notes = [...service.notes, ...(channel === 'partner' ? service.partnerNotes ?? [] : [])].map((f) => f.text);
  const actions = [service.primaryAction, ...(service.secondaryActions ?? [])].filter((a) => isOfficialUrl(a.url));
  return {
    type: 'SERVICE',
    serviceId: service.id,
    serviceName: service.name,
    category: service.category,
    status: opts.status ?? (service.needsHumanConfirmation ? '需要進一步確認' : '已找到相關官方資訊'),
    headline: opts.headline ?? service.name,
    summary: opts.summary ?? service.summary.map((f) => f.text).join(''),
    steps: service.steps.map((f) => f.text),
    documents: service.documents.map((f) => f.text),
    notes,
    primaryAction: actions[0],
    secondaryActions: actions.slice(1),
    citations: citationsFor(service, channel),
    handoff: buildHandoff(Boolean(service.needsHumanConfirmation), service.needsHumanConfirmation ? '官方頁面資訊不足以完整回答，建議由客服專人確認。' : '如需協助，可聯繫客服專人。', opts.now),
  };
}

function finalize(card: AnswerCard, startedAt: number): AnswerCard {
  return { ...card, latencyMs: Date.now() - startedAt };
}

export async function navigate(input: NavigateInput, llm?: LlmAssistant | null): Promise<NavigateOutput> {
  const startedAt = Date.now();
  const now = input.now ?? new Date();
  const { masked, types } = maskPii(input.query ?? '');
  const piiNote = types.length ? [`已自動遮罩您輸入的${types.join('、')}。請勿在對話中提供個人資料，本助手不會儲存或查詢個人保單。`] : [];

  // 1) 使用者從澄清選項或服務目錄直接選擇服務
  if (input.selectedServiceId) {
    const service = getService(input.selectedServiceId);
    if (service && service.channels.includes(input.channel)) {
      const body = buildServiceCard(service, input.channel, { now });
      const card = baseCard({ ...body, notes: [...piiNote, ...body.notes] }, masked, types, startedAt);
      return { card: finalize(card, startedAt), cacheable: false };
    }
  }

  const query = masked.trim();
  if (!query) {
    const card = baseCard({ type: 'NO_MATCH', status: '目前無法確認', headline: '請輸入您的問題', summary: '請用一句話描述您想辦理的保險服務。' }, masked, types, startedAt);
    return { card: finalize(card, startedAt), cacheable: false };
  }

  // 2) 安全防護
  const guard = detectGuardrail(query);
  if (guard) {
    const related = guard.relatedServiceId ? getService(guard.relatedServiceId) : undefined;
    const body = related ? buildServiceCard(related, input.channel, { now }) : null;
    const card = baseCard(
      {
        ...(body ?? {}),
        type: 'GUARDRAIL',
        status: '需要進一步確認',
        headline: guard.headline,
        summary: guard.summary,
        notes: [...piiNote, ...(body?.notes ?? [])],
        handoff: buildHandoff(guard.kind !== 'PROMPT_INJECTION', '如需進一步說明，請洽客服專人。', now),
      },
      masked,
      types,
      startedAt,
    );
    return { card: finalize(card, startedAt), cacheable: true };
  }

  // 3) 模糊的變更請求 → 澄清
  if (isVagueChangeRequest(query)) {
    const card = baseCard(
      {
        type: 'CLARIFY',
        status: '需要進一步確認',
        headline: '請問您想變更哪一項資料？',
        summary: '不同變更項目的辦理方式與應備文件不同，請選擇最接近的項目。',
        notes: piiNote,
        clarificationOptions: CHANGE_CLARIFICATION_IDS.map((id) => ({ label: getService(id)!.name, serviceId: id })),
      },
      masked,
      types,
      startedAt,
    );
    return { card: finalize(card, startedAt), cacheable: true };
  }

  // 4) 混合檢索
  const hits = retriever.search(query, input.channel, 5);
  let chosenId: string | null = null;
  let engine: AnswerCard['engine'] = 'rules';
  let llmFailed = false;

  const top = hits[0];
  const second = hits[1];
  const confident = top && top.score >= MIN_CONFIDENT_SCORE;
  const ambiguous = confident && second && second.score / top.score >= AMBIGUITY_RATIO;

  if (llm && hits.length > 0 && (!confident || ambiguous)) {
    // 檢索信心不足時，請 LLM 在候選中判斷（只能從候選中選）
    try {
      const candidates = hits.map((h) => getService(h.serviceId)!).filter(Boolean);
      const picked = await llm.chooseService(query, candidates);
      engine = 'rules+gemini';
      if (picked && candidates.some((c) => c.id === picked)) chosenId = picked;
    } catch {
      llmFailed = true;
    }
  }

  if (!chosenId && confident && !ambiguous) chosenId = top.serviceId;

  if (!chosenId && ambiguous) {
    const options = hits.filter((h) => h.score / top.score >= 0.6).slice(0, 4);
    const card = baseCard(
      {
        type: 'CLARIFY',
        status: '需要進一步確認',
        headline: '請問您指的是哪一項服務？',
        summary: '您的問題可能對應以下幾項服務，請選擇最接近的一項。',
        notes: piiNote,
        clarificationOptions: options.map((h) => ({ label: getService(h.serviceId)!.name, serviceId: h.serviceId })),
        retrieval: hits,
        engine,
      },
      masked,
      types,
      startedAt,
    );
    return { card: finalize(card, startedAt), cacheable: !llmFailed };
  }

  if (!chosenId) {
    const card = baseCard(
      {
        type: 'NO_MATCH',
        status: '目前無法確認',
        headline: '這個問題需要由客服專人協助',
        summary: '目前收錄的官方資料中找不到可靠的答案。為避免提供錯誤資訊，建議您聯繫客服，或從官方網路保險服務頁查找。',
        notes: piiNote,
        primaryAction: { label: '查看官方網路保險服務', url: CARDIF_OVERVIEW_URL, loginRequired: false, isDirectLink: false },
        citations: [getSource('f8')!].map((s) => ({ sourceId: s.id, title: s.title, url: s.url, verifiedAt: s.verifiedAt })),
        handoff: buildHandoff(true, '官方資料中查無對應服務。', now),
        retrieval: hits,
        engine,
      },
      masked,
      types,
      startedAt,
    );
    return { card: finalize(card, startedAt), cacheable: !llmFailed };
  }

  // 5) 組成服務回答卡（可選：LLM 改寫標題與摘要）
  const service = getService(chosenId)!;
  let headline: string | undefined;
  let summary: string | undefined;
  let model: string | undefined;
  if (llm) {
    try {
      const rewritten = await llm.rewrite(query, service);
      engine = 'rules+gemini';
      model = llm.model;
      if (rewritten) {
        headline = rewritten.headline;
        summary = rewritten.summary;
      }
    } catch {
      llmFailed = true;
    }
  }

  const body = buildServiceCard(service, input.channel, { headline, summary, now });
  const card = baseCard({ ...body, notes: [...piiNote, ...body.notes], retrieval: hits, engine, model }, masked, types, startedAt);
  return { card: finalize(card, startedAt), cacheable: !llmFailed };
}

export { retriever };
