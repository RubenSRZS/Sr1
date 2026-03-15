# Sr-Renovation.fr — Devis & Factures Pro

## Problème original
Application web pour créer des devis et factures professionnels et personnalisés pour Sr-Renovation.fr, avec un design aligné à la marque et une approche mobile-first.

## Architecture
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI + Pydantic
- **Database:** MongoDB
- **PDF:** html2canvas + jspdf
- **Email:** Resend API

## Fonctionnalités implémentées

### Core
- Dashboard avec statistiques (clients, devis, factures, CA)
- Gestion complète des clients (CRUD, tri alphabétique/récent)
- Création/édition de devis avec aperçu PDF en temps réel
- Création/édition de factures avec statut de paiement
- Catalogue de services avec catégories et couleurs
- Diagnostic visuel hiérarchique (groupes/sous-options)
- Conversion devis → facture
- Mode sombre global
- Numérotation personnalisée des documents
- Options multiples par devis (jusqu'à 3)
- Remises et unités personnalisées

### Sécurité (15 Mars 2026)
- Protection par code PIN (4 chiffres) à l'entrée de l'app
- Option "Code oublié" — envoi par email via Resend
- Option "Changer le code" avec vérification du code actuel
- Routes publiques séparées (pas de PIN requis pour les clients)

### Système d'envoi & signature en ligne (15 Mars 2026)
- Page publique de devis mobile-first aux couleurs SR Rénovation
- Lien unique sécurisé par devis (token aléatoire 32 chars)
- Signature en ligne (canvas tactile pour mobile)
- Bouton "Accepter et signer le devis"
- Suivi : consulté (opened_at), signé (signed_at)
- Notification email à l'admin quand un devis est signé
- Email professionnel avec template HTML responsive
- Texte prédéfini modifiable avant chaque envoi
- Bouton "Envoyer" sur chaque devis dans la liste
- Badges de tracking : Envoyé / Ouvert / Signé

### Correction critique (15 Mars 2026)
- **Page publique = PDF identique** : La page publique réutilise directement le composant `PDFDocument` du PDF preview, garantissant une identité visuelle parfaite
- Backend mis à jour pour retourner tous les champs nécessaires au composant PDF

### Corrections antérieures (15 Mars 2026)
- Diagnostic visuel : rendu PDF groupé (ex: "Gouttières : Obstruée, Encrassée")
- Couleurs catalogue : items affichés avec couleur de catégorie
- Backend diagnostic : champ changé de Pydantic rigide vers dict
- Doublons catalogue nettoyés

## Tests
- Iteration 8 : 100% pass — catalogue couleurs + diagnostic (7/7 backend, 6/6 frontend)
- Iteration 9 : 100% pass — PIN auth + page publique + envoi email (15/15 backend, 10/10 frontend)
- Iteration 10 : 100% pass — Parité visuelle page publique/PDF (9/9 backend, 12/12 frontend)

## Backlog priorisé

### P0 — Fait
- ~~Parité visuelle page publique / PDF~~ FAIT
- ~~Guide de déploiement (Render + Oracle Cloud)~~ FAIT → /app/GUIDE_DEPLOIEMENT.md

### P1 — À venir
- Dashboard statut des devis (section pour voir envoyés/ouverts/signés)
- Domaine email personnalisé (remplacer onboarding@resend.dev par un email @sr-renovation.fr — nécessite vérification DNS côté utilisateur)
- Texte email prédéfini modifiable avant envoi

### P2 — Vérification
- PDF preview fond blanc en mode sombre

### P3 — Futur
- Dashboard : graphiques de revenus et indicateurs visuels
- Drag & drop pour réorganiser les services
- Templates de devis prédéfinis
