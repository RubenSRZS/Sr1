# 📋 Document de Passation pour Claude Opus

## 🎯 Contexte Général

Tu reprends le développement de l'application **Sr-Renovation.fr** - une application web de gestion de devis et factures pour un artisan en rénovation (nettoyage de toitures, façades, terrasses).

**Propriétaire :** Ruben (SR Rénovation)  
**Région :** Jura (39), France  
**Contact :** 06 80 33 45 46 | SrRenovation03@gmail.com  
**Site web :** https://sr-renovation.fr  
**Lien Google My Business :** https://g.page/r/CeQWOZZ9f7xAEBM/review

---

## 🔐 Accès et Authentification

### Code PIN de l'application
**PIN :** `0330`

Ce code est nécessaire pour accéder à l'application en mode admin.

---

## 🎨 Identité Visuelle

### Thème Couleurs OFFICIEL
**IMPORTANT :** Le thème de l'application est **BLEU DÉGRADÉ ORANGE** :
- Bleu primaire : `#3b82f6` (blue-500)
- Bleu foncé : `#1e40af` (blue-800)
- Orange accent : `#f97316` (orange-500)
- Jaune bouton CTA : `#F9A825`

### ❌ CE QU'IL NE FAUT PAS FAIRE
- **NE JAMAIS** utiliser du vert (emerald/green) dans les emails ou pages publiques
- Le thème vert a été testé mais **REFUSÉ** par le client
- Exception : dans les menus internes admin, les icônes peuvent varier

### ✅ Où appliquer le thème bleu/orange
1. **Emails de devis** : Header avec `linear-gradient(135deg,#1e40af 0%,#3b82f6 40%,#f97316 100%)`
2. **Emails de factures** : Même gradient que les devis
3. **Pages publiques** (signature de devis)
4. **Boutons CTA** : Jaune `#F9A825` (ex: "Consulter mon devis")
5. **Liens dans emails** : Bleu `#3b82f6`

---

## 🚨 Points Critiques à Connaître

### 1. Build Frontend FRAGILE ⚠️
Le build frontend est **extrêmement instable** :
- Après un `git pull`, le build peut planter avec une erreur Babel
- **Erreur typique :** `TypeError: Cannot read properties of null (reading 'traverse')`
- **Solution immédiate :** `sudo supervisorctl restart frontend`
- ❌ **NE PAS** perdre de temps à réinstaller les dépendances (yarn install, etc.)
- Le hot reload fonctionne pour les modifications normales, mais en cas d'erreur, redémarre le service

