import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, FileText, Receipt, Users, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { initializeDefaultCatalog } from '@/utils/defaultCatalog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    initializeDefaultCatalog();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, quotesRes, invoicesRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/quotes`),
        axios.get(`${API}/invoices`),
      ]);
      setStats(statsRes.data);
      setRecentQuotes(quotesRes.data.slice(-5).reverse());
      setRecentInvoices(invoicesRes.data.slice(-5).reverse());
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sr-cream)]">
        <div className="h-10 w-10 border-3 border-[var(--sr-orange)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusLabel = (s) => ({ draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté' }[s] || s);
  const statusColor = (s) => ({ draft: 'bg-amber-100 text-amber-700', sent: 'bg-sky-100 text-sky-700', accepted: 'bg-emerald-100 text-emerald-700' }[s] || 'bg-gray-100 text-gray-600');
  const payLabel = (s) => ({ pending: 'En attente', partial: 'Partiel', paid: 'Payée' }[s] || s);
  const payColor = (s) => ({ pending: 'bg-red-100 text-red-700', partial: 'bg-amber-100 text-amber-700', paid: 'bg-emerald-100 text-emerald-700' }[s] || 'bg-gray-100 text-gray-600');

  return (
    <div className="min-h-screen bg-[var(--sr-cream)]" data-testid="dashboard-page">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #f59e0b 100%)' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-xs sm:text-sm text-white/60">Gestion devis & factures</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="stats-grid">
          {[
            { label: 'Clients', value: stats?.total_clients || 0, icon: Users, color: '#3b82f6' },
            { label: 'Devis', value: stats?.total_quotes || 0, icon: FileText, color: '#3b82f6' },
            { label: 'Factures', value: stats?.total_invoices || 0, icon: Receipt, color: '#10b981' },
            { label: "Chiffre d'affaires", value: `${(stats?.revenue?.total || 0).toFixed(0)}€`, icon: null, color: '#0c1829' },
          ].map((s, i) => (
            <Card key={i} className="p-4 bg-white border-0 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/quotes/new" data-testid="quick-new-quote">
            <div className="rounded-xl p-5 text-white flex items-center justify-between group transition-transform hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 bg-white/20 rounded-lg flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-semibold text-base">Nouveau Devis</div>
                  <div className="text-xs text-white/70">Créer un devis professionnel</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 opacity-60 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          <Link to="/invoices/new" data-testid="quick-new-invoice">
            <div className="rounded-xl p-5 text-white flex items-center justify-between group transition-transform hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #0c1829 0%, #1a2d4a 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 bg-white/20 rounded-lg flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-semibold text-base">Nouvelle Facture</div>
                  <div className="text-xs text-white/70">Créer une facture client</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 opacity-60 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Recent docs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Quotes */}
          <Card className="bg-white border-0 shadow-sm overflow-hidden" data-testid="recent-quotes">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-sm text-gray-800">Devis récents</span>
              <Link to="/quotes">
                <Button variant="ghost" size="sm" className="text-xs h-7" data-testid="view-all-quotes">Voir tout</Button>
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentQuotes.length > 0 ? recentQuotes.map((q) => (
                <Link key={q.id} to={`/quotes/edit/${q.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors" data-testid={`quote-item-${q.id}`}>
                  <div>
                    <span className="font-medium text-sm text-gray-900">{q.quote_number}</span>
                    <span className="text-xs text-gray-500 ml-2">{q.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(q.status)}`}>{statusLabel(q.status)}</span>
                    <span className="font-semibold text-sm">{q.total_net.toFixed(0)}€</span>
                  </div>
                </Link>
              )) : (
                <div className="py-8 text-center text-sm text-gray-400">Aucun devis</div>
              )}
            </div>
          </Card>

          {/* Recent Invoices */}
          <Card className="bg-white border-0 shadow-sm overflow-hidden" data-testid="recent-invoices">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-sm text-gray-800">Factures récentes</span>
              <Link to="/invoices">
                <Button variant="ghost" size="sm" className="text-xs h-7" data-testid="view-all-invoices">Voir tout</Button>
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentInvoices.length > 0 ? recentInvoices.map((inv) => (
                <Link key={inv.id} to={`/invoices/edit/${inv.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors" data-testid={`invoice-item-${inv.id}`}>
                  <div>
                    <span className="font-medium text-sm text-gray-900">{inv.invoice_number}</span>
                    <span className="text-xs text-gray-500 ml-2">{inv.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payColor(inv.payment_status)}`}>{payLabel(inv.payment_status)}</span>
                    <span className="font-semibold text-sm">{inv.total_net.toFixed(0)}€</span>
                  </div>
                </Link>
              )) : (
                <div className="py-8 text-center text-sm text-gray-400">Aucune facture</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
