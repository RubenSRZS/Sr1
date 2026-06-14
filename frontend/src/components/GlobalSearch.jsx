import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Receipt, Users, X } from 'lucide-react';
import { useDataCache } from '@/context/DataCacheContext';

const normalize = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const { cache, fetchQuotes, fetchInvoices, fetchClients } = useDataCache();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Open with Ctrl/Cmd + K or "/" anywhere outside inputs
  useEffect(() => {
    const handler = (e) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === '/' && document.activeElement && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Prefetch data when opened
  useEffect(() => {
    if (open) {
      fetchQuotes(); fetchInvoices(); fetchClients();
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery('');
    }
  }, [open, fetchQuotes, fetchInvoices, fetchClients]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    const quotes = (cache.quotes || []).filter(x =>
      normalize(x.quote_number).includes(q) ||
      normalize(x.client_name).includes(q) ||
      normalize(x.work_location).includes(q)
    ).slice(0, 6).map(x => ({
      type: 'quote', id: x.id, title: `${x.quote_number} — ${x.client_name}`,
      subtitle: x.work_location || '—', amount: x.total_net, status: x.status,
      to: `/quotes/edit/${x.id}`,
    }));
    const invoices = (cache.invoices || []).filter(x =>
      normalize(x.invoice_number).includes(q) ||
      normalize(x.client_name).includes(q)
    ).slice(0, 6).map(x => ({
      type: 'invoice', id: x.id, title: `${x.invoice_number} — ${x.client_name}`,
      subtitle: x.work_location || '—', amount: x.total_net, status: x.payment_status,
      to: `/invoices/edit/${x.id}`,
    }));
    const clients = (cache.clients || []).filter(x =>
      normalize(x.name).includes(q) ||
      normalize(x.email).includes(q) ||
      normalize(x.phone).includes(q) ||
      normalize(x.address).includes(q)
    ).slice(0, 6).map(x => ({
      type: 'client', id: x.id, title: x.name,
      subtitle: [x.email, x.phone].filter(Boolean).join(' · '),
      to: '/clients',
    }));
    return [...quotes, ...invoices, ...clients];
  }, [query, cache]);

  const goto = (r) => {
    setOpen(false);
    navigate(r.to);
  };

  const onKeyDown = (e) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); goto(results[activeIdx]); }
  };

  const iconFor = (t) => t === 'quote' ? FileText : t === 'invoice' ? Receipt : Users;
  const labelFor = (t) => t === 'quote' ? 'Devis' : t === 'invoice' ? 'Facture' : 'Client';

  return (
    <>
      {/* Trigger button (discreet) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 h-8 px-2.5 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 text-gray-500 text-xs transition-colors"
        data-testid="global-search-trigger"
        title="Recherche globale (Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Rechercher…</span>
        <kbd className="ml-1 px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px] font-mono text-gray-400">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          data-testid="global-search-modal"
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 border-b border-gray-100">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
                onKeyDown={onKeyDown}
                placeholder="Devis, factures, clients…"
                className="flex-1 h-12 outline-none text-sm placeholder:text-gray-400"
                data-testid="global-search-input"
              />
              <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400" data-testid="global-search-close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {!query.trim() && (
                <div className="px-4 py-8 text-center text-xs text-gray-400">
                  Tapez pour chercher un devis, une facture ou un client.<br />
                  <span className="text-gray-300">Astuce : <kbd className="px-1 bg-gray-100 rounded">↑ ↓</kbd> pour naviguer, <kbd className="px-1 bg-gray-100 rounded">⏎</kbd> pour ouvrir</span>
                </div>
              )}
              {query.trim() && results.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-gray-400">Aucun résultat</div>
              )}
              <ul>
                {results.map((r, i) => {
                  const Icon = iconFor(r.type);
                  const active = i === activeIdx;
                  return (
                    <li key={`${r.type}-${r.id}`}>
                      <button
                        type="button"
                        onClick={() => goto(r)}
                        onMouseEnter={() => setActiveIdx(i)}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-3 border-l-2 ${active ? 'bg-blue-50 border-blue-500' : 'border-transparent hover:bg-gray-50'}`}
                        data-testid={`global-search-result-${i}`}
                      >
                        <Icon className={`w-4 h-4 ${r.type === 'quote' ? 'text-blue-500' : r.type === 'invoice' ? 'text-emerald-500' : 'text-amber-500'} shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-800 truncate">{r.title}</div>
                          <div className="text-[11px] text-gray-400 truncate">{labelFor(r.type)} · {r.subtitle}</div>
                        </div>
                        {typeof r.amount === 'number' && (
                          <span className="text-xs font-semibold text-gray-600 shrink-0">{r.amount.toFixed(0)} €</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
