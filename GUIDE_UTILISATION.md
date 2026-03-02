# 🎯 GUIDE COMPLET - Utilisation & Déploiement

## ✨ NOUVELLES FONCTIONNALITÉS AJOUTÉES

### 1. 📋 **Copier-Coller Intelligent avec IA**

Vous pouvez maintenant copier-coller TOUT votre texte brut directement dans le champ IA :

**Exemple de texte que vous pouvez copier-coller :**
```
Mr Clere Nicolas 
2,Rue des Maisonnettes 
25480 Ecole-Valentin
nicolasclere25000@orange.fr

140 M2 sans les panneau solaire 
187 m2 avec les panneau solaire 

Demoussage manuelle + traitement longue durée
12€ m2

Hydrofuge Préventif 8€ m2

Traitement action rapide 10€ m2

Promotion -30%

Traitement longue durée + hydrofuge
20 - 30% = 14€ 

Total: 14 x 140 = 1960€
```

**Comment ça marche :**
1. Allez dans "Devis" → "Nouveau Devis"
2. Sélectionnez un client (ou créez-en un rapidement)
3. **COLLEZ tout votre texte dans le champ "Génération automatique IA"**
4. Cliquez sur "Générer avec l'IA"
5. ✨ **L'IA extrait automatiquement** :
   - Les infos client (nom, adresse, email, surface)
   - Les services avec leurs prix
   - Les promotions appliquées
   - Génère les descriptions professionnelles
6. Vous n'avez plus qu'à vérifier et ajuster si besoin
7. Enregistrer !

### 2. 👁️ **Prévisualisation PDF Professionnelle**

Un design unique qui vous démarque de la concurrence !

**Comment prévisualiser :**
1. Après avoir enregistré un devis ou une facture
2. Cliquez sur le bouton **"Prévisualiser"** (icône œil 👁️)
3. Vous verrez exactement à quoi ressemble le document final
4. Design professionnel avec :
   - Votre logo SR Renovation
   - Couleurs bleu/orange de votre site
   - Mise en page claire et moderne
   - Totalement différent des PDF standards

