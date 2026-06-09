# Identifiants de test — SR Rénovation (devis/factures)

## Accès Frontend (écran PIN)
- PIN: `0330`

## Base de données
- Données de PRODUCTION réelles (vrais clients). ⚠️ NE JAMAIS envoyer d'email de test.
- DB locale via MONGO_URL / DB_NAME (backend/.env).

## Profils entreprise (collection `profiles`)
- "SR Rénovation" — id: `e5a4b05f-4811-4e9c-a5e1-408545a10d80` (is_default = False)
- "Câble Ethernet Ugreen" — id: `4ecc93d3-f98f-462e-9a8f-88f1cd449b9b` (is_default = True) — semble être un profil de test créé par l'utilisateur.

## Notes pour les tests
- Pour tester l'envoi d'email, MOCKER l'appel Resend ou utiliser une adresse factice. Vrais clients en base.
- Pour créer des devis de test via API, utiliser work_location contenant "a supprimer" puis nettoyer.
