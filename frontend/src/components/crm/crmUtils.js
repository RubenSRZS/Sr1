export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const STAGES = {
  contact: { label: 'Nouveau contact', dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  quote_draft: { label: 'Devis en cours', dot: 'bg-amber-400', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  quote_sent: { label: 'Devis envoyé', dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  signed: { label: 'Signé', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  invoiced: { label: 'Facturé', dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  lost: { label: 'Perdu', dot: 'bg-rose-400', chip: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300' },
};

export const FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'contact', label: 'Contacts' },
  { key: 'quote_sent', label: 'Devis envoyés' },
  { key: 'signed', label: 'Signés' },
  { key: 'invoiced', label: 'Facturés' },
  { key: 'lost', label: 'Perdus' },
];

export const normalize = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const fmtDate = (iso, withYear = false) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
};

export const fmtMoney = (n) => `${Math.round(n || 0).toLocaleString('fr-FR')}\u00a0€`;

// Relative label for a callback date: "Aujourd'hui", "Demain", "En retard (3 j)", "mar. 24 sept."
export const callbackLabel = (iso) => {
  if (!iso) return null;
  const diff = Math.round((new Date(iso + 'T00:00:00') - new Date(todayISO() + 'T00:00:00')) / 86400000);
  if (diff === 0) return { text: "Aujourd'hui", tone: 'today' };
  if (diff === 1) return { text: 'Demain', tone: 'soon' };
  if (diff < 0) return { text: `En retard (${-diff} j)`, tone: 'late' };
  return { text: new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }), tone: 'later' };
};

export const relativeActivity = (iso) => {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (isNaN(days)) return '';
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 30) return `il y a ${days} j`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)} an${days >= 730 ? 's' : ''}`;
};

export const waLink = (phone) => {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits.startsWith('0') ? '33' + digits.slice(1) : digits}`;
};
