import { BookOpen, ExternalLink, RotateCcw, Sliders } from 'lucide-react';
import { CHANNEL_LABELS, type Channel } from '../../shared/types';
import { CARDIF_OVERVIEW_URL } from '../../shared/constants';

interface Props {
  channel: Channel;
  onChangeChannel: (c: Channel) => void;
  onOpenDirectory: () => void;
  onToggleDemo: () => void;
  isDemoOpen: boolean;
  onReset: () => void;
  hasMessages: boolean;
}

const CHANNELS: Channel[] = ['web', 'app', 'partner'];
const SHORT_LABELS: Record<Channel, string> = { web: '官網', app: '會員', partner: '理專' };

export function Header({ channel, onChangeChannel, onOpenDirectory, onToggleDemo, isDemoOpen, onReset, hasMessages }: Props) {
  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-xs font-black tracking-wider">CP</div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight">Cardif Pilot</span>
              <span className="text-xs font-medium text-emerald-800 hidden sm:inline">法巴智慧保險服務導覽助手</span>
            </div>
            <span className="text-[11px] text-neutral-500">大學競賽原型 · 非法國巴黎人壽官方產品</span>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1" role="tablist" aria-label="切換入口">
          {CHANNELS.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={channel === c}
              onClick={() => onChangeChannel(c)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                channel === c ? 'bg-white text-emerald-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span className="hidden md:inline">{CHANNEL_LABELS[c]}</span>
              <span className="md:hidden">{SHORT_LABELS[c]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button onClick={onOpenDirectory} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 cursor-pointer">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">服務目錄</span>
          </button>
          <a href={CARDIF_OVERVIEW_URL} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-100">
            <span>官方網站</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onToggleDemo}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium cursor-pointer ${isDemoOpen ? 'bg-emerald-800 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>評審示範</span>
          </button>
          {hasMessages && (
            <button onClick={onReset} title="清除對話" className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
