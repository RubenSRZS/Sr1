import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { WifiOff, CloudUpload } from 'lucide-react';
import { getOutbox, flushOutbox, OUTBOX_EVENT } from '@/utils/offlineQueue';
import { useDataCache } from '@/context/DataCacheContext';

// Petit bandeau : "Hors ligne" et nombre de documents en attente d'envoi.
// Envoie automatiquement dès que le réseau revient.
const OfflineSync = () => {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pending, setPending] = useState(() => getOutbox().length);
  const { invalidate } = useDataCache();

  const flush = useCallback(async () => {
    if (!getOutbox().length) return;
    const { sent, failed } = await flushOutbox();
    if (sent > 0) {
      toast.success(sent === 1 ? 'Document en attente envoyé' : `${sent} documents en attente envoyés`);
      invalidate('quotes');
      invalidate('invoices');
      invalidate('clients');
      invalidate('stats');
    }
    if (failed > 0) toast.error('Un document a été refusé par le serveur. Il est gardé de côté, rien n’est perdu.');
  }, [invalidate]);

  useEffect(() => {
    const goOnline = () => { setOnline(true); flush(); };
    const goOffline = () => setOnline(false);
    const refresh = () => setPending(getOutbox().length);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener(OUTBOX_EVENT, refresh);
    window.addEventListener('storage', refresh);
    flush();
    const timer = setInterval(() => { if (navigator.onLine) flush(); }, 30000);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener(OUTBOX_EVENT, refresh);
      window.removeEventListener('storage', refresh);
      clearInterval(timer);
    };
  }, [flush]);

  if (online && pending === 0) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg text-white"
      style={{ top: 'calc(8px + env(safe-area-inset-top))', background: online ? '#2563eb' : '#334155' }}
      data-testid="offline-banner"
    >
      {online ? <CloudUpload className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {!online && 'Hors ligne'}
      {!online && pending > 0 && ' · '}
      {pending > 0 && `${pending} en attente d'envoi`}
    </div>
  );
};

export default OfflineSync;
