import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_CATALOG = [
  // ───────────── TOITURE ─────────────
  { category: 'TOITURE', service_name: 'Nettoyage haute pression', description: 'Nettoyage complet de la toiture au nettoyeur haute pression professionnel\n- Élimination mousses, lichens et débris\n- Travail soigné avec protection des végétaux', default_price: 15, default_unit: 'm²' },
  { category: 'TOITURE', service_name: 'Traitement anti-mousse', description: 'Application d\'un traitement anti-mousse préventif longue durée\n- Produit professionnel biodégradable\n- Garantie efficacité 3 ans', default_price: 8, default_unit: 'm²' },
  { category: 'TOITURE', service_name: 'Traitement hydrofuge', description: 'Application d\'un hydrofuge coloré ou incolore\n- Protection contre l\'humidité et le gel\n- Améliore l\'esthétique de la toiture', default_price: 12, default_unit: 'm²' },
  { category: 'TOITURE', service_name: 'Démoussage manuel', description: 'Démoussage manuel à la brosse\n- Idéal pour tuiles fragiles\n- Travail minutieux', default_price: 18, default_unit: 'm²' },
  { category: 'TOITURE', service_name: 'Remplacement tuiles cassées', description: 'Fourniture et pose de tuiles de remplacement\n- Tuiles identiques ou approchantes\n- Vérification étanchéité', default_price: 45, default_unit: 'unité' },
  { category: 'TOITURE', service_name: 'Réfection faîtage', description: 'Réfection complète du faîtage\n- Dépose ancien faîtage\n- Pose nouveaux faîtiers au mortier', default_price: 65, default_unit: 'ML' },
  { category: 'TOITURE', service_name: 'Réparation fuite', description: 'Recherche et réparation de fuite\n- Diagnostic complet\n- Intervention ciblée', default_price: 150, default_unit: 'forfait' },
  
  // ───────────── FAÇADE ─────────────
  { category: 'FAÇADE', service_name: 'Nettoyage façade', description: 'Nettoyage complet de la façade\n- Haute pression adaptée au support\n- Élimination salissures et traces noires', default_price: 12, default_unit: 'm²' },
  { category: 'FAÇADE', service_name: 'Traitement anti-mousse façade', description: 'Application d\'un traitement anti-mousse sur façade\n- Action préventive longue durée\n- Produit professionnel', default_price: 6, default_unit: 'm²' },
  { category: 'FAÇADE', service_name: 'Hydrofuge façade', description: 'Application d\'un hydrofuge de façade\n- Protection contre les infiltrations\n- Effet perlant visible', default_price: 10, default_unit: 'm²' },
  { category: 'FAÇADE', service_name: 'Peinture façade', description: 'Peinture complète de la façade\n- 2 couches de peinture façade\n- Large choix de coloris', default_price: 25, default_unit: 'm²' },
  { category: 'FAÇADE', service_name: 'Rebouchage fissures', description: 'Rebouchage de fissures sur façade\n- Préparation du support\n- Enduit de réparation', default_price: 35, default_unit: 'ML' },
  
  // ───────────── ZINGUERIE & HABILLAGE ─────────────
  { category: 'ZINGUERIE & HABILLAGE', service_name: 'Nettoyage gouttières', description: 'Nettoyage complet des gouttières\n- Évacuation débris et feuilles\n- Vérification écoulement', default_price: 8, default_unit: 'ML' },
  { category: 'ZINGUERIE & HABILLAGE', service_name: 'Remplacement gouttière', description: 'Fourniture et pose de gouttière neuve\n- Gouttière PVC ou alu\n- Accessoires de fixation inclus', default_price: 45, default_unit: 'ML' },
  { category: 'ZINGUERIE & HABILLAGE', service_name: 'Remplacement descente EP', description: 'Fourniture et pose de descente d\'eau pluviale\n- PVC ou alu au choix\n- Colliers de fixation inclus', default_price: 55, default_unit: 'ML' },
  { category: 'ZINGUERIE & HABILLAGE', service_name: 'Habillage planche de rive', description: 'Habillage des planches de rive en PVC ou alu\n- Protection définitive du bois\n- Large choix de coloris', default_price: 35, default_unit: 'ML' },
  { category: 'ZINGUERIE & HABILLAGE', service_name: 'Habillage dessous de toit', description: 'Pose de lambris PVC sous débord de toit\n- Finition soignée\n- Ventilation intégrée', default_price: 55, default_unit: 'm²' },
  
  // ───────────── SOLS & EXTÉRIEURS ─────────────
  { category: 'SOLS & EXTÉRIEURS', service_name: 'Nettoyage terrasse', description: 'Nettoyage haute pression de terrasse\n- Tous types de dalles\n- Élimination mousses et taches', default_price: 10, default_unit: 'm²' },
  { category: 'SOLS & EXTÉRIEURS', service_name: 'Nettoyage allée', description: 'Nettoyage haute pression d\'allée\n- Béton, pavés, enrobé\n- Résultat impeccable', default_price: 8, default_unit: 'm²' },
  { category: 'SOLS & EXTÉRIEURS', service_name: 'Traitement anti-mousse sol', description: 'Traitement préventif anti-mousse pour sols extérieurs\n- Efficacité longue durée\n- Sans danger pour l\'environnement', default_price: 5, default_unit: 'm²' },
  { category: 'SOLS & EXTÉRIEURS', service_name: 'Nettoyage muret/clôture', description: 'Nettoyage de murets et clôtures\n- Parpaings, pierre, bois\n- Élimination verdissures', default_price: 12, default_unit: 'm²' },
];

export const initializeDefaultCatalog = async () => {
  try {
    const response = await axios.get(`${API}/catalog`);
    if (response.data.length === 0) {
      // Catalogue vide, on initialise avec les valeurs par défaut
      for (const item of DEFAULT_CATALOG) {
        await axios.post(`${API}/catalog`, item);
      }
      console.log('Catalogue initialisé avec les valeurs par défaut');
    }
  } catch (error) {
    console.error('Erreur initialisation catalogue:', error);
  }
};

export default DEFAULT_CATALOG;
