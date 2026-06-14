import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp, Clock, Trophy, BarChart3 } from 'lucide-react';
import { useDataCache } from '@/context/DataCacheContext';

const euro = (n) => `${(n || 0).toLocaleString('fr-FR')} €`;

const KpiTile = ({ label, value, sub, icon: Icon, color, dark, testid }) => (
  <Card className={`p-4 border-0 shadow-sm ${dark ? 'bg-slate-800' : 'bg-white'}`} data-testid={testid}>
    <div className="flex items-center gap-2 mb-1.5">
      <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}1a` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <span className={`text-[11px] uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
    </div>
    <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    {sub && <div className={`text-[11px] mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</div>}
  </Card>
);

const AnalyticsSection = ({ dark }) => {
  const { cache, fetchAnalytics } = useDataCache();
  const [loading, setLoading] = useState(cache.analytics === null);

  useEffect(() => {
    let active = true;
    fetchAnalytics().catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchAnalytics]);

  const a = cache.analytics;
  if (loading && !a) {
    return (
      <Card className={`p-5 ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} data-testid="analytics-loading">
        <div className="h-6 w-40 rounded bg-slate-200/60 animate-pulse mb-4" />
        <div className="h-24 rounded bg-slate-200/40 animate-pulse" />
      </Card>
    );
  }
  if (!a) return null;

  const maxTop = Math.max(1, ...(a.top_clients || []).map((c) => c.total));
  const hasRevenue = (a.revenue_by_month || []).some((m) => m.value > 0);
  const barColors = ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#f97316'];

  return (
    <div data-testid="analytics-section">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className={`w-5 h-5 ${dark ? 'text-blue-400' : 'text-blue-600'}`} />
        <h3 className={`font-bold text-base ${dark ? 'text-white' : 'text-slate-800'}`}>Performance</h3>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <KpiTile
          label="Conversion" color="#10b981" dark={dark} icon={TrendingUp} testid="kpi-conversion"
          value={`${a.conversion_rate}%`}
          sub={`${a.accepted_count}/${a.sent_count} devis signés`}
        />
        <KpiTile
          label="Délai signature" color="#3b82f6" dark={dark} icon={Clock} testid="kpi-delay"
          value={a.avg_days_to_sign !== null ? `${a.avg_days_to_sign} j` : '—'}
          sub="entre envoi et signature"
        />
        <KpiTile
          label="Total signé" color="#f97316" dark={dark} icon={Trophy} testid="kpi-signed"
          value={euro(a.total_signed)}
          sub="devis acceptés"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Revenue chart */}
        <Card className={`p-4 border-0 shadow-sm ${dark ? 'bg-slate-800' : 'bg-white'}`} data-testid="revenue-chart-card">
          <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Chiffre d'affaires — 6 derniers mois
          </div>
          {hasRevenue ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={a.revenue_by_month} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: dark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: dark ? '#33415533' : '#f1f5f9' }}
                  formatter={(v) => [euro(v), 'CA']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {a.revenue_by_month.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-[150px] flex items-center justify-center text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              Pas encore de factures sur la période
            </div>
          )}
        </Card>

        {/* Top clients */}
        <Card className={`p-4 border-0 shadow-sm ${dark ? 'bg-slate-800' : 'bg-white'}`} data-testid="top-clients-card">
          <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Top clients (facturé)
          </div>
          {(a.top_clients || []).length === 0 ? (
            <div className={`h-[150px] flex items-center justify-center text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              Aucune facture pour le moment
            </div>
          ) : (
            <ul className="space-y-2.5">
              {a.top_clients.map((c, i) => (
                <li key={i} data-testid={`top-client-${i}`}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`font-medium truncate ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{i + 1}. {c.name}</span>
                    <span className={`font-bold shrink-0 ml-2 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>{euro(c.total)}</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(6, (c.total / maxTop) * 100)}%`, background: 'linear-gradient(90deg, #3b82f6, #f97316)' }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsSection;
