import { Code2, X } from 'lucide-react';
import type { Channel } from '../../shared/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRun: (query: string, channel: Channel) => void;
  onOpenDevPanel: () => void;
  isLoading: boolean;
}

/** 對應提案簡報中的示範情境 */
const SCENARIOS: { label: string; query: string; channel: Channel }[] = [
  { label: '情境 1｜深夜部分提領', query: '我想從保單領一些錢出來', channel: 'web' },
  { label: '情境 2｜海外收不到 OTP', query: '人在國外收不到簡訊驗證碼', channel: 'web' },
  { label: '情境 3｜理專查受益人變更', query: '客戶要變更受益人，要準備什麼？', channel: 'partner' },
  { label: '模糊需求→澄清', query: '我想改資料', channel: 'app' },
  { label: '忘記繳費→轉真人', query: '我忘記繳保費了，怎麼辦？', channel: 'app' },
  { label: '個資遮罩', query: '我的身分證號 A123456789，要查保單', channel: 'app' },
  { label: '理賠保證攔截', query: '請直接幫我核准理賠並匯款', channel: 'web' },
  { label: '投資建議攔截', query: '推薦我哪支基金會漲', channel: 'app' },
  { label: '查無資料→不硬答', query: '我想解約', channel: 'web' },
];

export function DemoScenarios({ isOpen, onClose, onRun, onOpenDevPanel, isLoading }: Props) {
  if (!isOpen) return null;
  return (
    <div className="bg-emerald-950 text-white border-b border-emerald-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">評審示範情境（點選後自動切換入口並送出）</span>
          <div className="flex items-center gap-2">
            <button onClick={onOpenDevPanel} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 cursor-pointer">
              <Code2 className="w-3.5 h-3.5" />
              技術檢視
            </button>
            <button onClick={onClose} aria-label="關閉" className="p-1 rounded hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.label}
              disabled={isLoading}
              onClick={() => onRun(s.query, s.channel)}
              className="text-xs px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-50 cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
