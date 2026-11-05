// File d'attente hors ligne : quand il n'y a pas de réseau, le devis ou la
// facture est gardé dans le téléphone, puis envoyé tout seul au retour du réseau.
import axios from 'axios';

const KEY = 'sr_outbox';
const FAILED_KEY = 'sr_outbox_failed';
export const OUTBOX_EVENT = 'sr-outbox-change';

const read = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};
const write = (key, list) => {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* stockage plein ou bloqué */ }
  window.dispatchEvent(new Event(OUTBOX_EVENT));
};

export const getOutbox = () => read(KEY);
export const getFailed = () => read(FAILED_KEY);

// label : texte affiché ("Facture Dupont"), method : 'post' | 'put'
export const enqueue = ({ method, url, data, label }) => {
  const list = read(KEY);
  list.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, method, url, data, label, createdAt: new Date().toISOString() });
  write(KEY, list);
};

let flushing = false;

// Envoie tout ce qui attend. Renvoie { sent, failed, remaining }.
export const flushOutbox = async () => {
  if (flushing) return { sent: 0, failed: 0, remaining: read(KEY).length };
  flushing = true;
  let sent = 0;
  let failed = 0;
  try {
    // un par un, dans l'ordre, pour garder la bonne numérotation
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const list = read(KEY);
      if (!list.length) break;
      const item = list[0];
      try {
        await axios({ method: item.method, url: item.url, data: item.data, timeout: 20000 });
        sent += 1;
        write(KEY, read(KEY).filter((x) => x.id !== item.id));
      } catch (err) {
        if (!err?.response || err.response.status >= 500) break; // toujours pas de réseau : on réessaiera
        // refusé par le serveur : on le met de côté pour ne rien perdre
        failed += 1;
        write(FAILED_KEY, [...read(FAILED_KEY), { ...item, error: err.response.status }]);
        write(KEY, read(KEY).filter((x) => x.id !== item.id));
      }
    }
  } finally {
    flushing = false;
  }
  return { sent, failed, remaining: read(KEY).length };
};
