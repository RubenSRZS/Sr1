import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Save, Info, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DAY_CONFIGS = [
  { day: 3, label: 'J+3', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', tone: 'Ton amical — premier rappel doux' },
  { day: 7, label: 'J+7', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', tone: 'Ton direct — relance avec questions' },
  { day: 14, label: 'J+14', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', tone: 'Ton valeur — arguments + disponibilité' },
  { day: 30, label: 'J+30', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', tone: 'Ton final — dernière tentative' },
];

const VARIABLES = ['{client_name}', '{quote_number}', '{total_net}', '{work_location}'];

const RelanceSettings = () => {
  const [templates, setTemplates] = useState({});
  const [saving, setSaving] = useState({});
  const [sending, setSending] = useState({});
  const [expanded, setExpanded] = useState({ 3: true, 7: false, 14: false, 30: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const r = await axios.get(`${API}/relance-templates`);
      const map = {};
      r.data.forEach(t => { map[t.day] = { subject: t.subject, body: t.body }; });
      setTemplates(map);
    } catch {
      toast.error('Erreur chargement des modèles');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (day, field, value) => {
    setTemplates(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleSave = async (day) => {
    setSaving(prev => ({ ...prev, [day]: true }));
    try {
      await axios.put(`${API}/relance-templates/${day}`, {
        day,
        subject: templates[day]?.subject || '',
        body: templates[day]?.body || '',
      });
      toast.success(`Modèle J+${day} sauvegardé`);
    } catch {
      toast.error('Erreur sauvegarde');
    } finally {
      setSaving(prev => ({ ...prev, [day]: false }));
    }
  };

  const handleSendPreview = async (day) => {
    setSending(prev => ({ ...prev, [day]: true }));
    try {
      await axios.post(`${API}/relances/send-preview/${day}`, { email: 'rubensrzs03@gmail.com' });
      toast.success(`Aperçu J+${day} envoyé à rubensrzs03@gmail.com`);
    } catch {
      toast.error('Erreur envoi aperçu');
    } finally {
      setSending(prev => ({ ...prev, [day]: false }));
    }
  };

  const toggleExpanded = (day) => setExpanded(prev => ({ ...prev, [day]: !prev[day] }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--sr-cream)]">
      <div className="h-10 w-10 border-3 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--sr-cream)]" data-testid="relance-settings-page">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 60%, #f97316 100%)' }} className="text-white">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">Modèles de Relances</h1>
              <p className="text-xs text-white/60">Personnalisez les 4 emails de suivi automatique</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-semibold mb-1">Variables disponibles dans les textes :</p>
            <div className="flex flex-wrap gap-1">
              {VARIABLES.map(v => (
                <code key={v} className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-blue-800">{v}</code>
              ))}
            </div>
            <p className="mt-1 text-blue-600">Les relances s'envoient automatiquement sauf le dimanche. Elles s'arrêtent dès que le devis est signé ou marqué comme perdu.</p>
          </div>
        </div>

        {/* Template cards */}
        {DAY_CONFIGS.map(({ day, label, color, bg, border, tone }) => (
          <Card key={day} className="border-0 shadow-sm overflow-hidden" data-testid={`relance-card-${day}`}>
            {/* Card header */}
            <button
              onClick={() => toggleExpanded(day)}
              className="w-full p-4 flex items-center justify-between hover:opacity-90 transition-opacity"
              style={{ background: bg, borderBottom: `1px solid ${border}` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-sm font-bold px-3 py-1 rounded-full text-white"
                  style={{ background: color }}
                >
                  {label}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">{tone}</p>
                  {templates[day]?.subject && (
                    <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-md">
                      Objet : {templates[day].subject}
                    </p>
                  )}
                </div>
              </div>
              {expanded[day] ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>

            {/* Expanded form */}
            {expanded[day] && (
              <div className="bg-white p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Objet de l'email</label>
                  <Input
                    value={templates[day]?.subject || ''}
                    onChange={e => handleChange(day, 'subject', e.target.value)}
                    placeholder={`Objet de la relance J+${day}...`}
                    className="text-sm h-9"
                    data-testid={`relance-subject-${day}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Corps du message</label>
                  <textarea
                    value={templates[day]?.body || ''}
                    onChange={e => handleChange(day, 'body', e.target.value)}
                    placeholder="Contenu de l'email..."
                    rows={7}
                    className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-sans leading-relaxed"
                    data-testid={`relance-body-${day}`}
                  />
                  <p className="text-xs text-gray-400 mt-1">Le lien "Consulter mon devis" est ajouté automatiquement dans l'email.</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendPreview(day)}
                    disabled={sending[day]}
                    className="h-8 text-xs"
                    data-testid={`preview-relance-${day}`}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    {sending[day] ? 'Envoi...' : 'Aperçu email'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(day)}
                    disabled={saving[day]}
                    className="h-8 text-xs text-white"
                    style={{ background: color }}
                    data-testid={`save-relance-${day}`}
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    {saving[day] ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RelanceSettings;
