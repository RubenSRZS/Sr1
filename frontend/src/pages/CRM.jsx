import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, User, Phone, Mail, MapPin, FileText, Receipt, Send, CheckCircle, XCircle, Save, Trash2, ChevronLeft, StickyNote, Edit3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { useDataCache } from '@/context/DataCacheContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const normalize = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const round2 = (v) => Math.round(v * 100) / 100;
const toNum = (s) => { const n = parseFloat(String(s).replace(',', '.')); return isFinite(n) ? n : null; };

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

// Core arithmetic eval (no % sign). Sandboxed by a strict regex.
const evalCore = (raw) => {
  const cleaned = raw.replace(/[xX×]/g, '*').replace(/[÷]/g, '/').replace(/\s/g, '');
  if (!cleaned || !/^[\d+\-*/().,]+$/.test(cleaned)) return null;
  const safe = cleaned.replace(/,/g, '.');
  try {
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict"; return (${safe})`)();
    return (typeof val === 'number' && isFinite(val)) ? round2(val) : null;
  } catch { return null; }
};

// Evaluate a line, with calculator-style percentages:
// 1000-30% = 700, 1000+20% = 1200, 1000*30% = 300, 10x100-30% = 700, 30% = 0.3
const evalExpression = (expr) => {
  const e = expr.replace(/[xX×]/g, '*').replace(/[÷]/g, '/').replace(/\s/g, '');
  let m;
  if ((m = e.match(/^(.+?)([+\-])([\d.,]+)%$/))) {
    const base = evalCore(m[1]); const pct = toNum(m[3]);
    if (base === null || pct === null) return null;
    const delta = base * pct / 100;
    return round2(m[2] === '-' ? base - delta : base + delta);
  }
  if ((m = e.match(/^(.+?)([*/])([\d.,]+)%$/))) {
    const base = evalCore(m[1]); const pct = toNum(m[3]);
    if (base === null || pct === null) return null;
    if (m[2] === '/') return pct === 0 ? null : round2(base / (pct / 100));
    return round2(base * (pct / 100));
  }
  if ((m = e.match(/^([\d.,]+)%$/))) {
    const n = toNum(m[1]); return n !== null ? round2(n / 100) : null;
  }
  return evalCore(e);
};

// Compute the math result of a single note line, or null.
const lineResult = (line) => {
  const t = (line || '').trim();
  if (t && /[+\-*/xX×÷%]/.test(t) && /^[\d+\-*/().,xX×÷%\s]+$/.test(t)) {
    return evalExpression(t);
  }
  return null;
};

