import React from 'react';
import { Phone, MapPin, Hammer, Bell } from 'lucide-react';
import { STAGES, callbackLabel, relativeActivity, fmtMoney } from './crmUtils';

const TONE = {
  today: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30',
  soon: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  late: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30',
  later: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
};

export const ClientCard = ({ client, onOpen }) => {
  const stage = STAGES[client.stage] || STAGES.contact;
  const cb = callbackLabel(client.callback_at);
  const firstNote = (client.notes || '').split('\n').map((l) => l.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean)[0];
  const amount = client.total_invoiced || client.total_signed || client.pending_amount;

  return (
    <button
      type="button"
      data-testid={`client-card-${client.id}`}
      onClick={() => onOpen(client)}
      className="group text-left w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">{client.civility ? `${client.civility} ` : ''}{client.name}</h3>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 truncate">
            <span className="shrink-0">{client.country === 'CH' ? '🇨🇭' : '🇫🇷'}</span>
            {(client.city || client.address) && <><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{client.city || client.address}</span></>}
            {client.source && <span data-testid="card-source" className="shrink-0 ml-1 px-1.5 py-px rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">{client.source}</span>}
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full ${stage.chip}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />{stage.label}
        </span>
      </div>

      {(client.chantier || firstNote) && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 flex gap-1.5">
          {client.chantier ? <Hammer className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" /> : null}
          <span>{client.chantier || firstNote}</span>
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-slate-500 min-w-0">
          {client.phone ? <><Phone className="w-3 h-3 shrink-0" /><span className="truncate">{client.phone}</span></> : <span className="text-slate-300">Pas de téléphone</span>}
        </span>
        {cb ? (
          <span data-testid="card-callback" className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${TONE[cb.tone]}`}><Bell className="w-3 h-3" />{cb.text}{client.callback_time ? ` ${client.callback_time}` : ''}</span>
        ) : (
          <span className="text-slate-400">{amount ? fmtMoney(amount) : relativeActivity(client.last_activity)}</span>
        )}
      </div>
    </button>
  );
};
