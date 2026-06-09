import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, FileText, Trash2, Eye, Receipt, ChevronRight, Send, CheckCircle, Clock, FileCheck, SortAsc, Mail, EyeIcon, Copy, BellOff, Bell, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import SendQuoteModal from '@/components/SendQuoteModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  draft:    { label: 'Brouillon', color: 'bg-amber-100 text-amber-700',   icon: Clock },
  sent:     { label: 'En attente', color: 'bg-sky-100 text-sky-700',      icon: Send },
  accepted: { label: 'Signé',     color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  invoiced: { label: 'Facturé',   color: 'bg-purple-100 text-purple-700', icon: FileCheck },
  lost:     { label: 'Perdu',     color: 'bg-red-100 text-red-600',       icon: XCircle },
};

const TABS = [
  { key: 'all',      label: 'Tous' },
  { key: 'draft',    label: 'Brouillons' },
  { key: 'sent',     label: 'En attente' },
  { key: 'accepted', label: 'Signés' },
  { key: 'lost',     label: 'Perdus' },
];

function getNextRelanceDay(relancesSent) {
  const all = [3, 7, 14, 30];
  return all.find(d => !relancesSent.includes(d)) || null;
}

function getDaysSinceSent(sentAt) {
  if (!sentAt) return null;
  const sent = new Date(sentAt);
  const now = new Date();
  return Math.floor((now - sent) / (1000 * 60 * 60 * 24));
}

