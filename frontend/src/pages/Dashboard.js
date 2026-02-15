import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, TrendingUp, FileText, Receipt, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    initializeCatalog();
  }, []);

  const initializeCatalog = async () => {
    const initialized = await initializeDefaultCatalog();
    if (initialized) {
      console.log('Catalogue initialisé avec les services par défaut');
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, quotesRes, invoicesRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/quotes`),
        axios.get(`${API}/invoices`),
      ]);

      setStats(statsRes.data);
      setRecentQuotes(quotesRes.data.slice(0, 5));
      setRecentInvoices(invoicesRes.data.slice(0, 5));
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="https://customer-assets.emergentagent.com/job_538ea579-31dc-4f0d-9c02-673e8a0738ca/artifacts/srxb4k7u_Nouveau%20Logo%203.png"
              alt="SR Renovation Logo"
              className="h-12 w-auto"
            />
            <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
              SR RÉNOVATION
            </h1>
          </div>
          <p className="text-slate-300 text-lg">Gestion de devis et factures</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Clients</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.total_clients || 0}</p>
              </div>
              <Users className="h-12 w-12 text-orange-500" />
            </div>
          </Card>

          <Card className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Devis</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.total_quotes || 0}</p>
              </div>
              <FileText className="h-12 w-12 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Factures</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.total_invoices || 0}</p>
              </div>
              <Receipt className="h-12 w-12 text-green-500" />
            </div>
          </Card>

          <Card className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats?.revenue?.total?.toFixed(2) || 0} €
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/quotes/new" data-testid="quick-action-new-quote">
            <Card className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Nouveau Devis</p>
                  <p className="text-sm text-white/80">Créer avec l'IA</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/invoices/new" data-testid="quick-action-new-invoice">
            <Card className="p-6 bg-gradient-to-r from-slate-700 to-slate-800 text-white hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Nouvelle Facture</p>
                  <p className="text-sm text-white/80">Générer rapidement</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/clients" data-testid="quick-action-manage-clients">
            <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Gérer Clients</p>
                  <p className="text-sm text-white/80">Voir tous les clients</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Quotes */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Devis récents
                </h2>
                <Link to="/quotes">
                  <Button variant="ghost" size="sm" data-testid="view-all-quotes">
                    Voir tout
                  </Button>
                </Link>
              </div>
            </div>
            <div className="divide-y divide-slate-200">
              {recentQuotes.length > 0 ? (
                recentQuotes.map((quote) => (
                  <Link
                    key={quote.id}
                    to={`/quotes/edit/${quote.id}`}
                    className="block p-4 hover:bg-slate-50 transition-colors"
                    data-testid={`quote-item-${quote.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{quote.quote_number}</p>
                        <p className="text-sm text-slate-600">{quote.client_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{quote.total_net.toFixed(2)} €</p>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            quote.status === 'accepted'
                              ? 'bg-green-100 text-green-800'
                              : quote.status === 'sent'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {quote.status === 'draft'
                            ? 'Brouillon'
                            : quote.status === 'sent'
                            ? 'Envoyé'
                            : 'Accepté'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>Aucun devis pour le moment</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Invoices */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Factures récentes
                </h2>
                <Link to="/invoices">
                  <Button variant="ghost" size="sm" data-testid="view-all-invoices">
                    Voir tout
                  </Button>
                </Link>
              </div>
            </div>
            <div className="divide-y divide-slate-200">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    to={`/invoices/edit/${invoice.id}`}
                    className="block p-4 hover:bg-slate-50 transition-colors"
                    data-testid={`invoice-item-${invoice.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{invoice.invoice_number}</p>
                        <p className="text-sm text-slate-600">{invoice.client_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{invoice.total_net.toFixed(2)} €</p>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            invoice.payment_status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.payment_status === 'partial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {invoice.payment_status === 'paid'
                            ? 'Payée'
                            : invoice.payment_status === 'partial'
                            ? 'Partiel'
                            : 'En attente'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Receipt className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>Aucune facture pour le moment</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;