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

## Fonctionnalités implémentées (au 02/03/2026)

### Génération PDF
- **Approche**: html2canvas + jsPDF capture le composant HTML `PDFDocument`
- **Logos**: 5 logos intégrés en base64 WebP (évite les erreurs CORS): SR Rénovation, Drapeau Français, Banque Populaire, CMA, Gîtes de France
- **Multi-page**: Gestion automatique si le contenu dépasse une page A4
- **Qualité**: Scale 2.5x

### Aperçu HTML (PDFDocument component)
- Header: Gradient bleu→orange, logo SR (gauche), drapeau français + numéro + date (droite)
- Section entreprise (bleu) et client (orange) avec email affiché
- Tableau des services: colonnes Description, Qté, P.U., Total TTC
- **Section totaux (format simplifié):**
  - TOTAL NET (TTC) — bleu gradient
  - RESTE À PAYER — rouge (devis: 70% restant; facture: après acompte versé)
  - ACOMPTE 30% — orange (devis uniquement)
- Mentions légales: TVA non applicable, art. 293 B du CGI
- Zones de signature (devis uniquement)
- **Footer partenaires**: Banque Populaire, Chambre des Métiers (CMA), Gîtes de France, badge Google 5★
- Info contact (RC Pro, modes de paiement, téléphone)

### Gestion des devis
- Numéro auto-généré OU personnalisé (champ optionnel dans formulaire)
- Devis multi-options (Option 1 / Option 2 avec totaux séparés)
- Diagnostic visuel (mousses, lichens, tuiles cassées, etc.)
- Remise en % ou montant fixe
- Totaux affichés: Total Option X (TTC) / Reste à payer / Acompte 30%

### Gestion des factures
- Total net (TTC), Acompte versé, Reste à payer

### Dashboard
- Boutons: "Nouveau Devis" (bleu) / "Nouvelle Facture" (orange — corrigé)
- Stats: Clients, Devis, Factures, Chiffre d'affaires
- Listes récentes

### Clients
- CRUD avec email (optionnel)
- Email affiché dans la section client du document

### Catalogue
- Descriptions de services pré-remplies

## Schéma DB principal

### Quote
```
client_id, quote_number (auto ou custom), client_name, client_address, client_phone, client_email,
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
- 02/03/2026 (session 1): Refonte PDF (html2canvas+jsPDF), dashboard couleurs, numéro devis personnalisable, badges partenaires
- 02/03/2026 (session 2): Vrais logos (BP, CMA, Gîtes, drapeau FR), suppression décennale, totaux simplifiés (sans Total brut), bouton Facture orange

## Backlog prioritaire

### P1 - Intégration email (Resend)
- Envoyer PDF par email au client directement depuis l'application

### P2 - Signature électronique
- Pad de signature pour le client (acceptation du devis)

### P3 - Nettoyage code
- Supprimer fichiers orphelins: PDFGenerator.js, PDFGeneratorPro.js, PDFGenerator_simple.js

### P3 - Améliorations design
- Upload de logos personnalisés par l'utilisateur (pour future mise à jour)
- Expansion du catalogue de prestations
