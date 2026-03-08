import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, FileText, Receipt, Users, ArrowRight, Moon, Sun, Send, CheckCircle, Clock, FileCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { initializeDefaultCatalog } from '@/utils/defaultCatalog';
import { useTheme } from '@/context/ThemeContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const { darkMode, toggleDarkMode } = useTheme();
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
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-[var(--sr-cream)]'}`}>
        <div className="h-10 w-10 border-3 border-[var(--sr-orange)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusConfig = {
    draft: { label: 'Brouillon', color: darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700', icon: Clock },
    sent: { label: 'Envoyé', color: darkMode ? 'bg-sky-900/50 text-sky-300' : 'bg-sky-100 text-sky-700', icon: Send },
    accepted: { label: 'Accepté', color: darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    invoiced: { label: 'Facturé', color: darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700', icon: FileCheck },
  };
  
  const payConfig = {
    pending: { label: 'En attente', color: darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700' },
    partial: { label: 'Partiel', color: darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700' },
    paid: { label: 'Payée', color: darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700' },
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-[var(--sr-cream)]'}`} data-testid="dashboard-page">
      {/* Header */}
      <div style={{ background: darkMode ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #ea580c 100%)' : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 60%, #f97316 100%)' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-xs sm:text-sm text-white/60">Gestion devis & factures</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            data-testid="dark-mode-toggle"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="stats-grid">
          {[
            { label: 'Clients', value: stats?.total_clients || 0, icon: Users, color: '#f59e0b' },
            { label: 'Devis', value: stats?.total_quotes || 0, icon: FileText, color: '#3b82f6' },
            { label: 'Factures', value: stats?.total_invoices || 0, icon: Receipt, color: '#10b981' },
            { label: "Chiffre d'affaires", value: `${(stats?.revenue?.total || 0).toFixed(0)}€`, icon: null, color: '#3b82f6' },
          ].map((s, i) => (
            <Card key={i} className={`p-4 border-0 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <div className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{s.label}</div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/quotes/new" data-testid="quick-new-quote">
            <div className="rounded-xl p-5 text-white flex items-center justify-between group transition-all hover:scale-[1.01] hover:shadow-lg"
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
            <div className="rounded-xl p-5 text-white flex items-center justify-between group transition-all hover:scale-[1.01] hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)' }}
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
          <Card className={`border-0 shadow-sm overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-white'}`} data-testid="recent-quotes">
            <div className={`px-4 py-3 border-b flex items-center justify-between ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
              <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Devis récents</span>
              <Link to="/quotes">
                <Button variant="ghost" size="sm" className={`text-xs h-7 ${darkMode ? 'text-slate-300 hover:text-white' : ''}`} data-testid="view-all-quotes">Voir tout</Button>
              </Link>
            </div>
            <div className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-50'}`}>
              {recentQuotes.length > 0 ? recentQuotes.map((q) => {
                const status = statusConfig[q.status] || statusConfig.draft;
                const StatusIcon = status.icon;
                return (
                  <Link key={q.id} to={`/quotes/edit/${q.id}`} className={`flex items-center justify-between px-4 py-3 transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`} data-testid={`quote-item-${q.id}`}>
                    <div>
                      <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{q.quote_number}</span>
                      <span className={`text-xs ml-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{q.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                      <span className={`font-semibold text-sm ${darkMode ? 'text-white' : ''}`}>{q.total_net.toFixed(0)}€</span>
                    </div>
                  </Link>
                );
              }) : (
                <div className={`py-8 text-center text-sm ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Aucun devis</div>
              )}
            </div>
          </Card>

          {/* Recent Invoices */}
          <Card className={`border-0 shadow-sm overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-white'}`} data-testid="recent-invoices">
            <div className={`px-4 py-3 border-b flex items-center justify-between ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
              <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Factures récentes</span>
              <Link to="/invoices">
                <Button variant="ghost" size="sm" className={`text-xs h-7 ${darkMode ? 'text-slate-300 hover:text-white' : ''}`} data-testid="view-all-invoices">Voir tout</Button>
              </Link>
            </div>
            <div className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-50'}`}>
              {recentInvoices.length > 0 ? recentInvoices.map((inv) => {
                const pay = payConfig[inv.payment_status] || payConfig.pending;
                return (
                  <Link key={inv.id} to={`/invoices/edit/${inv.id}`} className={`flex items-center justify-between px-4 py-3 transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`} data-testid={`invoice-item-${inv.id}`}>
                    <div>
                      <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{inv.invoice_number}</span>
                      <span className={`text-xs ml-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{inv.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pay.color}`}>{pay.label}</span>
                      <span className={`font-semibold text-sm ${darkMode ? 'text-white' : ''}`}>{inv.total_net.toFixed(0)}€</span>
                    </div>
                  </Link>
                );
              }) : (
                <div className={`py-8 text-center text-sm ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Aucune facture</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
