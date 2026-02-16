import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Sparkles, Save, Send, Plus, Trash2, Mail, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import SignaturePad from '@/components/SignaturePad';
import PDFPreview from '@/components/PDFPreview';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const QuoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  
  const [formData, setFormData] = useState({
    client_id: '',
    work_location: '',
    work_surface: '',
    diagnostic: {
      mousses: false,
      lichens: false,
      tuiles_cassees: false,
      faitage: false,
      gouttieres: false,
      facade: false,
    },
    services: [],
    remise: 0,
    notes: '',
  });

  const [newClientData, setNewClientData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [quote, setQuote] = useState(null);

  useEffect(() => {
    fetchClients();
    fetchCatalog();
    if (id) {
      fetchQuote();
    }
  }, [id]);

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${API}/clients`);
      setClients(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des clients');
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await axios.get(`${API}/catalog`);
      setCatalog(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du catalogue');
    }
  };

  const fetchQuote = async () => {
    try {
      const res = await axios.get(`${API}/quotes/${id}`);
      const q = res.data;
      setQuote(q);
      setFormData({
        client_id: q.client_id,
        work_location: q.work_location,
        work_surface: q.work_surface,
        diagnostic: q.diagnostic || {
          mousses: false,
          lichens: false,
          tuiles_cassees: false,
          faitage: false,
          gouttieres: false,
          facade: false,
        },
        services: q.services,
        remise: q.remise,
        notes: q.notes || '',
      });
    } catch (error) {
      toast.error('Erreur lors du chargement du devis');
    }
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [
        ...formData.services,
        { description: '', quantity: 1, unit_price: 0, total: 0 },
      ],
    });
  };

  const addServiceFromCatalog = (catalogItem) => {
    const newService = {
      description: catalogItem.description,
      quantity: 1,
      unit_price: catalogItem.default_price || 0,
      total: catalogItem.default_price || 0,
    };
    setFormData({
      ...formData,
      services: [...formData.services, newService],
    });
    setShowCatalog(false);
    toast.success('Service ajouté');
  };

  const updateService = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index][field] = value;
    
    if (field === 'quantity' || field === 'unit_price') {
      newServices[index].total =
        parseFloat(newServices[index].quantity || 0) * parseFloat(newServices[index].unit_price || 0);
    }
    
    setFormData({ ...formData, services: newServices });
  };

  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  const calculateTotals = () => {
    const total_brut = formData.services.reduce((sum, s) => sum + (s.total || 0), 0);
    const total_net = total_brut - (formData.remise || 0);
    const acompte_30 = total_net * 0.3;
    return { total_brut, total_net, acompte_30 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let clientId = formData.client_id;
    
    // Si nouveau client, le créer d'abord
    if (showNewClientForm) {
      if (!newClientData.name || !newClientData.phone || !newClientData.address) {
        toast.error('Veuillez remplir nom, téléphone et adresse');
        return;
      }
      
      try {
        const clientRes = await axios.post(`${API}/clients`, newClientData);
        clientId = clientRes.data.id;
        toast.success('Client créé !');
        // Rafraîchir la liste des clients
        await fetchClients();
      } catch (error) {
        toast.error('Erreur lors de la création du client');
        return;
      }
    }
    
    if (!clientId) {
      toast.error('Veuillez sélectionner ou créer un client');
      return;
    }
    if (formData.services.length === 0) {
      toast.error('Veuillez ajouter au moins un service');
      return;
    }

    setLoading(true);
    try {
      const submitData = { ...formData, client_id: clientId };
      if (id) {
        await axios.put(`${API}/quotes/${id}`, submitData);
        toast.success('Devis modifié avec succès');
      } else {
        await axios.post(`${API}/quotes`, submitData);
        toast.success('Devis créé avec succès');
      }
      navigate('/quotes');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!quote) {
      toast.error('Veuillez d\'abord enregistrer le devis');
      return;
    }
    
    try {
      await axios.post(`${API}/send-email`, {
        recipient_email: quote.client_email,
        subject: emailSubject || `Devis ${quote.quote_number}`,
        document_id: quote.id,
        document_type: 'quote',
      });
      toast.success('Email envoyé avec succès');
      setShowEmailDialog(false);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Erreur lors de l\'envoi';
      toast.error(errorMsg);
    }
  };

  const { total_brut, total_net, acompte_30 } = calculateTotals();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/quotes')}
              className="text-white hover:bg-white/10"
              data-testid="back-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {id ? 'Modifier le devis' : 'Nouveau devis'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Client Selection */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Informations client</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="client">Client *</Label>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setShowNewClientForm(!showNewClientForm)}
                        className="text-orange-600"
                      >
                        {showNewClientForm ? 'Choisir un client existant' : '+ Nouveau client'}
                      </Button>
                    </div>
                    
                    {!showNewClientForm ? (
                      <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                        <SelectTrigger data-testid="client-select">
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} - {client.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-3 bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                        <Input
                          placeholder="Nom complet *"
                          value={newClientData.name}
                          onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                          data-testid="new-client-name"
                        />
                        <Input
                          placeholder="Email (optionnel)"
                          type="email"
                          value={newClientData.email}
                          onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                          data-testid="new-client-email"
                        />
                        <Input
                          placeholder="Téléphone *"
                          value={newClientData.phone}
                          onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                          data-testid="new-client-phone"
                        />
                        <Textarea
                          placeholder="Adresse complète *"
                          value={newClientData.address}
                          onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                          rows={2}
                          data-testid="new-client-address"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="work_location">Lieu des travaux *</Label>
                    <Input
                      id="work_location"
                      value={formData.work_location}
                      onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                      placeholder="Même adresse que le client ou autre"
                      required
                      data-testid="work-location-input"
                    />
                  </div>
                </div>
              </Card>

              {/* Diagnostic */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Diagnostic</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'mousses', label: 'Mousses' },
                    { key: 'lichens', label: 'Lichens' },
                    { key: 'tuiles_cassees', label: 'Tuiles cassées' },
                    { key: 'faitage', label: 'Faîtage' },
                    { key: 'gouttieres', label: 'Gouttières' },
                    { key: 'facade', label: 'Façade encrassée' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.key}
                        checked={formData.diagnostic[item.key]}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            diagnostic: { ...formData.diagnostic, [item.key]: checked },
                          })
                        }
                        data-testid={`diagnostic-${item.key}`}
                      />
                      <label htmlFor={item.key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Services */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">Services</h2>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setShowCatalog(true)}
                      variant="outline"
                      size="sm"
                      data-testid="add-from-catalog-btn"
                    >
                      Catalogue
                    </Button>
                    <Button
                      type="button"
                      onClick={addService}
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      data-testid="add-service-btn"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {formData.services.map((service, index) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <div className="space-y-3">
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={service.description}
                            onChange={(e) => updateService(index, 'description', e.target.value)}
                            rows={2}
                            data-testid={`service-description-${index}`}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label>Quantité</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={service.quantity}
                              onChange={(e) => updateService(index, 'quantity', e.target.value)}
                              data-testid={`service-quantity-${index}`}
                            />
                          </div>
                          <div>
                            <Label>Prix unitaire (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={service.unit_price}
                              onChange={(e) => updateService(index, 'unit_price', e.target.value)}
                              data-testid={`service-price-${index}`}
                            />
                          </div>
                          <div>
                            <Label>Total (€)</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={service.total.toFixed(2)}
                                readOnly
                                className="bg-slate-100"
                                data-testid={`service-total-${index}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeService(index)}
                                className="text-red-600 hover:bg-red-50"
                                data-testid={`remove-service-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Notes & Remise */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      data-testid="notes-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="remise">Remise (€)</Label>
                    <Input
                      id="remise"
                      type="number"
                      step="0.01"
                      value={formData.remise}
                      onChange={(e) => setFormData({ ...formData, remise: parseFloat(e.target.value) || 0 })}
                      data-testid="remise-input"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Panel - Preview */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Récapitulatif</h2>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-600">Total brut</span>
                    <span className="font-semibold text-slate-900">{total_brut.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-600">Remise</span>
                    <span className="font-semibold text-red-600">-{formData.remise.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between py-2 border-b-2 border-slate-300">
                    <span className="font-bold text-slate-900">Total net</span>
                    <span className="font-bold text-2xl text-slate-900">{total_net.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between py-2 bg-orange-50 rounded-lg px-3">
                    <span className="text-slate-700">Acompte 30%</span>
                    <span className="font-semibold text-orange-600">{acompte_30.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                    data-testid="save-quote-btn"
                  >
                    <Save className="mr-2 h-5 w-5" />
                    {loading ? 'Enregistrement...' : 'Enregistrer le devis'}
                  </Button>
                  
                  {quote && (
                    <>
                      <Button
                        type="button"
                        onClick={() => setShowPDFPreview(true)}
                        variant="outline"
                        className="w-full"
                        data-testid="preview-pdf-btn"
                      >
                        <Eye className="mr-2 h-5 w-5" />
                        Prévisualiser
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setShowEmailDialog(true)}
                        variant="outline"
                        className="w-full"
                        data-testid="send-email-btn"
                      >
                        <Mail className="mr-2 h-5 w-5" />
                        Envoyer par email
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* Catalog Dialog */}
      <Dialog open={showCatalog} onOpenChange={setShowCatalog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Sélectionner un service du catalogue</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3">
            {catalog.map((item) => (
              <Card
                key={item.id}
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => addServiceFromCatalog(item)}
                data-testid={`catalog-item-${item.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                        {item.category}
                      </span>
                      <h3 className="font-semibold text-slate-900">{item.service_name}</h3>
                    </div>
                    <p className="text-sm text-slate-600">{item.description}</p>
                    {item.default_price && (
                      <p className="text-sm font-medium text-orange-600 mt-1">
                        {item.default_price.toFixed(2)} €
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer le devis par email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Destinataire</Label>
              <Input value={quote?.client_email || ''} readOnly className="bg-slate-100" />
            </div>
            <div>
              <Label htmlFor="email-subject">Objet de l'email</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder={`Devis ${quote?.quote_number || ''}`}
                data-testid="email-subject-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendEmail} className="bg-orange-500 hover:bg-orange-600 text-white" data-testid="confirm-send-email-btn">
              <Send className="mr-2 h-4 w-4" />
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview */}
      {showPDFPreview && quote && (
        <PDFPreview
          document={quote}
          type="quote"
          onClose={() => setShowPDFPreview(false)}
        />
      )}
    </div>
  );
};

export default QuoteForm;
