# SR Renovation - Application de Gestion Devis & Factures

## Problem Statement
Application web pour Sr-Renovation.fr (entreprise de rénovation toiture/façade) pour créer des devis et factures professionnels avec design unique aux couleurs de la marque (bleu foncé et orange).

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI (port 3000)
- **Backend**: FastAPI + Motor/MongoDB (port 8001)
- **Database**: MongoDB (persistant)

## What's Implemented (Feb 2026)

### Core Features
- [x] Backend MongoDB persistant (toutes les données sont sauvegardées)
- [x] Email client optionnel
- [x] Numérotation par client (DEVIS-XX, FACT-XX)
- [x] Remise en % ET en montant fixe (toggle)
- [x] Création client inline (dans formulaire devis/facture)
- [x] Aperçu PDF live (desktop: côte-à-côte, mobile: modal)
- [x] Dashboard avec statistiques
- [x] Catalogue de services
- [x] Gestion clients CRUD
- [x] Listes devis/factures avec recherche

### Design & UI
- [x] Design PDF professionnel avec couleurs de marque:
  - Bleu foncé: #1e40af (header, tableaux, accents)
  - Orange: #f97316 (client, acomptes, accents secondaires)
- [x] Logos disséminés dans le PDF (SR, Qualibat, BP, CMA)
- [x] Diagnostic visible sur le PDF quand coché
- [x] Navigation desktop complète
- [x] Interface mobile-first responsive

### PDF Features (New - Feb 17, 2026)
- [x] **Téléchargement PDF** - Boutons sur formulaires devis/factures
  - Desktop: bouton "Télécharger PDF" à côté de "Enregistrer"
  - Mobile: bouton "PDF" dans la modal d'aperçu
  - Utilise html2canvas + jsPDF pour génération côté client
- [x] **Couleurs corrigées** - Bleu plus foncé, vrai orange (pas jaune)

## Backlog

### P0 - En cours
- [ ] **Devis multi-options** - Permettre 2 options sur un même devis
  - Backend: Ajouter option_2_services, option_2_total au modèle Quote
  - Frontend: UI pour gérer Option 1 / Option 2
  - PDF: Afficher les deux options clairement

### P1 - Prioritaire
- [ ] Intégration email Resend (envoi PDF aux clients)
- [ ] Signature électronique

### P2 - Améliorations
- [ ] Conversion devis → facture en un clic
- [ ] Enrichir catalogue de services

### P3 - Futur
- [ ] Tableau de bord avancé (graphiques)
- [ ] Notifications de paiement

## Technical Details

### Brand Colors (constants in PDFPreview.js)
```javascript
const BRAND_BLUE = '#1e40af';       // Bleu foncé principal
const BRAND_BLUE_LIGHT = '#3b82f6'; // Bleu clair secondaire
const BRAND_ORANGE = '#f97316';     // Orange principal
const BRAND_ORANGE_LIGHT = '#fb923c'; // Orange clair secondaire
```

### PDF Generation
- Library: html2canvas + jsPDF
- Function: `downloadPDF(element, filename)` in PDFPreview.js
- Format: A4, portrait, PNG image embedded

### Key Files
- `/app/backend/server.py` - API FastAPI avec MongoDB
- `/app/frontend/src/components/PDFPreview.js` - Composant PDF + téléchargement
- `/app/frontend/src/pages/QuoteForm.js` - Formulaire de devis
- `/app/frontend/src/pages/InvoiceForm.js` - Formulaire de factures

## Tests Passed
- Iteration 1: 29/29 tests
- Iteration 2: 15/15 tests
- Manual verification: PDF download, colors, live preview ✓
