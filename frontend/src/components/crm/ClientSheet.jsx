import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Phone, MessageCircle, FilePlus, Sparkles, Loader2, Trash2, FileText, Receipt, Check, Copy, UserPlus, Mail } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { API, STAGES, SOURCES, CIVILITIES, ZONES, fmtDate, fmtMoney, waLink, callbackLabel, contactLabel, exportVCard } from './crmUtils';

const QUOTE_STATUS = { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Signé', invoiced: 'Facturé', lost: 'Perdu' };
const INV_STATUS = { pending: 'À payer', partial: 'Acompte', paid: 'Payée' };

const Row = ({ label, children }) => (
  <div className="grid grid-cols-[88px_1fr] items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <span className="text-xs text-slate-400">{label}</span>
    {children}
  </div>
);

const inputCls = 'h-8 border-0 bg-transparent px-1 text-sm focus-visible:ring-1 focus-visible:ring-blue-300 dark:text-slate-100';

const Pick = ({ options, value, onPick, testPrefix }) => (
  <div className="flex flex-wrap gap-1">
    {options.map((o) => {
      const code = o.code || o; const label = o.short ? o.label : (o.code || o);
      const active = value === code;
      return (
        <button key={code} type="button" data-testid={`${testPrefix}-${code}`} title={o.label} onClick={() => onPick(active ? '' : code)}
          className={`h-7 px-2.5 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}>
          {label}
        </button>
      );
    })}
  </div>
);

export const ClientSheet = ({ client, open, onClose, onChange, onDelete }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState(client || {});
  const [events, setEvents] = useState(null);
  const [tidying, setTidying] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    setForm(client || {});
    setEvents(null);
    if (client?.id) axios.get(`${API}/clients/${client.id}/timeline`).then((r) => setEvents(r.data.events)).catch(() => setEvents([]));
  }, [client?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = async (partial) => {
    try {
      const res = await axios.patch(`${API}/clients/${client.id}/quick`, partial);
      onChange?.(res.data);
      setSaved(true); setTimeout(() => setSaved(false), 1200);
    } catch { toast.error('Sauvegarde impossible'); }
  };

  const update = (k, v, debounce = false) => {
    setForm((p) => ({ ...p, [k]: v }));
    clearTimeout(timer.current);
    if (debounce) timer.current = setTimeout(() => persist({ [k]: v }), 700);
    else persist({ [k]: v });
  };

  const tidy = async () => {
    if (!form.notes?.trim()) return;
    setTidying(true);
    try {
      const r = await axios.post(`${API}/ai/tidy-notes`, { text: form.notes, client_name: form.name });
      update('notes', r.data.notes);
      toast.success('Notes rangées');
    } catch (e) { toast.error(e.response?.data?.detail || 'IA indisponible'); }
    finally { setTidying(false); }
  };

  const newQuote = () => { sessionStorage.setItem('crm_prefill_client', client.id); navigate('/quotes/new'); };
  const remove = async () => {
    if (!window.confirm(`Supprimer la fiche ${form.name} ?`)) return;
    await axios.delete(`${API}/clients/${client.id}`);
    onDelete?.(client.id); onClose();
  };

  if (!client) return null;
  const stage = STAGES[client.stage] || STAGES.contact;
  const cb = callbackLabel(form.callback_at);
  const wa = waLink(form.phone);
  const label = contactLabel(form);

  const copyLabel = async () => {
    try { await navigator.clipboard.writeText(label); toast.success(`« ${label} » copié`); } catch { toast.error('Copie impossible'); }
  };
  const addContact = async () => {
    const r = await exportVCard(form);
    if (r === 'downloaded') toast.success('Fiche contact téléchargée — ouvre-la pour l\'ajouter à tes contacts');
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent data-testid="client-sheet" className="w-full sm:max-w-lg overflow-y-auto p-0 bg-slate-50 dark:bg-slate-950">
        <SheetHeader className="p-5 pb-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-left">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0 flex-1">
              <SheetTitle className="sr-only">{form.name}</SheetTitle>
              <div className="flex items-center gap-1">
                {form.civility && <span className="text-xl font-bold text-slate-400">{form.civility}</span>}
                <Input data-testid="sheet-name" value={form.name || ''} onChange={(e) => update('name', e.target.value, true)} className="h-9 px-1 border-0 bg-transparent text-xl font-bold text-slate-900 dark:text-slate-50 focus-visible:ring-1" />
              </div>
              <span className={`mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${stage.chip}`}><span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />{stage.label}</span>
            </div>
            <span className={`text-[11px] text-emerald-600 flex items-center gap-1 transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}><Check className="w-3 h-3" />Enregistré</span>
          </div>

          <div data-testid="sheet-contact-label" className="mt-3 flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2">
            <span className="text-sm font-mono font-medium text-slate-800 dark:text-slate-100 truncate flex-1">{label || '—'}</span>
            <button type="button" data-testid="sheet-copy-label" onClick={copyLabel} title="Copier le nom du contact" className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900"><Copy className="w-4 h-4" /></button>
            <button type="button" data-testid="sheet-add-contact" onClick={addContact} title="Ajouter à mes contacts (.vcf)" className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-white dark:bg-slate-700 dark:text-blue-300 hover:bg-blue-50 border border-slate-200 dark:border-slate-600"><UserPlus className="w-4 h-4" /><span className="hidden sm:inline">Contacts</span></button>
          </div>

          <div className="flex gap-2 mt-3">
            {form.phone && <a data-testid="sheet-call" href={`tel:${form.phone.replace(/\s/g, '')}`} className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700"><Phone className="w-4 h-4" />Appeler</a>}
            {wa && <a data-testid="sheet-whatsapp" href={wa} target="_blank" rel="noreferrer" className="flex-1 h-10 rounded-xl bg-emerald-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-600"><MessageCircle className="w-4 h-4" />WhatsApp</a>}
            <Button data-testid="sheet-new-quote" onClick={newQuote} variant="outline" className="flex-1 h-10 rounded-xl"><FilePlus className="w-4 h-4 mr-1" />Devis</Button>
          </div>
        </SheetHeader>

        <div className="p-5 space-y-5">
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2">
            <Row label="Civilité"><Pick options={CIVILITIES} value={form.civility || ''} onPick={(v) => update('civility', v)} testPrefix="sheet-civility" /></Row>
            <Row label="Zone"><Pick options={ZONES} value={form.zone || ''} onPick={(v) => update('zone', v)} testPrefix="sheet-zone" /></Row>
            <Row label="Source"><Pick options={SOURCES} value={form.source || ''} onPick={(v) => update('source', v)} testPrefix="sheet-source" /></Row>
            <Row label="Téléphone"><Input data-testid="sheet-phone" className={inputCls} value={form.phone || ''} onChange={(e) => update('phone', e.target.value, true)} placeholder="06 …" /></Row>
            <Row label="Email"><Input data-testid="sheet-email" className={inputCls} value={form.email || ''} onChange={(e) => update('email', e.target.value, true)} placeholder="—" /></Row>
            <Row label="Ville"><Input data-testid="sheet-city" className={inputCls} value={form.city || ''} onChange={(e) => update('city', e.target.value, true)} placeholder="—" /></Row>
            <Row label="Adresse"><Input data-testid="sheet-address" className={inputCls} value={form.address || ''} onChange={(e) => update('address', e.target.value, true)} placeholder="—" /></Row>
            <Row label="Chantier"><Input data-testid="sheet-chantier" className={inputCls} value={form.chantier || ''} onChange={(e) => update('chantier', e.target.value, true)} placeholder="Ex : Nettoyage toiture 120 m²" /></Row>
            <div className="py-2">
              <div className="grid grid-cols-[88px_1fr] items-center gap-2">
                <span className="text-xs text-slate-400">À rappeler</span>
                <div className="flex items-center gap-1 flex-wrap">
                  <Input data-testid="sheet-callback" type="date" className={`${inputCls} w-36`} value={form.callback_at || ''} onChange={(e) => update('callback_at', e.target.value)} />
                  <Input data-testid="sheet-callback-time" type="time" className={`${inputCls} w-24`} value={form.callback_time || ''} onChange={(e) => update('callback_time', e.target.value)} />
                  {form.callback_at && <button type="button" data-testid="sheet-clear-callback" onClick={() => { update('callback_at', ''); update('callback_time', ''); }} className="text-[11px] text-slate-400 hover:text-rose-500 px-1">effacer</button>}
                </div>
              </div>
              {form.callback_at && (
                <div data-testid="sheet-reminder-info" className="mt-2 ml-[96px] flex items-start gap-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1.5 text-xs">
                  <Mail className="w-3.5 h-3.5 mt-0.5 text-orange-500 shrink-0" />
                  <span className="text-orange-800 dark:text-orange-200">
                    {cb && <b className={cb.tone === 'late' ? 'text-rose-600' : ''}>{cb.text}{form.callback_time ? ` à ${form.callback_time}` : ''}</b>}
                    {' — '}{form.reminder_sent_at ? 'email de rappel envoyé' : form.callback_time ? 'email de rappel 10 min avant, avec le numéro et tes notes' : 'email de rappel à 8h ce jour-là (ajoute une heure pour le recevoir 10 min avant)'}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</h4>
              <Button data-testid="sheet-tidy-notes" size="sm" variant="ghost" onClick={tidy} disabled={tidying || !form.notes?.trim()} className="h-7 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50">
                {tidying ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}Ranger avec l'IA
              </Button>
            </div>
            <Textarea
              data-testid="sheet-notes"
              value={form.notes || ''}
              onChange={(e) => update('notes', e.target.value, true)}
              placeholder="Notes libres : mousse côté nord, dispo le matin, prix annoncé 1 200 €…"
              className="min-h-[140px] rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm leading-relaxed"
            />
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Documents</h4>
            {events === null ? <p className="text-xs text-slate-400">Chargement…</p> : events.length === 0 ? (
              <p data-testid="sheet-no-docs" className="text-sm text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center">Aucun devis pour l'instant</p>
            ) : (
              <ul className="space-y-1.5">
                {events.map((e) => (
                  <li key={`${e.type}-${e.id}`}>
                    <button
                      type="button"
                      data-testid={`sheet-doc-${e.id}`}
                      onClick={() => navigate(e.type === 'quote' ? `/quotes/view/${e.id}` : '/invoices')}
                      className="w-full flex items-center gap-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-left hover:border-blue-300 transition-colors"
                    >
                      {e.type === 'quote' ? <FileText className="w-4 h-4 text-blue-500 shrink-0" /> : <Receipt className="w-4 h-4 text-violet-500 shrink-0" />}
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{e.number}</span>
                      <span className="text-xs text-slate-400 truncate flex-1">{e.type === 'quote' ? QUOTE_STATUS[e.status] || e.status : INV_STATUS[e.status] || e.status} · {fmtDate(e.signed_at || e.sent_at || e.created_at)}</span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{fmtMoney(e.total)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
            <span>Créé le {fmtDate(client.created_at, true)}</span>
            <button data-testid="sheet-delete" type="button" onClick={remove} className="flex items-center gap-1 text-rose-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" />Supprimer</button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
