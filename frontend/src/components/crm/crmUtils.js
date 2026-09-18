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
  { key: 'reminders', label: 'À rappeler' },
  { key: 'quote_sent', label: 'Devis envoyés' },
  { key: 'signed', label: 'Signés' },
  { key: 'invoiced', label: 'Facturés' },
  { key: 'lost', label: 'Perdus' },
];

export const COUNTRIES = [
  { code: 'FR', flag: '🇫🇷', label: 'France' },
  { code: 'CH', flag: '🇨🇭', label: 'Suisse' },
];

export const SOURCES = [
  { code: 'RN', label: 'Référencement naturel' },
  { code: 'FB', label: 'Facebook' },
  { code: 'GA', label: 'Google Ads' },
  { code: 'LS', label: 'Local Service' },
  { code: 'TK', label: 'TikTok' },
  { code: 'BO', label: 'Bouche à oreille' },
];

export const CIVILITIES = ['Mr', 'Mme'];

// "Mr Dupont Belfort FB" — the exact naming the user uses in his phone contacts
export const contactLabel = (c) => [c.civility, c.name, c.city, c.source].map((s) => (s || '').trim()).filter(Boolean).join(' ');

const downloadOrShare = async (filename, mime, content) => {
  const file = new File([content], filename, { type: mime });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancel'; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
};

const esc = (s) => (s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

export const exportVCard = (c) => {
  const label = contactLabel(c) || c.name;
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `N:${esc(label)};;;;`, `FN:${esc(label)}`,
    c.phone ? `TEL;TYPE=CELL:${c.phone.replace(/[^\d+]/g, '')}` : null,
    c.email ? `EMAIL:${c.email}` : null,
    (c.address || c.city) ? `ADR;TYPE=HOME:;;${esc(c.address || '')};${esc(c.city || '')};;;${c.country === 'CH' ? 'Suisse' : 'France'}` : null,
    c.chantier ? `NOTE:${esc(c.chantier)}` : null,
    'END:VCARD',
  ].filter(Boolean);
  return downloadOrShare(`${label.replace(/[^\w\- ]/g, '')}.vcf`, 'text/vcard', lines.join('\r\n'));
};

const pad = (n) => String(n).padStart(2, '0');
const icsLocal = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

export const exportReminder = (c) => {
  if (!c.callback_at) return Promise.resolve('none');
  const [h, m] = (c.callback_time || '09:00').split(':').map(Number);
  const start = new Date(`${c.callback_at}T00:00:00`); start.setHours(h || 9, m || 0, 0, 0);
  const end = new Date(start.getTime() + 15 * 60000);
  const label = contactLabel(c) || c.name;
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SR Renovation//CRM//FR',
    'BEGIN:VEVENT', `UID:${c.id}-${c.callback_at}@sr-renovation`, `DTSTAMP:${icsLocal(new Date())}Z`,
    `DTSTART:${icsLocal(start)}`, `DTEND:${icsLocal(end)}`,
    `SUMMARY:${esc(`Rappeler ${label}`)}`,
    `DESCRIPTION:${esc([c.phone, c.chantier, c.notes].filter(Boolean).join('\n'))}`,
    'BEGIN:VALARM', 'TRIGGER:-PT0M', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`Rappeler ${label}`)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return downloadOrShare(`rappel-${(c.name || 'client').replace(/[^\w\-]/g, '')}.ics`, 'text/calendar', lines.join('\r\n'));
};

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
