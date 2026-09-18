import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Receipt, Trash2, Eye, CheckCircle, Clock, SortAsc, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import SendInvoiceModal from '@/components/SendInvoiceModal';
import { useDataCache } from '@/context/DataCacheContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const payLabel = (s) => ({ pending: 'En attente', partial: 'Partiel', paid: 'Payée' }[s] || s);
const payColor = (s) => ({ pending: 'bg-red-100 text-red-700', partial: 'bg-amber-100 text-amber-700', paid: 'bg-emerald-100 text-emerald-700' }[s] || 'bg-gray-100 text-gray-600');

const TABS = [
  { key: 'all',     label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'paid',    label: 'Payées' },
];

const InvoicesList = () => {
  const { cache, fetchInvoices: cachedFetchInvoices, invalidate } = useDataCache();
  const invoices = cache.invoices || [];
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(cache.invoices === null);
  const [sortMode, setSortMode] = useState('recent');
  const [sendModal, setSendModal] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    let active = true;
    cachedFetchInvoices().catch(() => { if (active) toast.error('Erreur chargement'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cachedFetchInvoices]);

  const fetchInvoices = async () => {
    invalidate('invoices');
    try { await cachedFetchInvoices({ force: true }); }
    catch { toast.error('Erreur chargement'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette facture ?')) return;
    try { await axios.delete(`${API}/invoices/${id}`); toast.success('Supprimée'); fetchInvoices(); }
    catch { toast.error('Erreur suppression'); }
  };

  const handleMarkPaid = async (id, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    try {
      await axios.patch(`${API}/invoices/${id}/payment?payment_status=${newStatus}`);
      toast.success(newStatus === 'paid' ? 'Facture marquée comme payée' : 'Statut remis en attente');
      fetchInvoices();
    } catch { toast.error('Erreur mise à jour'); }
  };

  const sorted = [...invoices].sort((a, b) => {
    if (sortMode === 'alpha') return (a.client_name || '').localeCompare(b.client_name || '', 'fr', { sensitivity: 'base' });
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const byTab = activeTab === 'all' ? sorted : sorted.filter(inv => {
    if (activeTab === 'pending') return inv.payment_status === 'pending' || inv.payment_status === 'partial';
    return inv.payment_status === activeTab;
  });
  const filtered = search
    ? byTab.filter(inv => inv.client_name.toLowerCase().includes(search.toLowerCase()) || inv.invoice_number.toLowerCase().includes(search.toLowerCase()))
    : byTab;

  const counts = { all: invoices.length };
  counts['pending'] = invoices.filter(i => i.payment_status === 'pending' || i.payment_status === 'partial').length;
  counts['paid'] = invoices.filter(i => i.payment_status === 'paid').length;

  // Stats
  const totalPending = invoices.filter(i => i.payment_status !== 'paid').reduce((s, i) => s + (i.reste_a_payer || 0), 0);
  const totalPaid = invoices.filter(i => i.payment_status === 'paid').reduce((s, i) => s + (i.total_net || 0), 0);

  if (loading && invoices.length === 0) return <div className="min-h-screen flex items-center justify-center"><div className="h-10 w-10 border-3 border-[#3b82f6] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[var(--sr-cream)]" data-testid="invoices-list-page">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Mes Factures</h1>
            <p className="text-xs text-white/60">{invoices.length} factures · <span className="font-semibold">{totalPending.toFixed(0)} € en attente</span> · {totalPaid.toFixed(0)} € encaissé</p>
          </div>
          <Link to="/invoices/new">
            <Button size="sm" className="text-white h-9" style={{ background: '#059669' }} data-testid="create-invoice-btn">
              <Plus className="h-4 w-4 mr-1" /> Nouvelle
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
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1 ${
                activeTab === tab.key ? 'border-violet-500 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              data-testid={`tab-invoices-${tab.key}`}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" data-testid="search-invoices-input" />
          </div>
          <Button
            variant={sortMode === 'alpha' ? 'default' : 'outline'}
            size="sm"
            className="h-9 text-xs px-3 shrink-0"
            style={sortMode === 'alpha' ? { background: '#059669', color: 'white' } : {}}
            onClick={() => setSortMode(sortMode === 'alpha' ? 'recent' : 'alpha')}
            data-testid="sort-alpha-invoices"
          >
            <SortAsc className="h-3.5 w-3.5 mr-1" />
            {sortMode === 'alpha' ? 'A→Z' : 'Récents'}
          </Button>
        </div>

        {filtered.length > 0 ? filtered.map(inv => (
          <Card key={inv.id} className="bg-white border border-slate-200 shadow-md rounded-xl p-4 mb-4 hover:shadow-lg hover:border-slate-300 transition-all" data-testid={`invoice-card-${inv.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-violet-600 flex-shrink-0" />
                <span className="font-semibold text-sm">{inv.invoice_number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payColor(inv.payment_status)}`}>{payLabel(inv.payment_status)}</span>
              </div>
              <span className="font-bold text-lg">{inv.total_net.toFixed(0)} €</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">{inv.client_name} &middot; {inv.date} &middot; {inv.work_location}</div>
            <div className="text-xs mb-3">
              {inv.payment_status === 'paid'
                ? <span className="font-medium text-emerald-600">Payée intégralement</span>
                : <><span className="text-gray-500">Reste : </span><span className="font-medium text-red-600">{inv.reste_a_payer.toFixed(2)} €</span></>
              }
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Link to={`/invoices/edit/${inv.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs" data-testid={`view-invoice-${inv.id}`}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> Voir
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setSendModal(inv)} className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 px-2 flex-shrink-0" data-testid={`send-invoice-${inv.id}`}>
                <Send className="h-3.5 w-3.5 mr-1" /> Envoyer
              </Button>
              {inv.payment_status !== 'paid' ? (
                <Button variant="outline" size="sm" onClick={() => handleMarkPaid(inv.id, inv.payment_status)} className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-2 flex-shrink-0" data-testid={`mark-paid-${inv.id}`}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Payée
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => handleMarkPaid(inv.id, inv.payment_status)} className="h-8 text-xs text-amber-600 border-amber-200 hover:bg-amber-50 px-2 flex-shrink-0" data-testid={`mark-unpaid-${inv.id}`}>
                  <Clock className="h-3.5 w-3.5 mr-1" /> Annuler
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => handleDelete(inv.id)} className="h-8 text-red-500 hover:bg-red-50 flex-shrink-0" data-testid={`delete-invoice-${inv.id}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        )) : (
          <Card className="bg-white border-0 shadow-sm p-10 text-center">
            <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500 mb-3">{activeTab === 'all' ? 'Aucune facture' : `Aucune facture dans cet onglet`}</p>
            {activeTab === 'all' && <Link to="/invoices/new"><Button size="sm" style={{ background: '#059669' }} className="text-white"><Plus className="h-4 w-4 mr-1" /> Créer une facture</Button></Link>}
          </Card>
        )}
      </div>

      {sendModal && <SendInvoiceModal invoice={sendModal} onClose={() => setSendModal(null)} onSent={() => { fetchInvoices(); setSendModal(null); }} />}
    </div>
  );
};

export default InvoicesList;
