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

### Templates PDF multiples (Juin 2026)
- Système de thèmes paramétrable dans `PDFPreview.js` (`PDF_THEMES` + `getTheme` + `ACTIVE_THEME`).
- Template `sr_renovation` (défaut) = rendu d'origine STRICTEMENT inchangé (bleu+orange, logos SR, drapeau, partenaires).
- Nouveau template `sd_renovation` = couleurs vert sapin (#2f6b66) + orange (#cf6a23), logo SD transparent (header + footer), sans logos partenaires SR, sans signature Ruben, pied de page basé sur les infos du profil.
- Logo SD optimisé en base64 webp (~33KB) dans `lib/logoConstants.js` (LOGO_SD_B64).
- Champ `pdf_template` ajouté au modèle Profile (backend) + sélecteur dans ProfileManager.
- `resolve_company` injecte `template` dans le snapshot company (devis ET factures).
- Sélecteur discret "Modèle PDF" (icône Palette) dans QuoteForm + InvoiceForm (override par document, mobile + desktop).
- InvoiceForm dispose maintenant aussi d'un sélecteur de Profil (les factures portent profile_id + company snapshot).
- Profil "SD Renovation" (David) configuré par défaut sur le template `sd_renovation`.
- ⚠️ Le template S.R. Rénovation ne doit JAMAIS être modifié/supprimé.

### Core
- Dashboard, clients CRUD, devis/factures avec aperçu PDF en temps réel
- Catalogue de services avec catégories et couleurs (accès depuis Accueil)
- Diagnostic visuel hiérarchique, conversion devis->facture
- Mode sombre global, numérotation personnalisée, options multiples, remises

### Performance (Feb 2026)
- Lazy loading de toutes les routes (React.lazy + Suspense) → bundle initial réduit
- Cache global (DataCacheContext, TTL 60s) pour quotes/invoices/clients/profiles/catalog/stats
- Préfetch en arrière-plan après le premier paint

### CRM véritable (Feb 2026)
- Page /crm avec liste clients gauche + détail droite (responsive mobile)
- Bloc-notes par client avec calculs auto inline (10x100 = 1000, 5+7, 200/4...)
- Auto-save debouncée (800ms)
- Timeline complète (devis + factures + statuts + ouvertures)
- Stats par client (count devis, total signé, total facturé)
- Endpoints : GET /clients/{id}/timeline, PATCH /clients/{id}/notes

### Recherche globale (Feb 2026)
- Composant GlobalSearch avec raccourci Ctrl/Cmd + K et "/"
- Recherche cross-entity (devis, factures, clients)
- Navigation clavier ↑ ↓ ⏎

### Envoi devis/factures (Feb 2026)
- Pièces jointes multiples (attestation assurance, photos, PDF) — max 10 Mo
- Bouton WhatsApp natif amélioré (icône SVG + gestion absence de téléphone)
- Aperçu plein écran PC (en plus du mobile)
- Tracking ouvertures : open_count + last_opened_at affichés en badge "Ouvert X×"

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

## Implémenté le 14/06/2026 (corrections CRM + envoi)
- **Fix bloc-notes CRM (bug majeur)**: l'auto-save appelait `invalidate('clients')` → la liste passait à `null` → le panneau détail se démontait/remontait en plein milieu de la frappe, le textarea perdait le focus et se réinitialisait (d'où "les opérations ne fonctionnent pas"). Corrigé via `patchCacheItem`/`removeCacheItem` (DataCacheContext) qui met à jour le client en place sans refetch. `ClientDetail` ne refait plus `setNotes` sur chaque changement de prop (useEffect dépend de `[client.id]` uniquement).
- **Total des calculs**: ajout d'une ligne "Total" (somme des lignes calculées) sous l'aperçu du bloc-notes quand ≥2 opérations.
- **Tri des clients**: nouveau sélecteur (data-testid=crm-sort-select) — Nom (A→Z), Récemment modifié, Récemment ajouté. Backend: champ `updated_at` sur Client, mis à jour sur PATCH notes et PUT client.
- **Catalogue restauré dans la nav PC** (DesktopNav) — retiré uniquement de la barre mobile du bas (BottomNav), comme demandé.
- **Modals d'envoi**: pied de page collant (sticky bottom-0) avec "Envoyer par email" + "Envoyer par WhatsApp" toujours visibles sans scroller (SendQuoteModal + SendInvoiceModal).
- Tests: iteration_17.json 16/16 PASS (frontend).

## Implémenté le 14/06/2026 (session 2 — refonte bloc-notes + analytics)
- **Refonte bloc-notes CRM (demande explicite)**: suppression du double panneau (jaune + blanc). Nouveau composant `SmartNotes` = un seul bloc où chaque ligne est un champ et le **résultat s'affiche inline, à droite de la ligne écrite** (10x100 → "= 1 000"). Entrée = nouvelle ligne, Backspace en début de ligne = fusion, flèches ↑↓ pour naviguer, curseur stable. Ligne "Total" si ≥2 calculs.
- **Mini-dashboard analytics "Performance"** sur l'Accueil: 3 KPI (taux de conversion signés/envoyés, délai moyen de signature, total signé), graphique CA des 6 derniers mois (recharts BarChart), top 5 clients facturés (barres de progression). Endpoint backend `GET /api/stats/analytics`. Composant `AnalyticsSection.jsx`. Cache `fetchAnalytics`.
- Tests: iteration_18.json — backend 6/6 pytest, frontend 22/22 PASS.

