import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Receipt, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const payLabel = (s) => ({ pending: 'En attente', partial: 'Partiel', paid: 'Payée' }[s] || s);
const payColor = (s) => ({ pending: 'bg-red-100 text-red-700', partial: 'bg-amber-100 text-amber-700', paid: 'bg-emerald-100 text-emerald-700' }[s] || 'bg-gray-100 text-gray-600');

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchInvoices(); }, []);
  const fetchInvoices = async () => {
    try { const r = await axios.get(`${API}/invoices`); setInvoices(r.data); }
    catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette facture ?')) return;
    try { await axios.delete(`${API}/invoices/${id}`); toast.success('Supprimée'); fetchInvoices(); }
    catch { toast.error('Erreur suppression'); }
  };

  const filtered = search
    ? invoices.filter(inv => inv.client_name.toLowerCase().includes(search.toLowerCase()) || inv.invoice_number.toLowerCase().includes(search.toLowerCase()))
    : invoices;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-10 w-10 border-3 border-[#e8712a] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[var(--sr-cream)]" data-testid="invoices-list-page">
      <div style={{ background: 'linear-gradient(135deg, #0c1829 0%, #1a2d4a 100%)' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Mes Factures</h1>
            <p className="text-xs text-white/50">{invoices.length} factures au total</p>
          </div>
          <Link to="/invoices/new">
            <Button size="sm" className="text-white h-9" style={{ background: '#e8712a' }} data-testid="create-invoice-btn">
              <Plus className="h-4 w-4 mr-1" /> Nouvelle
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" data-testid="search-invoices-input" />
        </div>

        {filtered.length > 0 ? filtered.map(inv => (
          <Card key={inv.id} className="bg-white border-0 shadow-sm p-4 hover:shadow-md transition-shadow" data-testid={`invoice-card-${inv.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-sm">{inv.invoice_number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payColor(inv.payment_status)}`}>{payLabel(inv.payment_status)}</span>
              </div>
              <span className="font-bold text-lg">{inv.total_net.toFixed(0)} €</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">
              {inv.client_name} &middot; {inv.date} &middot; {inv.work_location}
            </div>
            <div className="text-xs mb-3">
              <span className="text-gray-500">Reste: </span>
              <span className="font-medium text-red-600">{inv.reste_a_payer.toFixed(2)} €</span>
            </div>
            <div className="flex gap-2">
              <Link to={`/invoices/edit/${inv.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs" data-testid={`view-invoice-${inv.id}`}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> Voir
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(inv.id)} className="h-8 text-red-500 hover:bg-red-50" data-testid={`delete-invoice-${inv.id}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        )) : (
          <Card className="bg-white border-0 shadow-sm p-10 text-center">
            <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500 mb-3">Aucune facture</p>
            <Link to="/invoices/new"><Button size="sm" style={{ background: '#e8712a' }} className="text-white"><Plus className="h-4 w-4 mr-1" /> Créer une facture</Button></Link>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InvoicesList;
