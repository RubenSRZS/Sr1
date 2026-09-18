# Héberger l'interface sur Netlify (gratuit) — ouverture instantanée

Principe : l'interface (React) est servie par le CDN Netlify, ton VPS Google ne garde que l'API + MongoDB.
Le PIN reste actif (il est vérifié par l'API sur le VPS). Plan gratuit Netlify : 100 Go/mois, largement suffisant.

## 1. Sur Netlify (5 min)
1. https://app.netlify.com → **Add new site → Import an existing project → GitHub** → repo `RubenSRZS/Sr1`
2. Paramètres de build :
   - **Base directory** : `frontend`
   - **Build command** : `yarn build` (pré-rempli par `frontend/netlify.toml`)
   - **Publish directory** : `frontend/build`
3. **Environment variables** → ajouter :
   - `REACT_APP_BACKEND_URL` = `https://devis.sr-renovation.fr`  (ton API actuelle, sans / à la fin)
4. **Deploy site**. Netlify te donne une URL du type `https://sr-renovation.netlify.app`.
5. (Optionnel) **Domain settings → Add custom domain** : par ex. `app.sr-renovation.fr`
   → chez ton registrar, ajouter un CNAME `app` → `<ton-site>.netlify.app`. HTTPS automatique.

À chaque "Save to GitHub" depuis Emergent, Netlify rebuild et déploie tout seul (~2 min). Plus de `yarn build` sur le VPS.

## 2. Sur le VPS (1 fois) — autoriser le nouveau domaine
Dans `/app/backend/.env` (ou le .env de ton VPS) :
```
CORS_ORIGINS=https://devis.sr-renovation.fr,https://sr-renovation.netlify.app,https://app.sr-renovation.fr
```
puis `pm2 restart backend` (ou le nom de ton process).
Si `CORS_ORIGINS` n'est pas défini, tout est autorisé (`*`) : ça marche aussi, c'est juste moins strict.

Optionnel : `PUBLIC_APP_URL=https://app.sr-renovation.fr` pour que les liens des emails de devis pointent vers Netlify.

## 3. Nginx sur le VPS
Rien à changer : `/api/*` continue d'être servi par FastAPI. L'ancien site `devis.sr-renovation.fr` reste accessible tant que tu veux.

## Résultat
- Première ouverture : ~0,5 s au lieu de plusieurs secondes (CDN + cache immutable des assets)
- Le VPS 1 Go ne fait plus que répondre aux appels API → moins de RAM, plus de crash au build