## Implémenté le 14/06/2026 (session 3 — retours utilisateur)
- **Calculs en pourcentage** dans le bloc-notes : `1000-30%` = 700, `1000+20%` = 1200, `1000*30%` = 300, `30%` = 0,3 (+ tous les calculs existants). Logique `evalExpression` réécrite (evalCore + patterns %).
- **Création client allégée** : seul le **nom** est obligatoire. Téléphone, email, adresse et note sont optionnels (style "Notes iPhone" — on peut juste mettre un nom et noter directement). Backend `ClientCreate` : phone/address désormais Optional. Champ Note ajouté à la création.
- **KPI mobile** : "Total signé" ne passe plus le € à la ligne (whitespace-nowrap + montant arrondi + espace insécable).
- **Dates dans la timeline** : badges "Envoyé le 28 avr.", "Ouvert le 24 avr.", "Signé le …", "Perdu le …".
- Tests: iteration_19.json — frontend 16/16 PASS.

## Implémenté le 19/06/2026
- **Signature entreprise sur template SD Rénovation** : `signatureLogo` était `null` dans le thème SD → changé en `LOGO_SIGN_URL` (même signature que SR). Rétrocompatible (B64 map déjà présente).
- **Correctif envoi email avec templates** : `SendQuoteModal` remplaçait `company` du devis par le profil brut (`pdf_template`) → PDFPreview lisait `company.template = undefined` → fallback SR template. Désormais le template du devis est préservé (`quote.company.template || profile.pdf_template`).

### P0 — À confirmer avec l'utilisateur
- Le profil par défaut actuel est "Câble Ethernet Ugreen" (semble être un profil de test). L'utilisateur voudra probablement définir "SR Rénovation" comme profil par défaut (page Profil / bouton 'définir par défaut').

## Session du 20/06/2026
- **Contact SD sur page publique** : résolution via profil correspondant au template (David/SD), non plus Ruben par défaut
- **Sélecteurs profil/template liés** : changer l'un met à jour l'autre automatiquement (QuoteForm + InvoiceForm)
- **Header mobile** : sélecteurs dans container scrollable, ne débordent plus
- **Prix forfaitaire** : toggle dans le formulaire devis, PDF masque les colonnes prix, badge "PRIX FORFAITAIRE" visible, backend stocke et calcule l'acompte 30%
- **Assistant IA** : prompt enrichi avec descriptions complètes du catalogue, Gemini utilise désormais la description du service et pas seulement le titre

## Session du 12/07/2026 — Relances IA (Phase 3)
- **Mode relances configurable** : `relance_mode` (auto | ai) dans settings — GET/PUT `/api/relances/mode`
- **Génération IA (Gemini 2.5 Flash)** : brouillons de relance personnalisés (montant, chantier, ouvertures, ton selon J+3/7/14/30), fallback template classique si échec IA
- **File de validation** : collection `ai_relances`, endpoints GET `/api/ai-relances`, PUT (édition), POST `/send`, `/reject`, POST `/api/ai-relances/generate/{quote_id}` (manuel)
- **Scheduler** : en mode IA, `run_relances` met en file au lieu d'envoyer (1 brouillon pending max par devis)
- **UI /relances** : composant `AIRelanceQueue.jsx` — toggle mode + file éditable avec Valider & envoyer / Rejeter
- **Dashboard** : widget `FollowUpWidget.jsx` "Devis à relancer" (envoyés ≥5j non signés, bouton Relance IA)
- Testé via curl : génération Gemini OK (email personnalisé signé SD/SR selon devis), file, rejet, modes. Mode laissé sur "auto" par défaut.

## Session du 25/07/2026 — Crash blanc devis + page "Voir"
- **ErrorBoundary global** (`ErrorBoundary.jsx`, wrap dans App.js) : plus jamais d'écran blanc — UI d'erreur FR avec Recharger/Accueil + auto-reload sur ChunkLoadError (chunks lazy périmés après déploiement, cause probable du crash prod)
- **Guards null** : `total_net` (QuotesList x2, QuoteView), `inst.amount` (PDFPreview) — anciens devis avec company/champs null ne crashent plus
- **Nouvelle page lecture seule** `/quotes/view/:id` (`QuoteView.jsx`) : aperçu PDF + boutons Envoyer (SendQuoteModal intégré), Modifier, PDF, retour — bouton "Voir" de la liste pointe dessus
- Tests : iteration_20.json — 100% PASS (15/15 frontend, 3/3 backend, mobile inclus)
- Retour utilisateur : bouton "Modifier" ajouté à côté de "Voir" dans la liste des devis + scroll en haut de page à l'ouverture de /quotes/view (vérifié screenshot, scrollY=0)

## Session du 25/07/2026 (suite) — Vitesse + chevauchement en-tête mobile
- **Fix chevauchement** : en-tête mobile QuoteForm/InvoiceForm — titre truncate + flex min-w-0, sélecteurs maxWidth 55vw (testé iteration_21 : bounding boxes sans overlap)
- **Service worker** (`public/sw.js`, enregistré en production uniquement) : cache-first des assets statiques + network-first pour index.html → démarrage quasi instantané après 1re visite, même connexion lente. Actif seulement sur le build prod du VPS.
- **Nettoyage code mort** : supprimé PDFGenerator.js, PDFGeneratorPro.js, PDFGenerator_simple.js, SendQuoteModal backups (~1900 lignes)
- Tests : iteration_21.json — 100% PASS (mobile + desktop + backend smoke)
- **Séparation des cartes devis/factures** : bordure slate-200 + ombre + coins arrondis + écart mb-4 entre chaque carte (retour utilisateur "les cases se fondent") — vérifié screenshot desktop

### P1 — À venir
- Push GitHub (RubenSRZS/Sr1) via le bouton "Save to Github"
- Prix forfaitaire pour les Factures

### P2
- Refactorisation server.py (2164+ lignes)
- PDF preview fond blanc en mode sombre

### P3 — Futur
- Dashboard: graphiques de revenus
- Drag & drop pour réorganiser les services
- Templates de devis prédéfinis
