# 📋 Sr-Renovation - Application de Gestion de Devis et Factures

Application professionnelle de gestion de devis et factures pour Sr-Renovation.fr, avec génération automatique par intelligence artificielle.

## 🚀 Fonctionnalités

### ✨ **Génération Automatique IA**
- **GPT-5.2** intégré pour générer des devis complets
- Il suffit de décrire les travaux → l'IA génère tous les services détaillés
- Descriptions professionnelles en français sans fautes
- Prix estimés automatiquement

### 📝 **Gestion de Devis**
- Création rapide de devis professionnels
- Catalogue de phrases pré-remplies par catégorie :
  - TOITURE (nettoyage, traitement, hydrofuge...)
  - FAÇADE (nettoyage, réparations...)
  - ZINGUERIE & HABILLAGE (gouttières, habillage rives...)
  - SOLS & EXTÉRIEURS (terrasses, murets...)
- Diagnostic avec checkboxes (mousses, lichens, tuiles cassées...)
- Calcul automatique : Total brut, Remise, Total net, Acompte 30%
- Signature électronique tactile (facile pour clients âgés)
- Envoi par email direct

### 🧾 **Gestion de Factures**
- Conversion devis → facture en un clic
- Suivi des acomptes versés
- Calcul automatique du reste à payer
- Statuts de paiement (En attente, Partiel, Payé)
- Envoi par email

### 👥 **Gestion de Clients**
- Base de données clients complète
- Recherche rapide par nom, email, téléphone
- Historique des devis et factures
- Notes personnalisées

### 📊 **Tableau de Bord**
- Statistiques en temps réel
- Total clients, devis, factures
- Chiffre d'affaires
- Accès rapide aux derniers documents

### 📱 **Mobile-First**
- Interface optimisée pour smartphone et tablette
- Navigation tactile intuitive
- Utilisable sur chantier

## 🎨 Design

- **Couleurs** : Bleu professionnel (#0F172A) + Orange SR-Renovation (#F97316)
- **Logo** : Intégré partout
- **Polices** : Manrope (titres) + Inter (texte)
- **Style** : Moderne, épuré, professionnel

## 🔧 Configuration Nécessaire

### 📧 **Envoi d'emails (Resend)**
Pour activer l'envoi d'emails, ajoutez votre clé API Resend :

1. Créez un compte sur [resend.com](https://resend.com)
2. Générez une clé API
3. Ajoutez dans `/app/backend/.env` :
```
RESEND_API_KEY=re_votre_cle_ici
SENDER_EMAIL=votre-email@votre-domaine.com
```
4. Redémarrez le backend :
```bash
sudo supervisorctl restart backend
```

### 🤖 **IA - Clé Emergent (Déjà configurée)**
L'application utilise la **clé universelle Emergent** pour GPT-5.2.
- Aucune configuration supplémentaire nécessaire
- Fonctionne directement
- Si le budget est atteint, rechargez via : Profile → Universal Key → Add Balance

## 📖 Guide d'Utilisation

### **1. Créer un client**
1. Aller dans "Clients"
2. Cliquer sur "Nouveau Client"
3. Remplir : nom, email, téléphone, adresse
4. Enregistrer

### **2. Créer un devis avec l'IA**
1. Aller dans "Devis" → "Nouveau Devis"
2. Sélectionner un client
3. Remplir le lieu des travaux
4. **Dans "Génération automatique IA"** :
   - Décrire les travaux (ex: "Nettoyage toiture 120m², traitement anti-mousse, réparation gouttières")
   - Cliquer sur "Générer avec l'IA"
   - L'IA remplit automatiquement tous les services !
5. Ajuster si nécessaire (quantités, prix...)
6. Cocher le diagnostic si besoin
7. Ajouter une remise si nécessaire
8. Enregistrer
9. Envoyer par email au client

### **3. Créer une facture depuis un devis**
1. Aller dans la liste des devis
2. Cliquer sur le devis accepté
3. (Future feature: bouton "Convertir en facture")
4. Ou créer une nouvelle facture manuellement

### **4. Gérer le catalogue**
1. Aller dans "Catalogue"
2. Ajouter vos services et descriptions professionnelles
3. L'IA s'inspire de ce catalogue pour générer les devis

## 📱 Accès Mobile

L'application fonctionne parfaitement sur mobile :
1. Ouvrez l'URL dans le navigateur de votre téléphone
2. Ajoutez à l'écran d'accueil pour un accès rapide :
   - **iPhone** : Safari → Partager → "Sur l'écran d'accueil"
   - **Android** : Chrome → Menu → "Ajouter à l'écran d'accueil"

## 🆘 Support

### **Problèmes fréquents**

**L'IA ne génère pas de services**
- Vérifiez que vous avez sélectionné un client
- Vérifiez que la description des travaux n'est pas vide
- Si erreur de budget : rechargez la clé Emergent (Profile → Universal Key)

**Les emails ne s'envoient pas**
- Vérifiez que RESEND_API_KEY est configurée
- Vérifiez que SENDER_EMAIL est correct
- Redémarrez le backend : `sudo supervisorctl restart backend`

**L'application ne charge pas**
- Vérifiez que les services sont démarrés : `sudo supervisorctl status`
- Consultez les logs : `tail -f /var/log/supervisor/backend.err.log`

## 🏗️ Architecture Technique

- **Frontend** : React 19, TailwindCSS, Shadcn/UI, Axios
- **Backend** : FastAPI (Python), Motor (async MongoDB)
- **Base de données** : MongoDB
- **IA** : OpenAI GPT-5.2 (via clé Emergent)
- **Email** : Resend
- **Signature** : react-signature-canvas

## 📂 Structure des Fichiers

```
/app/
├── backend/
│   ├── server.py          # API FastAPI complète
│   ├── .env               # Variables d'environnement
│   └── requirements.txt   # Dépendances Python
│
├── frontend/
│   ├── src/
│   │   ├── pages/         # Dashboard, QuoteForm, InvoiceForm, etc.
│   │   ├── components/    # SignaturePad, BottomNav, UI components
│   │   └── utils/         # defaultCatalog.js
│   ├── .env               # URL backend
│   └── package.json       # Dépendances React
│
└── design_guidelines.json # Guidelines design Sr-Renovation
```

## 🎯 Informations Entreprise (Pré-configurées)

Ces informations apparaissent automatiquement sur les devis et factures :

- **Entreprise** : SR RÉNOVATION
- **Gérant** : Ruben SUAREZ-SAR
- **Téléphone** : 06 80 33 45 46
- **Email** : SrRenovation03@gmail.com
- **Adresse** : 1 Chemin de l'Etang Jean Guyon, 39570 COURLAOUX
- **SIRET** : 894 908 227 00024
- **Assurance** : RC Professionnelle Banque Populaire
- **Site** : Sr-Renovation.fr

---

**Développé avec ❤️ pour Sr-Renovation par Emergent AI**
