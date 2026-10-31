// Personnalisation des mails selon le client (civilité + région du CRM)

export const lastNameOf = (clientName) => (clientName ? clientName.trim().split(' ').slice(-1)[0] : '');

export const salutation = (clientName, ctx) =>
  `${ctx?.civility === 'Mme' ? 'Madame' : 'Monsieur'} ${lastNameOf(clientName)}`.trim();

export const signature = (ctx) =>
  ctx?.tagline ? `Ruben — SR Rénovation\n${ctx.tagline}` : 'Ruben — SR Rénovation';

// Demande au serveur la région et la civilité du client. En cas d'erreur : null (texte standard).
export const fetchEmailContext = async (api, params) => {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${api}/email-context?${qs}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};
