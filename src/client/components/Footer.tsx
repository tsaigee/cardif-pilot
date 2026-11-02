import { ExternalLink, Phone } from 'lucide-react';
import { CARDIF_HOTLINE, CARDIF_HOURS_TEXT, CARDIF_OVERVIEW_URL } from '../../shared/constants';

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-3 px-4 text-xs text-neutral-500">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <span>大學競賽原型，非法國巴黎人壽官方產品；僅提供資訊導覽，實際辦理以保險公司公告與保單條款為準。</span>
        <span className="flex flex-wrap items-center justify-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1">
            <Phone className="w-3 h-3" />
            客服 {CARDIF_HOTLINE}（{CARDIF_HOURS_TEXT}）
          </span>
          <a href={CARDIF_OVERVIEW_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 hover:text-emerald-800">
            官方網站
            <ExternalLink className="w-3 h-3" />
          </a>
        </span>
      </div>
    </footer>
  );
}