**Caractéristiques du design PDF :**
- ✅ Header avec votre logo en grand
- ✅ Numérotation automatique (DEV-2026-XXXX, FACT-2026-XXXX)
- ✅ Sections colorées (bleu pour l'entreprise, orange pour le client)
- ✅ Table des services professionnelle
- ✅ Footer avec toutes vos infos légales
- ✅ Mentions RC Pro, SIRET, garantie 10 ans

### 3. 🔄 **Conversion Devis → Facture** (À venir)

Cette fonction sera ajoutée prochainement. Pour l'instant :
- Créez vos devis normalement
- Pour la facture, créez une nouvelle facture en reprenant les infos du devis

---

## 📱 COMMENT RÉCUPÉRER VOTRE APPLICATION ?

Vous avez **3 options** pour utiliser votre application :

### **Option 1 : Utiliser la Preview Emergent (RECOMMANDÉ pour tester)**

✅ **URL actuelle** : https://renovation-quotes-1.preview.emergentagent.com

**Avantages :**
- ✅ Gratuit en preview
- ✅ Fonctionne immédiatement
- ✅ Accessible depuis n'importe quel appareil (PC, mobile, tablette)
- ✅ Parfait pour tester et utiliser pendant quelques jours

**Limites :**
- ⚠️ Preview = temporaire
- ⚠️ Les données peuvent être effacées lors d'une mise à jour

**Comment l'utiliser :**
1. Ouvrez l'URL dans votre navigateur
2. Sur mobile : Ajoutez à l'écran d'accueil
   - **iPhone** : Safari → Partager → "Sur l'écran d'accueil"
   - **Android** : Chrome → Menu (3 points) → "Ajouter à l'écran d'accueil"
3. Utilisez-la comme une app normale !

---

### **Option 2 : DÉPLOYER sur Emergent (RECOMMANDÉ pour production)**

Pour avoir votre application **EN PERMANENCE** avec VOS données sauvegardées :

#### **Étapes de déploiement :**

1. **Cliquez sur le bouton "Deploy"** dans l'interface Emergent
2. **Cliquez sur "Deploy Now"**
3. **Attendez 10-15 minutes** (temps de déploiement)
4. **Vous recevrez une URL permanente** comme :
   - `https://votre-app.emergentagent.com`

#### **Coût :**
- **50 crédits/mois** par application déployée
- Toute l'infrastructure gérée pour vous (serveur, base de données, etc.)
- Vous pouvez arrêter le déploiement à tout moment

#### **Avantages :**
- ✅ Application permanente
- ✅ Vos données sont sauvegardées
- ✅ URL stable que vous pouvez partager
- ✅ Accessible 24/7 depuis n'importe où
- ✅ Sauvegardes automatiques
- ✅ Certificat SSL (https)

#### **Configuration après déploiement :**

1. **Ajoutez votre clé Resend** (pour l'envoi d'emails) :
   - Allez sur [resend.com](https://resend.com)
   - Créez un compte gratuit
   - Générez une clé API
   - Dans Emergent, ajoutez la variable d'environnement :
     ```
     RESEND_API_KEY=re_votre_cle_ici
     SENDER_EMAIL=votre-email@votre-domaine.com
     ```
   - Redéployez

2. **L'IA est déjà configurée** avec la clé Emergent
   - Si le budget est faible, rechargez via : Profile → Universal Key → Add Balance

---

### **Option 3 : Domaine personnalisé (optionnel)**

Si vous voulez une URL comme `devis.sr-renovation.fr` :

1. **D'abord déployez** (Option 2)
2. **Dans Emergent** : Cliquez sur "Link domain"
3. **Entrez votre nom de domaine**
4. **Suivez les instructions** pour configurer le DNS
5. Votre app sera accessible sur votre propre domaine !

---

## 🚀 UTILISATION QUOTIDIENNE

### **Workflow recommandé :**

#### **Sur Chantier (Mobile) :**
1. Ouvrez l'app sur votre téléphone
2. Allez dans "Devis" → "Nouveau Devis"
3. Sélectionnez ou créez le client
4. **COLLEZ votre texte brut** avec toutes les infos dans le champ IA
5. Générez avec l'IA
6. Ajustez si besoin
7. Enregistrez
8. **Prévisualisez** pour vérifier
9. Envoyez par email au client

#### **Au Bureau (PC) :**
1. Consultez le dashboard pour voir vos stats
2. Gérez vos clients
3. Créez des devis/factures plus complexes
4. Gérez votre catalogue de services
5. Suivez vos paiements

---

## 📋 CHECKLIST AVANT DE COMMENCER

- [ ] Testez l'app en preview
- [ ] Créez quelques clients de test
- [ ] Testez la génération IA avec un copier-coller
- [ ] Vérifiez la prévisualisation PDF
- [ ] Décidez si vous voulez déployer
- [ ] Si déploiement : créez un compte Resend
- [ ] Configurez votre clé Resend
- [ ] Rechargez le budget IA Emergent si nécessaire

---

## 🆘 BESOIN D'AIDE ?

### **L'IA ne génère pas ?**
- Vérifiez que vous avez du budget sur la clé Emergent
- Rechargez : Profile → Universal Key → Add Balance
- Vérifiez que votre texte contient bien les infos nécessaires

### **Les emails ne partent pas ?**
- Vérifiez que RESEND_API_KEY est configurée
- Vérifiez SENDER_EMAIL
- En mode test Resend, les emails vont uniquement aux adresses vérifiées

### **Je veux un design PDF différent ?**
- Le design actuel est unique et professionnel
- Il respecte l'identité Sr-Renovation (bleu/orange, logo, style)
- Vous pouvez demander des ajustements si besoin

---

## 💡 ASTUCES PRO

1. **Sauvegardez vos phrases types** dans le Catalogue pour réutiliser
2. **Utilisez les promotions** dans les notes (ex: "Promotion -30% appliquée")
3. **Prévisualisez toujours** avant d'envoyer
4. **Gardez l'app sur l'écran d'accueil** de votre téléphone
5. **Faites des devis sur chantier** directement

---

**Questions ? Demandez de l'aide !**