### 2. Git et Déploiement 🔄
- ❌ **NE JAMAIS faire de `git pull`** sans l'accord explicite de Ruben
- Le dernier `git pull` a cassé l'environnement (fichier `SendQuoteModal.jsx` incompatible)
- Ruben a une version live sur son serveur Google Cloud
- Il pousse/tire les changements manuellement via GitHub : `https://github.com/RubenSRZS/Sr1`
- **Tâche bloquée :** Pousser les changements actuels vers GitHub (problème d'authentification)

### 3. Fonctionnalité WhatsApp (À RÉIMPLÉMENTER)
**CONTEXTE IMPORTANT :**

Ruben avait une fonctionnalité pour **envoyer les devis via WhatsApp** dans le fichier `SendQuoteModal.jsx`. Cette fonctionnalité a été **supprimée** lors d'un conflit de merge pour stabiliser l'environnement.

**Ce qu'il faut savoir :**
- Le modal d'envoi de devis avait 2 boutons : "Email" et "WhatsApp"
- L'envoi WhatsApp ouvrait l'application avec un message pré-rempli et un lien vers le devis public
- **Ruben va vouloir récupérer cette fonctionnalité**
- Il faudra la réimplémenter proprement sans casser le build

**Code de base WhatsApp :**
```javascript
const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
  `Bonjour,\n\nVotre devis SR Rénovation est prêt !\n\nConsultez-le ici : ${publicLink}`
)}`;
window.open(whatsappLink, '_blank');
```

**Champs nécessaires :**
- Téléphone client (avec indicatif, ex: 33680334546 pour la France)
- Lien public du devis (avec token)

---

## 📧 Système d'Emails

### Configuration Resend
Les emails sont envoyés via **Resend** (voir `.env` backend).

**Variables d'environnement :**
```
RESEND_API_KEY=...
SENDER_EMAIL=...
ADMIN_EMAIL=...
REPLY_TO_EMAIL=...
```

### Templates d'Email

#### 1. Email de Devis
- **Endpoint :** `POST /api/quotes/{quote_id}/send-email`
- **Template :** Header bleu/orange, bouton jaune "Consulter mon devis"
- **Fonctionnalités :**
  - Lien public sécurisé vers la page de signature
  - PDF joint en pièce jointe
  - Message personnalisable

#### 2. Email de Facture (NOUVEAU)
- **Endpoint :** `POST /api/invoices/{invoice_id}/send-email`
- **2 Types d'email :**
  1. **"Avec avis"** : Message + bouton "⭐ Laisser un avis Google" (lien GMB)
  2. **"Simple"** : Message de remerciement uniquement
- **Thème :** BLEU/ORANGE (comme les devis)
- **Fichiers :**
  - Backend : `/app/backend/server.py` (classe `SendInvoiceEmail`)
  - Frontend : `/app/frontend/src/components/SendInvoiceModal.jsx`

### ⚠️ Problème Connu : Emails @icloud.com
Les emails vers les adresses `@icloud.com` ne sont **pas délivrés** avec Resend.
- Problème non résolu
- Peut-être lié à Apple Mail Privacy Protection
- À investiguer : DMARC, DKIM, SPF

---

## 🤖 Fonctionnalité AI Assistant

### Description
Page `/assistant-ia` qui permet de **créer des devis automatiquement** via commande vocale ou texte.

**Comment ça marche :**
1. L'utilisateur dicte ou tape une demande (ex: "Devis pour Jean Dupont, nettoyage de toiture 100m², 1500€")
2. L'AI (Google Gemini) analyse le texte
3. L'AI utilise le **catalogue de services** existant
4. L'AI génère un JSON structuré avec client + services + calculs
5. L'utilisateur peut créer le devis directement

**Fichiers :**
- Frontend : `/app/frontend/src/pages/AIAssistant.jsx`
- Backend : `/app/backend/server.py` (endpoint `/api/ai/generate-document`)
- API : Google Gemini (clé dans `.env` : `GEMINI_API_KEY`)

**Statut :** ⚠️ Implémenté mais **NON TESTÉ end-to-end**
- Le bouton "Créer le devis" peut avoir des bugs
- La dictée vocale avait un bug (mots répétés) qui a été corrigé mais non vérifié

---

## 📦 Catalogue : Notes & Conditions

### Nouveau Type d'Item
Le catalogue supporte maintenant **2 types d'items** :
1. **Services** : Prestations avec prix (ex: "Nettoyage toiture")
2. **Notes & Conditions** : Textes pré-enregistrés à ajouter aux devis/factures

**Champ DB :** `item_type` : `'service'` ou `'notes_conditions'`

**Usage :**
- Bouton "📖 Catalogue" dans les formulaires de devis/factures
- L'utilisateur peut ajouter des notes pré-enregistrées (ex: conditions de paiement, garanties)

**Fichiers :**
- `/app/frontend/src/pages/CatalogManager.js`
- `/app/frontend/src/pages/QuoteForm.js`
- `/app/frontend/src/pages/InvoiceForm.js`

---

## 🔄 Fonctionnalités de Réorganisation

### Réorganisation des Services
**Statut :** ✅ Implémenté pour les **DEVIS** uniquement

**Où :** `/app/frontend/src/pages/QuoteForm.js`

**Comment ça marche :**
- Boutons ⬆️ et ⬇️ à côté de chaque service
- Permet de changer l'ordre d'affichage des prestations
- Utile pour présenter les services dans l'ordre souhaité

**❌ À FAIRE :** Implémenter la même chose pour les **FACTURES** (`InvoiceForm.js`)

---

## 📋 Duplication de Documents

### Duplication de Devis
**Statut :** ✅ Implémenté pour les **DEVIS** uniquement

**Où :** `/app/frontend/src/pages/QuotesList.js`

**Bouton :** "Dupliquer" sur chaque carte de devis

**❌ À FAIRE :** Implémenter la même chose pour les **FACTURES** (`InvoicesList.js`)

---

## 🐛 Bugs Connus

### 1. Page Publique de Devis
**Fichier :** `/app/frontend/src/pages/PublicQuotePage.jsx`

**Statut :** ⚠️ Modifications récentes NON TESTÉES

**Changements apportés :**
- Nom bénéficiaire du RIB corrigé
- Affichage conditionnel du RIB : uniquement si le devis n'a **PAS** d'email client (implique envoi via WhatsApp)
- Bouton "Imprimer" ajouté pour compatibilité iOS (car le téléchargement PDF ne marche pas sur iPhone)

**Logique RIB :**
```javascript
// Afficher le RIB SEULEMENT si pas d'email (= envoi WhatsApp)
if (!quote.client_email) {
  // Afficher les infos bancaires
}
```

**Raison :** Si envoi par email, le RIB est dans l'email de confirmation. Si envoi WhatsApp, le RIB doit être sur la page publique.

**À TESTER :** Utiliser le frontend testing agent pour vérifier les 2 cas (avec/sans email)

### 2. Navigation Mobile (Bottom Nav)
**Fichier :** `/app/frontend/src/components/BottomNav.js`

**Problème :** Sur mobile, la barre de navigation a **trop d'items**, le lien "Catalogue" est caché/inaccessible

**Solution à implémenter :** 
- Réduire le nombre d'items visibles
- Ou créer un menu déroulant "Plus"
- Ou utiliser un drawer/sidebar

### 3. Padding Barre iOS
**Statut :** ✅ Corrigé

Un padding a été ajouté pour éviter que la barre de navigation ne soit masquée par la barre "home" des iPhone récents.

---

## 🗄️ Architecture Base de Données

### MongoDB Collections

#### `clients`
```javascript
{
  id: string (UUID),
  name: string,
  address: string,
  phone: string,
  email: string (optionnel),
  notes: string,
  created_at: datetime
}
```

#### `quotes` (Devis)
```javascript
{
  id: string (UUID),
  quote_number: string (ex: "DEVIS-01"),
  quote_title: string,
  client_id: string,
  client_name: string,
  client_email: string,
  client_phone: string,
  client_address: string,
  work_location: string,
  services: [{
    description: string,
    quantity: float,
    unit: string,
    unit_price: float,
    remise_percent: float,
    total: float
  }],
  // Options 2 et 3 possibles
  option_2_services: [],
  option_3_services: [],
  remise_percent: float,
  remise_montant: float,
  total_ht: float,
  tva: float,
  total_net: float,
  status: string, // 'draft' | 'sent' | 'accepted'
  public_token: string, // Token pour URL publique
  sent_at: datetime,
  signed_at: datetime,
  signature_data: string, // Base64 de la signature
  selected_option: int, // Option signée (1, 2, 3)
  created_at: datetime
}
```

#### `invoices` (Factures)
```javascript
{
  id: string (UUID),
  invoice_number: string (ex: "FACT-01"),
  client_id: string,
  client_name: string,
  client_email: string,
  client_phone: string,
  client_address: string,
  date: string,
  work_location: string,
  services: [{...}], // Même structure que quotes
  payment_status: string, // 'pending' | 'partial' | 'paid'
  acompte_verse: float,
  reste_a_payer: float,
  total_net: float,
  sent_at: datetime, // NOUVEAU : date d'envoi email
  sent_to_email: string, // NOUVEAU : email destinataire
  created_at: datetime
}
```

#### `catalog` (Catalogue)
```javascript
{
  id: string (UUID),
  category: string,
  service_name: string,
  description: string,
  default_price: float,
  default_unit: string,
  color: string,
  item_type: string, // 'service' | 'notes_conditions'
  created_at: datetime
}
```

---

## 🚀 Tâches Prioritaires

### P0 - URGENT
1. **Tester la page publique de devis** (`PublicQuotePage.jsx`)
   - Cas 1 : Devis avec email → RIB dans l'email de confirmation uniquement
   - Cas 2 : Devis sans email (WhatsApp) → RIB affiché sur la page
   - Vérifier que les boutons "Télécharger" et "Imprimer" fonctionnent sur iOS

2. **Résoudre le push vers GitHub**
   - Problème d'authentification git
   - Besoin de pousser tous les changements vers `https://github.com/RubenSRZS/Sr1`

### P1 - IMPORTANT
1. **Tester l'AI Assistant end-to-end**
   - Créer un devis via voix
   - Vérifier que le bouton "Créer le devis" fonctionne
   - Tester la dictée vocale (bug mots répétés corrigé)

2. **Corriger la navigation mobile**
   - Résoudre l'overflow du `BottomNav.js`
   - Rendre "Catalogue" accessible

3. **Ajouter réorganisation services dans `InvoiceForm.js`**
   - Copier la logique de `QuoteForm.js`

4. **Réimplémenter l'envoi WhatsApp pour les devis**
   - Ajouter un bouton WhatsApp dans `SendQuoteModal.jsx`
   - Ne pas casser le build !

### P2 - MOYEN
1. **Ajouter duplication pour les factures**
2. **Investiguer le problème emails @icloud.com**

### BACKLOG
- Dashboard : section statut des devis récents
- Guide de déploiement Google Cloud
- Personnalisation templates email depuis l'UI
- Graphiques de revenus
- Refactoring : mutualiser réorganisation/duplication Devis/Factures

---

## 🛠️ Stack Technique

### Frontend
- **Framework :** React 18
- **Routing :** React Router
- **Styling :** Tailwind CSS
- **Components :** Shadcn UI (`/app/frontend/src/components/ui/`)
- **PDF Generation :** `html2canvas` + `jspdf`
- **Notifications :** `sonner` (toast)
- **HTTP Client :** `axios` + `fetch`
- **Voice Input :** Web Speech API

### Backend
- **Framework :** FastAPI (Python)
- **Database :** MongoDB (Motor async driver)
- **Email :** Resend
- **AI :** Google Gemini (`google-genai`)
- **Auth :** PIN simple (pas de JWT)

### DevOps
- **Environnement :** Kubernetes (Emergent platform)
- **Process Manager :** Supervisor
- **Services :**
  - Backend : `0.0.0.0:8001`
  - Frontend : `3000`
  - MongoDB : local
- **Hot Reload :** Activé (frontend et backend)

### URLs et Variables d'Environnement

#### Frontend `.env`
```
REACT_APP_BACKEND_URL=https://quote-invoice-flow-2.preview.emergentagent.com
```

#### Backend `.env`
```
MONGO_URL=mongodb://localhost:27017/
DB_NAME=sr_renovation
RESEND_API_KEY=...
SENDER_EMAIL=...
ADMIN_EMAIL=...
REPLY_TO_EMAIL=...
GEMINI_API_KEY=...
PUBLIC_APP_URL=https://quote-invoice-flow-2.preview.emergentagent.com
CORS_ORIGINS=*
```

**⚠️ IMPORTANT :**
- **NE JAMAIS** hardcoder les URLs dans le code
- Toujours utiliser `process.env.REACT_APP_BACKEND_URL` en frontend
- Toujours utiliser `os.environ.get('MONGO_URL')` en backend
- Tous les endpoints API doivent avoir le préfixe `/api`

---

## 📱 PWA et Mobile

### Logos et Manifest
- **Manifest :** `/app/frontend/public/manifest.json`
- **Logos :** Configurés pour PWA (ajout récent)
- **iOS Safe Area :** Padding ajouté pour éviter chevauchement avec la barre home

### Compatibilité iOS
- Le téléchargement PDF ne fonctionne **PAS** directement sur iPhone
- **Solution :** Bouton "Imprimer" ajouté qui ouvre le menu d'impression iOS, permettant ensuite de "Enregistrer en PDF"

---

## 🎨 Design et UX

### Thème Général
- **Fond :** Crème/beige clair (`var(--sr-cream)`)
- **Cartes :** Blanc avec ombres légères
- **Primaire :** Bleu (`#3b82f6`)
- **Accent :** Orange (`#f97316`)

### Composants Shadcn Disponibles
Tous les composants Shadcn UI sont dans `/app/frontend/src/components/ui/` :
- `Button`, `Input`, `Card`, `Select`, `Dialog`, `Toast`, etc.

### Guidelines UI
- **Boutons principaux :** Bleu avec hover
- **Boutons danger :** Rouge
- **Boutons success :** Vert (uniquement admin)
- **Cartes :** Arrondi 12px minimum
- **Typographie :** Font system (Segoe UI, Arial)
- **Emails :** Font Montserrat pour le titre "SR RÉNOVATION"

---

## 🧪 Testing

### Commandes Utiles

#### Redémarrer les services
```bash
sudo supervisorctl restart frontend
sudo supervisorctl restart backend
sudo supervisorctl status
```

#### Tester l'API
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -s "$API_URL/api/"
```

#### Logs
```bash
tail -n 100 /var/log/supervisor/backend.err.log
tail -n 100 /var/log/supervisor/frontend.err.log
```

### Frontend Testing Agent
Utilise le testing agent d'Emergent pour tester les flows frontend complets avec Playwright.

---

## 💡 Conseils pour Travailler Efficacement

### ✅ Best Practices
1. **Toujours tester après modification** (curl pour backend, screenshot pour frontend)
2. **Lint avant de finish** (`mcp_lint_python`, `mcp_lint_javascript`)
3. **Utiliser le testing agent** pour les features moyennes/grandes
4. **View files avant search_replace** pour matcher l'indentation
5. **Parallel tool calls** quand possible (sauf subagents)

### ❌ Erreurs à Éviter
1. Ne PAS casser le thème bleu/orange
2. Ne PAS git pull sans confirmation
3. Ne PAS réinstaller les dépendances en boucle si build cassé
4. Ne PAS oublier le préfixe `/api` pour les routes backend
5. Ne PAS hardcoder les URLs/credentials

---

## 📞 Contact Client

Si tu as besoin de clarifications, Ruben est **très réactif** et **collaboratif**. Il connaît bien son métier et sait ce qu'il veut.

**Points de communication :**
- Il préfère le **français**
- Il est **exigeant sur le design** (surtout les couleurs)
- Il a une vision claire de son workflow métier
- Il apprécie qu'on lui propose des solutions mais valide toujours avant implémentation

---

## 🎯 Objectif Final

Créer une **application professionnelle, stable et efficace** qui aide Ruben à :
1. Gérer ses clients
2. Créer des devis rapidement (avec AI)
3. Envoyer des devis (Email + WhatsApp)
4. Faire signer électroniquement
5. Créer et envoyer des factures
6. Suivre les paiements
7. Obtenir des avis Google de ses clients satisfaits

**L'app doit être :**
- ✅ Rapide et intuitive
- ✅ Mobile-friendly (Ruben travaille souvent sur chantier)
- ✅ Professionnelle (image de marque)
- ✅ Fiable (c'est son outil de travail quotidien)

---

## 🚀 Bon Courage !

Tu as maintenant toutes les infos nécessaires pour reprendre le projet efficacement.

N'hésite pas à :
- Lire ce document plusieurs fois
- Tester l'application avec le PIN `0330`
- Explorer les fichiers mentionnés
- Utiliser les outils de testing

**Points de vigilance :**
1. ⚠️ Build frontend fragile
2. 🎨 Thème bleu/orange OBLIGATOIRE
3. 📱 WhatsApp à réimplémenter
4. 🧪 Tests de la page publique de devis

---

**Document créé le :** $(date)
**Par :** Agent de développement E1  
**Pour :** Claude Opus (prochain développeur)
