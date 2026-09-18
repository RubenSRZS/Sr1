import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, PhoneIncoming, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { API } from './crmUtils';

const EMPTY = { name: '', phone: '', email: '', city: '', address: '', chantier: '', callback_at: '', notes: '' };

const Field = ({ label, testId, ...props }) => (
  <label className="block">
    <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</span>
    <Input data-testid={testId} className="mt-1 h-9 bg-white dark:bg-slate-900" {...props} />
  </label>
);

export const QuickCapture = ({ onCreated }) => {
  const [raw, setRaw] = useState('');
  const [draft, setDraft] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const analyze = async () => {
    if (!raw.trim()) return;
    setParsing(true);
    try {
      const res = await axios.post(`${API}/ai/parse-contact`, { text: raw });
      const d = res.data.data || {};
      setDraft({ ...EMPTY, ...d, callback_at: d.callback_at || '' });
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
      const payload = { ...draft, address: draft.address || draft.city, callback_at: draft.callback_at || null, source: 'appel' };
      const res = await axios.post(`${API}/clients`, payload);
      toast.success(`Fiche ${res.data.name} créée`);
      setRaw(''); setDraft(null);
      onCreated?.(res.data);
    } catch (e) {
      toast.error('Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setDraft((p) => ({ ...p, [k]: e.target.value }));

  return (
    <section data-testid="quick-capture" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center"><PhoneIncoming className="w-4 h-4" /></span>
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Appel client — saisie rapide</h2>
          <p className="text-xs text-slate-400">Tape en vrac, l'IA range tout dans la fiche.</p>
        </div>
      </div>

      {!draft ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <Textarea
            data-testid="quick-capture-input"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) analyze(); }}
            placeholder="Ex : Dupont 06 12 34 56 78 Belfort, toiture 120 m² beaucoup de mousse, rappeler mardi matin…"
            className="min-h-[56px] sm:min-h-[44px] resize-none bg-slate-50 dark:bg-slate-950 border-slate-200"
            rows={2}
          />
          <Button data-testid="quick-capture-analyze" onClick={analyze} disabled={parsing || !raw.trim()} className="sm:w-auto h-11 sm:h-auto bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-xl px-4">
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="ml-2">{parsing ? 'Analyse…' : 'Créer la fiche'}</span>
          </Button>
        </div>
      ) : (
        <div data-testid="quick-capture-draft" className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Nom *" testId="draft-name" value={draft.name} onChange={set('name')} autoFocus />
            <Field label="Téléphone" testId="draft-phone" value={draft.phone} onChange={set('phone')} />
            <Field label="Ville" testId="draft-city" value={draft.city} onChange={set('city')} />
            <Field label="Chantier" testId="draft-chantier" value={draft.chantier} onChange={set('chantier')} />
            <Field label="À rappeler le" testId="draft-callback" type="date" value={draft.callback_at} onChange={set('callback_at')} />
            <Field label="Email" testId="draft-email" value={draft.email} onChange={set('email')} />
            <Field label="Adresse" testId="draft-address" value={draft.address} onChange={set('address')} />
          </div>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Notes</span>
            <Textarea data-testid="draft-notes" value={draft.notes} onChange={set('notes')} rows={3} className="mt-1 bg-white dark:bg-slate-900 text-sm" />
          </label>
          <div className="flex justify-end gap-2">
            <Button data-testid="draft-cancel" variant="ghost" onClick={() => setDraft(null)} className="rounded-xl"><X className="w-4 h-4 mr-1" />Annuler</Button>
            <Button data-testid="draft-save" onClick={save} disabled={saving} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}Enregistrer la fiche
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};
