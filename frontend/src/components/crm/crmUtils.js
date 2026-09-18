export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Code couleur global : contact = ambre, devis = bleu, signé = vert, facturé = violet, perdu = rose
export const STAGES = {
  contact: { label: 'Nouveau contact', dot: 'bg-amber-500', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
  quote_draft: { label: 'Devis en cours', dot: 'bg-sky-400', chip: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  quote_sent: { label: 'Devis envoyé', dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  signed: { label: 'Signé', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  invoiced: { label: 'Facturé', dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
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

export const ZONES = [
  { code: 'JU', short: '39', label: 'Jura', chip: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { code: 'HS', short: '74', label: 'Hte-Savoie', chip: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  { code: 'CH', short: 'CH', label: 'Suisse', chip: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
];
export const zoneOf = (code) => ZONES.find((z) => z.code === code) || null;

export const SOURCES = [
  { code: 'RN', label: 'Référencement naturel' },
  { code: 'FB', label: 'Facebook' },
  { code: 'GA', label: 'Google Ads' },
  { code: 'LS', label: 'Local Service' },
  { code: 'TK', label: 'TikTok' },
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
    (c.address || c.city) ? `ADR;TYPE=HOME:;;${esc(c.address || '')};${esc(c.city || '')};;;${c.zone === 'CH' ? 'Suisse' : 'France'}` : null,
    c.chantier ? `NOTE:${esc(c.chantier)}` : null,
    'END:VCARD',
  ].filter(Boolean);
  return downloadOrShare(`${label.replace(/[^\w\- ]/g, '')}.vcf`, 'text/vcard', lines.join('\r\n'));
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
