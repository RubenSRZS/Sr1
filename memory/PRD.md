# SR Renovation - Application de Gestion Devis & Factures

## Problem Statement
Application web pour Sr-Renovation.fr (entreprise de rénovation toiture/façade) pour créer des devis et factures professionnels avec design unique.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI (port 3000)
- **Backend**: FastAPI + Motor/MongoDB (port 8001)
- **Database**: MongoDB

## What's Implemented (Feb 2026)
- [x] Backend MongoDB persistant
- [x] Email client optionnel
- [x] Numérotation par client (DEVIS-XX, FACT-XX)
- [x] Remise en % ET en montant fixe (toggle)
- [x] Création client inline (dans formulaire devis/facture)
- [x] Aperçu PDF live (desktop: côte-à-côte, mobile: modal)
- [x] Design PDF professionnel bleu clair (#3b82f6) dégradé orange
- [x] Logos disséminés dans le PDF (Qualibat, BP, CMA)
- [x] Diagnostic visible sur le PDF quand coché
- [x] Navigation desktop complète (Accueil, Devis, Factures, Clients, Catalogue)
- [x] Plus de doublon "SR RENOVATION" texte
- [x] Champ surface supprimé des formulaires
- [x] Dashboard avec statistiques
- [x] Catalogue de services
- [x] Gestion clients CRUD
- [x] Listes devis/factures avec recherche
- [x] Tests: 44/44 passés (29 iter1 + 15 iter2)

## Backlog
### P1
- [ ] Intégration email Resend
- [ ] Signature électronique
- [ ] Export PDF téléchargeable

### P2
- [ ] Conversion devis → facture en un clic
- [ ] Enrichir catalogue

### P3
- [ ] Tableau de bord avancé (graphiques)
- [ ] Notifications de paiement
