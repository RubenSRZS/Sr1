import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, PhoneIncoming, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { API, COUNTRIES, SOURCES, CIVILITIES, contactLabel } from './crmUtils';

const EMPTY = { civility: '', name: '', phone: '', email: '', city: '', address: '', chantier: '', source: '', callback_at: '', callback_time: '', notes: '' };

const Field = ({ label, testId, className = '', ...props }) => (
  <label className={`block ${className}`}>
    <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</span>
    <Input data-testid={testId} className="mt-1 h-9 bg-white dark:bg-slate-900" {...props} />
  </label>
);

const Chip = ({ active, onClick, children, testId, className = '' }) => (
  <button type="button" data-testid={testId} onClick={onClick} className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'} ${className}`}>
    {children}
  </button>
);

export const CountryToggle = ({ value, onChange, allowAll = false, size = 'md' }) => (
  <div data-testid="country-toggle" className={`inline-flex rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
    {(allowAll ? [{ code: 'all', flag: '', label: 'Tous' }, ...COUNTRIES] : COUNTRIES).map((c) => (
      <button key={c.code} type="button" data-testid={`country-${c.code}`} onClick={() => onChange(c.code)}
        className={`px-3 ${size === 'sm' ? 'h-7' : 'h-8'} rounded-full font-medium transition-colors ${value === c.code ? 'bg-white dark:bg-slate-950 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
        {c.flag ? <span className="mr-1">{c.flag}</span> : null}{c.label}
      </button>
    ))}
  </div>
);

export const QuickCapture = ({ country, onCountryChange, onCreated }) => {
  const [raw, setRaw] = useState('');
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const analyze = async () => {
    if (!raw.trim()) return;
    setParsing(true);
    try {
      const res = await axios.post(`${API}/ai/parse-contact`, { text: raw, country });
      const d = res.data.data || {};
      setDraft({ ...EMPTY, ...d, callback_at: d.callback_at || '', callback_time: d.callback_time || '' });
    } catch (e) {
      toast.error(e.response?.data?.detail || "L'IA n'a pas pu analyser — remplis la fiche à la main");
      setDraft({ ...EMPTY, notes: raw });
    } finally {
      setParsing(false);
    }
  };

  const save = async () => {
    if (!draft.name.trim()) { toast.error('Le nom est obligatoire'); return; }
    setSaving(true);
    try {
      const payload = { ...draft, country, address: draft.address || draft.city, callback_at: draft.callback_at || null };
      const res = await axios.post(`${API}/clients`, payload);
      toast.success(`Fiche ${contactLabel(res.data)} créée`);
      setRaw(''); setDraft(null);
      onCreated?.(res.data);
    } catch (e) {
      toast.error('Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setDraft((p) => ({ ...p, [k]: e.target.value }));
  const setVal = (k, v) => setDraft((p) => ({ ...p, [k]: p[k] === v ? '' : v }));
  const expanded = focused || raw.length > 0;

  return (
    <section data-testid="quick-capture" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 shrink-0 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center"><PhoneIncoming className="w-4 h-4" /></span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">Appel client — saisie rapide</h2>
            <p className="text-xs text-slate-400 truncate">Tape en vrac, l'IA range tout dans la fiche.</p>
          </div>
        </div>
        <CountryToggle value={country} onChange={onCountryChange} size="sm" />
      </div>

      {!draft ? (
        <div className="space-y-2">
          <Textarea
            data-testid="quick-capture-input"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) analyze(); }}
            placeholder={`Ex : Mme Dupont 06 12 34 56 78 Belfort FB, toiture 120 m² beaucoup de mousse, rappeler mardi 17h…`}
            className={`resize-none bg-slate-50 dark:bg-slate-950 border-slate-200 text-base sm:text-sm leading-relaxed transition-[min-height,box-shadow] duration-300 ease-out ${expanded ? 'min-h-[180px] sm:min-h-[120px] shadow-inner' : 'min-h-[56px] sm:min-h-[48px]'}`}
          />
          <div className={`flex items-center justify-between gap-2 overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${expanded ? 'max-h-14 opacity-100' : 'max-h-0 opacity-0 sm:max-h-14 sm:opacity-100'}`}>
            <span className="text-[11px] text-slate-400 hidden sm:inline">Ctrl/Cmd + Entrée pour analyser</span>
            <Button data-testid="quick-capture-analyze" onClick={analyze} disabled={parsing || !raw.trim()} className="ml-auto h-11 sm:h-10 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-xl px-5">
              {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="ml-2">{parsing ? 'Analyse…' : 'Créer la fiche'}</span>
            </Button>
          </div>
        </div>
      ) : (
        <div data-testid="quick-capture-draft" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {CIVILITIES.map((c) => <Chip key={c} testId={`draft-civility-${c}`} active={draft.civility === c} onClick={() => setVal('civility', c)}>{c}</Chip>)}
            <span className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
            {SOURCES.map((s) => <Chip key={s.code} testId={`draft-source-${s.code}`} active={draft.source === s.code} onClick={() => setVal('source', s.code)} title={s.label}>{s.code}</Chip>)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Nom *" testId="draft-name" value={draft.name} onChange={set('name')} autoFocus />
            <Field label="Téléphone" testId="draft-phone" value={draft.phone} onChange={set('phone')} />
            <Field label="Ville" testId="draft-city" value={draft.city} onChange={set('city')} />
            <Field label="Chantier" testId="draft-chantier" value={draft.chantier} onChange={set('chantier')} className="col-span-2 sm:col-span-1" />
            <Field label="À rappeler le" testId="draft-callback" type="date" value={draft.callback_at} onChange={set('callback_at')} />
            <Field label="Heure" testId="draft-callback-time" type="time" value={draft.callback_time} onChange={set('callback_time')} />
            <Field label="Email" testId="draft-email" value={draft.email} onChange={set('email')} />
            <Field label="Adresse" testId="draft-address" value={draft.address} onChange={set('address')} className="col-span-2 sm:col-span-2" />
          </div>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Notes</span>
            <Textarea data-testid="draft-notes" value={draft.notes} onChange={set('notes')} rows={3} className="mt-1 bg-white dark:bg-slate-900 text-sm" />
          </label>
          <div className="flex items-center justify-between gap-2">
            <span data-testid="draft-label" className="text-xs text-slate-500 truncate">Contact : <b className="text-slate-800 dark:text-slate-100">{contactLabel(draft) || '—'}</b></span>
            <div className="flex gap-2 shrink-0">
              <Button data-testid="draft-cancel" variant="ghost" onClick={() => setDraft(null)} className="rounded-xl"><X className="w-4 h-4 mr-1" />Annuler</Button>
              <Button data-testid="draft-save" onClick={save} disabled={saving} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
