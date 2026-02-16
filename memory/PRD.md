# SR Renovation - Application de Gestion Devis & Factures

## Problem Statement
Application web pour Sr-Renovation.fr (entreprise de rénovation de toiture/façade) permettant de créer des devis et factures professionnels avec un design unique reflétant l'identité de l'entreprise.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI (port 3000)
- **Backend**: FastAPI + Motor/MongoDB (port 8001)
- **Database**: MongoDB (local)

## Core Requirements
1. Créer/gérer des devis et factures professionnels
2. Design élégant bleu (#0c1829) et orange (#e8712a)
3. Gestion de clients (email optionnel)
4. Catalogue de services pré-remplis
5. Aperçu PDF en direct pendant la saisie
6. Numérotation séquentielle par client (DEVIS-01, DEVIS-02)
7. Création client intégrée dans le formulaire devis/facture
8. Remise en pourcentage
9. Mobile-first
10. **PAS d'IA** (supprimée à la demande de l'utilisateur)

## What's Been Implemented (Feb 2026)
- [x] Backend complet avec MongoDB persistant
- [x] Email client optionnel
- [x] Numérotation par client (DEVIS-XX, FACT-XX)
- [x] Remise en pourcentage (%)
- [x] Création client inline (dans le formulaire devis/facture)
- [x] Aperçu PDF en direct (desktop: côte-à-côte, mobile: modal)
- [x] Formulaire devis et facture identiques et cohérents
- [x] Design professionnel avec logos SR Renovation
- [x] Dashboard avec statistiques
- [x] Catalogue de services avec descriptions professionnelles
- [x] Gestion clients (CRUD, email optionnel)
- [x] Listes devis/factures avec recherche
- [x] Tests backend: 29/29 passés
- [x] Tests frontend: 100% fonctionnels

## Backlog
### P1 - Prochaines tâches
- [ ] Intégration email Resend (envoi devis/factures par email)
- [ ] Signature électronique simple (pour clients âgés)

### P2 - Améliorations
- [ ] Conversion devis → facture en un clic
- [ ] Export PDF réel (téléchargeable)
- [ ] Enrichir le catalogue de services

### P3 - Futur
- [ ] Tableau de bord avancé (graphiques, évolution CA)
- [ ] Notifications de paiement

## API Endpoints
- `POST/GET /api/clients` - CRUD clients (email optionnel)
- `POST/GET /api/quotes` - Devis (new_client inline, remise_percent)
- `POST/GET /api/invoices` - Factures (acompte_paid, reste_a_payer)
- `POST/GET /api/catalog` - Catalogue services
- `GET /api/stats` - Statistiques dashboard

## Key Files
- `/app/backend/server.py` - API FastAPI complète
- `/app/frontend/src/pages/QuoteForm.js` - Formulaire devis avec aperçu live
- `/app/frontend/src/pages/InvoiceForm.js` - Formulaire facture (identique au devis)
- `/app/frontend/src/components/PDFPreview.js` - Design PDF professionnel
- `/app/frontend/src/pages/Dashboard.js` - Tableau de bord
