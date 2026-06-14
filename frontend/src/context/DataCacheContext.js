import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DataCacheContext = createContext();

export const useDataCache = () => {
  const ctx = useContext(DataCacheContext);
  if (!ctx) throw new Error('useDataCache must be used within DataCacheProvider');
  return ctx;
};

const TTL_MS = 60 * 1000; // 1 minute fresh window

export const DataCacheProvider = ({ children }) => {
  const [cache, setCache] = useState({
    quotes: null,
    invoices: null,
    clients: null,
    profiles: null,
    catalog: null,
    stats: null,
  });
  const fetchedAt = useRef({});
  const inflight = useRef({});

  const isFresh = (key) => {
    const t = fetchedAt.current[key];
    return t && Date.now() - t < TTL_MS;
  };

  const getOrFetch = useCallback(async (key, url, { force = false } = {}) => {
    if (!force && isFresh(key) && cache[key] !== null) return cache[key];
    if (inflight.current[key]) return inflight.current[key];
    const p = axios.get(url).then((res) => {
      setCache((prev) => ({ ...prev, [key]: res.data }));
      fetchedAt.current[key] = Date.now();
      inflight.current[key] = null;
      return res.data;
    }).catch((err) => {
      inflight.current[key] = null;
      throw err;
    });
    inflight.current[key] = p;
    return p;
  }, [cache]);

  const invalidate = useCallback((key) => {
    fetchedAt.current[key] = 0;
    setCache((prev) => ({ ...prev, [key]: null }));
  }, []);

  // Update a single item in a cached list locally, without nulling/refetching the whole list.
  const patchCacheItem = useCallback((key, id, partial) => {
    setCache((prev) => {
      const list = prev[key];
      if (!Array.isArray(list)) return prev;
      return { ...prev, [key]: list.map((it) => (it.id === id ? { ...it, ...partial } : it)) };
    });
  }, []);

  const removeCacheItem = useCallback((key, id) => {
    setCache((prev) => {
      const list = prev[key];
      if (!Array.isArray(list)) return prev;
      return { ...prev, [key]: list.filter((it) => it.id !== id) };
    });
  }, []);

  const invalidateAll = useCallback(() => {
    fetchedAt.current = {};
    setCache({ quotes: null, invoices: null, clients: null, profiles: null, catalog: null, stats: null });
  }, []);

  const fetchQuotes = useCallback((opts) => getOrFetch('quotes', `${API}/quotes`, opts), [getOrFetch]);
  const fetchInvoices = useCallback((opts) => getOrFetch('invoices', `${API}/invoices`, opts), [getOrFetch]);
  const fetchClients = useCallback((opts) => getOrFetch('clients', `${API}/clients`, opts), [getOrFetch]);
  const fetchProfiles = useCallback((opts) => getOrFetch('profiles', `${API}/profiles`, opts), [getOrFetch]);
  const fetchCatalog = useCallback((opts) => getOrFetch('catalog', `${API}/services`, opts), [getOrFetch]);
  const fetchStats = useCallback((opts) => getOrFetch('stats', `${API}/stats`, opts), [getOrFetch]);

  // Background prefetch — start loading the heavy lists right after first paint
  const prefetchEssentials = useCallback(() => {
    Promise.allSettled([
      fetchStats(),
      fetchQuotes(),
      fetchInvoices(),
      fetchClients(),
      fetchProfiles(),
    ]);
  }, [fetchStats, fetchQuotes, fetchInvoices, fetchClients, fetchProfiles]);

  return (
    <DataCacheContext.Provider value={{
      cache,
      fetchQuotes,
      fetchInvoices,
      fetchClients,
      fetchProfiles,
      fetchCatalog,
      fetchStats,
      invalidate,
      invalidateAll,
      patchCacheItem,
      removeCacheItem,
      prefetchEssentials,
    }}>
      {children}
    </DataCacheContext.Provider>
  );
};
