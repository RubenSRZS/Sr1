import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Plus, Trash2, Eye, EyeOff, BookOpen, Download, Copy, Moon, Sun, ChevronUp, ChevronDown, Building2, Search } from 'lucide-react';
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
import { useTheme } from '@/context/ThemeContext';
import { useFormPersist } from '@/context/FormPersistContext';
import { DiagnosticSection } from '@/components/DiagnosticSection';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Category color mapping (same as CatalogManager)
const CATALOG_CATEGORIES = {
  'TOITURE': '#3b82f6',
  'FAÇADE': '#f97316',
  'ZINGUERIE & HABILLAGE': '#10b981',
  'SOLS & EXTÉRIEURS': '#8b5cf6',
};

const getCatalogItemColor = (item) => item.color || CATALOG_CATEGORIES[item.category] || '#6b7280';

// ─── ServicesSection MUST be defined OUTSIDE QuoteForm to prevent remount on every render ─────
const UNITS = ['unité', 'm²', 'ML', 'm', 'h', 'forfait', 'kg'];

const ServicesSection = ({ services, updateSvc, removeSvc, addSvc, openCat, optionNum, totals, remiseType, remisePercent, remiseMontant, onRemiseTypeChange, onRemisePercentChange, onRemiseMontantChange, optionTitle, onTitleChange, moveSvcUp, moveSvcDown }) => (
  <Card className="p-4 bg-white border-0 shadow-sm" data-testid={`services-section-${optionNum}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="font-bold text-sm px-2 py-0.5 rounded"
        style={{ background: optionNum === 1 ? '#eff6ff' : optionNum === 2 ? '#fff7ed' : '#fef3c7', color: optionNum === 1 ? BRAND_BLUE : optionNum === 2 ? BRAND_ORANGE : '#d97706' }}>
        OPTION {optionNum}
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={openCat} data-testid={`catalog-btn-${optionNum}`}>
          <BookOpen className="h-3.5 w-3.5 mr-1" /> Catalogue
        </Button>
        <Button type="button" size="sm" className="h-7 text-xs text-white" style={{ background: optionNum === 1 ? BRAND_BLUE : optionNum === 2 ? BRAND_ORANGE : '#d97706' }} onClick={addSvc} data-testid={`add-service-btn-${optionNum}`}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
        </Button>
      </div>
    </div>
    {/* Titre de l'option */}
    <div className="mb-3">
      <Input 
        value={optionTitle || ''} 
        onChange={e => onTitleChange(e.target.value)}
        placeholder={`Titre Option ${optionNum} (ex: Solution économique, Premium...)`}
        className="h-8 text-sm border-dashed"
        data-testid={`option-title-${optionNum}`}
      />
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
          {/* Mobile: Vertical layout */}
          <div className="block sm:hidden space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500 mb-1">Quantité</Label>
                <Input type="number" step="0.01" value={s.quantity} onChange={e => updateSvc(i, 'quantity', e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1">Unité</Label>
                <select value={s.unit || 'unité'} onChange={e => updateSvc(i, 'unit', e.target.value)}
                  className="h-9 text-sm w-full border border-input rounded-md px-2 bg-white">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500 mb-1">Prix unitaire €</Label>
                <Input type="number" step="0.01" value={s.unit_price} onChange={e => updateSvc(i, 'unit_price', e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1">Remise</Label>
                <div className="flex gap-1">
                  <select 
                    value={s.remise_type || 'percent'} 
                    onChange={e => {
                      const newServices = [...services];
                      newServices[i] = { ...s, remise_type: e.target.value, remise_montant: 0 };
                      updateSvc(i, 'remise_type', e.target.value);
                    }}
                    className="h-9 text-xs w-16 border border-input rounded-md px-1 bg-white"
                  >
                    <option value="percent">%</option>
                    <option value="amount">€</option>
                  </select>
                  <Input 
                    type="number" 
                    min="0" 
                    step={s.remise_type === 'amount' ? '0.01' : '1'}
                    max={s.remise_type === 'percent' ? '100' : undefined}
                    value={s.remise_type === 'amount' ? (s.remise_montant || 0) : (s.remise_percent || 0)} 
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      if (s.remise_type === 'amount') {
                        updateSvc(i, 'remise_montant', val);
                      } else {
                        updateSvc(i, 'remise_percent', val);
                      }
                    }} 
                    className="h-9 text-sm flex-1" 
                  />
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Label className="text-xs text-blue-700 font-semibold mb-1">Total</Label>
              <div className="text-2xl font-bold text-blue-600">{(s.total || 0).toFixed(2)} €</div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => moveSvcUp(i)} 
                disabled={i === 0}
                className="h-9"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => moveSvcDown(i)} 
                disabled={i === services.length - 1}
                className="h-9"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeSvc(i)} className="h-9 text-red-500 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Desktop: Horizontal layout */}
          <div className="hidden sm:block overflow-x-auto -mx-3 px-3 pb-2">
            <div className="grid grid-cols-5 gap-1.5 items-end min-w-[600px]">
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
                <Label className="text-xs text-gray-500">Remise</Label>
                <div className="flex gap-1">
                  <select 
                    value={s.remise_type || 'percent'} 
                    onChange={e => updateSvc(i, 'remise_type', e.target.value)}
                    className="h-8 text-xs w-12 border border-input rounded-md px-0.5 bg-white focus:ring-1 focus:ring-ring"
                  >
                    <option value="percent">%</option>
                    <option value="amount">€</option>
                  </select>
                  <Input 
                    type="number" 
                    min="0" 
                    step={s.remise_type === 'amount' ? '0.01' : '1'}
                    max={s.remise_type === 'percent' ? '100' : undefined}
                    value={s.remise_type === 'amount' ? (s.remise_montant || 0) : (s.remise_percent || 0)} 
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      if (s.remise_type === 'amount') {
                        updateSvc(i, 'remise_montant', val);
                      } else {
                        updateSvc(i, 'remise_percent', val);
                      }
                    }} 
                    className="h-8 text-sm flex-1" 
                  />
                </div>
              </div>
              <div className="flex gap-1">
                <div className="flex-1">
                  <Label className="text-xs text-gray-500">Total €</Label>
                  <Input value={(s.total || 0).toFixed(2)} readOnly className="h-8 text-sm bg-gray-100 font-medium" />
                </div>
                <div className="flex flex-col gap-0.5 mt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => moveSvcUp(i)} 
                    disabled={i === 0}
                    className="h-4 p-0 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30"
                    title="Déplacer vers le haut"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => moveSvcDown(i)} 
                    disabled={i === services.length - 1}
                    className="h-4 p-0 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30"
                    title="Déplacer vers le bas"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeSvc(i)} className="h-8 mt-4 text-red-500 hover:bg-red-50" title="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
      {(totals.remise_totale > 0 || totals.remises_lignes > 0 || totals.remise_globale > 0) && (
        <>
          <div className="flex justify-between text-sm mb-1 text-gray-600">
            <span>Total TTC (avant remises)</span>
            <span>{totals.total_brut.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm mb-2 font-semibold" style={{ color: BRAND_ORANGE }}>
            <span>Total remises</span>
            <span>-{totals.remise_totale.toFixed(2)} €</span>
          </div>
        </>
      )}
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
  const { darkMode, toggleDarkMode } = useTheme();
  const { quoteFormData, saveQuoteForm, clearQuoteForm } = useFormPersist();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showNotesCatalog, setShowNotesCatalog] = useState(false);
  const [catalogTarget, setCatalogTarget] = useState('option1'); // 'option1' ou index numérique d'option dynamique
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [additionalOptions, setAdditionalOptions] = useState([]); // Options dynamiques illimitées
  const [draftRestored, setDraftRestored] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');

  const initialFormState = {
    client_id: '',
    custom_quote_number: '',
    quote_title: '',
    work_location: '',
    diagnostic: {},
    payment_plan: 'acompte_solde',
    show_line_numbers: true,
    option_1_title: '',
    services: [],
    remise_type: 'percent',
    remise_percent: 0,
    remise_montant: 0,
    option_2_title: '',
    option_2_services: [],
    option_2_remise_type: 'percent',
    option_2_remise_percent: 0,
    option_2_remise_montant: 0,
    option_3_title: '',
    option_3_services: [],
    option_3_remise_type: 'percent',
    option_3_remise_percent: 0,
    option_3_remise_montant: 0,
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  const [newClient, setNewClient] = useState({ name: '', address: '', phone: '', email: '' });

  // Restore draft on mount (only for new quotes)
  useEffect(() => {
    if (!id && quoteFormData && !draftRestored) {
      const restored = quoteFormData.data;
      if (restored) {
        setFormData(prev => ({ ...prev, ...restored }));
        if (quoteFormData.options?.additionalOptions) setAdditionalOptions(quoteFormData.options.additionalOptions);
        if (quoteFormData.options?.newClient) setNewClient(quoteFormData.options.newClient);
        if (quoteFormData.options?.showNewClient) setShowNewClient(true);
        setDraftRestored(true);
        if (restored.services && restored.services.length > 0) {
          toast.info('Brouillon restauré', { description: 'Votre travail en cours a été récupéré' });
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft immediately on every change (only for new quotes)
  useEffect(() => {
    if (id) return; // Don't auto-save when editing existing quote
    const hasContent = formData.services.length > 0 || formData.work_location || formData.quote_title || formData.client_id;
    if (hasContent) {
      saveQuoteForm(formData, { additionalOptions, newClient, showNewClient });
    }
  }, [formData, additionalOptions, newClient, showNewClient, id, saveQuoteForm]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, catalogRes] = await Promise.all([
          axios.get(`${API}/clients`),
          axios.get(`${API}/catalog`)
        ]);
        
        setClients(clientsRes.data);
        setCatalog(catalogRes.data);

        // Charger les profils entreprise
        try {
          const profilesRes = await axios.get(`${API}/profiles`);
          setProfiles(profilesRes.data || []);
          if (!id) {
            const def = (profilesRes.data || []).find(p => p.is_default) || (profilesRes.data || [])[0];
            if (def) setSelectedProfileId(prev => prev || def.id);
          }
        } catch (e) {
          console.error('Erreur chargement profils:', e);
        }
        
        // Charger les données générées par l'IA si présentes
        const aiData = sessionStorage.getItem('ai_generated_quote');
        if (aiData && !id) {
          try {
            const data = JSON.parse(aiData);
            
            // Créer le client d'abord ou trouver un client existant
            if (data.client) {
              // Vérifier si le client existe déjà
              const existingClient = clientsRes.data.find(c => 
                c.phone === data.client.phone || c.email === data.client.email
              );
              
              if (existingClient) {
                // Utiliser le client existant
                setFormData(prev => ({
                  ...prev,
                  client_id: existingClient.id,
                  work_location: data.work_location || existingClient.address,
                  services: data.items || [],
                  notes: data.notes || ''
                }));
                toast.success('Données IA chargées ! Client existant trouvé.');
              } else {
                // Créer un nouveau client
                setNewClient({
                  name: data.client.name || '',
                  address: data.client.address || '',
                  phone: data.client.phone || '',
                  email: data.client.email || '',
                  postal_code: '',
                  city: ''
                });
                setShowNewClient(true);
                
                // Pré-remplir les services et notes
                setFormData(prev => ({
                  ...prev,
                  work_location: data.work_location || data.client.address,
                  services: data.items || [],
                  notes: data.notes || ''
                }));
                toast.success('Données IA chargées ! Remplissez les infos client.');
              }
            }
            
            // Nettoyer le sessionStorage
            sessionStorage.removeItem('ai_generated_quote');
          } catch (e) {
            console.error('Erreur chargement données IA:', e);
          }
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };
    
    loadData();
    
    if (id) {
      axios.get(`${API}/quotes/${id}`).then(r => {
        const q = r.data;
        if (q.profile_id) setSelectedProfileId(q.profile_id);
        
        // Charger les options dynamiques : priorité au nouveau format additional_options,
        // sinon rétro-compatibilité avec les anciens champs option_2 / option_3.
        let loadedOptions = [];
        if (Array.isArray(q.additional_options) && q.additional_options.length > 0) {
          loadedOptions = q.additional_options.map(o => ({
            title: o.title || '',
            services: o.services || [],
            remise_type: o.remise_type || (o.remise_montant > 0 ? 'amount' : 'percent'),
            remise_percent: o.remise_percent || 0,
            remise_montant: o.remise_montant || 0,
          }));
        } else {
          if (q.option_2_services && q.option_2_services.length > 0) {
            loadedOptions.push({
              title: q.option_2_title || '',
              services: q.option_2_services || [],
              remise_type: q.option_2_remise_montant > 0 ? 'amount' : 'percent',
              remise_percent: q.option_2_remise_percent || 0,
              remise_montant: q.option_2_remise_montant || 0,
            });
          }
          if (q.option_3_services && q.option_3_services.length > 0) {
            loadedOptions.push({
              title: q.option_3_title || '',
              services: q.option_3_services || [],
              remise_type: q.option_3_remise_montant > 0 ? 'amount' : 'percent',
              remise_percent: q.option_3_remise_percent || 0,
              remise_montant: q.option_3_remise_montant || 0,
            });
          }
        }
        setAdditionalOptions(loadedOptions);
        
        setFormData({
          client_id: q.client_id,
          client_name: q.client_name || '',
          client_email: q.client_email || '',
          client_phone: q.client_phone || '',
          client_address: q.client_address || '',
          custom_quote_number: q.quote_number || '',
          quote_title: q.quote_title || '',
          work_location: q.work_location,
          diagnostic: q.diagnostic || initialFormState.diagnostic,
          services: q.services || [],
          option_1_title: q.option_1_title || '',
          remise_type: q.remise_percent > 0 ? 'percent' : (q.remise_montant > 0 ? 'amount' : 'percent'),
          remise_percent: q.remise_percent || 0,
          remise_montant: q.remise_montant || 0,
          payment_plan: q.payment_plan || 'acompte_solde',
          show_line_numbers: q.show_line_numbers !== false,
          notes: q.notes || '',
        });
      }).catch(() => toast.error('Erreur chargement devis'));
    }
  }, [id]);

  const updateField = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  // Option 1 services
  const addService = () => updateField('services', [...formData.services, { description: '', quantity: 1, unit: 'unité', unit_price: 0, remise_type: 'percent', remise_percent: 0, remise_montant: 0, total: 0 }]);
  const updateService = (i, field, val) => {
    const s = [...formData.services];
    s[i] = { ...s[i], [field]: val };
    if (field === 'quantity' || field === 'unit_price' || field === 'remise_percent' || field === 'remise_montant' || field === 'remise_type') {
      const qty = parseFloat(s[i].quantity || 0);
      const pu = parseFloat(s[i].unit_price || 0);
      const lineTotal = qty * pu;
      
      // Calculer la remise selon le type
      let remise = 0;
      if (s[i].remise_type === 'amount') {
        remise = parseFloat(s[i].remise_montant || 0);
      } else {
        remise = lineTotal * (parseFloat(s[i].remise_percent || 0) / 100);
      }
      
      s[i].total = Math.max(lineTotal - remise, 0);
    }
    updateField('services', s);
  };
  const removeService = (i) => updateField('services', formData.services.filter((_, idx) => idx !== i));
  const moveServiceUp = (i) => {
    if (i === 0) return;
    const s = [...formData.services];
    [s[i-1], s[i]] = [s[i], s[i-1]];
    updateField('services', s);
  };
  const moveServiceDown = (i) => {
    if (i === formData.services.length - 1) return;
    const s = [...formData.services];
    [s[i], s[i+1]] = [s[i+1], s[i]];
    updateField('services', s);
  };

  // ─── Options dynamiques (illimitées) ───────────────────────────
  const computeOptTotals = (opt) => {
    const services = opt.services || [];
    const brut = services.reduce((s, x) => s + (parseFloat(x.quantity || 0) * parseFloat(x.unit_price || 0)), 0);
    const remisesLignes = services.reduce((s, x) => {
      const lt = parseFloat(x.quantity || 0) * parseFloat(x.unit_price || 0);
      return s + (x.remise_type === 'amount' ? parseFloat(x.remise_montant || 0) : lt * (parseFloat(x.remise_percent || 0) / 100));
    }, 0);
    const apres = services.reduce((s, x) => s + (x.total || 0), 0);
    const remiseGlobale = opt.remise_type === 'percent'
      ? Math.round(apres * (opt.remise_percent || 0) / 100 * 100) / 100
      : Math.round((opt.remise_montant || 0) * 100) / 100;
    const remiseTotale = Math.round((remisesLignes + remiseGlobale) * 100) / 100;
    const net = Math.max(Math.round((apres - remiseGlobale) * 100) / 100, 0);
    return {
      total_brut: brut, remises_lignes: remisesLignes, remise_globale: remiseGlobale,
      remise_totale: remiseTotale, remise: remiseGlobale, total_net: net,
      acompte_30: Math.round(net * 0.3 * 100) / 100,
    };
  };

  const addOption = () => setAdditionalOptions(prev => [...prev, { title: '', services: [], remise_type: 'percent', remise_percent: 0, remise_montant: 0 }]);
  const removeOption = (idx) => setAdditionalOptions(prev => prev.filter((_, i) => i !== idx));
  const updateOptionField = (idx, key, val) => setAdditionalOptions(prev => prev.map((o, i) => i === idx ? { ...o, [key]: val } : o));
  const addOptService = (idx) => setAdditionalOptions(prev => prev.map((o, i) => i === idx ? { ...o, services: [...o.services, { description: '', quantity: 1, unit: 'unité', unit_price: 0, remise_type: 'percent', remise_percent: 0, remise_montant: 0, total: 0 }] } : o));
  const updateOptService = (idx, i, field, val) => setAdditionalOptions(prev => prev.map((o, oi) => {
    if (oi !== idx) return o;
    const s = [...o.services];
    s[i] = { ...s[i], [field]: val };
    if (['quantity', 'unit_price', 'remise_percent', 'remise_montant', 'remise_type'].includes(field)) {
      const lt = parseFloat(s[i].quantity || 0) * parseFloat(s[i].unit_price || 0);
      const rem = s[i].remise_type === 'amount' ? parseFloat(s[i].remise_montant || 0) : lt * (parseFloat(s[i].remise_percent || 0) / 100);
      s[i].total = Math.max(lt - rem, 0);
    }
    return { ...o, services: s };
  }));
  const removeOptService = (idx, i) => setAdditionalOptions(prev => prev.map((o, oi) => oi === idx ? { ...o, services: o.services.filter((_, k) => k !== i) } : o));
  const moveOptServiceUp = (idx, i) => setAdditionalOptions(prev => prev.map((o, oi) => {
    if (oi !== idx || i === 0) return o;
    const s = [...o.services]; [s[i - 1], s[i]] = [s[i], s[i - 1]]; return { ...o, services: s };
  }));
  const moveOptServiceDown = (idx, i) => setAdditionalOptions(prev => prev.map((o, oi) => {
    if (oi !== idx || i === o.services.length - 1) return o;
    const s = [...o.services]; [s[i], s[i + 1]] = [s[i + 1], s[i]]; return { ...o, services: s };
  }));

  // Catalog handler
  const addFromCatalog = (item) => {
    const newService = { 
      description: item.description, 
      quantity: 1, 
      unit: item.default_unit || 'unité', 
      unit_price: item.default_price || 0, 
      remise_type: 'percent',
      remise_percent: 0, 
      remise_montant: 0,
      total: item.default_price || 0 
    };
    if (typeof catalogTarget === 'number') {
      setAdditionalOptions(prev => prev.map((o, i) => i === catalogTarget ? { ...o, services: [...o.services, newService] } : o));
    } else {
      updateField('services', [...formData.services, newService]);
    }
    setShowCatalog(false);
    toast.success('Service ajouté');
  };

  const openCatalog = (target) => {
    setCatalogTarget(target);
    setCatalogSearch('');
    setShowCatalog(true);
  };

  // Option 1 totals
  const totals1 = useMemo(() => {
    // Calculer le total brut AVANT remises de lignes
    const brutAvantRemises = formData.services.reduce((sum, s) => {
      const lineTotal = (s.quantity || 0) * (s.unit_price || 0);
      return sum + lineTotal;
    }, 0);
    
    // Calculer le total des remises de lignes (% ou montant fixe)
    const remisesLignes = formData.services.reduce((sum, s) => {
      const lineTotal = (s.quantity || 0) * (s.unit_price || 0);
      let lineRemise = 0;
      if (s.remise_type === 'amount') {
        lineRemise = s.remise_montant || 0;
      } else {
        lineRemise = lineTotal * ((s.remise_percent || 0) / 100);
      }
      return sum + lineRemise;
    }, 0);
    
    // Total après remises de lignes
    const brutApresRemisesLignes = formData.services.reduce((sum, s) => sum + (s.total || 0), 0);
    
    // Remise globale
    const remiseGlobale = formData.remise_type === 'percent'
      ? Math.round(brutApresRemisesLignes * (formData.remise_percent || 0) / 100 * 100) / 100
      : Math.round((formData.remise_montant || 0) * 100) / 100;
    
    // Total de TOUTES les remises
    const remiseTotale = Math.round((remisesLignes + remiseGlobale) * 100) / 100;
    
    const net = Math.round((brutApresRemisesLignes - remiseGlobale) * 100) / 100;
    return { 
      total_brut: brutAvantRemises, 
      remises_lignes: remisesLignes,
      remise_globale: remiseGlobale,
      remise_totale: remiseTotale,
      remise: remiseGlobale, // Pour compatibilité
      total_net: Math.max(net, 0), 
      acompte_30: Math.round(Math.max(net, 0) * 0.3 * 100) / 100 
    };
  }, [formData.services, formData.remise_type, formData.remise_percent, formData.remise_montant]);

  // Live preview document
  const previewDoc = useMemo(() => {
    const client = clients.find(c => c.id === formData.client_id);
    const cName = showNewClient ? newClient.name : client?.name || '';
    const cAddr = showNewClient ? newClient.address : client?.address || '';
    const cPhone = showNewClient ? newClient.phone : client?.phone || '';
    const cEmail = showNewClient ? newClient.email : client?.email || '';

    const prof = profiles.find(p => p.id === selectedProfileId);
    const company = prof ? {
      company_name: prof.company_name || '',
      account_holder: prof.account_holder || '',
      address: prof.address || '',
      phone: prof.phone || '',
      email: prof.email || '',
      siret: prof.siret || '',
    } : null;

    // Options dynamiques avec totaux calculés
    const additional_options = additionalOptions
      .filter(o => (o.services || []).length > 0)
      .map(o => {
        const t = computeOptTotals(o);
        return {
          title: o.title || '', services: o.services,
          remise_type: o.remise_type, remise_percent: o.remise_percent, remise_montant: o.remise_montant,
          total_brut: t.total_brut, remise: t.remise, remise_totale: t.remise_totale, total_net: t.total_net, acompte_30: t.acompte_30,
        };
      });

    const doc = {
      quote_number: formData.custom_quote_number || (id ? undefined : 'XX'),
      quote_title: formData.quote_title,
      company,
      client_name: cName, client_address: cAddr, client_phone: cPhone, client_email: cEmail,
      date: new Date().toLocaleDateString('fr-FR'),
      work_location: formData.work_location,
      diagnostic: formData.diagnostic,
      services: formData.services,
      option_1_title: formData.option_1_title,
      payment_plan: formData.payment_plan,
      show_line_numbers: formData.show_line_numbers,
      ...totals1,
      remise_percent: formData.remise_type === 'percent' ? formData.remise_percent : 0,
      remise_montant: formData.remise_type === 'amount' ? formData.remise_montant : 0,
      additional_options,
      notes: formData.notes,
    };

    return doc;
  }, [formData, newClient, showNewClient, clients, id, totals1, additionalOptions, profiles, selectedProfileId]);

  const handleDownloadPDF = useCallback(async () => {
    await downloadPDF(previewDoc, 'quote');
  }, [previewDoc]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientId = formData.client_id;
    const hasNewClient = showNewClient && newClient.name;
    if (!clientId && !hasNewClient) { toast.error('Sélectionnez ou créez un client'); return; }
    if (formData.services.length === 0) { toast.error('Ajoutez au moins un service à l\'option 1'); return; }
    const emptyOption = additionalOptions.find(o => (o.services || []).length === 0);
    if (emptyOption) { toast.error('Une option supplémentaire est vide. Ajoutez un service ou supprimez-la.'); return; }
    if (showNewClient && (!newClient.name || !newClient.phone || !newClient.address)) {
      toast.error('Nom, téléphone et adresse sont obligatoires'); return;
    }

    setLoading(true);
    try {
      const payload = {
        client_id: hasNewClient ? null : clientId,
        new_client: hasNewClient ? newClient : null,
        custom_quote_number: formData.custom_quote_number || null,
        quote_title: formData.quote_title || '',
        profile_id: selectedProfileId || null,
        work_location: formData.work_location,
        work_surface: '',
        diagnostic: formData.diagnostic,
        services: formData.services,
        option_1_title: formData.option_1_title || '',
        remise_percent: formData.remise_type === 'percent' ? formData.remise_percent : 0,
        remise_montant: formData.remise_type === 'amount' ? formData.remise_montant : 0,
        payment_plan: formData.payment_plan || 'acompte_solde',
        notes: formData.notes,
        // Options dynamiques (illimitées)
        additional_options: additionalOptions
          .filter(o => (o.services || []).length > 0)
          .map(o => ({
            title: o.title || '',
            services: o.services,
            remise_type: o.remise_type || 'percent',
            remise_percent: o.remise_type === 'percent' ? (o.remise_percent || 0) : 0,
            remise_montant: o.remise_type === 'amount' ? (o.remise_montant || 0) : 0,
          })),
      };
      if (id) {
        payload.client_id = payload.client_id || formData.client_id;
        await axios.put(`${API}/quotes/${id}`, payload);
        toast.success('Devis modifié');
      } else {
        await axios.post(`${API}/quotes`, payload);
        clearQuoteForm(); // Clear draft after successful save
        toast.success('Devis créé');
      }
      navigate('/quotes');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur de sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const PAYMENT_PLANS = [
    { value: 'acompte_solde', label: 'Acompte 30% + Solde 70%' },
    { value: '2_fois', label: '2 fois égales (50% + 50%)' },
    { value: '3_fois', label: '3 fois égales (33% + 33% + 34%)' },
    { value: '4_fois', label: '4 fois égales (25% × 4)' },
  ];


  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-[var(--sr-cream)]'}`} data-testid="quote-form-page">
      {/* Header */}
      <div style={{ background: darkMode ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : `linear-gradient(135deg, ${BRAND_BLUE} 0%, #3b82f6 100%)` }} className="text-white lg:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/quotes')} className="text-white hover:bg-white/10 h-8 w-8 p-0" data-testid="back-button">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">{id ? 'Modifier le devis' : 'Nouveau devis'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {profiles.length > 0 && (
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger data-testid="profile-select-mobile" className="h-8 w-auto gap-1 bg-white/15 border-white/30 text-white text-xs px-2 hover:bg-white/25">
                  <Building2 className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Profil" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(p => <SelectItem key={p.id} value={p.id} data-testid={`profile-option-${p.id}`}>{p.company_name || p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <button onClick={toggleDarkMode} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" data-testid="dark-mode-toggle-form">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="hidden lg:flex lg:items-center lg:justify-between mb-4">
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{id ? 'Modifier le devis' : 'Nouveau devis'}</h1>
          <div className="flex items-center gap-2">
            {profiles.length > 0 && (
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger data-testid="profile-select-desktop" className={`h-9 w-auto gap-1.5 text-sm px-3 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`}>
                  <Building2 className="h-4 w-4" style={{ color: BRAND_BLUE }} />
                  <SelectValue placeholder="Profil entreprise" />
                </SelectTrigger>
                <SelectContent className={darkMode ? 'bg-slate-700 border-slate-600' : ''}>
                  {profiles.map(p => <SelectItem key={p.id} value={p.id} className={darkMode ? 'text-white hover:bg-slate-600' : ''} data-testid={`profile-option-desktop-${p.id}`}>{p.company_name || p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-5">
          {/* LEFT - Form */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Client */}
            <Card className={`p-4 border-0 shadow-sm ${darkMode ? 'bg-slate-800' : 'bg-white'}`} data-testid="client-section">
              <div className="flex items-center justify-between mb-3">
                <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Client</span>
                <button type="button" onClick={() => setShowNewClient(!showNewClient)}
                  className="text-xs font-medium hover:underline" style={{ color: BRAND_BLUE }} data-testid="toggle-new-client">
                  {showNewClient ? 'Client existant' : '+ Nouveau client'}
                </button>
              </div>
              {!showNewClient ? (
                <Select value={formData.client_id} onValueChange={(v) => updateField('client_id', v)}>
                  <SelectTrigger data-testid="client-select" className={`h-9 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}><SelectValue placeholder="Choisir un client" /></SelectTrigger>
                  <SelectContent className={darkMode ? 'bg-slate-700 border-slate-600' : ''}>
                    {clients.map(c => <SelectItem key={c.id} value={c.id} className={darkMode ? 'text-white hover:bg-slate-600' : ''}>{c.name} {c.phone ? `- ${c.phone}` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className={`space-y-2 p-3 rounded-lg border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-blue-50/50 border-blue-200/50'}`}>
                  <Input placeholder="Nom complet *" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} className={`h-9 text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`} data-testid="new-client-name" />
                  <Input placeholder="Téléphone *" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} className={`h-9 text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`} data-testid="new-client-phone" />
                  <Input placeholder="Adresse *" value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} className={`h-9 text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`} data-testid="new-client-address" />
                  <Input placeholder="Email (optionnel)" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className={`h-9 text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`} data-testid="new-client-email" />
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
                <Label className="text-xs text-gray-500">Titre du devis (optionnel)</Label>
                <Input
                  value={formData.quote_title}
                  onChange={e => updateField('quote_title', e.target.value)}
                  placeholder="Ex: Rénovation toiture complète"
                  className="h-9 text-sm"
                  data-testid="quote-title-input"
                />
              </div>
              <div className="mt-3">
                <Label className="text-xs text-gray-500">Lieu des travaux *</Label>
                <Input value={formData.work_location} onChange={e => updateField('work_location', e.target.value)} placeholder="Adresse du chantier" className="h-9 text-sm" required data-testid="work-location-input" />
              </div>
            </Card>

            {/* Diagnostic */}
            <DiagnosticSection 
              diagnostic={formData.diagnostic || {}}
              updateDiagnostic={(newDiag) => updateField('diagnostic', newDiag)}
              darkMode={darkMode}
            />

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
              {/* Toggle numérotation des lignes */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Numéroter les prestations</span>
                  <button
                    type="button"
                    onClick={() => updateField('show_line_numbers', !formData.show_line_numbers)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.show_line_numbers ? 'bg-blue-600' : 'bg-gray-300'}`}
                    data-testid="toggle-line-numbers"
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.show_line_numbers ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
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
              optionTitle={formData.option_1_title}
              onTitleChange={(v) => updateField('option_1_title', v)}
              moveSvcUp={moveServiceUp}
              moveSvcDown={moveServiceDown}
            />

            {/* Options dynamiques (illimitées) */}
            {additionalOptions.map((opt, idx) => (
              <div key={idx} className="space-y-2" data-testid={`dynamic-option-${idx}`}>
                <ServicesSection
                  services={opt.services}
                  updateSvc={(i, field, val) => updateOptService(idx, i, field, val)}
                  removeSvc={(i) => removeOptService(idx, i)}
                  addSvc={() => addOptService(idx)}
                  openCat={() => openCatalog(idx)}
                  optionNum={idx + 2}
                  totals={computeOptTotals(opt)}
                  remiseType={opt.remise_type}
                  remisePercent={opt.remise_percent}
                  remiseMontant={opt.remise_montant}
                  onRemiseTypeChange={(t) => { updateOptionField(idx, 'remise_type', t); if (t === 'percent') updateOptionField(idx, 'remise_montant', 0); else updateOptionField(idx, 'remise_percent', 0); }}
                  onRemisePercentChange={(v) => updateOptionField(idx, 'remise_percent', v)}
                  onRemiseMontantChange={(v) => updateOptionField(idx, 'remise_montant', v)}
                  optionTitle={opt.title}
                  onTitleChange={(v) => updateOptionField(idx, 'title', v)}
                  moveSvcUp={(i) => moveOptServiceUp(idx, i)}
                  moveSvcDown={(i) => moveOptServiceDown(idx, i)}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-9 text-red-600 border-red-300 hover:bg-red-50 text-sm"
                  onClick={() => {
                    if (window.confirm(`Supprimer l'option ${idx + 2} ?`)) removeOption(idx);
                  }}
                  data-testid={`remove-option-${idx}-btn`}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Supprimer l'option {idx + 2}
                </Button>
              </div>
            ))}

            {/* Bouton ajouter une option */}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-12 border-dashed border-2"
              style={{ borderColor: BRAND_ORANGE, color: BRAND_ORANGE }}
              onClick={addOption}
              data-testid="add-option-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une option (alternative)
            </Button>

            {/* Notes */}
            <Card className="p-4 bg-white border-0 shadow-sm" data-testid="notes-section">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-gray-500">Notes</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-6 text-xs" 
                  onClick={() => setShowNotesCatalog(true)}
                  data-testid="notes-catalog-btn"
                >
                  <BookOpen className="h-3 w-3 mr-1" /> Catalogue
                </Button>
              </div>
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
                {additionalOptions.filter(o => (o.services || []).length > 0).map((opt, idx) => (
                  <div key={idx} className="p-2 rounded-lg" style={{ background: '#fff7ed' }}>
                    <div className="flex justify-between font-bold" style={{ color: BRAND_ORANGE }}>
                      <span>{opt.title ? `Option ${idx + 2}` : `Option ${idx + 2}`}</span><span>{computeOptTotals(opt).total_net.toFixed(2)} €</span>
                    </div>
                  </div>
                ))}
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
                  {additionalOptions.filter(o => (o.services || []).length > 0).map((opt, idx) => {
                    const t = computeOptTotals(opt);
                    return (
                      <div key={idx} className="p-2 rounded-lg" style={{ background: '#fff7ed' }}>
                        {t.remise > 0 && <div className="flex justify-between text-sm" style={{ color: BRAND_ORANGE }}><span>Remise</span><span>-{t.remise.toFixed(2)} €</span></div>}
                        <div className="flex justify-between font-bold pt-1 border-t" style={{ borderColor: BRAND_ORANGE, color: BRAND_ORANGE }}>
                          <span>Total Option {idx + 2}</span><span>{t.total_net.toFixed(2)} €</span>
                        </div>
                      </div>
                    );
                  })}
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
                <div className="p-2 bg-white max-h-[55vh] overflow-y-auto" data-testid="live-preview-desktop">
                  <div className="transform scale-[0.48] origin-top-left bg-white" style={{ width: '210mm' }}>
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
            <div className="p-2 bg-white">
              <PDFDocument document={previewDoc} type="quote" compact={true} />
            </div>
          </div>
        </div>
      )}

      {/* Catalog Dialog */}
      <Dialog open={showCatalog} onOpenChange={(open) => { setShowCatalog(open); if (!open) setCatalogSearch(''); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]" data-testid="catalog-dialog">
          <DialogHeader>
            <DialogTitle>
              Catalogue de services 
              <span className="ml-2 text-sm font-normal" style={{ color: catalogTarget === 'option1' ? BRAND_BLUE : BRAND_ORANGE }}>
                (pour {catalogTarget === 'option1' ? 'Option 1' : `Option ${catalogTarget + 2}`})
              </span>
            </DialogTitle>
          </DialogHeader>
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              placeholder="Rechercher une prestation..."
              className="pl-9 h-9 text-sm"
              autoFocus
              data-testid="catalog-search-input"
            />
          </div>
          <div className="overflow-y-auto space-y-3 max-h-[55vh] px-1">
            {catalog.filter(i => i.item_type !== 'note_condition').length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Aucun service dans le catalogue</p>
                <p className="text-xs mt-2">Ajoutez des services depuis la page Catalogue</p>
              </div>
            ) : (
              (() => {
                // Ordre des catégories défini
                const CATEGORY_ORDER = Object.keys(CATALOG_CATEGORIES);

                // Filtrer par recherche (exclure notes/conditions)
                const filtered = catalog.filter(item =>
                  item.item_type !== 'note_condition' && (
                    !catalogSearch ||
                    item.service_name?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                    item.description?.toLowerCase().includes(catalogSearch.toLowerCase())
                  )
                );

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">Aucun résultat pour « {catalogSearch} »</p>
                    </div>
                  );
                }

                // Grouper par catégorie
                const grouped = filtered.reduce((acc, item) => {
                  const cat = item.category || 'Autres';
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(item);
                  return acc;
                }, {});

                // Trier les catégories dans l'ordre défini
                const sortedEntries = Object.entries(grouped).sort(([a], [b]) => {
                  const idxA = CATEGORY_ORDER.indexOf(a);
                  const idxB = CATEGORY_ORDER.indexOf(b);
                  if (idxA === -1 && idxB === -1) return a.localeCompare(b);
                  if (idxA === -1) return 1;
                  if (idxB === -1) return -1;
                  return idxA - idxB;
                });
                
                return sortedEntries.map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <div className="text-xs font-bold uppercase text-gray-500 px-2 py-1 bg-gray-50 rounded sticky top-0">
                      {category}
                    </div>
                    <div className="space-y-1.5">
                      {items.map(item => {
                        const itemColor = getCatalogItemColor(item);
                        return (
                        <div 
                          key={item.id} 
                          onClick={() => addFromCatalog(item)}
                          className="p-3 rounded-lg border hover:shadow-sm cursor-pointer transition-all"
                          style={{ 
                            borderColor: itemColor,
                            borderLeftWidth: '4px',
                            backgroundColor: `${itemColor}08`
                          }}
                          data-testid={`catalog-item-${item.id}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div 
                              className="w-5 h-5 rounded-md border-2 shadow-sm flex-shrink-0" 
                              style={{ 
                                backgroundColor: itemColor,
                                borderColor: itemColor
                              }}
                            />
                            <span className="font-semibold text-sm flex-1">{item.service_name}</span>
                            {item.default_price && (
                              <span className="text-sm font-bold px-2 py-0.5 rounded" style={{ color: itemColor }}>
                                {item.default_price.toFixed(2)} €
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-600 ml-7">{item.description}</p>
                          )}
                        </div>
                      );})}
                    </div>
                  </div>
                ));
              })()
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Notes & Conditions Catalogue */}
      <Dialog open={showNotesCatalog} onOpenChange={setShowNotesCatalog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]" data-testid="notes-catalog-dialog">
          <DialogHeader>
            <DialogTitle>Notes & Conditions préenregistrées</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto space-y-2 max-h-[60vh] px-1">
            {catalog.filter(item => item.item_type === 'note_condition').length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Aucune note dans le catalogue</p>
                <p className="text-xs mt-2">Ajoutez des notes depuis la page Catalogue → NOTES & CONDITIONS</p>
              </div>
            ) : (
              catalog.filter(item => item.item_type === 'note_condition').map(note => (
                <div 
                  key={note.id} 
                  onClick={() => {
                    // Ajouter la note au champ notes (avec séparateur si déjà du contenu)
                    const currentNotes = formData.notes.trim();
                    const separator = currentNotes ? '\n\n' : '';
                    updateField('notes', currentNotes + separator + note.description);
                    setShowNotesCatalog(false);
                    toast.success(`Note "${note.service_name}" ajoutée`);
                  }}
                  className="p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-sm cursor-pointer transition-all bg-slate-50"
                  data-testid={`note-item-${note.id}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-md border-2 shadow-sm flex-shrink-0 bg-slate-500 border-slate-500" />
                    <span className="font-semibold text-sm flex-1">{note.service_name}</span>
                  </div>
                  <p className="text-xs text-gray-600 ml-7 line-clamp-2">{note.description}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuoteForm;
