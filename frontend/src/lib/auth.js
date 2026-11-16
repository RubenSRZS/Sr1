// Sécurité : après le bon code, le serveur donne un jeton de session.
// Ce fichier l'ajoute automatiquement à toutes les demandes vers /api/
// (axios et fetch), et renvoie vers l'écran du code si le serveur refuse.
import axios from 'axios';

const TOKEN_KEY = 'sr_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
};

export const saveSession = (token) => {
  try {
    localStorage.setItem('sr_auth', 'true');
    if (token) localStorage.setItem(TOKEN_KEY, token);
  } catch { /* stockage bloqué */ }
};

export const clearSession = () => {
  try {
    localStorage.removeItem('sr_auth');
    localStorage.removeItem(TOKEN_KEY);
  } catch { /* stockage bloqué */ }
};

const urlOf = (input) => {
  if (typeof input === 'string') return input;
  if (input && typeof input.url === 'string') return input.url;
  return String(input || '');
};

const isApi = (url) => url.includes('/api/');
const isOpen = (url) => /\/api\/(auth\/|public\/)/.test(url);

let redirecting = false;
const onUnauthorized = (url) => {
  if (redirecting || isOpen(url)) return;
  redirecting = true;
  clearSession();
  window.location.reload();
};

let installed = false;
export function installAuth() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // axios
  axios.interceptors.request.use((config) => {
    const token = getToken();
    if (token && isApi(config.url || '')) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      const url = err?.config?.url || '';
      if (err?.response?.status === 401 && isApi(url)) onUnauthorized(url);
      return Promise.reject(err);
    },
  );

  // fetch
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = urlOf(input);
    const token = getToken();
    if (token && isApi(url)) {
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      init = { ...init, headers };
    }
    const res = await nativeFetch(input, init);
    if (res.status === 401 && isApi(url)) onUnauthorized(url);
    return res;
  };
}
