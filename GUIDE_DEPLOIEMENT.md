# Guide de Déploiement — SR Rénovation App

Ce guide vous explique comment déployer l'application (Backend FastAPI + Frontend React + MongoDB) sur deux plateformes : **Render** (simple) et **Oracle Cloud** (gratuit à vie).

---

## Option A : Render.com (Simple et rapide)

### Coût estimé
- **Backend :** Gratuit (plan Free) — Attention : le serveur s'éteint après 15 min d'inactivité.
- **Base de données :** Utilisez **MongoDB Atlas** gratuit (voir section MongoDB).
- **Frontend :** Gratuit via les "Static Sites" de Render.

### Étape 1 : Créer un compte MongoDB Atlas (gratuit)

1. Allez sur [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Créez un compte gratuit
3. Créez un cluster (choisissez le plan **M0 Free**)
4. Allez dans **Database Access** → Créez un utilisateur avec un mot de passe
5. Allez dans **Network Access** → Ajoutez `0.0.0.0/0` (accès depuis partout)
6. Cliquez sur **Connect** → **Drivers** → Copiez l'URI de connexion :
   ```
   mongodb+srv://VOTRE_USER:VOTRE_MDP@cluster0.xxxxx.mongodb.net/sr_renovation?retryWrites=true&w=majority
   ```

### Étape 2 : Préparer le code

Le code est déjà dans votre dépôt. Vérifiez que ces fichiers existent :

**`/backend/requirements.txt`** — Contient toutes les dépendances Python.

Créez un fichier **`/backend/Procfile`** (sans extension) :
```
web: uvicorn server:app --host 0.0.0.0 --port $PORT
```

### Étape 3 : Déployer le Backend sur Render

1. Allez sur [https://render.com](https://render.com) → Créez un compte
2. Cliquez sur **New** → **Web Service**
3. Connectez votre dépôt GitHub
4. Configuration :
   - **Name:** `sr-renovation-api`
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Dans **Environment Variables**, ajoutez :
   ```
   MONGO_URL = mongodb+srv://VOTRE_USER:VOTRE_MDP@cluster0.xxxxx.mongodb.net/sr_renovation?retryWrites=true&w=majority
   DB_NAME = sr_renovation
   CORS_ORIGINS = *
   RESEND_API_KEY = re_VOTRE_CLE_RESEND
   SENDER_EMAIL = onboarding@resend.dev
   ADMIN_EMAIL = Srrenovation03@gmail.com
   DEFAULT_PIN = 0330
   PUBLIC_APP_URL = https://sr-renovation.onrender.com
   ```
   > **Note :** Remplacez `PUBLIC_APP_URL` par l'URL de votre frontend une fois déployé.
6. Cliquez sur **Create Web Service**

Votre API sera accessible à : `https://sr-renovation-api.onrender.com`

### Étape 4 : Déployer le Frontend sur Render

1. Dans Render → **New** → **Static Site**
2. Connectez le même dépôt GitHub
3. Configuration :
   - **Name:** `sr-renovation`
   - **Root Directory:** `frontend`
   - **Build Command:** `yarn install && yarn build`
   - **Publish Directory:** `build`
4. Dans **Environment Variables**, ajoutez :
   ```
   REACT_APP_BACKEND_URL = https://sr-renovation-api.onrender.com
   ```
5. Cliquez sur **Create Static Site**

Votre application sera accessible à : `https://sr-renovation.onrender.com`

### Étape 5 : Mettre à jour PUBLIC_APP_URL

Retournez dans les paramètres du Backend sur Render et mettez à jour :
```
PUBLIC_APP_URL = https://sr-renovation.onrender.com
```

### Étape 6 : Configurer les Redirections (SPA)

Créez un fichier **`/frontend/public/_redirects`** :
```
/*    /index.html   200
```
Cela permet aux URLs comme `/devis/public/xxx` de fonctionner correctement.

---

## Option B : Oracle Cloud Free Tier (Gratuit à vie)

### Coût estimé
- **Tout est gratuit à vie** avec le plan "Always Free" d'Oracle Cloud.
- VM avec 1 Go de RAM, 1 OCPU, 50 Go de stockage.

### Étape 1 : Créer un compte Oracle Cloud

1. Allez sur [https://cloud.oracle.com/](https://cloud.oracle.com/)
2. Cliquez sur **Créer un compte gratuit**
3. Remplissez le formulaire. Une carte bancaire est demandée pour vérification mais **aucun frais ne sera prélevé** tant que vous restez sur le plan Free.
4. Attendez l'activation du compte (peut prendre quelques heures).

### Étape 2 : Créer une VM (Machine Virtuelle)

1. Dans la console Oracle Cloud → **Compute** → **Instances** → **Create Instance**
2. Configuration :
   - **Name:** `sr-renovation`
   - **Image:** Ubuntu 22.04 (ou plus récent)
   - **Shape:** VM.Standard.E2.1.Micro (Always Free)
   - **Add SSH Keys:** Générez ou téléchargez votre clé SSH publique
3. Cliquez sur **Create**
4. Notez l'**IP publique** de la VM.

### Étape 3 : Ouvrir les ports

1. Dans la console Oracle → **Networking** → **Virtual Cloud Networks**
2. Cliquez sur votre VCN → **Security Lists** → **Default Security List**
3. Ajoutez des **Ingress Rules** :
   - Port 80 (HTTP) : Source `0.0.0.0/0`, Port `80`
   - Port 443 (HTTPS) : Source `0.0.0.0/0`, Port `443`
4. Sur la VM elle-même, ouvrez les ports dans le firewall :
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```

### Étape 4 : Installer les dépendances sur la VM

Connectez-vous en SSH :
```bash
ssh -i votre_cle_ssh ubuntu@VOTRE_IP_PUBLIQUE
```

Installez tout ce qu'il faut :
```bash
# Mise à jour
sudo apt update && sudo apt upgrade -y

# Python 3.11+
sudo apt install -y python3 python3-pip python3-venv

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn

# MongoDB
# Suivez les instructions pour Ubuntu sur : https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/
sudo apt install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Nginx (serveur web / reverse proxy)
sudo apt install -y nginx

# Certbot (pour HTTPS gratuit)
sudo apt install -y certbot python3-certbot-nginx
```

### Étape 5 : Déployer le code

```bash
# Cloner le dépôt
cd /home/ubuntu
git clone https://github.com/VOTRE_USER/VOTRE_REPO.git sr-renovation
cd sr-renovation

# --- Backend ---
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Créer le fichier .env
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=sr_renovation
CORS_ORIGINS=*
RESEND_API_KEY=re_VOTRE_CLE_RESEND
SENDER_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=Srrenovation03@gmail.com
DEFAULT_PIN=0330
PUBLIC_APP_URL=https://VOTRE_DOMAINE.com
EOF

# --- Frontend ---
cd ../frontend

# Créer le fichier .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://VOTRE_DOMAINE.com
EOF

yarn install
yarn build
```

### Étape 6 : Configurer Nginx

```bash
sudo nano /etc/nginx/sites-available/sr-renovation
```

Collez cette configuration :
```nginx
server {
    listen 80;
    server_name VOTRE_DOMAINE.com;  # ou votre IP publique

    # Frontend (fichiers statiques)
    location / {
        root /home/ubuntu/sr-renovation/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API (proxy vers FastAPI)
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activez le site :
```bash
sudo ln -s /etc/nginx/sites-available/sr-renovation /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Étape 7 : Lancer le Backend en service

Créez un service systemd :
```bash
sudo nano /etc/systemd/system/sr-renovation.service
```

```ini
[Unit]
Description=SR Renovation Backend
After=network.target mongod.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/sr-renovation/backend
EnvironmentFile=/home/ubuntu/sr-renovation/backend/.env
ExecStart=/home/ubuntu/sr-renovation/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start sr-renovation
sudo systemctl enable sr-renovation
```

### Étape 8 : HTTPS avec un nom de domaine (optionnel mais recommandé)

Si vous avez un nom de domaine :
1. Pointez votre domaine (A record) vers l'IP publique de la VM Oracle.
2. Lancez Certbot :
   ```bash
   sudo certbot --nginx -d VOTRE_DOMAINE.com
   ```
3. Le certificat SSL sera renouvelé automatiquement.

Si vous n'avez pas de domaine, l'application fonctionnera sur `http://VOTRE_IP_PUBLIQUE`.

### Étape 9 : Vérification

```bash
# Vérifier que tout tourne
sudo systemctl status sr-renovation   # Backend
sudo systemctl status mongod          # MongoDB
sudo systemctl status nginx            # Nginx

# Tester l'API
curl http://localhost:8001/api/health
```

Ouvrez votre navigateur : `http://VOTRE_IP_PUBLIQUE` (ou `https://VOTRE_DOMAINE.com`)

---

## Mises à jour futures

Pour mettre à jour l'application après des modifications :

```bash
cd /home/ubuntu/sr-renovation
git pull origin main

# Rebuild frontend
cd frontend && yarn install && yarn build

# Restart backend
sudo systemctl restart sr-renovation
```

---

## Récapitulatif

| | **Render** | **Oracle Cloud** |
|---|---|---|
| **Difficulté** | Facile | Intermédiaire |
| **Coût** | Gratuit (avec limitations) | Gratuit à vie |
| **Performance** | Le serveur s'éteint après 15min | Toujours actif |
| **Base de données** | MongoDB Atlas (externe) | MongoDB local |
| **HTTPS** | Automatique | Via Certbot |
| **Contrôle** | Limité | Total |

**Recommandation :** Pour un usage professionnel, Oracle Cloud Free Tier est le meilleur choix car le serveur est toujours actif et vous avez un contrôle total.
