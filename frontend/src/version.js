// Version affichée sur le tableau de bord.
// APP_VERSION : à augmenter à chaque amélioration (4.0 → 4.1 → 4.2…).
// La date de mise à jour se remplit toute seule à chaque mise en ligne (voir netlify.toml).
export const APP_VERSION = '4.1';

const built = Number(process.env.REACT_APP_BUILD_TIME || 0);

export const BUILD_LABEL = built
  ? new Date(built * 1000).toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(' ', ' à ').replace(':', 'h')
  : '';
