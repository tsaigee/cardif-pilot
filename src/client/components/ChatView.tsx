import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowUp, RefreshCw } from 'lucide-react';
import type { Channel, ChatMessage } from '../../shared/types';
import { CHANNEL_LABELS } from '../../shared/types';
import { AnswerCardView } from './AnswerCardView';

interface Props {
  channel: Channel;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (q: string) => void;
  onSelectService: (serviceId: string, label: string) => void;
  onRetry?: () => void;
  onOpenDevPanel: () => void;
  getSessionId: () => Promise<string>;
}

const SUGGESTIONS: Record<Channel, { q: string; hint: string }[]> = {
  web: [
    { q: '我想從保單領一些錢出來', hint: '部分提領的線上辦理方式' },
    { q: '人在國外收不到簡訊驗證碼', hint: '會員登入與 OTP 問題' },
    { q: '我忘記繳保費了，怎麼辦？', hint: '繳費明細與客服確認' },
  ],
  app: [
    { q: '我想查詢配息紀錄', hint: '投資表現與配息歸戶' },
    { q: '我想更改信用卡扣款資料', hint: '線上變更或書面授權' },
    { q: '查詢理賠進度', hint: '保單變更與理賠進度' },
  ],
  partner: [
    { q: '客戶要變更受益人，要準備什麼？', hint: '表單與注意事項' },
    { q: '保單借款要準備哪些文件', hint: '應備文件與撥款時間' },
    { q: '住院理賠要準備什麼文件', hint: '理賠應備文件' },
  ],
};

export function ChatView({ channel, messages, isLoading, error, onSend, onSelectService, onRetry, onOpenDevPanel, getSessionId }: Props) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || isLoading) return;
    onSend(q);
    setInput('');
  };

  const inputBox = (
    <form onSubmit={submit} className="relative w-full">
      <label htmlFor="cp-input" className="sr-only">輸入您的問題</label>
      <input
        id="cp-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        maxLength={300}
        disabled={isLoading}
        placeholder={channel === 'partner' ? '請輸入客戶的需求（例：客戶要變更受益人）' : '用一句話描述您的需求，例如：我想從保單領一些錢出來'}
        className="w-full pl-4 pr-12 py-3.5 bg-white text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15 placeholder:text-neutral-400"
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        aria-label="送出"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:bg-neutral-200 text-white disabled:text-neutral-400 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </form>
  );

  if (messages.length === 0) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-center px-4 py-10">
        <div className="max-w-2xl w-full mx-auto space-y-7">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">問一句，就到位</h1>
            <p className="text-sm text-neutral-600">
              目前入口：<span className="font-medium text-emerald-900">{CHANNEL_LABELS[channel]}</span>。我會依法國巴黎人壽官方資料，告訴您該去哪裡、怎麼辦理，並附上資料來源。
            </p>
          </div>
          {inputBox}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SUGGESTIONS[channel].map((s) => (
              <button
                key={s.q}
                onClick={() => onSend(s.q)}
                disabled={isLoading}
                className="text-left p-3.5 bg-white border border-neutral-200 hover:border-emerald-700 rounded-xl cursor-pointer"
              >
                <p className="text-sm font-semibold leading-snug">{s.q}</p>
                <p className="text-xs text-neutral-500 mt-1">{s.hint}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-500 text-center">請勿在對話中輸入身分證號、卡號等個人資料；系統偵測到時會自動遮罩。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6">
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1" aria-live="polite">
        {messages.map((m) =>
          m.sender === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-lg bg-neutral-900 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">{m.text}</div>
            </div>
          ) : m.card ? (
            <AnswerCardView key={m.id} card={m.card} channel={channel} onSelectService={onSelectService} onOpenDevPanel={onOpenDevPanel} getSessionId={getSessionId} />
          ) : null,
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-neutral-500 px-1">
            <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
            正在比對官方服務資料…
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-sm text-rose-800 flex items-start justify-between gap-3">
            <span className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </span>
            {onRetry && (
              <button onClick={onRetry} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-white border border-rose-300 rounded-md cursor-pointer">
                <RefreshCw className="w-3 h-3" />
                重試
              </button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="pt-3">{inputBox}</div>
    </div>
  );
}
