# PRD - Sr-Renovation.fr Application de Facturation

## Problème original
Application web pour créer des devis et factures professionnels pour l'entreprise "Sr-Renovation.fr" (Ruben SUAREZ-SAR). Design unique aux couleurs de la marque (bleu #1e40af et orange #f97316).

## Architecture
```
/app/
├── backend/
│   ├── server.py       # FastAPI monolithique (API REST)
│   └── .env            # MONGO_URL, DB_NAME
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PDFPreview.js           # ACTIF: Aperçu HTML + PDF (html2canvas+jsPDF)
│   │   │   ├── PDFGenerator.js         # ORPHELIN — à supprimer
│   │   │   ├── PDFGeneratorPro.js      # ORPHELIN — à supprimer
│   │   │   └── PDFGenerator_simple.js  # ORPHELIN — à supprimer
│   │   ├── pages/
│   │   │   ├── QuoteForm.js        # Devis (ServicesSection hors composant pour édition correcte)
│   │   │   ├── InvoiceForm.js      # Factures
│   │   │   ├── Dashboard.js        # Tableau de bord
│   │   │   ├── QuotesList.js
│   │   │   ├── InvoicesList.js
│   │   │   ├── ClientsManager.js
│   │   │   └── CatalogManager.js
│   │   └── App.js
│   └── package.json
└── memory/PRD.md
```

## Technologies
- Frontend: React 19, Tailwind CSS, html2canvas, jsPDF
- Backend: FastAPI, Motor (MongoDB async)
- Database: MongoDB

## Logos intégrés (base64 WebP dans PDFPreview.js)
| Logo | Usage | Source |
|------|-------|--------|
| SR Rénovation | En-tête header gauche | job_538ea579 |
| Drapeau Français | En-tête header droite | job_intelinvoice |
| Banque Populaire | Footer partenaires | job_intelinvoice |
| Chambre des Métiers | Footer partenaires | job_intelinvoice |
| Gîtes de France | Footer partenaires | job_e13a9390 |
| Google Avis Clients | Footer partenaires | job_e13a9390 |
| Signature Ruben | Case signature entreprise | job_e13a9390 |

## Design document
- Header: gradient bleu→orange, logo SR (gauche), drapeau + N°/date (droite)
- Client: carte orange (à droite), Entreprise: carte bleue (à gauche)
- Tableau: border-collapse collapse, headers inline styles (fix pdf alignment)
- Totaux: TOTAL NET (bleu) → ACOMPTE 30% (orange) → SOLDE APRÈS TRAVAUX (bleu clair, non agressif)
- Signatures: boîtes dashed (min-height 80px), signature image dans case entreprise
- Footer: 4 logos partenaires + infos contact + Sr-Renovation.fr

## Fonctionnalités
- Devis: numéro auto ou personnalisé, multi-options, diagnostic visuel, remise %/€
- Factures: total TTC, acompte versé, reste à payer
- Clients: CRUD + email optionnel affiché dans document
- Catalogue: descriptions pré-remplies
- PDF: html2canvas+jsPDF (identique au live preview), tous logos base64 (sans CORS)

## Fonctionnalités implémentées (toutes opérationnelles)
- **ServicesSection:** Champs Qté, Unité (m², ML, m, h, forfait, kg, unité), Prix unitaire, Remise %, Total calculé automatiquement
- **Remise globale:** Par option (% ou €), cumulative avec remise par article
- **Modalités de paiement:** 4 options — Acompte 30%+Solde, 2×, 3×, 4× fois égales
- **Multi-options:** Option 1 + Option 2 facultative
- **Diagnostic visuel:** 12 cases à cocher groupées (Structure, Végétation, Hydrologie)
- **Tri par client:** Liste devis triée alphabétiquement
- **PDF:** Toutes données affichées, téléchargement identique au preview

## CHANGELOG
- 02/03/2026 (S1): Refonte PDF html2canvas+jsPDF, dashboard couleurs, numéro devis custom
- 02/03/2026 (S2): Vrais logos partenaires, sans décennale, totaux sans rouge
- 02/03/2026 (S3): Google/signature logos, ServicesSection extrait (fix édition), totaux élégants, CORS résolu
- 02/03/2026 (S4): Unités, remise par article, plans de paiement multiple, tri client, aperçu PDF amélioré. Correction bug syntaxe QuoteForm.js (doublon ServicesSection). Tests: 10/10 ✅

## Backlog

### P1 — Email Resend
Envoyer PDF par email au client avec pièce jointe et message personnalisé

### P2 — Signature électronique
Pad de signature pour le client (acceptation du devis en ligne)

### P3 — Nettoyage
Supprimer PDFGenerator.js, PDFGeneratorPro.js, PDFGenerator_simple.js

### P3 — Numérotation par année
DEVIS-2026-001, remise à zéro chaque année

### P4 — Dashboard amélioré
Graphique CA mensuel

### P4 — Convertir devis → facture
Bouton 1-clic sur la liste des devis
