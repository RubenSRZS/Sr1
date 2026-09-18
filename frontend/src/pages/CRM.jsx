import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Search, Bell, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDataCache } from '@/context/DataCacheContext';
import { QuickCapture, ZoneToggle } from '@/components/crm/QuickCapture';
import { ClientCard } from '@/components/crm/ClientCard';
import { ClientSheet } from '@/components/crm/ClientSheet';
import { API, FILTERS, normalize, todayISO } from '@/components/crm/crmUtils';

const CRM = () => {
  const { invalidate } = useDataCache();
  const [clients, setClients] = useState(null);
  const [filter, setFilter] = useState('all');
  const [zone, setZone] = useState(() => localStorage.getItem('crm_zone') || 'all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const pickZone = (z) => { setZone(z); localStorage.setItem('crm_zone', z); };

  const load = useCallback(async () => {
    const res = await axios.get(`${API}/clients/overview`);
    setClients(res.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const patch = (updated) => setClients((list) => (list || []).map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
  const onCreated = (c) => { invalidate('clients'); setClients((l) => [{ ...c, stage: 'contact', last_activity: c.updated_at }, ...(l || [])]); setSelectedId(c.id); };
  const onDelete = (id) => { invalidate('clients'); setClients((l) => (l || []).filter((c) => c.id !== id)); };

  const today = todayISO();
  const inZone = useCallback((c) => zone === 'all' || (c.zone || '') === zone, [zone]);
  const reminders = useMemo(() => (clients || []).filter((c) => inZone(c) && c.callback_at && c.callback_at <= today).sort((a, b) => a.callback_at.localeCompare(b.callback_at)), [clients, today, inZone]);

  const visible = useMemo(() => {
    const q = normalize(search);
    return (clients || [])
      .filter(inZone)
      .filter((c) => filter === 'all' || (filter === 'reminders' ? !!c.callback_at : c.stage === filter))
      .filter((c) => !q || normalize(`${c.civility} ${c.name} ${c.phone} ${c.city} ${c.address} ${c.chantier} ${c.source} ${c.notes}`).includes(q))
      .sort((a, b) => filter === 'reminders' ? (a.callback_at || '').localeCompare(b.callback_at || '') : (b.last_activity || '').localeCompare(a.last_activity || ''));
  }, [clients, filter, search, inZone]);

  const counts = useMemo(() => (clients || []).filter(inZone).reduce((acc, c) => { acc.all = (acc.all || 0) + 1; acc[c.stage] = (acc[c.stage] || 0) + 1; if (c.callback_at) acc.reminders = (acc.reminders || 0) + 1; return acc; }, {}), [clients, inZone]);
  const selected = clients?.find((c) => c.id === selectedId) || null;

  return (
    <div data-testid="crm-page" className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight whitespace-nowrap">Mes clients</h1>
            <p className="text-sm text-slate-400 mt-1">{clients ? `${counts.all || 0} fiches` : 'Chargement…'}</p>
          </div>
          <ZoneToggle value={zone} onChange={pickZone} allowAll />
        </header>

        <QuickCapture zone={zone === 'all' ? 'JU' : zone} onZoneChange={pickZone} onCreated={onCreated} />

        {reminders.length > 0 && (
          <section data-testid="reminders-strip" className="rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/60 dark:bg-orange-950/20 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300 flex items-center gap-1.5 mb-2"><Bell className="w-3.5 h-3.5" />À rappeler ({reminders.length})</h2>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {reminders.map((c) => (
                <button key={c.id} type="button" data-testid={`reminder-${c.id}`} onClick={() => setSelectedId(c.id)} className="shrink-0 rounded-xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/50 px-3 py-2 text-left hover:border-orange-400 transition-colors">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{c.civility ? `${c.civility} ` : ''}{c.name}</div>
                  <div className="text-xs text-slate-500 truncate max-w-[180px]">{c.chantier || c.city || c.phone || '—'}</div>
                  <div className={`text-[11px] font-medium mt-0.5 ${c.callback_at < today ? 'text-rose-600' : 'text-orange-600'}`}>{c.callback_at < today ? 'En retard' : "Aujourd'hui"}{c.callback_time ? ` · ${c.callback_time}` : ''}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
            {FILTERS.map((f) => {
              const n = counts[f.key];
              const active = filter === f.key;
              return (
                <button key={f.key} type="button" data-testid={`filter-${f.key}`} onClick={() => setFilter(f.key)} className={`shrink-0 h-8 px-3 rounded-full text-xs font-medium transition-colors ${active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}>
                  {f.label}{n ? <span className={`ml-1.5 ${active ? 'opacity-70' : 'text-slate-400'}`}>{n}</span> : null}
                </button>
              );
            })}
          </div>
          <div className="relative sm:ml-auto sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input data-testid="crm-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, ville, téléphone, note…" className="pl-9 h-9 rounded-full bg-white dark:bg-slate-900" />
          </div>
        </div>

        {clients && visible.length === 0 ? (
          <div data-testid="crm-empty" className="text-center py-16 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun client ici</p>
          </div>
        ) : (
          <div data-testid="clients-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((c) => <ClientCard key={c.id} client={c} onOpen={(cl) => setSelectedId(cl.id)} />)}
          </div>
        )}
      </div>

      <ClientSheet client={selected} open={!!selected} onClose={() => setSelectedId(null)} onChange={(u) => { patch(u); invalidate('clients'); }} onDelete={onDelete} />
    </div>
  );
};

export default CRM;
