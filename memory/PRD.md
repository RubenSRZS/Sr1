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
- Iteration 13 (09/06/2026): 100% — Sélection profil par devis + options dynamiques illimitées + remises € (backend 8/8 pytest, frontend UI OK)

## Implémenté le 09/06/2026
- **Sélection du profil entreprise par devis**: petit sélecteur (icône bâtiment) à côté du bouton mode nuit (mobile + desktop). Le profil choisi alimente la carte 'Entreprise' de l'aperçu/PDF (avant codé en dur 'Ruben SUAREZ-SAR'). Snapshot `company` stocké sur le devis. Backend: `profile_id` + `company` sur Quote, helper `resolve_company`.
- **Options dynamiques illimitées**: bouton 'Ajouter une option' crée Option 2,3,4...; chaque option a titre/services/remise globale et un bouton de suppression individuel. Backend: modèle `OptionBlock`, champ `additional_options` (POST/PUT), synchronisation rétro-compatible vers option_2/option_3 (2 premières) pour anciens consommateurs (PDF legacy, page publique). PDFPreview rend `additional_options` (fallback legacy). Page publique: cases à cocher dynamiques.
- **Remises en € (montant fixe)**: modèle `Service` backend inclut désormais `remise_type`/`remise_montant` (persistance des remises de ligne). Recalcul correct des totaux ligne + option + global.

## Implémenté le 09/06/2026 (session 2)
- **Réorganisation du catalogue**: Les catégories sont maintenant triées dans l'ordre défini (TOITURE → FAÇADE → ZINGUERIE & HABILLAGE → SOLS & EXTÉRIEURS → Autres). Avant, l'ordre était aléatoire (ZINGUERIE apparaissait en premier).
- **Barre de recherche dans le catalogue**: Champ de recherche en haut de la boîte de dialogue pour filtrer en temps réel par nom ou description de prestation. Auto-focus, message "aucun résultat" si rien ne correspond.

## Implémenté le 09/06/2026 (session 3)
- **Correctif remises sur prestations (PDFPreview + QuoteForm)**: 
  - Indicateur de remise sur les lignes de service: affiche maintenant `(-100.00 €)` ou `(-10%)` selon le type
  - TotalsSection PDF: affiche désormais "Total avant remises" + "Remise: -X€" quand remise_totale > 0 (utilise remise_totale = lignes + globale, avant on n'utilisait que la remise globale)
  - previewDoc des options dynamiques: inclut maintenant remise_totale correctement
  - Test: 6/6 scénarios PASS (remise €, remise %, sans remise, aperçu PDF, indicateurs lignes)

## Implémenté le 09/06/2026 (session 4 — Relances automatiques)
**Système de relances automatiques complet:**
- APScheduler (8h00 Paris, skip dimanche) envoi emails J+3, J+7, J+14, J+30
- Relances activées auto quand devis envoyé par email, réinitialisées sur renvoi
- Toggle ON/OFF par devis (bouton Bell) — arrêt immédiat si client répond par tél
- Bouton "Marquer perdu" (XCircle) — arrête relances + archive avec statut `lost`
- Arrêt automatique si devis signé (`status=accepted`)
- Modèles d'emails éditables sur /relances (4 templates: J+3,7,14,30 avec variables)
- Redesign QuotesList: onglets Tous/Brouillons/En attente/Signés/Perdus
- Redesign InvoicesList: onglets Toutes/En attente (pending+partial)/Payées + stats header
- Carte "Relances Automatiques" dans Dashboard avec lien /relances
- Tests: 17/17 backend + frontend critical flows OK

## Backlog priorisé

### P0 — À confirmer avec l'utilisateur
- Le profil par défaut actuel est "Câble Ethernet Ugreen" (semble être un profil de test). L'utilisateur voudra probablement définir "SR Rénovation" comme profil par défaut (page Profil / bouton 'définir par défaut').

### P1 — À venir
- Dashboard statut des devis (section envoyés/ouverts/signés)
- Push GitHub (RubenSRZS/Sr1) via le bouton "Save to Github" quand l'utilisateur valide.

### P2
- PDF preview fond blanc en mode sombre

### P3 — Futur
- Dashboard: graphiques de revenus
- Drag & drop pour réorganiser les services
- Templates de devis prédéfinis
