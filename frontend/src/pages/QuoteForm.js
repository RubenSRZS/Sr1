import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Plus, Trash2, Eye, EyeOff, BookOpen, Download, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PDFDocument, downloadPDF, BRAND_BLUE, BRAND_ORANGE } from '@/components/PDFPreview';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ─── ServicesSection MUST be defined OUTSIDE QuoteForm to prevent remount on every render ─────
const UNITS = ['unité', 'm²', 'ML', 'm', 'h', 'forfait', 'kg'];

const ServicesSection = ({ services, updateSvc, removeSvc, addSvc, openCat, optionNum, totals, remiseType, remisePercent, remiseMontant, onRemiseTypeChange, onRemisePercentChange, onRemiseMontantChange }) => (
  <Card className="p-4 bg-white border-0 shadow-sm" data-testid={`services-section-${optionNum}`}>
    <div className="flex items-center justify-between mb-3">
      <span className="font-bold text-sm px-2 py-0.5 rounded"
        style={{ background: optionNum === 1 ? '#eff6ff' : '#fff7ed', color: optionNum === 1 ? BRAND_BLUE : BRAND_ORANGE }}>
        OPTION {optionNum}
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={openCat} data-testid={`catalog-btn-${optionNum}`}>
          <BookOpen className="h-3.5 w-3.5 mr-1" /> Catalogue
        </Button>
        <Button type="button" size="sm" className="h-7 text-xs text-white" style={{ background: optionNum === 1 ? BRAND_BLUE : BRAND_ORANGE }} onClick={addSvc} data-testid={`add-service-btn-${optionNum}`}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
        </Button>
      </div>
    </div>
    <div className="space-y-3">
      {services.map((s, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100" data-testid={`service-row-${optionNum}-${i}`}>
          <Textarea
            value={s.description}
            onChange={e => updateSvc(i, 'description', e.target.value)}
            placeholder="Description du service"
            rows={2}
            className="text-sm mb-2 resize-none"
            data-testid={`service-desc-${optionNum}-${i}`}
          />
          <div className="grid grid-cols-5 gap-1.5 items-end">
            <div>
              <Label className="text-xs text-gray-500">Qté</Label>
              <Input type="number" step="0.01" value={s.quantity} onChange={e => updateSvc(i, 'quantity', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Unité</Label>
              <select value={s.unit || 'unité'} onChange={e => updateSvc(i, 'unit', e.target.value)}
                className="h-8 text-sm w-full border border-input rounded-md px-1 bg-white focus:ring-1 focus:ring-ring">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Prix unitaire €</Label>
              <Input type="number" step="0.01" value={s.unit_price} onChange={e => updateSvc(i, 'unit_price', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Remise %</Label>
              <Input type="number" min="0" max="100" step="1" value={s.remise_percent || 0} onChange={e => updateSvc(i, 'remise_percent', parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
            </div>
            <div className="flex gap-1">
              <div className="flex-1">
                <Label className="text-xs text-gray-500">Total €</Label>
                <Input value={(s.total || 0).toFixed(2)} readOnly className="h-8 text-sm bg-gray-100 font-medium" />
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeSvc(i)} className="h-8 mt-4 text-red-500 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      {services.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-400">Ajoutez des services</div>
      )}
    </div>
    {/* Remise globale */}
    <div className="mt-4 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <Label className="text-xs text-gray-500">Remise globale Option {optionNum}</Label>
        <div className="flex bg-gray-100 rounded-md p-0.5">
          <button type="button" onClick={() => onRemiseTypeChange('percent')}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${remiseType === 'percent' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>%</button>
          <button type="button" onClick={() => onRemiseTypeChange('amount')}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${remiseType === 'amount' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>€</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {remiseType === 'percent' ? (
          <Input type="number" min="0" max="100" step="1" value={remisePercent}
            onChange={e => onRemisePercentChange(parseFloat(e.target.value) || 0)}
            placeholder="%" className="h-8 text-sm" />
        ) : (
          <Input type="number" min="0" step="0.01" value={remiseMontant}
            onChange={e => onRemiseMontantChange(parseFloat(e.target.value) || 0)}
            placeholder="€" className="h-8 text-sm" />
        )}
        <Input value={`-${totals.remise.toFixed(2)} €`} readOnly className="h-8 text-sm bg-gray-50" />
      </div>
    </div>
    {/* Totals */}
    <div className="mt-3 p-3 rounded-lg" style={{ background: optionNum === 1 ? '#eff6ff' : '#fff7ed' }}>
      {totals.remise > 0 && <div className="flex justify-between text-sm mb-1" style={{ color: BRAND_ORANGE }}><span>Remise</span><span>-{totals.remise.toFixed(2)} €</span></div>}
      <div className="flex justify-between font-bold text-lg pt-1 border-t" style={{ borderColor: optionNum === 1 ? BRAND_BLUE : BRAND_ORANGE, color: optionNum === 1 ? BRAND_BLUE : BRAND_ORANGE }}>
        <span>Total Option {optionNum} (TTC)</span><span>{totals.total_net.toFixed(2)} €</span>
      </div>
      <div className="flex justify-between text-sm font-medium mt-1" style={{ color: '#0369a1' }}><span>Acompte 30%</span><span>{totals.acompte_30.toFixed(2)} €</span></div>
      <div className="flex justify-between text-sm font-medium mt-0.5 text-gray-500"><span>Solde après travaux</span><span>{(totals.total_net - totals.acompte_30).toFixed(2)} €</span></div>
    </div>
  </Card>
);

const QuoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogTarget, setCatalogTarget] = useState('option1'); // 'option1' or 'option2'
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [hasOption2, setHasOption2] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    custom_quote_number: '',
    work_location: '',
    diagnostic: {
      // Structure
      tuiles_cassees: false, tuile_ciment: false, tuile_terre_cuite: false, faitage: false, fissures: false,
      // Végétation / taches
      mousses: false, lichens: false, mousse_verte: false, trace_noire: false,
      // Hydrologie
      gouttieres: false, forte_humidite: false,
      // Extérieur
      facade: false,
    },
    payment_plan: 'acompte_solde',
    // Option 1
    services: [],
    remise_type: 'percent',
    remise_percent: 0,
    remise_montant: 0,
    // Option 2
    option_2_services: [],
    option_2_remise_type: 'percent',
    option_2_remise_percent: 0,
    option_2_remise_montant: 0,
    notes: '',
  });

  const [newClient, setNewClient] = useState({ name: '', address: '', phone: '', email: '' });

  useEffect(() => {
    axios.get(`${API}/clients`).then(r => setClients(r.data)).catch(() => {});
    axios.get(`${API}/catalog`).then(r => setCatalog(r.data)).catch(() => {});
    if (id) {
      axios.get(`${API}/quotes/${id}`).then(r => {
        const q = r.data;
        const has2 = q.option_2_services && q.option_2_services.length > 0;
        setHasOption2(has2);
        setFormData({
          client_id: q.client_id,
          custom_quote_number: q.quote_number || '',
          work_location: q.work_location,
          diagnostic: q.diagnostic || { tuiles_cassees: false, tuile_ciment: false, tuile_terre_cuite: false, faitage: false, fissures: false, mousses: false, lichens: false, mousse_verte: false, trace_noire: false, gouttieres: false, forte_humidite: false, facade: false },
          services: q.services || [],
          remise_type: q.remise_percent > 0 ? 'percent' : (q.remise_montant > 0 ? 'amount' : 'percent'),
          remise_percent: q.remise_percent || 0,
          remise_montant: q.remise_montant || 0,
          payment_plan: q.payment_plan || 'acompte_solde',
          option_2_services: q.option_2_services || [],
          option_2_remise_type: q.option_2_remise_percent > 0 ? 'percent' : (q.option_2_remise_montant > 0 ? 'amount' : 'percent'),
          option_2_remise_percent: q.option_2_remise_percent || 0,
          option_2_remise_montant: q.option_2_remise_montant || 0,
          notes: q.notes || '',
        });
      }).catch(() => toast.error('Erreur chargement devis'));
    }
  }, [id]);

  const updateField = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  // Option 1 services
  const addService = () => updateField('services', [...formData.services, { description: '', quantity: 1, unit: 'unité', unit_price: 0, remise_percent: 0, total: 0 }]);
  const updateService = (i, field, val) => {
    const s = [...formData.services];
    s[i] = { ...s[i], [field]: val };
    if (field === 'quantity' || field === 'unit_price' || field === 'remise_percent') {
      const qty = parseFloat(s[i].quantity || 0);
      const pu = parseFloat(s[i].unit_price || 0);
      const remise = parseFloat(s[i].remise_percent || 0);
      s[i].total = qty * pu * (1 - remise / 100);
    }
    updateField('services', s);
  };
  const removeService = (i) => updateField('services', formData.services.filter((_, idx) => idx !== i));

  // Option 2 services
  const addService2 = () => updateField('option_2_services', [...formData.option_2_services, { description: '', quantity: 1, unit: 'unité', unit_price: 0, remise_percent: 0, total: 0 }]);
  const updateService2 = (i, field, val) => {
    const s = [...formData.option_2_services];
    s[i] = { ...s[i], [field]: val };
    if (field === 'quantity' || field === 'unit_price' || field === 'remise_percent') {
      const qty = parseFloat(s[i].quantity || 0);
      const pu = parseFloat(s[i].unit_price || 0);
      const remise = parseFloat(s[i].remise_percent || 0);
      s[i].total = qty * pu * (1 - remise / 100);
    }
    updateField('option_2_services', s);
  };
  const removeService2 = (i) => updateField('option_2_services', formData.option_2_services.filter((_, idx) => idx !== i));

  // Catalog handler
  const addFromCatalog = (item) => {
    const newService = { description: item.description, quantity: 1, unit: 'unité', unit_price: item.default_price || 0, remise_percent: 0, total: item.default_price || 0 };
    if (catalogTarget === 'option2') {
      updateField('option_2_services', [...formData.option_2_services, newService]);
    } else {
      updateField('services', [...formData.services, newService]);
    }
    setShowCatalog(false);
    toast.success('Service ajouté');
  };

  const openCatalog = (target) => {
    setCatalogTarget(target);
    setShowCatalog(true);
  };

  // Option 1 totals
  const totals1 = useMemo(() => {
    const brut = formData.services.reduce((sum, s) => sum + (s.total || 0), 0);
    const remise = formData.remise_type === 'percent'
      ? Math.round(brut * (formData.remise_percent || 0) / 100 * 100) / 100
      : Math.round((formData.remise_montant || 0) * 100) / 100;
    const net = Math.round((brut - remise) * 100) / 100;
    return { total_brut: brut, remise, total_net: Math.max(net, 0), acompte_30: Math.round(Math.max(net, 0) * 0.3 * 100) / 100 };
  }, [formData.services, formData.remise_type, formData.remise_percent, formData.remise_montant]);

  // Option 2 totals
  const totals2 = useMemo(() => {
    const brut = formData.option_2_services.reduce((sum, s) => sum + (s.total || 0), 0);
    const remise = formData.option_2_remise_type === 'percent'
      ? Math.round(brut * (formData.option_2_remise_percent || 0) / 100 * 100) / 100
      : Math.round((formData.option_2_remise_montant || 0) * 100) / 100;
    const net = Math.round((brut - remise) * 100) / 100;
    return { total_brut: brut, remise, total_net: Math.max(net, 0), acompte_30: Math.round(Math.max(net, 0) * 0.3 * 100) / 100 };
  }, [formData.option_2_services, formData.option_2_remise_type, formData.option_2_remise_percent, formData.option_2_remise_montant]);

  // Live preview document
  const previewDoc = useMemo(() => {
    const client = clients.find(c => c.id === formData.client_id);
    const cName = showNewClient ? newClient.name : client?.name || '';
    const cAddr = showNewClient ? newClient.address : client?.address || '';
    const cPhone = showNewClient ? newClient.phone : client?.phone || '';
    const cEmail = showNewClient ? newClient.email : client?.email || '';
    
    const doc = {
      quote_number: formData.custom_quote_number || (id ? undefined : 'XX'),
      client_name: cName, client_address: cAddr, client_phone: cPhone, client_email: cEmail,
      date: new Date().toLocaleDateString('fr-FR'),
      work_location: formData.work_location,
      diagnostic: formData.diagnostic,
      services: formData.services,
      payment_plan: formData.payment_plan,
      ...totals1,
      remise_percent: formData.remise_type === 'percent' ? formData.remise_percent : 0,
      remise_montant: formData.remise_type === 'amount' ? formData.remise_montant : 0,
      notes: formData.notes,
    };
    
    // Add option 2 if enabled
    if (hasOption2 && formData.option_2_services.length > 0) {
      doc.option_2_services = formData.option_2_services;
      doc.option_2_total_brut = totals2.total_brut;
      doc.option_2_remise = totals2.remise;
      doc.option_2_remise_percent = formData.option_2_remise_type === 'percent' ? formData.option_2_remise_percent : 0;
      doc.option_2_total_net = totals2.total_net;
      doc.option_2_acompte_30 = totals2.acompte_30;
    }
    
    return doc;
  }, [formData, newClient, showNewClient, clients, id, totals1, totals2, hasOption2]);

  const handleDownloadPDF = useCallback(async () => {
    await downloadPDF(previewDoc, 'quote');
  }, [previewDoc]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientId = formData.client_id;
    const hasNewClient = showNewClient && newClient.name;
    if (!clientId && !hasNewClient) { toast.error('Sélectionnez ou créez un client'); return; }
    if (formData.services.length === 0) { toast.error('Ajoutez au moins un service à l\'option 1'); return; }
    if (hasOption2 && formData.option_2_services.length === 0) { toast.error('Ajoutez au moins un service à l\'option 2 ou désactivez-la'); return; }
    if (showNewClient && (!newClient.name || !newClient.phone || !newClient.address)) {
      toast.error('Nom, téléphone et adresse sont obligatoires'); return;
    }

    setLoading(true);
    try {
      const payload = {
        client_id: hasNewClient ? null : clientId,
        new_client: hasNewClient ? newClient : null,
        custom_quote_number: formData.custom_quote_number || null,
        work_location: formData.work_location,
        work_surface: '',
        diagnostic: formData.diagnostic,
        services: formData.services,
        remise_percent: formData.remise_type === 'percent' ? formData.remise_percent : 0,
        remise_montant: formData.remise_type === 'amount' ? formData.remise_montant : 0,
        payment_plan: formData.payment_plan || 'acompte_solde',
        notes: formData.notes,
        // Option 2
        option_2_services: hasOption2 ? formData.option_2_services : [],
        option_2_remise_percent: hasOption2 && formData.option_2_remise_type === 'percent' ? formData.option_2_remise_percent : 0,
        option_2_remise_montant: hasOption2 && formData.option_2_remise_type === 'amount' ? formData.option_2_remise_montant : 0,
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

  const diagnosticGroups = [
    { group: 'Structure', items: [
      { key: 'tuiles_cassees', label: 'Tuiles cassées' },
      { key: 'tuile_ciment', label: 'Tuile ciment' },
      { key: 'tuile_terre_cuite', label: 'Tuile terre cuite' },
      { key: 'faitage', label: 'Faîtage' },
      { key: 'fissures', label: 'Fissures' },
    ]},
    { group: 'Végétation / Taches', items: [
      { key: 'mousses', label: 'Mousses' },
      { key: 'lichens', label: 'Lichens' },
      { key: 'mousse_verte', label: 'Mousse verte' },
      { key: 'trace_noire', label: 'Trace noire' },
    ]},
    { group: 'Hydrologie / Ext.', items: [
      { key: 'gouttieres', label: 'Gouttières' },
      { key: 'forte_humidite', label: 'Forte humidité' },
      { key: 'facade', label: 'Façade' },
    ]},
  ];
  const PAYMENT_PLANS = [
    { value: 'acompte_solde', label: 'Acompte 30% + Solde 70%' },
    { value: '2_fois', label: '2 fois égales (50% + 50%)' },
    { value: '3_fois', label: '3 fois égales (33% + 33% + 34%)' },
    { value: '4_fois', label: '4 fois égales (25% × 4)' },
  ];


  return (
    <div className="min-h-screen bg-[var(--sr-cream)]" data-testid="quote-form-page">
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, #3b82f6 100%)` }} className="text-white lg:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/quotes')} className="text-white hover:bg-white/10 h-8 w-8 p-0" data-testid="back-button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{id ? 'Modifier le devis' : 'Nouveau devis'}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="hidden lg:block mb-4">
          <h1 className="text-xl font-bold text-gray-900">{id ? 'Modifier le devis' : 'Nouveau devis'}</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-5">
          {/* LEFT - Form */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Client */}
            <Card className="p-4 bg-white border-0 shadow-sm" data-testid="client-section">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-gray-800">Client</span>
                <button type="button" onClick={() => setShowNewClient(!showNewClient)}
                  className="text-xs font-medium hover:underline" style={{ color: BRAND_BLUE }} data-testid="toggle-new-client">
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
                <div className="space-y-2 bg-blue-50/50 p-3 rounded-lg border border-blue-200/50">
                  <Input placeholder="Nom complet *" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} className="h-9 text-sm" data-testid="new-client-name" />
                  <Input placeholder="Téléphone *" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} className="h-9 text-sm" data-testid="new-client-phone" />
                  <Input placeholder="Adresse *" value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} className="h-9 text-sm" data-testid="new-client-address" />
                  <Input placeholder="Email (optionnel)" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className="h-9 text-sm" data-testid="new-client-email" />
                </div>
              )}
              <div className="mt-3">
                <Label className="text-xs text-gray-500">Numéro de devis (optionnel)</Label>
                <Input
                  value={formData.custom_quote_number}
                  onChange={e => updateField('custom_quote_number', e.target.value)}
                  placeholder="Ex: DEVIS-2025-001 (auto si vide)"
                  className="h-9 text-sm"
                  data-testid="quote-number-input"
                />
              </div>
              <div className="mt-3">
                <Label className="text-xs text-gray-500">Lieu des travaux *</Label>
                <Input value={formData.work_location} onChange={e => updateField('work_location', e.target.value)} placeholder="Adresse du chantier" className="h-9 text-sm" required data-testid="work-location-input" />
              </div>
            </Card>

            {/* Diagnostic */}
            <Card className="p-4 bg-white border-0 shadow-sm" data-testid="diagnostic-section">
              <span className="font-semibold text-sm text-gray-800 mb-2 block">Diagnostic visuel</span>
              <div className="space-y-2">
                {diagnosticGroups.map(group => (
                  <div key={group.group}>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{group.group}</div>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
                      {group.items.map(d => (
                        <label key={d.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <Checkbox checked={formData.diagnostic[d.key] || false} onCheckedChange={v => updateField('diagnostic', { ...formData.diagnostic, [d.key]: v })} data-testid={`diag-${d.key}`} />
                          {d.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment plan */}
            <Card className="p-4 bg-white border-0 shadow-sm" data-testid="payment-plan-section">
              <span className="font-semibold text-sm text-gray-800 mb-2 block">Modalités de paiement</span>
              <div className="grid grid-cols-1 gap-1.5">
                {PAYMENT_PLANS.map(plan => (
                  <label key={plan.value} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-gray-50 border transition-colors"
                    style={{ borderColor: formData.payment_plan === plan.value ? BRAND_BLUE : 'transparent', background: formData.payment_plan === plan.value ? '#eff6ff' : '' }}>
                    <input type="radio" name="payment_plan" value={plan.value}
                      checked={formData.payment_plan === plan.value}
                      onChange={() => updateField('payment_plan', plan.value)}
                      className="text-blue-600" data-testid={`payment-plan-${plan.value}`} />
                    <span style={{ color: formData.payment_plan === plan.value ? BRAND_BLUE : '#374151', fontWeight: formData.payment_plan === plan.value ? 600 : 400 }}>{plan.label}</span>
                  </label>
                ))}
              </div>
            </Card>

            {/* Option 1 Services */}
            <ServicesSection
              services={formData.services}
              updateSvc={updateService}
              removeSvc={removeService}
              addSvc={addService}
              openCat={() => openCatalog('option1')}
              optionNum={1}
              totals={totals1}
              remiseType={formData.remise_type}
              remisePercent={formData.remise_percent}
              remiseMontant={formData.remise_montant}
              onRemiseTypeChange={(t) => { updateField('remise_type', t); if(t === 'percent') updateField('remise_montant', 0); else updateField('remise_percent', 0); }}
              onRemisePercentChange={(v) => updateField('remise_percent', v)}
              onRemiseMontantChange={(v) => updateField('remise_montant', v)}
            />

            {/* Toggle Option 2 */}
            {!hasOption2 ? (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-12 border-dashed border-2"
                style={{ borderColor: BRAND_ORANGE, color: BRAND_ORANGE }}
                onClick={() => setHasOption2(true)}
                data-testid="add-option-2-btn"
              >
                <Copy className="h-4 w-4 mr-2" />
                Ajouter une Option 2 (alternative)
              </Button>
            ) : (
              <>
                {/* Option 2 Services */}
                <ServicesSection
                  services={formData.option_2_services}
                  updateSvc={updateService2}
                  removeSvc={removeService2}
                  addSvc={addService2}
                  openCat={() => openCatalog('option2')}
                  optionNum={2}
                  totals={totals2}
                  remiseType={formData.option_2_remise_type}
                  remisePercent={formData.option_2_remise_percent}
                  remiseMontant={formData.option_2_remise_montant}
                  onRemiseTypeChange={(t) => { updateField('option_2_remise_type', t); if(t === 'percent') updateField('option_2_remise_montant', 0); else updateField('option_2_remise_percent', 0); }}
                  onRemisePercentChange={(v) => updateField('option_2_remise_percent', v)}
                  onRemiseMontantChange={(v) => updateField('option_2_remise_montant', v)}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full text-red-500 hover:bg-red-50"
                  onClick={() => { setHasOption2(false); updateField('option_2_services', []); }}
                  data-testid="remove-option-2-btn"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer l'Option 2
                </Button>
              </>
            )}

            {/* Notes */}
            <Card className="p-4 bg-white border-0 shadow-sm" data-testid="notes-section">
              <Label className="text-xs text-gray-500">Notes</Label>
              <Textarea value={formData.notes} onChange={e => updateField('notes', e.target.value)} rows={2} placeholder="Remarques, conditions..." className="text-sm resize-none" data-testid="notes-input" />
            </Card>

            {/* Mobile Summary + Save */}
            <Card className="p-4 bg-white border-0 shadow-sm lg:hidden" data-testid="mobile-summary">
              <div className="space-y-2 mb-3">
                <div className="p-2 rounded-lg" style={{ background: '#eff6ff' }}>
                  <div className="flex justify-between font-bold" style={{ color: BRAND_BLUE }}>
                    <span>Option 1</span><span>{totals1.total_net.toFixed(2)} €</span>
                  </div>
                </div>
                {hasOption2 && formData.option_2_services.length > 0 && (
                  <div className="p-2 rounded-lg" style={{ background: '#fff7ed' }}>
                    <div className="flex justify-between font-bold" style={{ color: BRAND_ORANGE }}>
                      <span>Option 2</span><span>{totals2.total_net.toFixed(2)} €</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1 h-10" onClick={() => setShowPreviewMobile(true)} data-testid="preview-btn-mobile">
                  <Eye className="h-4 w-4 mr-1.5" /> Aperçu
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 h-10 text-white" style={{ background: BRAND_BLUE }} data-testid="save-quote-btn">
                  <Save className="h-4 w-4 mr-1.5" /> {loading ? '...' : 'Enregistrer'}
                </Button>
              </div>
            </Card>
          </div>

          {/* RIGHT - Live Preview (desktop) */}
          <div className="hidden lg:block w-[420px] shrink-0">
            <div className="sticky top-20 space-y-3">
              <Card className="p-4 bg-white border-0 shadow-sm">
                <div className="space-y-2 mb-3">
                  <div className="p-2 rounded-lg" style={{ background: '#eff6ff' }}>
                    {totals1.remise > 0 && <div className="flex justify-between text-sm" style={{ color: BRAND_ORANGE }}><span>Remise</span><span>-{totals1.remise.toFixed(2)} €</span></div>}
                    <div className="flex justify-between font-bold pt-1 border-t" style={{ borderColor: BRAND_BLUE, color: BRAND_BLUE }}>
                      <span>Total Option 1</span><span>{totals1.total_net.toFixed(2)} €</span>
                    </div>
                  </div>
                  {hasOption2 && formData.option_2_services.length > 0 && (
                    <div className="p-2 rounded-lg" style={{ background: '#fff7ed' }}>
                      {totals2.remise > 0 && <div className="flex justify-between text-sm" style={{ color: BRAND_ORANGE }}><span>Remise</span><span>-{totals2.remise.toFixed(2)} €</span></div>}
                      <div className="flex justify-between font-bold pt-1 border-t" style={{ borderColor: BRAND_ORANGE, color: BRAND_ORANGE }}>
                        <span>Total Option 2</span><span>{totals2.total_net.toFixed(2)} €</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-10"
                    style={{ borderColor: BRAND_BLUE, color: BRAND_BLUE }}
                    onClick={handleDownloadPDF}
                    data-testid="download-pdf-btn-desktop"
                  >
                    <Download className="h-4 w-4 mr-1.5" /> PDF
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 h-10 text-white" style={{ background: BRAND_BLUE }} data-testid="save-quote-btn-desktop">
                    <Save className="h-4 w-4 mr-1.5" /> {loading ? '...' : 'Enregistrer'}
                  </Button>
                </div>
              </Card>

              <Card className="bg-white border-0 shadow-sm overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aperçu en direct</span>
                </div>
                <div className="p-2 bg-gray-100 max-h-[55vh] overflow-y-auto" data-testid="live-preview-desktop">
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
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadPDF}
                  className="h-7 text-xs"
                  style={{ borderColor: BRAND_BLUE, color: BRAND_BLUE }}
                  data-testid="download-pdf-btn-mobile"
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowPreviewMobile(false)} className="h-7" data-testid="close-mobile-preview"><EyeOff className="h-4 w-4" /></Button>
              </div>
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
          <DialogHeader>
            <DialogTitle>
              Catalogue de services 
              <span className="ml-2 text-sm font-normal" style={{ color: catalogTarget === 'option1' ? BRAND_BLUE : BRAND_ORANGE }}>
                (pour {catalogTarget === 'option1' ? 'Option 1' : 'Option 2'})
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto space-y-2 max-h-[60vh]">
            {catalog.map(item => (
              <div key={item.id} onClick={() => addFromCatalog(item)}
                className="p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-colors"
                data-testid={`catalog-item-${item.id}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: '#eff6ff', color: BRAND_BLUE }}>{item.category}</span>
                  <span className="font-medium text-sm">{item.service_name}</span>
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
                {item.default_price && <p className="text-xs font-medium mt-1" style={{ color: BRAND_BLUE }}>{item.default_price.toFixed(2)} €</p>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuoteForm;
