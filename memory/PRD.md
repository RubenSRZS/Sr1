# Sr-Renovation.fr — Devis & Factures Pro

## Problème original
Application web pour créer des devis et factures professionnels et personnalisés pour Sr-Renovation.fr, avec un design aligné à la marque et une approche mobile-first.

## Architecture
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI + Pydantic
- **Database:** MongoDB
- **PDF:** html2canvas + jspdf
- **Email:** Resend API (devis@sr-renovation.fr)

## Fonctionnalités implémentées

### Core
- Dashboard avec statistiques (clients, devis, factures, CA)
- Gestion complète des clients (CRUD, tri alphabétique/récent)
- Création/édition de devis avec aperçu PDF en temps réel
- Création/édition de factures avec statut de paiement
- Catalogue de services avec catégories et couleurs
- Diagnostic visuel hiérarchique (groupes/sous-options)
- Conversion devis -> facture
- Mode sombre global
- Numérotation personnalisée des documents
- Options multiples par devis (jusqu'à 3)
- Remises et unités personnalisées

### Sécurité
- Protection par code PIN (4 chiffres) à l'entrée de l'app
- Option "Code oublié" — envoi par email via Resend
- Routes publiques séparées (pas de PIN requis pour les clients)

### Système d'envoi & signature en ligne
- Page publique de devis visuellement identique au PDF (réutilise PDFDocument)
- Lien unique sécurisé par devis (token aléatoire 32 chars)
- Signature en ligne (canvas tactile pour mobile)
- Suivi : consulté (opened_at), signé (signed_at)
- Notification email à l'admin quand un devis est signé

### Email professionnel (15 Mars 2026)
- Sender: "SR Renovation <devis@sr-renovation.fr>"
- Reply-To: Srrenovation03@gmail.com
- Objet dynamique: "Votre devis est prêt — SR Rénovation n°[Numéro]"
- Template HTML avec dégradé bleu-orange identique à la marque
- Bouton CTA orange (#FF8C42) "Consulter mon devis" arrondi
- Prix masqué dans l'email (client doit cliquer pour voir)
- Prénom du client injecté dynamiquement
- Footer pro: téléphone, email, adresse, site web
- Pièce jointe PDF générée côté client (html2canvas + jspdf) et envoyée via Resend
- Nom fichier PDF: Devis_SR-Renovation_{numéro}.pdf
- Responsive mobile, anti-spam compliant

## Tests
- Iteration 10: 100% pass — Parité visuelle page publique/PDF (9/9 backend, 12/12 frontend)
- Iteration 11: 100% pass — Refonte email + PDF attachment (12/12 backend, 8/8 frontend)

## Backlog priorisé

### P1 — À venir
- Dashboard statut des devis (section envoyés/ouverts/signés)
- Personnalisation du texte email avant envoi (FAIT - texte modifiable dans le modal)

### P2
- PDF preview fond blanc en mode sombre

### P3 — Futur
- Dashboard : graphiques de revenus et indicateurs visuels
- Drag & drop pour réorganiser les services
- Templates de devis prédéfinis
