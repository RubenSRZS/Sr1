# SR-Renovation Invoice/Quote Application - PRD

## Original Problem Statement
Application web pour créer des devis et factures professionnels pour Sr-Renovation.fr avec design unique aux couleurs de la marque (bleu et orange).

## Implemented Features ✅

### Core Functionality
1. ✅ Création, visualisation et gestion des devis et factures
2. ✅ Gestion des clients
3. ✅ Catalogue de prestations prédéfinies
4. ✅ Aperçu PDF en direct
5. ✅ Formulaires flexibles (email optionnel, remises %, unités personnalisées)
6. ✅ Devis multi-options (Option 1 + Option 2)
7. ✅ Plans de paiement (acompte 30%, échéances)
8. ✅ Téléchargement PDF (html2canvas + jsPDF)

### New Features (2026-03-08)
9. ✅ **Numérotation des prestations** - Colonne N° avec toggle pour désactiver
10. ✅ **Conversion Devis → Facture** - Bouton "Facturer" avec case "Payée"
11. ✅ **Mode Sombre** - Toggle lune/soleil sur le dashboard
12. ✅ **Indicateurs de progression** - Badges statut avec menu de changement rapide

## Technical Architecture

### Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI
- **Backend:** FastAPI, Pydantic
- **Database:** MongoDB
- **PDF Generation:** html2canvas + jsPDF

### Key Files
```
/app/
├── backend/
│   └── server.py           # API avec ConvertQuoteToInvoice model
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── PDFPreview.js   # ServicesTable avec showLineNumbers
    │   ├── lib/
    │   │   └── logoConstants.js
    │   └── pages/
    │       ├── Dashboard.js    # Mode sombre
    │       ├── QuotesList.js   # Conversion + statuts
    │       └── QuoteForm.js    # Toggle numérotation
    └── package.json
```

### API Endpoints
- `POST /api/invoices/from-quote/{quote_id}` - Conversion avec `mark_as_paid` option
- `PATCH /api/quotes/{quote_id}/status` - Changement de statut

## Change Log

### 2026-03-08
- **ADDED:** Numérotation des prestations avec toggle
- **ADDED:** Conversion devis → facture avec option "payée"
- **ADDED:** Mode sombre pour le dashboard
- **ADDED:** Indicateurs de statut avec icônes et menu de changement
- **FIXED:** Erreur de compilation (base64 logo)

## Pending Tasks

### P1 - User Requested
- Email Integration (Resend)
- Acceptation en ligne des devis avec signature

### P2 - Future
- Vérification logos dans PDF téléchargé
- Drag & drop pour réorganiser prestations
- Templates de devis prédéfinis
