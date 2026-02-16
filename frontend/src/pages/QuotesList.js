import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, FileText, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusLabel = (s) => ({ draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté' }[s] || s);
const statusColor = (s) => ({ draft: 'bg-amber-100 text-amber-700', sent: 'bg-sky-100 text-sky-700', accepted: 'bg-emerald-100 text-emerald-700' }[s] || 'bg-gray-100 text-gray-600');

const QuotesList = () => {
  const [quotes, setQuotes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filtered = search
    ? quotes.filter(q => q.client_name.toLowerCase().includes(search.toLowerCase()) || q.quote_number.toLowerCase().includes(search.toLowerCase()))
    : quotes;

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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" data-testid="search-quotes-input" />
        </div>

        {filtered.length > 0 ? filtered.map(q => (
          <Card key={q.id} className="bg-white border-0 shadow-sm p-4 hover:shadow-md transition-shadow" data-testid={`quote-card-${q.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#3b82f6]" />
                <span className="font-semibold text-sm">{q.quote_number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(q.status)}`}>{statusLabel(q.status)}</span>
              </div>
              <span className="font-bold text-lg">{q.total_net.toFixed(0)} €</span>
            </div>
            <div className="text-xs text-gray-500 mb-3">
              {q.client_name} &middot; {q.date} &middot; {q.work_location}
            </div>
            <div className="flex gap-2">
              <Link to={`/quotes/edit/${q.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs" data-testid={`view-quote-${q.id}`}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> Voir / Éditer
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)} className="h-8 text-red-500 hover:bg-red-50" data-testid={`delete-quote-${q.id}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        )) : (
          <Card className="bg-white border-0 shadow-sm p-10 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500 mb-3">Aucun devis</p>
            <Link to="/quotes/new"><Button size="sm" style={{ background: '#3b82f6' }} className="text-white"><Plus className="h-4 w-4 mr-1" /> Créer un devis</Button></Link>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuotesList;
