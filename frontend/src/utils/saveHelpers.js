// Outils communs pour enregistrer devis et factures sans erreur,
// même avec un champ vide ou une virgule tapée sur le téléphone.

// "12,5" -> 12.5 ; "" ou texte -> 0
export const toNum = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (v === null || v === undefined) return 0;
  const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n) => Math.round(n * 100) / 100;

// Nettoie chaque ligne de prestation avant l'envoi au serveur
export const cleanServices = (services) =>
  (services || []).map((s) => {
    const quantity = toNum(s.quantity);
    const unit_price = toNum(s.unit_price);
    const rawTotal = typeof s.total === 'number' ? s.total : parseFloat(String(s.total ?? '').replace(',', '.'));
    const out = {
      ...s,
      description: s.description || '',
      unit: s.unit || 'unité',
      quantity,
      unit_price,
      total: round2(Number.isFinite(rawTotal) ? rawTotal : quantity * unit_price),
    };
    if ('remise_percent' in s) out.remise_percent = toNum(s.remise_percent);
    if ('remise_montant' in s) out.remise_montant = toNum(s.remise_montant);
    return out;
  });

// Transforme n'importe quelle erreur serveur en phrase lisible
// (avant : le serveur renvoyait une liste et l'appli plantait en page blanche)
export const apiErrorMessage = (err, fallback = 'Erreur de sauvegarde') => {
  if (!err?.response) return 'Pas de réseau';
  const d = err.response.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d.length) {
    const first = d[0];
    const field = Array.isArray(first?.loc) ? first.loc.filter((x) => typeof x === 'string' && x !== 'body').join(' > ') : '';
    return field ? `Champ invalide : ${field}` : fallback;
  }
  return fallback;
};

// Vrai si la requête n'a jamais eu de réponse (pas de réseau, serveur injoignable)
export const isNetworkError = (err) => !err?.response;
