import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, Flame, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useDataCache } from '@/context/DataCacheContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const FollowUpWidget = ({ dark }) => {
  const { cache } = useDataCache();
  const [busy, setBusy] = useState({});
  const [done, setDone] = useState({});

  const toFollow = useMemo(() => (cache.quotes || [])
    .filter(q => q.status === 'sent' && q.sent_at)
    .map(q => ({ ...q, days: Math.floor((Date.now() - new Date(q.sent_at).getTime()) / 86400000) }))
    .filter(q => q.days >= 5)
    .sort((a, b) => b.days - a.days)
    .slice(0, 5), [cache.quotes]);

  if (toFollow.length === 0) return null;

  const generate = async (q) => {
    setBusy(prev => ({ ...prev, [q.id]: true }));
    try {
      const r = await axios.post(`${API}/ai-relances/generate/${q.id}`);
      setDone(prev => ({ ...prev, [q.id]: true }));
      if (r.data.status === 'exists') {
        toast.info('Une relance est déjà en attente de validation pour ce devis');
      } else {
        toast.success(`Brouillon IA créé pour ${q.client_name} — à valider dans Relances`);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erreur génération IA');
    } finally {
      setBusy(prev => ({ ...prev, [q.id]: false }));
    }
  };

  return (
    <Card className={`border-0 shadow-sm overflow-hidden ${dark ? 'bg-slate-800' : 'bg-white'}`} data-testid="follow-up-widget">
      <div className={`px-4 py-3 border-b flex items-center justify-between ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className={`font-semibold text-sm ${dark ? 'text-white' : 'text-gray-800'}`}>Devis à relancer</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold">{toFollow.length}</span>
        </div>
        <Link to="/relances" className={`text-xs flex items-center gap-1 font-medium ${dark ? 'text-violet-300' : 'text-violet-600'} hover:underline`} data-testid="follow-up-goto-relances">
          File de validation <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className={`divide-y ${dark ? 'divide-slate-700' : 'divide-gray-50'}`}>
        {toFollow.map(q => (
          <div key={q.id} className="flex items-center justify-between px-4 py-2.5 gap-2" data-testid={`follow-up-row-${q.id}`}>
            <Link to={`/quotes/edit/${q.id}`} className="min-w-0 flex-1">
              <span className={`font-medium text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{q.quote_number}</span>
              <span className={`text-xs ml-2 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{q.client_name}</span>
            </Link>
            <span className={`text-xs font-semibold flex-shrink-0 ${q.days >= 14 ? 'text-red-500' : 'text-orange-500'}`}>J+{q.days}</span>
            <span className={`font-semibold text-sm flex-shrink-0 ${dark ? 'text-white' : ''}`}>{(q.total_net || 0).toFixed(0)}€</span>
            <button
              onClick={() => generate(q)}
              disabled={busy[q.id] || done[q.id]}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0 transition-colors ${done[q.id]
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60'}`}
              data-testid={`follow-up-generate-${q.id}`}
            >
              <Sparkles className="h-3 w-3" />
              {busy[q.id] ? '...' : done[q.id] ? 'Créée' : 'Relance IA'}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default FollowUpWidget;
