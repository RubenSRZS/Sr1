import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Receipt, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = invoices.filter(
        (inv) =>
          inv.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInvoices(filtered);
    } else {
      setFilteredInvoices(invoices);
    }
  }, [searchTerm, invoices]);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(`${API}/invoices`);
      setInvoices(res.data);
      setFilteredInvoices(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      try {
        await axios.delete(`${API}/invoices/${id}`);
        toast.success('Facture supprimée');
        fetchInvoices();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
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
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Mes Factures
              </h1>
              <p className="text-slate-300">Gérez toutes vos factures en un seul endroit</p>
            </div>
            <Link to="/invoices/new">
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="create-invoice-btn"
              >
                <Plus className="mr-2 h-5 w-5" />
                Nouvelle Facture
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Rechercher une facture (client, numéro...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-invoices-input"
            />
          </div>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredInvoices.map((invoice) => (
              <Card
                key={invoice.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Receipt className="h-6 w-6 text-green-500" />
                        <h3 className="text-xl font-semibold text-slate-900">{invoice.invoice_number}</h3>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
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
                            ? 'Paiement partiel'
                            : 'En attente'}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-1">
                        <strong>Client:</strong> {invoice.client_name}
                      </p>
                      <p className="text-slate-600 mb-1">
                        <strong>Date:</strong> {invoice.date}
                      </p>
                      <p className="text-slate-600">
                        <strong>Lieu:</strong> {invoice.work_location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-slate-900 mb-2">
                        {invoice.total_net.toFixed(2)} €
                      </p>
                      <p className="text-sm text-slate-600">Acompte: {invoice.acompte_paid.toFixed(2)} €</p>
                      <p className="text-sm font-semibold text-orange-600">
                        Reste: {invoice.reste_a_payer.toFixed(2)} €
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link to={`/invoices/edit/${invoice.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full"
                        data-testid={`view-invoice-${invoice.id}`}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir / Éditer
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(invoice.id)}
                      className="text-red-600 hover:bg-red-50"
                      data-testid={`delete-invoice-${invoice.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
            <Receipt className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucune facture trouvée</h3>
            <p className="text-slate-600 mb-4">Commencez par créer votre première facture</p>
            <Link to="/invoices/new">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="mr-2 h-5 w-5" />
                Créer une facture
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InvoicesList;