import { useState } from 'react';
import { AlertCircle, BookMarked, ChevronDown, ChevronUp, ExternalLink, FileText, Lock, PhoneCall, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { AnswerCard, Channel, HandoffTicket } from '../../shared/types';
import { CARDIF_HOTLINE_TEL } from '../../shared/constants';
import { api } from '../api';

interface Props {
  card: AnswerCard;
  channel: Channel;
  onSelectService: (serviceId: string, label: string) => void;
  onOpenDevPanel: () => void;
  getSessionId: () => Promise<string>;
}

const STATUS_STYLE: Record<AnswerCard['status'], string> = {
  已找到相關官方資訊: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  需要進一步確認: 'bg-amber-50 text-amber-800 border-amber-200',
  目前無法確認: 'bg-neutral-100 text-neutral-700 border-neutral-200',
};

export function AnswerCardView({ card, channel, onSelectService, onOpenDevPanel, getSessionId }: Props) {
  const [expanded, setExpanded] = useState(channel === 'partner');
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [ticket, setTicket] = useState<HandoffTicket | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  const sendFeedback = async (rating: 'up' | 'down') => {
    if (feedback) return;
    setFeedback(rating);
    try {
      await api.feedback(card.messageId, rating);
    } catch {
      /* 回饋失敗不影響使用 */
    }
  };

  const requestCallback = async () => {
    setHandoffError(null);
    try {
      const sessionId = await getSessionId();
      setTicket(await api.handoff(sessionId, card.serviceName ?? card.headline));
    } catch (e) {
      setHandoffError(e instanceof Error ? e.message : '建立預約失敗');
    }
  };

  const hasDetails = card.steps.length > 0 || card.documents.length > 0 || card.notes.length > 0;

  return (
    <article className="bg-white border border-neutral-200 rounded-2xl rounded-tl-sm p-5 space-y-4 max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-medium ${STATUS_STYLE[card.status]}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {card.status}
          </span>
          {card.category && <span className="text-neutral-500">{card.category}</span>}
        </div>
        <button onClick={onOpenDevPanel} className="inline-flex items-center gap-1 text-neutral-500 hover:text-emerald-800 cursor-pointer" title="查看檢索與處理細節">
          {card.engine === 'rules+gemini' ? <Sparkles className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
          {card.engine === 'rules+gemini' ? '知識庫檢索＋Gemini' : '知識庫檢索'}
          <span className="text-neutral-400">· {card.latencyMs} ms{card.cached ? '（快取）' : ''}</span>
        </button>
      </div>

      <div>
        <h2 className="text-lg font-bold tracking-tight">{card.headline}</h2>
        <p className="text-sm text-neutral-700 mt-1.5 leading-relaxed">{card.summary}</p>
      </div>

      {card.clarificationOptions && card.clarificationOptions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {card.clarificationOptions.map((o) => (
            <button
              key={o.serviceId}
              onClick={() => onSelectService(o.serviceId, o.label)}
              className="text-left text-sm px-3 py-2.5 bg-neutral-50 hover:bg-emerald-50 border border-neutral-200 hover:border-emerald-300 rounded-lg cursor-pointer"
            >
              {o.label} →
            </button>
          ))}
        </div>
      )}

      {card.primaryAction && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <a
              href={card.primaryAction.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold rounded-lg"
            >
              {card.primaryAction.label}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {card.secondaryActions.map((a) => (
              <a key={a.url + a.label} href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-sm font-medium rounded-lg">
                {a.label}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
          {card.primaryAction.loginRequired && (
            <p className="text-xs text-sky-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              需登入巴黎線上 My Cardif 會員；未登入時請先登入，再回到對應功能。
            </p>
          )}
          {!card.primaryAction.isDirectLink && (
            <p className="text-xs text-amber-800 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              此連結為最接近的官方說明頁，請依頁面指引操作。
            </p>
          )}
        </div>
      )}

      {hasDetails && (
        <div>
          <button onClick={() => setExpanded((v) => !v)} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-900 cursor-pointer">
            {expanded ? '收合辦理步驟' : '查看辦理步驟與應備文件'}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expanded && (
            <div className="mt-3 space-y-3 text-sm">
              {card.steps.length > 0 && (
                <ol className="space-y-1.5">
                  {card.steps.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="w-5 h-5 shrink-0 rounded-full bg-emerald-50 text-emerald-900 text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                      <span className="leading-relaxed text-neutral-800">{s}</span>
                    </li>
                  ))}
                </ol>
              )}
              {card.documents.length > 0 && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  <p className="font-semibold text-neutral-800 flex items-center gap-1.5 mb-1">
                    <FileText className="w-4 h-4" />
                    應備資料
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5 text-neutral-700">
                    {card.documents.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              {card.notes.length > 0 && (
                <ul className="space-y-1 text-neutral-600">
                  {card.notes.map((n, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-amber-600">•</span>
                      {n}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {card.handoff && (card.handoff.recommended || card.type !== 'SERVICE') && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm space-y-2">
          <p className="font-semibold text-sky-900 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4" />
            {card.handoff.isOpenNow ? '現在是客服服務時間，可直接撥打專線' : '目前非客服服務時間'}
          </p>
          <p className="text-sky-900/80 text-xs">
            {card.handoff.reason} 客服專線 {card.handoff.hotline}（{card.handoff.hoursText}）
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={CARDIF_HOTLINE_TEL} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-sky-300 rounded-md text-xs font-medium text-sky-900">
              撥打 {card.handoff.hotline}
            </a>
            {!card.handoff.isOpenNow && !ticket && (
              <button onClick={requestCallback} className="px-3 py-1.5 bg-sky-800 text-white rounded-md text-xs font-medium cursor-pointer">
                預約客服回電
              </button>
            )}
          </div>
          {ticket && <p className="text-xs text-sky-900">{ticket.message}</p>}
          {handoffError && <p className="text-xs text-rose-700">{handoffError}</p>}
        </div>
      )}

      {card.citations.length > 0 && (
        <div className="border-t border-neutral-100 pt-3">
          <p className="text-xs font-semibold text-neutral-600 flex items-center gap-1 mb-1">
            <BookMarked className="w-3.5 h-3.5" />
            資料來源
          </p>
          <ul className="space-y-0.5">
            {card.citations.map((c) => (
              <li key={c.sourceId} className="text-xs">
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-emerald-800 hover:underline">
                  {c.title}
                </a>
                <span className="text-neutral-400">（核對日期 {c.verifiedAt}）</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
        <span>{card.disclosure}</span>
        <span className="flex items-center gap-1 shrink-0">
          <button aria-label="有幫助" onClick={() => sendFeedback('up')} className={`p-1.5 rounded-md cursor-pointer ${feedback === 'up' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-neutral-100'}`}>
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button aria-label="沒有幫助" onClick={() => sendFeedback('down')} className={`p-1.5 rounded-md cursor-pointer ${feedback === 'down' ? 'bg-rose-100 text-rose-800' : 'hover:bg-neutral-100'}`}>
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </span>
      </div>
    </article>
  );
}