const QuotesList = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [markAsPaid, setMarkAsPaid] = useState(true);
  const [converting, setConverting] = useState(false);
  const [sortMode, setSortMode] = useState('recent');
  const [sendQuote, setSendQuote] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => { fetchQuotes(); }, []);

  const fetchQuotes = async () => {
    try { const r = await axios.get(`${API}/quotes`); setQuotes(r.data); }
    catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce devis ?')) return;
    try { await axios.delete(`${API}/quotes/${id}`); toast.success('Supprimé'); fetchQuotes(); }
    catch { toast.error('Erreur suppression'); }
  };

  const handleStatusChange = async (quote, newStatus) => {
    try {
      await axios.patch(`${API}/quotes/${quote.id}/status?status=${newStatus}`);
      toast.success(`Statut mis à jour`);
      fetchQuotes();
    } catch { toast.error('Erreur mise à jour statut'); }
  };

  const handleDuplicate = async (quote) => {
    try {
      const newQuote = { ...quote, quote_number: '', status: 'draft', is_signed: false, signed_at: null, public_token: null, created_at: undefined, updated_at: undefined, id: undefined };
      const res = await axios.post(`${API}/quotes`, newQuote);
      toast.success('Devis dupliqué !');
      navigate(`/quotes/edit/${res.data.id}`);
    } catch { toast.error('Erreur lors de la duplication'); }
  };

  const handleToggleRelances = async (e, quote) => {
    e.stopPropagation();
    try {
      const r = await axios.patch(`${API}/quotes/${quote.id}/toggle-relances`);
      toast.success(r.data.relances_active ? 'Relances réactivées' : 'Relances désactivées');
      fetchQuotes();
    } catch { toast.error('Erreur'); }
  };

  const handleMarkLost = async (e, quote) => {
    e.stopPropagation();
    if (!window.confirm(`Marquer le devis ${quote.quote_number} comme perdu ?`)) return;
    try {
      await axios.patch(`${API}/quotes/${quote.id}/mark-lost`);
      toast.success('Devis marqué comme perdu');
      fetchQuotes();
    } catch { toast.error('Erreur'); }
  };

  const openConvertModal = (quote) => { setSelectedQuote(quote); setMarkAsPaid(true); setShowConvertModal(true); };

  const handleConvertToInvoice = async () => {
    if (!selectedQuote) return;
    setConverting(true);
    try {
      const res = await axios.post(`${API}/invoices/from-quote/${selectedQuote.id}`, { mark_as_paid: markAsPaid });
      toast.success(`Facture ${res.data.invoice_number} créée !`);
      setShowConvertModal(false);
      fetchQuotes();
      navigate(`/invoices/edit/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur conversion');
    } finally { setConverting(false); }
  };

  const sorted = [...quotes].sort((a, b) => {
    if (sortMode === 'alpha') return (a.client_name || '').localeCompare(b.client_name || '', 'fr', { sensitivity: 'base' });
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const byTab = activeTab === 'all' ? sorted : sorted.filter(q => q.status === activeTab);
  const filtered = search
    ? byTab.filter(q => q.client_name.toLowerCase().includes(search.toLowerCase()) || q.quote_number.toLowerCase().includes(search.toLowerCase()))
    : byTab;

  // Counts per tab
  const counts = { all: quotes.length };
  TABS.slice(1).forEach(t => { counts[t.key] = quotes.filter(q => q.status === t.key).length; });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-10 w-10 border-3 border-[#3b82f6] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[var(--sr-cream)]" data-testid="quotes-list-page">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Mes Devis</h1>
            <p className="text-xs text-white/50">{quotes.length} devis au total</p>
          </div>
          <Link to="/quotes/new">
            <Button size="sm" className="text-white h-9" style={{ background: '#3b82f6' }} data-testid="create-quote-btn">
              <Plus className="h-4 w-4 mr-1" /> Nouveau
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1 ${
                activeTab === tab.key
                  ? 'border-[#3b82f6] text-[#3b82f6]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              data-testid={`tab-${tab.key}`}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
        {/* Search + sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" data-testid="search-quotes-input" />
          </div>
          <Button
            variant={sortMode === 'alpha' ? 'default' : 'outline'}
            size="sm"
            className="h-9 text-xs px-3 shrink-0"
            style={sortMode === 'alpha' ? { background: '#3b82f6', color: 'white' } : {}}
            onClick={() => setSortMode(sortMode === 'alpha' ? 'recent' : 'alpha')}
            data-testid="sort-alpha-quotes"
          >
            <SortAsc className="h-3.5 w-3.5 mr-1" />
            {sortMode === 'alpha' ? 'A→Z' : 'Récents'}
          </Button>
        </div>

        {/* Quote cards */}
        {filtered.length > 0 ? filtered.map(q => {
          const status = statusConfig[q.status] || statusConfig.draft;
          const StatusIcon = status.icon;
          const daysSinceSent = getDaysSinceSent(q.sent_at);
          const nextRelanceDay = getNextRelanceDay(q.relances_sent || []);
          const isSent = q.status === 'sent';

          return (
            <Card key={q.id} className={`bg-white border-0 shadow-sm p-4 hover:shadow-md transition-shadow ${q.status === 'lost' ? 'opacity-70' : ''}`} data-testid={`quote-card-${q.id}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="h-4 w-4 text-[#3b82f6] flex-shrink-0" />
                  <span className="font-semibold text-sm">{q.quote_number}</span>
                  {/* Status badge with dropdown */}
                  <div className="relative group">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 cursor-pointer ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                      {q.status !== 'lost' && q.status !== 'invoiced' && <ChevronRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />}
                    </span>
                    {q.status !== 'lost' && q.status !== 'invoiced' && (
                      <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[140px]">
                        {Object.entries(statusConfig).filter(([key]) => key !== 'invoiced' && key !== 'lost').map(([key, cfg]) => {
                          const Icon = cfg.icon;
                          return (
                            <button key={key} onClick={() => handleStatusChange(q, key)}
                              className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-gray-50 ${q.status === key ? 'bg-gray-50 font-semibold' : ''}`}>
                              <Icon className="h-3 w-3" />{cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <span className="font-bold text-lg">{q.total_net.toFixed(0)} €</span>
              </div>

              <div className="text-xs text-gray-500 mb-1">
                {q.client_name} &middot; {q.date} &middot; {q.work_location}
              </div>

              {/* Tracking + relance info */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {q.sent_at && <span className="text-[10px] bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> Envoyé {daysSinceSent !== null ? `(J+${daysSinceSent})` : ''}</span>}
                {q.opened_at && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded flex items-center gap-1"><EyeIcon className="w-2.5 h-2.5" /> Ouvert</span>}
                {q.signed_at && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> Signé</span>}
                {isSent && q.relances_active && nextRelanceDay && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Bell className="w-2.5 h-2.5" /> Relance J+{nextRelanceDay} prévue
                  </span>
                )}
                {isSent && !q.relances_active && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <BellOff className="w-2.5 h-2.5" /> Relances OFF
                  </span>
                )}
                {isSent && q.last_relance_at && (
                  <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">
                    Dernière relance J+{Math.max(...(q.relances_sent || [0]))}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                <Link to={`/quotes/edit/${q.id}`} className="flex-1 min-w-0">
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs" data-testid={`view-quote-${q.id}`}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Voir
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => handleDuplicate(q)} className="h-8 text-xs text-slate-600 border-slate-200 hover:bg-slate-50 flex-shrink-0" title="Dupliquer" data-testid={`duplicate-quote-${q.id}`}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSendQuote(q)} className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 flex-shrink-0" data-testid={`send-quote-${q.id}`}>
                  <Send className="h-3.5 w-3.5 mr-1" /> Envoyer
                </Button>

                {/* Toggle relances — only for sent quotes */}
                {isSent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleToggleRelances(e, q)}
                    className={`h-8 text-xs flex-shrink-0 ${q.relances_active ? 'text-blue-600 border-blue-200 hover:bg-blue-50' : 'text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                    title={q.relances_active ? 'Désactiver les relances' : 'Activer les relances'}
                    data-testid={`toggle-relances-${q.id}`}
                  >
                    {q.relances_active ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                  </Button>
                )}

                {/* Mark as lost — only for sent quotes */}
                {isSent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleMarkLost(e, q)}
                    className="h-8 text-xs text-red-500 border-red-200 hover:bg-red-50 flex-shrink-0"
                    title="Marquer comme perdu"
                    data-testid={`mark-lost-${q.id}`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                )}

                {q.status !== 'invoiced' && q.status !== 'lost' && (
                  <Button variant="outline" size="sm" onClick={() => openConvertModal(q)} className="h-8 text-xs text-orange-600 border-orange-200 hover:bg-orange-50 flex-shrink-0" data-testid={`convert-quote-${q.id}`}>
                    <Receipt className="h-3.5 w-3.5 mr-1" /> Facturer
                  </Button>
                )}

                <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)} className="h-8 text-red-500 hover:bg-red-50 flex-shrink-0" data-testid={`delete-quote-${q.id}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          );
        }) : (
          <Card className="bg-white border-0 shadow-sm p-10 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500 mb-3">{activeTab === 'all' ? 'Aucun devis' : `Aucun devis dans cet onglet`}</p>
            {activeTab === 'all' && <Link to="/quotes/new"><Button size="sm" style={{ background: '#3b82f6' }} className="text-white"><Plus className="h-4 w-4 mr-1" /> Créer un devis</Button></Link>}
          </Card>
        )}
      </div>

      {/* Modal conversion */}
      <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-orange-500" /> Convertir en Facture
            </DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-semibold text-gray-800">{selectedQuote.quote_number}</div>
                <div className="text-xs text-gray-500">{selectedQuote.client_name}</div>
                <div className="text-lg font-bold text-blue-600 mt-2">{selectedQuote.total_net.toFixed(2)} €</div>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <Checkbox checked={markAsPaid} onCheckedChange={setMarkAsPaid} data-testid="mark-as-paid-checkbox" />
                <div>
                  <div className="text-sm font-medium text-gray-800">Marquer comme payée</div>
                  <div className="text-xs text-gray-500">La facture sera directement au statut "Payée"</div>
                </div>
              </label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowConvertModal(false)} className="flex-1">Annuler</Button>
                <Button onClick={handleConvertToInvoice} disabled={converting} className="flex-1 text-white" style={{ background: '#f97316' }} data-testid="confirm-convert-btn">
                  {converting ? 'Conversion...' : 'Créer la Facture'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {sendQuote && <SendQuoteModal quote={sendQuote} onClose={() => setSendQuote(null)} onSent={fetchQuotes} />}
    </div>
  );
};

export default QuotesList;
