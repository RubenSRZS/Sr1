import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, FileText, Trash2, Eye, Receipt, ChevronRight, Send, CheckCircle, Clock, FileCheck, SortAsc, Mail, EyeIcon, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import SendQuoteModal from '@/components/SendQuoteModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  draft: { label: 'Brouillon', color: 'bg-amber-100 text-amber-700', icon: Clock },
  sent: { label: 'Envoyé', color: 'bg-sky-100 text-sky-700', icon: Send },
  accepted: { label: 'Accepté', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  invoiced: { label: 'Facturé', color: 'bg-purple-100 text-purple-700', icon: FileCheck },
};

const QuotesList = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [markAsPaid, setMarkAsPaid] = useState(true);
  const [converting, setConverting] = useState(false);
  const [sortMode, setSortMode] = useState('recent'); // 'recent' | 'alpha'
  const [sendQuote, setSendQuote] = useState(null);

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
      toast.success(`Statut mis à jour: ${statusConfig[newStatus]?.label || newStatus}`);
      fetchQuotes();
    } catch {
      toast.error('Erreur mise à jour statut');
    }
  };

  const handleDuplicate = async (quote) => {
    try {
      const newQuote = {
        ...quote,
        quote_number: '',
        status: 'draft',
        is_signed: false,
        signed_at: null,
        public_token: null,
        created_at: undefined,
        updated_at: undefined,
        id: undefined,
      };
      const res = await axios.post(`${API}/quotes`, newQuote);
      toast.success('Devis dupliqué ! Redirection...');
      navigate(`/quotes/edit/${res.data.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la duplication');
    }
  };

  const openConvertModal = (quote) => {
    setSelectedQuote(quote);
    setMarkAsPaid(true);
    setShowConvertModal(true);
  };

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
    } finally {
      setConverting(false);
    }
  };

  const sorted = [...quotes].sort((a, b) => {
    if (sortMode === 'alpha') return (a.client_name || '').localeCompare(b.client_name || '', 'fr', { sensitivity: 'base' });
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const filtered = (search
    ? sorted.filter(q => q.client_name.toLowerCase().includes(search.toLowerCase()) || q.quote_number.toLowerCase().includes(search.toLowerCase()))
    : sorted
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-10 w-10 border-3 border-[#3b82f6] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[var(--sr-cream)]" data-testid="quotes-list-page">
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

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
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

        {filtered.length > 0 ? filtered.map(q => {
          const status = statusConfig[q.status] || statusConfig.draft;
          const StatusIcon = status.icon;
          return (
            <Card key={q.id} className="bg-white border-0 shadow-sm p-4 hover:shadow-md transition-shadow" data-testid={`quote-card-${q.id}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#3b82f6]" />
                  <span className="font-semibold text-sm">{q.quote_number}</span>
                  {/* Status badge avec menu de changement rapide */}
                  <div className="relative group">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 cursor-pointer ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                      <ChevronRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </span>
                    {/* Dropdown pour changer le statut */}
                    <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[140px]">
                      {Object.entries(statusConfig).filter(([key]) => key !== 'invoiced').map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={key}
                            onClick={() => handleStatusChange(q, key)}
                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-gray-50 ${q.status === key ? 'bg-gray-50 font-semibold' : ''}`}
                          >
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <span className="font-bold text-lg">{q.total_net.toFixed(0)} €</span>
              </div>
              <div className="text-xs text-gray-500 mb-1">
                {q.client_name} &middot; {q.date} &middot; {q.work_location}
              </div>
              {/* Tracking info */}
              {(q.sent_at || q.opened_at || q.signed_at) && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {q.sent_at && <span className="text-[10px] bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> Envoyé</span>}
                  {q.opened_at && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded flex items-center gap-1"><EyeIcon className="w-2.5 h-2.5" /> Ouvert</span>}
                  {q.signed_at && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> Signé</span>}
                </div>
              )}
              <div className="flex gap-2">
                <Link to={`/quotes/edit/${q.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs" data-testid={`view-quote-${q.id}`}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Voir / Éditer
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(q)}
                  className="h-8 text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
                  title="Dupliquer ce devis"
                  data-testid={`duplicate-quote-${q.id}`}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSendQuote(q)}
                  className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                  data-testid={`send-quote-${q.id}`}
                >
                  <Send className="h-3.5 w-3.5 mr-1" /> Envoyer
                </Button>
                {q.status !== 'invoiced' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openConvertModal(q)} 
                    className="h-8 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                    data-testid={`convert-quote-${q.id}`}
                  >
                    <Receipt className="h-3.5 w-3.5 mr-1" /> Facturer
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)} className="h-8 text-red-500 hover:bg-red-50" data-testid={`delete-quote-${q.id}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          );
        }) : (
          <Card className="bg-white border-0 shadow-sm p-10 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500 mb-3">Aucun devis</p>
            <Link to="/quotes/new"><Button size="sm" style={{ background: '#3b82f6' }} className="text-white"><Plus className="h-4 w-4 mr-1" /> Créer un devis</Button></Link>
          </Card>
        )}
      </div>

      {/* Modal conversion devis -> facture */}
      <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-orange-500" />
              Convertir en Facture
            </DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-semibold text-gray-800">{selectedQuote.quote_number}</div>
                <div className="text-xs text-gray-500">{selectedQuote.client_name}</div>
                <div className="text-lg font-bold text-blue-600 mt-2">{selectedQuote.total_net.toFixed(2)} €</div>
              </div>
              
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <Checkbox 
                  checked={markAsPaid} 
                  onCheckedChange={setMarkAsPaid}
                  data-testid="mark-as-paid-checkbox"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">Marquer comme payée</div>
                  <div className="text-xs text-gray-500">La facture sera directement au statut "Payée"</div>
                </div>
              </label>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowConvertModal(false)} className="flex-1">
                  Annuler
                </Button>
                <Button 
                  onClick={handleConvertToInvoice} 
                  disabled={converting}
                  className="flex-1 text-white"
                  style={{ background: '#f97316' }}
                  data-testid="confirm-convert-btn"
                >
                  {converting ? 'Conversion...' : 'Créer la Facture'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal envoi email */}
      {sendQuote && (
        <SendQuoteModal
          quote={sendQuote}
          onClose={() => setSendQuote(null)}
          onSent={fetchQuotes}
        />
      )}
    </div>
  );
};

export default QuotesList;
