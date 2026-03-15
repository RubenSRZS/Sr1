# Sr-Renovation.fr — Devis & Factures Pro

## Problème original
Application web pour créer des devis et factures professionnels et personnalisés pour Sr-Renovation.fr, avec un design aligné à la marque et une approche mobile-first.

## Architecture
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI + Pydantic
- **Database:** MongoDB
- **PDF:** html2canvas + jspdf

## Fonctionnalités implémentées
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

## Corrections 15 Mars 2026
- **Diagnostic visuel** : Rendu PDF corrigé — les sous-options sont groupées sous leur catégorie (ex: "Gouttières : Obstruée, Encrassée")
- **Couleurs catalogue** : Tous les items ont maintenant leur couleur de catégorie (TOITURE=bleu, FAÇADE=orange, ZINGUERIE=vert, SOLS=violet)
- **Backend diagnostic** : Champ `diagnostic` changé de modèle Pydantic rigide vers `Optional[dict]`
- **Doublons catalogue** : Nettoyés, couleurs assignées automatiquement par catégorie
- **Tests** : 100% backend (7/7), 100% frontend (6/6)

## Backlog priorisé

### P1 — À venir
- Guide de déploiement (auto-hébergement gratuit et sécurisé)
- Acceptation de devis en ligne (lien unique + signature)
- Envoi de documents par email

### P2 — Vérification
- PDF preview fond blanc en mode sombre (à vérifier)

### P3 — Futur
- Dashboard : graphiques de revenus et indicateurs visuels
- Drag & drop pour réorganiser les services
- Templates de devis prédéfinis
