import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Plus, Trash2, Eye, EyeOff, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PDFDocument } from '@/components/PDFPreview';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const QuoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    work_location: '',
    diagnostic: { mousses: false, lichens: false, tuiles_cassees: false, faitage: false, gouttieres: false, facade: false },
    services: [],
    remise_type: 'percent',
    remise_percent: 0,
    remise_montant: 0,
    notes: '',
  });

  const [newClient, setNewClient] = useState({ name: '', address: '', phone: '', email: '' });

  useEffect(() => {
    axios.get(`${API}/clients`).then(r => setClients(r.data)).catch(() => {});
    axios.get(`${API}/catalog`).then(r => setCatalog(r.data)).catch(() => {});
    if (id) {
      axios.get(`${API}/quotes/${id}`).then(r => {
        const q = r.data;
        setFormData({
          client_id: q.client_id,
          work_location: q.work_location,
          diagnostic: q.diagnostic || { mousses: false, lichens: false, tuiles_cassees: false, faitage: false, gouttieres: false, facade: false },
          services: q.services,
          remise_type: q.remise_percent > 0 ? 'percent' : (q.remise_montant > 0 ? 'amount' : 'percent'),
          remise_percent: q.remise_percent || 0,
          remise_montant: q.remise_montant || 0,
          notes: q.notes || '',
        });
      }).catch(() => toast.error('Erreur chargement devis'));
    }
  }, [id]);

  const updateField = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const addService = () => updateField('services', [...formData.services, { description: '', quantity: 1, unit_price: 0, total: 0 }]);

  const addFromCatalog = (item) => {
    updateField('services', [...formData.services, { description: item.description, quantity: 1, unit_price: item.default_price || 0, total: item.default_price || 0 }]);
    setShowCatalog(false);
    toast.success('Service ajouté');
  };

  const updateService = (i, field, val) => {
    const s = [...formData.services];
    s[i] = { ...s[i], [field]: val };
    if (field === 'quantity' || field === 'unit_price') {
      s[i].total = parseFloat(s[i].quantity || 0) * parseFloat(s[i].unit_price || 0);
    }
    updateField('services', s);
  };

  const removeService = (i) => updateField('services', formData.services.filter((_, idx) => idx !== i));

  const totals = useMemo(() => {
    const brut = formData.services.reduce((sum, s) => sum + (s.total || 0), 0);
    const remise = formData.remise_type === 'percent'
      ? Math.round(brut * (formData.remise_percent || 0) / 100 * 100) / 100
      : Math.round((formData.remise_montant || 0) * 100) / 100;
    const net = Math.round((brut - remise) * 100) / 100;
    return { total_brut: brut, remise, total_net: Math.max(net, 0), acompte_30: Math.round(Math.max(net, 0) * 0.3 * 100) / 100 };
  }, [formData.services, formData.remise_type, formData.remise_percent, formData.remise_montant]);

  // Live preview document
  const previewDoc = useMemo(() => {
    const client = clients.find(c => c.id === formData.client_id);
    const cName = showNewClient ? newClient.name : client?.name || '';
    const cAddr = showNewClient ? newClient.address : client?.address || '';
    const cPhone = showNewClient ? newClient.phone : client?.phone || '';
    const cEmail = showNewClient ? newClient.email : client?.email || '';
    return {
      quote_number: id ? undefined : 'XX',
      client_name: cName, client_address: cAddr, client_phone: cPhone, client_email: cEmail,
      date: new Date().toLocaleDateString('fr-FR'),
      work_location: formData.work_location, work_surface: formData.work_surface,
      services: formData.services,
      ...totals,
      remise_percent: formData.remise_percent,
      notes: formData.notes,
    };
  }, [formData, newClient, showNewClient, clients, id, totals]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientId = formData.client_id;
    const hasNewClient = showNewClient && newClient.name;
    if (!clientId && !hasNewClient) { toast.error('Sélectionnez ou créez un client'); return; }
    if (formData.services.length === 0) { toast.error('Ajoutez au moins un service'); return; }
    if (showNewClient && (!newClient.name || !newClient.phone || !newClient.address)) {
      toast.error('Nom, téléphone et adresse sont obligatoires'); return;
    }

    setLoading(true);
    try {
      const payload = {
        client_id: hasNewClient ? null : clientId,
        new_client: hasNewClient ? newClient : null,
        work_location: formData.work_location,
        work_surface: formData.work_surface,
        diagnostic: formData.diagnostic,
        services: formData.services,
        remise_percent: formData.remise_percent,
        notes: formData.notes,
      };
      if (id) {
        payload.client_id = payload.client_id || formData.client_id;
        await axios.put(`${API}/quotes/${id}`, payload);
        toast.success('Devis modifié');
      } else {
        await axios.post(`${API}/quotes`, payload);
        toast.success('Devis créé');
      }
      navigate('/quotes');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur de sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const diagnosticItems = [
    { key: 'mousses', label: 'Mousses' }, { key: 'lichens', label: 'Lichens' },
    { key: 'tuiles_cassees', label: 'Tuiles cassées' }, { key: 'faitage', label: 'Faîtage' },
    { key: 'gouttieres', label: 'Gouttières' }, { key: 'facade', label: 'Façade' },
  ];

  return (
    <div className="min-h-screen bg-[var(--sr-cream)]" data-testid="quote-form-page">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/quotes')} className="text-white hover:bg-white/10 h-8 w-8 p-0" data-testid="back-button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{id ? 'Modifier le devis' : 'Nouveau devis'}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="flex gap-5">
          {/* LEFT - Form */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Client */}
            <Card className="p-4 bg-white border-0 shadow-sm" data-testid="client-section">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-gray-800">Client</span>
                <button type="button" onClick={() => setShowNewClient(!showNewClient)}
                  className="text-xs font-medium hover:underline" style={{ color: '#e8712a' }} data-testid="toggle-new-client">
                  {showNewClient ? 'Client existant' : '+ Nouveau client'}
                </button>
              </div>
              {!showNewClient ? (
                <Select value={formData.client_id} onValueChange={(v) => updateField('client_id', v)}>
                  <SelectTrigger data-testid="client-select" className="h-9"><SelectValue placeholder="Choisir un client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2 bg-orange-50/50 p-3 rounded-lg border border-orange-200/50">
                  <Input placeholder="Nom complet *" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} className="h-9 text-sm" data-testid="new-client-name" />
                  <Input placeholder="Téléphone *" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} className="h-9 text-sm" data-testid="new-client-phone" />
                  <Input placeholder="Adresse *" value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} className="h-9 text-sm" data-testid="new-client-address" />
                  <Input placeholder="Email (optionnel)" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className="h-9 text-sm" data-testid="new-client-email" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <Label className="text-xs text-gray-500">Lieu des travaux *</Label>
                  <Input value={formData.work_location} onChange={e => updateField('work_location', e.target.value)} placeholder="Adresse du chantier" className="h-9 text-sm" required data-testid="work-location-input" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Surface</Label>
                  <Input value={formData.work_surface} onChange={e => updateField('work_surface', e.target.value)} placeholder="Ex: 120m²" className="h-9 text-sm" data-testid="work-surface-input" />
                </div>
              </div>
            </Card>

            {/* Diagnostic */}
            <Card className="p-4 bg-white border-0 shadow-sm" data-testid="diagnostic-section">
              <span className="font-semibold text-sm text-gray-800 mb-2 block">Diagnostic</span>
              <div className="grid grid-cols-3 gap-2">
                {diagnosticItems.map(d => (
                  <label key={d.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <Checkbox checked={formData.diagnostic[d.key]} onCheckedChange={v => updateField('diagnostic', { ...formData.diagnostic, [d.key]: v })} data-testid={`diag-${d.key}`} />
                    {d.label}
                  </label>
                ))}
              </div>
            </Card>

            {/* Services */}
            <Card className="p-4 bg-white border-0 shadow-sm" data-testid="services-section">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-gray-800">Services</span>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowCatalog(true)} data-testid="catalog-btn">
                    <BookOpen className="h-3.5 w-3.5 mr-1" /> Catalogue
                  </Button>
                  <Button type="button" size="sm" className="h-7 text-xs text-white" style={{ background: '#e8712a' }} onClick={addService} data-testid="add-service-btn">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {formData.services.map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100 animate-fade-in-up" data-testid={`service-row-${i}`}>
                    <Textarea value={s.description} onChange={e => updateService(i, 'description', e.target.value)}
                      placeholder="Description du service" rows={2} className="text-sm mb-2 resize-none" data-testid={`service-desc-${i}`} />
                    <div className="grid grid-cols-4 gap-2 items-end">
                      <div>
                        <Label className="text-xs text-gray-500">Qté</Label>
                        <Input type="number" step="0.01" value={s.quantity} onChange={e => updateService(i, 'quantity', e.target.value)} className="h-8 text-sm" data-testid={`service-qty-${i}`} />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Prix unit. €</Label>
                        <Input type="number" step="0.01" value={s.unit_price} onChange={e => updateService(i, 'unit_price', e.target.value)} className="h-8 text-sm" data-testid={`service-price-${i}`} />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Total €</Label>
                        <Input value={s.total.toFixed(2)} readOnly className="h-8 text-sm bg-gray-100 font-medium" data-testid={`service-total-${i}`} />
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeService(i)} className="h-8 text-red-500 hover:bg-red-50" data-testid={`remove-service-${i}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {formData.services.length === 0 && (
                  <div className="text-center py-6 text-sm text-gray-400">Ajoutez des services depuis le catalogue ou manuellement</div>
                )}
              </div>
            </Card>

            {/* Notes & Remise */}
            <Card className="p-4 bg-white border-0 shadow-sm" data-testid="notes-section">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <Label className="text-xs text-gray-500">Remise (%)</Label>
                  <Input type="number" min="0" max="100" step="1" value={formData.remise_percent}
                    onChange={e => updateField('remise_percent', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 30" className="h-9 text-sm" data-testid="remise-percent-input" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Montant remise</Label>
                  <Input value={`${totals.remise.toFixed(2)} €`} readOnly className="h-9 text-sm bg-gray-50" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Notes</Label>
                <Textarea value={formData.notes} onChange={e => updateField('notes', e.target.value)} rows={2} placeholder="Remarques, conditions..." className="text-sm resize-none" data-testid="notes-input" />
              </div>
            </Card>

            {/* Summary + Save (mobile) */}
            <Card className="p-4 bg-white border-0 shadow-sm lg:hidden" data-testid="mobile-summary">
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Total brut</span><span className="font-medium">{totals.total_brut.toFixed(2)} €</span></div>
                {totals.remise > 0 && <div className="flex justify-between text-sm" style={{ color: '#e8712a' }}><span>Remise ({formData.remise_percent}%)</span><span>-{totals.remise.toFixed(2)} €</span></div>}
                <div className="flex justify-between font-bold text-lg pt-1 border-t"><span>Total net</span><span>{totals.total_net.toFixed(2)} €</span></div>
                <div className="flex justify-between text-sm font-medium" style={{ color: '#e8712a' }}><span>Acompte 30%</span><span>{totals.acompte_30.toFixed(2)} €</span></div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1 h-10" onClick={() => setShowPreviewMobile(true)} data-testid="preview-btn-mobile">
                  <Eye className="h-4 w-4 mr-1.5" /> Aperçu
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 h-10 text-white" style={{ background: '#0c1829' }} data-testid="save-quote-btn">
                  <Save className="h-4 w-4 mr-1.5" /> {loading ? 'Sauvegarde...' : 'Enregistrer'}
                </Button>
              </div>
            </Card>
          </div>

          {/* RIGHT - Live Preview (desktop) */}
          <div className="hidden lg:block w-[420px] shrink-0">
            <div className="sticky top-4 space-y-3">
              <Card className="p-4 bg-white border-0 shadow-sm">
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Total brut</span><span className="font-medium">{totals.total_brut.toFixed(2)} €</span></div>
                  {totals.remise > 0 && <div className="flex justify-between text-sm" style={{ color: '#e8712a' }}><span>Remise ({formData.remise_percent}%)</span><span>-{totals.remise.toFixed(2)} €</span></div>}
                  <div className="flex justify-between font-bold text-lg pt-1 border-t"><span>Total net</span><span>{totals.total_net.toFixed(2)} €</span></div>
                  <div className="flex justify-between text-sm font-medium" style={{ color: '#e8712a' }}><span>Acompte 30%</span><span>{totals.acompte_30.toFixed(2)} €</span></div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-10 text-white" style={{ background: '#0c1829' }} data-testid="save-quote-btn-desktop">
                  <Save className="h-4 w-4 mr-1.5" /> {loading ? 'Sauvegarde...' : 'Enregistrer le devis'}
                </Button>
              </Card>

              <Card className="bg-white border-0 shadow-sm overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aperçu en direct</span>
                </div>
                <div className="p-2 bg-gray-100 max-h-[65vh] overflow-y-auto" data-testid="live-preview-desktop">
                  <div className="transform scale-[0.48] origin-top-left" style={{ width: '210mm' }}>
                    <PDFDocument document={previewDoc} type="quote" compact={false} />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* Mobile Preview Modal */}
      {showPreviewMobile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-3 pt-6 backdrop-blur-sm overflow-y-auto lg:hidden">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl animate-fade-in-up">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-xl z-10">
              <span className="font-semibold text-sm">Aperçu du devis</span>
              <Button variant="ghost" size="sm" onClick={() => setShowPreviewMobile(false)} className="h-7" data-testid="close-mobile-preview"><EyeOff className="h-4 w-4" /></Button>
            </div>
            <div className="p-2 bg-gray-100">
              <PDFDocument document={previewDoc} type="quote" compact={true} />
            </div>
          </div>
        </div>
      )}

      {/* Catalog Dialog */}
      <Dialog open={showCatalog} onOpenChange={setShowCatalog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]" data-testid="catalog-dialog">
          <DialogHeader><DialogTitle>Catalogue de services</DialogTitle></DialogHeader>
          <div className="overflow-y-auto space-y-2 max-h-[60vh]">
            {catalog.map(item => (
              <div key={item.id} onClick={() => addFromCatalog(item)}
                className="p-3 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 cursor-pointer transition-colors"
                data-testid={`catalog-item-${item.id}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: '#fff3e6', color: '#e8712a' }}>{item.category}</span>
                  <span className="font-medium text-sm">{item.service_name}</span>
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
                {item.default_price && <p className="text-xs font-medium mt-1" style={{ color: '#e8712a' }}>{item.default_price.toFixed(2)} €</p>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuoteForm;
