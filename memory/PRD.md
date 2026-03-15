# Sr-Renovation.fr — Devis & Factures Pro

## Problème original
Application web pour créer des devis et factures professionnels et personnalisés pour Sr-Renovation.fr.

## Architecture
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI + Pydantic
- **Database:** MongoDB
- **PDF:** html2canvas + jspdf (client-side generation)
- **Email:** Resend API (devis@sr-renovation.fr)

## Fonctionnalités implémentées

### Core
- Dashboard, clients CRUD, devis/factures avec aperçu PDF en temps réel
- Catalogue de services avec catégories et couleurs
- Diagnostic visuel hiérarchique, conversion devis->facture
- Mode sombre global, numérotation personnalisée, options multiples, remises

### Sécurité
- Protection par code PIN (0330)
- Récupération du code par email

### Email professionnel
- Sender: "SR Renovation <devis@sr-renovation.fr>" + Reply-To
- Template HTML avec dégradé bleu-orange, bouton CTA #F9A825, typographie variée (Georgia serif/sans-serif)
- Footer pro avec icônes unicode (tel, email, maison, globe)
- Accents HTML entities, responsive mobile, anti-spam
- Prix masqué dans l'email
- Salutation: "Bonjour, Monsieur {Nom}"
- Sous-titre: "Nettoyage, toiture, façade, terrasse"
- PDF en pièce jointe automatique

### Page publique de devis
- Visuellement identique au PDF (réutilise PDFDocument)
- Responsive mobile: CSS transform scale pour adapter 794px au viewport
- Signature en ligne (canvas tactile)
- Bouton "Télécharger le devis signé" après signature

### Signature et suivi
- Signature client intégrée directement sur le PDF (zone "Bon pour accord")
- À la signature: email admin avec PDF signé en pièce jointe
- À la signature: email confirmation client avec RIB (IBAN, BIC, Banque Populaire BFC)
- Montant acompte 30% affiché dans l'email de confirmation
- Suivi: envoyé, ouvert, signé

## Tests
- Iteration 10: 100% (21/21) — Parité visuelle page publique/PDF
- Iteration 11: 100% (20/20) — Refonte email + PDF attachment
- Iteration 12: 100% (23/23) — Responsive, signature PDF, emails post-signature, RIB

## Backlog priorisé

### P1 — À venir
- Dashboard statut des devis (section envoyés/ouverts/signés)

### P2
- PDF preview fond blanc en mode sombre

### P3 — Futur
- Dashboard: graphiques de revenus
- Drag & drop pour réorganiser les services
- Templates de devis prédéfinis
