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
│   │   │   ├── PDFPreview.js       # ACTIF: Aperçu HTML + génération PDF (html2canvas+jsPDF)
│   │   │   ├── PDFGenerator.js     # ORPHELIN (peut être supprimé)
│   │   │   ├── PDFGeneratorPro.js  # ORPHELIN (peut être supprimé)
│   │   │   └── PDFGenerator_simple.js # ORPHELIN
│   │   ├── pages/
│   │   │   ├── QuoteForm.js        # Formulaire devis + aperçu live + PDF
│   │   │   ├── InvoiceForm.js      # Formulaire facture + aperçu live + PDF
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
- Backend: FastAPI, Pydantic, Motor (MongoDB async)
- Database: MongoDB

## Fonctionnalités implémentées

### Génération PDF (Refactorisé - 02/03/2026)
- **Approche**: html2canvas + jsPDF capture le composant HTML `PDFDocument` qui est déjà beau
- **Logo**: Intégré en base64 WebP directement dans PDFPreview.js (évite les problèmes CORS)
- **Multi-page**: Gestion automatique si le contenu dépasse une page A4
- **Qualité**: Scale 2.5x pour qualité haute résolution

### Aperçu HTML (PDFDocument component)
- Header gradient bleu→orange avec logo SR Rénovation
- Section entreprise (bleu) et client (orange)
- Tableau des services avec prix
- Section totaux avec acompte 30%
- Badges partenaires: BANQUE POPULAIRE, CHAMBRE DES MÉTIERS, GARANTIE DÉCENNALE
- Signatures (devis uniquement)
- Compatible: devis standard, devis multi-options (Option 1 + Option 2), factures

### Gestion des devis
- Numéro auto-généré OU personnalisé (NOUVEAU)
- Devis multi-options (Option 1 / Option 2 avec totaux séparés)
- Diagnostic visuel (mousses, lichens, tuiles cassées, etc.)
- Remise en % ou montant fixe
- Acompte 30% calculé automatiquement

### Gestion des factures
- Reste à payer automatique
- Acompte versé

### Clients
- CRUD complet avec email (optionnel)
- Email affiché dans l'aperçu du document

### Catalogue
- Descriptions de services pré-remplies

## Schéma DB principal

### Quote
```
client_id, quote_number, client_name, client_address, client_phone, client_email,
date, work_location, diagnostic, services: [Service], total_brut, remise_percent, 
remise_montant, remise, total_net, acompte_30, option_2_services, option_2_total_net, notes
```

### Invoice
```
client_id, invoice_number, services, total_net, acompte_paid, reste_a_payer
```

## Couleurs marque
- Bleu principal: #1e40af
- Bleu clair: #3b82f6
- Orange: #f97316
- Orange clair: #fb923c

## CHANGELOG
- 02/03/2026: Refonte complète génération PDF (html2canvas+jsPDF), couleurs dashboard corrigées (orange pas jaune), numéro devis personnalisable, badges partenaires, email client affiché

## Backlog prioritaire

### P1 - Intégration email (Resend)
- Envoyer PDF par email au client

### P2 - Signature électronique
- Signature pad pour le client

### P3 - Nettoyage code
- Supprimer fichiers orphelins: PDFGenerator.js, PDFGeneratorPro.js, PDFGenerator_simple.js

### P3 - Améliorations
- Upload de logos partenaires réels (Banque Populaire, Chambre des Métiers)
- Expansion du catalogue de prestations
