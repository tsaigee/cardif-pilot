import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Channel, ServiceCategory } from '../../shared/types';
import { api } from '../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel;
  onSelect: (serviceId: string, name: string) => void;
}

type Fn = Awaited<ReturnType<typeof api.catalog>>['functions'][number];

export function ServiceDirectory({ isOpen, onClose, channel, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Fn[]>([]);
  const [verifiedAt, setVerifiedAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      api
        .catalog(channel, query)
        .then((r) => {
          setItems(r.functions);
          setVerifiedAt(r.knowledgeVerifiedAt);
          setError(null);
        })
        .catch((e) => setError(e instanceof Error ? e.message : '載入失敗'));
    }, 200);
    return () => clearTimeout(t);
  }, [isOpen, channel, query]);

  const grouped = useMemo(() => {
    const map = new Map<ServiceCategory, Fn[]>();
    for (const f of items) map.set(f.category, [...(map.get(f.category) ?? []), f]);
    return [...map.entries()];
  }, [items]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-neutral-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">服務功能目錄</h2>
              <p className="text-xs text-neutral-500">共 {items.length} 項 · 官方資料核對日期 {verifiedAt}</p>
            </div>
            <button onClick={onClose} aria-label="關閉" className="p-1.5 rounded-md hover:bg-neutral-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋服務，例如：提領、受益人、密碼"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-800"
            />
          </div>
        </div>
        <div className="p-5 overflow-y-auto space-y-5">
          {error && <p className="text-sm text-rose-700">{error}</p>}
          {grouped.map(([category, fns]) => (
            <section key={category}>
              <h3 className="text-xs font-semibold text-neutral-500 mb-2">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {fns.map((f) => (
                  <button key={f.id} onClick={() => onSelect(f.id, f.name)} className="text-left p-3 border border-neutral-200 hover:border-emerald-700 rounded-lg cursor-pointer">
                    <p className="text-sm font-semibold">{f.name}</p>
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{f.summary}</p>
                    <p className="text-[11px] text-neutral-400 mt-1.5">來源：{f.sourceIds.join('、')}</p>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {!error && items.length === 0 && <p className="text-sm text-neutral-500">找不到符合的服務。</p>}
        </div>
      </div>
    </div>
  );
}
