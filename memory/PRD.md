# PRD — Sr-Renovation.fr

## Problème original
Application web pour créer des devis et factures professionnels pour une entreprise de rénovation (Sr-Renovation.fr). Design unique aux couleurs bleu/orange de la marque.

## Stack Technique
- Frontend: React + Tailwind CSS + Shadcn/UI
- Backend: FastAPI + MongoDB (Motor)
- PDF: html2canvas + jsPDF
- Icons: lucide-react

## Architecture
```
/app/
├── backend/server.py         # API FastAPI
└── frontend/src/
    ├── App.js                # Routes + Providers
    ├── context/
    │   ├── ThemeContext.js   # Dark mode global
    │   └── FormPersistContext.js  # Persistance formulaires
    ├── pages/
    │   ├── Dashboard.js
    │   ├── QuoteForm.js      # Formulaire devis (multi-options)
    │   ├── QuotesList.js
    │   ├── InvoiceForm.js
    │   ├── InvoicesList.js
    │   ├── ClientsManager.js
    │   └── CatalogManager.js
    ├── components/
    │   ├── PDFPreview.js     # Aperçu et génération PDF
    │   ├── PDFGeneratorPro.js
    │   ├── BottomNav.js
    │   └── DesktopNav.js
    ├── utils/defaultCatalog.js
    └── index.css             # Styles + dark mode global
```

## Fonctionnalités implémentées

### ✅ Core (MVP)
- Création/modification/suppression de devis et factures
- Gestion clients (CRUD)
- Catalogue de services avec couleurs et unités par défaut
- Aperçu PDF en direct lors de la saisie
- Téléchargement PDF

### ✅ Devis
- Multi-options (jusqu'à 3 options avec titres)
- Titre global du devis
- Numéro de devis personnalisable
- Diagnostic visuel enrichi (gouttières obstruées/encrassées/rouille/déformées/décollées, PC tôle rouille/perforé/joint, façade fissures/mousses)
- Numérotation des lignes (toggle on/off)
- Remise par ligne et remise globale (% ou €)
- Modalités de paiement (4 options)
- Conversion devis → facture (1 clic)

### ✅ Factures
- Numéro personnalisable
- Acompte versé / Reste à payer
- Statut paiement: En attente / Partiel / Payée
- Bouton "Marquer comme payée" dans la liste
- "Payée intégralement" affiché quand payé

### ✅ Clients
- Tri alphabétique A→Z
- Tri par date (plus récents)
- Recherche par nom/téléphone/email
- Client existant ou nouveau client depuis le formulaire

### ✅ Catalogue
- Catégories colorées
- Unités par défaut par service
- Descriptions vides (à remplir par l'utilisateur)
- Initialisation idempotente (pas de doublons)

### ✅ UX
- Dark mode global (persiste sur toutes les pages via ThemeContext)
- Persistance formulaire (localStorage, restauration au retour)
- Responsive mobile-first
- Navigation bottom (mobile) + desktop nav

### ✅ Listes
- Tri A→Z / Récents sur devis, factures, clients

## Backlog (Non implémenté)

### P1
- Acceptation en ligne du devis via lien unique + signature
- Envoi par email (Resend) avec PDF en pièce jointe

### P2  
- Tableaux de bord avec graphiques de revenus
- Drag & drop pour réordonner les services
- Modèles de devis prédéfinis

### P3
- Synchronisation Google Calendar
- Export comptable CSV/Excel

## Schéma DB clé
- **quotes**: title, option1-3 (services+title+remise), diagnostic (30+ champs), show_line_numbers, status
- **invoices**: payment_status (pending/partial/paid), acompte_paid, reste_a_payer
- **catalog**: category, service_name, description, default_price, default_unit, color
- **clients**: name, address, phone, email, notes, created_at

## Endpoints clés
- POST/GET/PUT/DELETE /api/quotes
- POST/GET/PUT/DELETE /api/invoices
- PATCH /api/invoices/{id}/payment?payment_status=paid
- POST /api/invoices/from-quote/{quote_id}
- PATCH /api/quotes/{id}/status
- POST/GET/PUT/DELETE /api/catalog
- POST/GET/PUT/DELETE /api/clients
