import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Sparkles, Send, X, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DAY_COLORS = { 3: '#3b82f6', 7: '#f97316', 14: '#8b5cf6', 30: '#ef4444' };

export const AIRelanceQueue = () => {
  const [mode, setMode] = useState('auto');
  const [queue, setQueue] = useState([]);
  const [busy, setBusy] = useState({});

  const fetchAll = useCallback(async () => {
    try {
      const [m, q] = await Promise.all([
        axios.get(`${API}/relances/mode`),
        axios.get(`${API}/ai-relances?status=pending`),
      ]);
      setMode(m.data.mode);
      setQueue(q.data);
    } catch {
      toast.error('Erreur chargement relances IA');
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const changeMode = async (newMode) => {
    try {
      await axios.put(`${API}/relances/mode`, { mode: newMode });
      setMode(newMode);
      toast.success(newMode === 'ai' ? 'Mode IA activé — les relances attendront votre validation' : 'Mode automatique activé');
    } catch {
      toast.error('Erreur changement de mode');
    }
  };

  const updateField = (id, field, value) => {
    setQueue(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSend = async (rel) => {
    setBusy(prev => ({ ...prev, [rel.id]: 'send' }));
    try {
      await axios.put(`${API}/ai-relances/${rel.id}`, { subject: rel.subject, body: rel.body });
      await axios.post(`${API}/ai-relances/${rel.id}/send`);
      setQueue(prev => prev.filter(r => r.id !== rel.id));
      toast.success(`Relance envoyée à ${rel.client_name}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erreur envoi');
    } finally {
      setBusy(prev => ({ ...prev, [rel.id]: null }));
    }
  };

  const handleReject = async (rel) => {
    setBusy(prev => ({ ...prev, [rel.id]: 'reject' }));
    try {
      await axios.post(`${API}/ai-relances/${rel.id}/reject`);
      setQueue(prev => prev.filter(r => r.id !== rel.id));
      toast.success('Relance rejetée');
    } catch {
      toast.error('Erreur');
    } finally {
      setBusy(prev => ({ ...prev, [rel.id]: null }));
    }
  };

  return (
    <div className="space-y-3" data-testid="ai-relance-section">
      {/* Mode toggle */}
      <Card className="border-0 shadow-sm p-4" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <h3 className="text-sm font-bold text-gray-800">Relances IA</h3>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          En mode IA, Gemini rédige une relance personnalisée pour chaque devis (montant, chantier, historique) et la place ici pour votre validation. Rien ne part sans votre accord.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => changeMode('auto')}
            className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${mode === 'auto' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
            data-testid="relance-mode-auto"
          >
            Automatique (modèles)
          </button>
          <button
            onClick={() => changeMode('ai')}
            className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors flex items-center gap-1 ${mode === 'ai' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}
            data-testid="relance-mode-ai"
          >
            <Sparkles className="h-3 w-3" /> IA + validation
          </button>
        </div>
      </Card>

      {/* Pending queue */}
      {queue.length > 0 && (
        <div className="space-y-3" data-testid="ai-relance-queue">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Bot className="h-4 w-4 text-violet-600" />
            À valider ({queue.length})
          </h3>
          {queue.map(rel => (
            <Card key={rel.id} className="border-0 shadow-sm overflow-hidden" data-testid={`ai-relance-card-${rel.id}`}>
              <div className="p-3 flex items-center justify-between bg-violet-50 border-b border-violet-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: DAY_COLORS[rel.day] || '#8b5cf6' }}>
                    J+{rel.days_since ?? rel.day}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 truncate">{rel.client_name}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">{rel.quote_number}</span>
                </div>
                {rel.ai_generated && (
                  <span className="text-[10px] font-bold text-violet-600 flex items-center gap-1 flex-shrink-0"><Sparkles className="h-3 w-3" /> IA</span>
                )}
              </div>
              <div className="p-3 space-y-2 bg-white">
                <Input
                  value={rel.subject}
                  onChange={e => updateField(rel.id, 'subject', e.target.value)}
                  className="text-sm h-9 font-medium"
                  data-testid={`ai-relance-subject-${rel.id}`}
                />
                <textarea
                  value={rel.body}
                  onChange={e => updateField(rel.id, 'body', e.target.value)}
                  rows={6}
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y leading-relaxed"
                  data-testid={`ai-relance-body-${rel.id}`}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm" variant="outline"
                    onClick={() => handleReject(rel)}
                    disabled={!!busy[rel.id]}
                    className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    data-testid={`ai-relance-reject-${rel.id}`}
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Rejeter
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSend(rel)}
                    disabled={!!busy[rel.id] || !rel.client_email}
                    className="h-8 text-xs text-white bg-emerald-600 hover:bg-emerald-700"
                    data-testid={`ai-relance-send-${rel.id}`}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    {busy[rel.id] === 'send' ? 'Envoi...' : 'Valider & envoyer'}
                  </Button>
                </div>
                {!rel.client_email && <p className="text-xs text-red-500 text-right">Ce client n'a pas d'email</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIRelanceQueue;
