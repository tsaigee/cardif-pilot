import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { AnswerCard, Channel, HealthInfo } from '../../shared/types';
import { CHANNEL_LABELS } from '../../shared/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card?: AnswerCard;
  health: HealthInfo | null;
  channel: Channel;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-white/10 text-xs">
      <span className="text-neutral-400">{label}</span>
      <span className="text-right font-mono break-all">{value}</span>
    </div>
  );
}

export function DevPanel({ isOpen, onClose, card, health, channel }: Props) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside className="w-full max-w-md h-full bg-neutral-950 text-neutral-100 p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">技術檢視</h2>
          <button onClick={onClose} aria-label="關閉" className="p-1 rounded hover:bg-white/10 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <section className="mb-5">
          <h3 className="text-xs font-semibold text-emerald-400 mb-1">系統狀態</h3>
          <Row label="入口" value={CHANNEL_LABELS[channel]} />
          <Row label="Gemini" value={health?.aiConnected ? `已啟用（${health.model}）` : '未設定金鑰：僅使用知識庫檢索'} />
          <Row label="知識庫服務數" value={health?.serviceCount ?? '—'} />
          <Row label="官方來源頁數" value={health?.sourceCount ?? '—'} />
          <Row label="知識庫核對日期" value={health?.knowledgeVerifiedAt ?? '—'} />
          <Row label="版本" value={health?.version ?? '—'} />
        </section>

        {card ? (
          <>
            <section className="mb-5">
              <h3 className="text-xs font-semibold text-emerald-400 mb-1">最近一次回答</h3>
              <Row label="回答類型" value={card.type} />
              <Row label="對應服務" value={card.serviceId ?? '—'} />
              <Row label="處理引擎" value={card.engine + (card.model ? `（${card.model}）` : '')} />
              <Row label="伺服器處理時間" value={`${card.latencyMs} ms${card.cached ? '（快取）' : ''}`} />
              <Row label="個資遮罩" value={card.maskedPiiTypes.length ? card.maskedPiiTypes.join('、') : '無'} />
              <Row label="遮罩後問句" value={card.maskedQuery || '—'} />
            </section>
            <section className="mb-5">
              <h3 className="text-xs font-semibold text-emerald-400 mb-1">檢索候選（分數＝2×關鍵詞＋BM25）</h3>
              {card.retrieval.length ? card.retrieval.map((h) => <Row key={h.serviceId} label={h.serviceId} value={h.score} />) : <p className="text-xs text-neutral-400">本次未經檢索（澄清選擇、安全攔截或直接選擇服務）。</p>}
            </section>
            <section>
              <h3 className="text-xs font-semibold text-emerald-400 mb-1">引用來源</h3>
              {card.citations.map((c) => (
                <Row key={c.sourceId} label={c.sourceId} value={<a className="underline" href={c.url} target="_blank" rel="noopener noreferrer">{c.url}</a>} />
              ))}
            </section>
          </>
        ) : (
          <p className="text-xs text-neutral-400">送出一個問題後，這裡會顯示檢索分數、處理時間與引用來源。</p>
        )}
      </aside>
    </div>
  );
}