// Single notepad where the computed result appears inline, on the right of each line.
const SmartNotes = ({ value, onChange, placeholder }) => {
  const lines = useMemo(() => (value && value.length ? value.split('\n') : ['']), [value]);
  const refs = useRef([]);
  const caret = useRef(null);

  const commit = (next) => onChange(next.join('\n'));

  const handleChange = (i, text) => {
    const next = [...lines];
    next[i] = text;
    commit(next);
  };

  const handleKeyDown = (i, e) => {
    const el = e.target;
    if (e.key === 'Enter') {
      e.preventDefault();
      const pos = el.selectionStart ?? lines[i].length;
      const before = lines[i].slice(0, pos);
      const after = lines[i].slice(pos);
      const next = [...lines];
      next[i] = before;
      next.splice(i + 1, 0, after);
      caret.current = { line: i + 1, pos: 0 };
      commit(next);
    } else if (e.key === 'Backspace' && el.selectionStart === 0 && el.selectionEnd === 0 && i > 0) {
      e.preventDefault();
      const prevLen = lines[i - 1].length;
      const next = [...lines];
      next[i - 1] = lines[i - 1] + lines[i];
      next.splice(i, 1);
      caret.current = { line: i - 1, pos: prevLen };
      commit(next);
    } else if (e.key === 'ArrowUp' && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowDown' && i < lines.length - 1) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  };

  useEffect(() => {
    if (caret.current) {
      const { line, pos } = caret.current;
      const el = refs.current[line];
      if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) { /* ignore */ } }
      caret.current = null;
    }
  });

  return (
    <div data-testid="client-notes-editor">
      {lines.map((line, i) => {
        const res = lineResult(line);
        return (
          <div key={i} className="flex items-center gap-2 min-h-[30px] border-b border-dashed border-slate-100 last:border-0">
            <input
              ref={(el) => { refs.current[i] = el; }}
              value={line}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              placeholder={i === 0 ? placeholder : ''}
              className="flex-1 bg-transparent outline-none py-1 text-sm text-slate-700 placeholder:text-slate-300"
              data-testid={`notes-line-${i}`}
            />
            {res !== null && (
              <span className="shrink-0 text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded" data-testid={`notes-line-result-${i}`}>
                = {res.toLocaleString('fr-FR')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Sum of all computed lines (only meaningful when there are several)
const computeNotesTotal = (notes) => {
  if (!notes) return null;
  let sum = 0, count = 0;
  notes.split('\n').forEach((line) => {
    const r = lineResult(line);
    if (r !== null) { sum += r; count += 1; }
  });
  return count > 1 ? Math.round(sum * 100) / 100 : null;
};

const statusColor = (status, type) => {
  if (type === 'invoice') {
    return { paid: 'bg-emerald-100 text-emerald-700', pending: 'bg-red-100 text-red-700', partial: 'bg-amber-100 text-amber-700' }[status] || 'bg-gray-100 text-gray-600';
  }
  return {
    draft: 'bg-amber-100 text-amber-700',
    sent: 'bg-sky-100 text-sky-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    invoiced: 'bg-purple-100 text-purple-700',
    lost: 'bg-red-100 text-red-700',
  }[status] || 'bg-gray-100 text-gray-600';
};

const statusLabel = (status, type) => {
  if (type === 'invoice') return { paid: 'Payée', pending: 'En attente', partial: 'Partielle' }[status] || status;
  return { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Signé', invoiced: 'Facturé', lost: 'Perdu' }[status] || status;
};

const ClientDetail = ({ client, onBack, onUpdated, onDeleted }) => {
  const navigate = useNavigate();
  const [data, setData] = useState({ events: [], stats: {} });
  const [notes, setNotes] = useState(client.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [form, setForm] = useState({ name: client.name, phone: client.phone, email: client.email || '', address: client.address });
  const debounceRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/clients/${client.id}/timeline`).then(r => setData(r.data)).catch(() => {});
  }, [client.id]);

  const notesTotal = useMemo(() => computeNotesTotal(notes), [notes]);

  // Debounced auto-save of notes
  useEffect(() => {
    if (notes === (client.notes || '')) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSavingNotes(true);
      try {
        await axios.patch(`${API}/clients/${client.id}/notes`, { notes });
        onUpdated?.({ ...client, notes });
      } catch { toast.error('Erreur sauvegarde notes'); }
      finally { setSavingNotes(false); }
    }, 800);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [notes, client, onUpdated]);

  const handleSaveProfile = async () => {
    try {
      await axios.put(`${API}/clients/${client.id}`, { ...form, notes });
      toast.success('Client mis à jour');
      onUpdated?.({ ...client, ...form });
      setEditingProfile(false);
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer définitivement "${client.name}" ?`)) return;
    try {
      await axios.delete(`${API}/clients/${client.id}`);
      toast.success('Client supprimé');
      onDeleted?.();
    } catch { toast.error('Erreur suppression'); }
  };

  const totalSigned = data.stats?.total_signed || 0;
  const totalInvoiced = data.stats?.total_invoiced || 0;

  return (
    <div className="flex flex-col h-full" data-testid="client-detail">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 sm:px-5 py-3 flex items-center gap-2 bg-white">
        <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden h-8 px-2" data-testid="back-to-list-btn">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-base text-slate-800 truncate">{client.name}</div>
          <div className="text-xs text-slate-400">{client.phone}{client.email ? ` · ${client.email}` : ''}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)} className="h-8 px-2 text-slate-500" data-testid="edit-client-btn">
          <Edit3 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete} className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50" data-testid="delete-client-btn">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 px-4 sm:px-5 py-3 border-b border-gray-100 bg-slate-50">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Devis</div>
          <div className="text-base font-bold text-slate-700">{data.stats?.quotes_count || 0}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Signé</div>
          <div className="text-base font-bold text-emerald-600">{totalSigned.toFixed(0)} €</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Facturé</div>
          <div className="text-base font-bold text-blue-600">{totalInvoiced.toFixed(0)} €</div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-5">
        {/* Contact */}
        <Card className="p-4 border border-slate-200 shadow-none">
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" /> <a href={`tel:${client.phone}`} className="hover:text-blue-600">{client.phone || '—'}</a></div>
            {client.email && <div className="flex items-center gap-2 text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" /> <a href={`mailto:${client.email}`} className="hover:text-blue-600 truncate">{client.email}</a></div>}
            <div className="flex items-start gap-2 text-slate-600"><MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" /> <span>{client.address || '—'}</span></div>
          </div>
        </Card>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate(`/quotes/new?client=${client.id}`)} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white" data-testid="new-quote-from-client-btn">
            <FileText className="w-3.5 h-3.5 mr-1.5" /> Nouveau devis
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/invoices/new?client=${client.id}`)} className="h-8 text-xs" data-testid="new-invoice-from-client-btn">
            <Receipt className="w-3.5 h-3.5 mr-1.5" /> Nouvelle facture
          </Button>
        </div>

        {/* Notes — bloc unique, résultat inline */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5" /> Bloc-notes
            </Label>
            <div className="flex items-center gap-2">
              {savingNotes && <span className="text-[10px] text-slate-400">Sauvegarde…</span>}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!notes.trim()) {
                    toast.error('Le bloc-notes est vide');
                    return;
                  }
                  sessionStorage.setItem('ai_prefilled_input', notes);
                  navigate('/ai-assistant');
                  toast.success("Notes copiées vers l'IA");
                }}
                className="h-7 text-xs gap-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700"
                data-testid="copy-to-ai-btn"
              >
                <Sparkles className="w-3 h-3" />
                Copier vers l&apos;IA
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 min-h-[80px] focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-200 transition-colors">
            <SmartNotes
              value={notes}
              onChange={setNotes}
              placeholder="Ex : 10x100, 1000-30%, + déplacement 50…"
            />
            {notesTotal !== null && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between font-bold text-emerald-700" data-testid="notes-total-row">
                <span className="text-[11px] uppercase tracking-wider text-slate-400">Total</span>
                <span data-testid="notes-total">{notesTotal.toLocaleString('fr-FR')} €</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Calculs auto : 10x100, 50+25, 1000-30%… le résultat s&apos;affiche à droite. Entrée = nouvelle ligne.</p>
        </div>

        {/* Timeline */}
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Historique</Label>
          {(data.events || []).length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center bg-slate-50 rounded-md">Aucun devis ni facture pour ce client</div>
          ) : (
            <ol className="space-y-2">
              {data.events.map((e) => (
                <li key={`${e.type}-${e.id}`}>
                  <Link to={e.type === 'quote' ? `/quotes/edit/${e.id}` : `/invoices/edit/${e.id}`}
                    className="block bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-md px-3 py-2 transition-all"
                    data-testid={`timeline-${e.type}-${e.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {e.type === 'quote' ? <FileText className="w-3.5 h-3.5 text-blue-500" /> : <Receipt className="w-3.5 h-3.5 text-emerald-500" />}
                      <span className="text-sm font-semibold text-slate-700">{e.number}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor(e.status, e.type)}`}>{statusLabel(e.status, e.type)}</span>
                      <span className="ml-auto text-sm font-bold text-slate-700">{(e.total || 0).toFixed(0)} €</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {e.work_location && <span className="text-[10px] text-slate-400">{e.work_location}</span>}
                      {e.sent_at && <span className="text-[10px] bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded flex items-center gap-1"><Send className="w-2.5 h-2.5" /> Envoyé le {fmtDate(e.sent_at)}</span>}
                      {e.opened_at && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Ouvert {e.open_count > 1 ? `${e.open_count}× ` : ''}le {fmtDate(e.opened_at)}</span>}
                      {e.signed_at && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> Signé le {fmtDate(e.signed_at)}</span>}
                      {e.lost_at && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded flex items-center gap-1"><XCircle className="w-2.5 h-2.5" /> Perdu le {fmtDate(e.lost_at)}</span>}
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Edit profile dialog */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent className="sm:max-w-md" data-testid="edit-client-dialog">
          <DialogHeader><DialogTitle>Modifier le client</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs text-slate-500">Nom *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="edit-client-name" /></div>
            <div><Label className="text-xs text-slate-500">Téléphone <span className="text-slate-300">(optionnel)</span></Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} data-testid="edit-client-phone" /></div>
            <div><Label className="text-xs text-slate-500">Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} data-testid="edit-client-email" /></div>
            <div><Label className="text-xs text-slate-500">Adresse <span className="text-slate-300">(optionnel)</span></Label><Textarea rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} data-testid="edit-client-address" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingProfile(false)}>Annuler</Button>
            <Button size="sm" onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="save-edit-client">
              <Save className="w-3.5 h-3.5 mr-1.5" /> Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const CRM = () => {
  const { cache, fetchClients, invalidate, patchCacheItem, removeCacheItem } = useDataCache();
  const clients = cache.clients || [];
  const [loading, setLoading] = useState(cache.clients === null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', address: '', phone: '', email: '', notes: '' });

  useEffect(() => {
    let active = true;
    fetchClients().catch(() => { if (active) toast.error('Erreur chargement'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchClients]);

  const filtered = useMemo(() => {
    const base = !search.trim()
      ? [...clients]
      : clients.filter(c => {
          const q = normalize(search);
          return normalize(c.name).includes(q) ||
            normalize(c.phone).includes(q) ||
            normalize(c.email).includes(q) ||
            normalize(c.address).includes(q);
        });
    const ts = (c) => new Date(c.updated_at || c.created_at || 0).getTime() || 0;
    const cmp = {
      name: (a, b) => (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' }),
      recent: (a, b) => ts(b) - ts(a),
      created: (a, b) => (new Date(b.created_at || 0).getTime() || 0) - (new Date(a.created_at || 0).getTime() || 0),
    }[sortBy] || ((a, b) => 0);
    return base.sort(cmp);
  }, [clients, search, sortBy]);

  const selected = filtered.find(c => c.id === selectedId) || clients.find(c => c.id === selectedId);

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      return toast.error('Le nom est requis');
    }
    try {
      const r = await axios.post(`${API}/clients`, createForm);
      toast.success('Client créé');
      setShowCreate(false);
      setCreateForm({ name: '', address: '', phone: '', email: '', notes: '' });
      invalidate('clients');
      await fetchClients({ force: true });
      setSelectedId(r.data.id);
    } catch { toast.error('Erreur'); }
  };

  if (loading && clients.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-10 w-10 border-3 border-[#3b82f6] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[var(--sr-cream)]" data-testid="crm-page">
      <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 60%, #f97316 100%)' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">CRM</h1>
            <p className="text-xs text-white/60">{clients.length} clients · Bloc-note avec calculs intégrés</p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)} className="h-9 bg-white text-blue-700 hover:bg-white/90" data-testid="crm-new-client-btn">
            <Plus className="w-4 h-4 mr-1" /> Nouveau
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-3 h-[calc(100vh-200px)]">
          {/* List */}
          <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col ${selected ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Chercher par nom, tel, email…"
                  className="pl-8 h-9 text-sm"
                  data-testid="crm-search-input"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-xs" data-testid="crm-sort-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name" data-testid="crm-sort-name">Nom (A → Z)</SelectItem>
                    <SelectItem value="recent" data-testid="crm-sort-recent">Récemment modifié</SelectItem>
                    <SelectItem value="created" data-testid="crm-sort-created">Récemment ajouté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {filtered.map(c => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2 ${selectedId === c.id ? 'bg-blue-50 border-l-2 border-blue-500' : 'border-l-2 border-transparent'}`}
                    data-testid={`crm-client-${c.id}`}
                  >
                    <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {(c.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800 truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{c.phone}</div>
                    </div>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className="px-3 py-8 text-center text-xs text-slate-400">Aucun client</li>}
            </ul>
          </div>

          {/* Detail */}
          <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${selected ? 'flex' : 'hidden lg:flex'} flex-col`}>
            {selected ? (
              <ClientDetail
                key={selected.id}
                client={selected}
                onBack={() => setSelectedId(null)}
                onUpdated={(updated) => patchCacheItem('clients', updated.id, { ...updated, updated_at: new Date().toISOString() })}
                onDeleted={() => { removeCacheItem('clients', selected.id); setSelectedId(null); }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <User className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Sélectionnez un client à gauche</p>
                  <p className="text-xs text-slate-400 mt-1">ou créez-en un nouveau avec le bouton &quot;Nouveau&quot;</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md" data-testid="crm-create-dialog">
          <DialogHeader><DialogTitle>Nouveau client</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs text-slate-500">Nom *</Label><Input autoFocus value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Nom du client" data-testid="crm-create-name" /></div>
            <div><Label className="text-xs text-slate-500">Téléphone <span className="text-slate-300">(optionnel)</span></Label><Input value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} data-testid="crm-create-phone" /></div>
            <div><Label className="text-xs text-slate-500">Email <span className="text-slate-300">(optionnel)</span></Label><Input value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} data-testid="crm-create-email" /></div>
            <div><Label className="text-xs text-slate-500">Adresse <span className="text-slate-300">(optionnel)</span></Label><Textarea rows={2} value={createForm.address} onChange={e => setCreateForm({ ...createForm, address: e.target.value })} data-testid="crm-create-address" /></div>
            <div><Label className="text-xs text-slate-500">Note <span className="text-slate-300">(optionnel)</span></Label><Textarea rows={2} value={createForm.notes} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} placeholder="Notez directement quelque chose…" data-testid="crm-create-notes" /></div>
            <p className="text-[11px] text-slate-400">Seul le nom est obligatoire. Vous pourrez compléter le reste plus tard.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button size="sm" onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="crm-create-submit">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRM;
