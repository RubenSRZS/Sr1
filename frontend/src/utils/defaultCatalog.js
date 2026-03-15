import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_CATALOG = [
  // ───────────── TOITURE ─────────────
  { category: 'TOITURE', service_name: 'Nettoyage haute pression', description: '', default_price: 15, default_unit: 'm²' },
  { category: 'TOITURE', service_name: 'Traitement anti-mousse', description: '', default_price: 8, default_unit: 'm²' },
  { category: 'TOITURE', service_name: 'Traitement hydrofuge', description: '', default_price: 12, default_unit: 'm²' },
  { category: 'TOITURE', service_name: 'Démoussage manuel', description: '', default_price: 18, default_unit: 'm²' },
  { category: 'TOITURE', service_name: 'Remplacement tuiles cassées', description: '', default_price: 45, default_unit: 'unité' },
  { category: 'TOITURE', service_name: 'Réfection faîtage', description: '', default_price: 65, default_unit: 'ML' },
  { category: 'TOITURE', service_name: 'Réparation fuite', description: '', default_price: 150, default_unit: 'forfait' },
  
  // ───────────── FAÇADE ─────────────
  { category: 'FAÇADE', service_name: 'Nettoyage façade', description: '', default_price: 12, default_unit: 'm²' },
  { category: 'FAÇADE', service_name: 'Traitement anti-mousse façade', description: '', default_price: 6, default_unit: 'm²' },
  { category: 'FAÇADE', service_name: 'Hydrofuge façade', description: '', default_price: 10, default_unit: 'm²' },
  { category: 'FAÇADE', service_name: 'Peinture façade', description: '', default_price: 25, default_unit: 'm²' },
  { category: 'FAÇADE', service_name: 'Rebouchage fissures', description: '', default_price: 35, default_unit: 'ML' },
  
  // ───────────── ZINGUERIE & HABILLAGE ─────────────
  { category: 'ZINGUERIE & HABILLAGE', service_name: 'Nettoyage gouttières', description: '', default_price: 8, default_unit: 'ML' },
  { category: 'ZINGUERIE & HABILLAGE', service_name: 'Remplacement gouttière', description: '', default_price: 45, default_unit: 'ML' },
  { category: 'ZINGUERIE & HABILLAGE', service_name: 'Remplacement descente EP', description: '', default_price: 55, default_unit: 'ML' },
  { category: 'ZINGUERIE & HABILLAGE', service_name: 'Habillage planche de rive', description: '', default_price: 35, default_unit: 'ML' },
  { category: 'ZINGUERIE & HABILLAGE', service_name: 'Habillage dessous de toit', description: '', default_price: 55, default_unit: 'm²' },
  
  // ───────────── SOLS & EXTÉRIEURS ─────────────
  { category: 'SOLS & EXTÉRIEURS', service_name: 'Nettoyage terrasse', description: '', default_price: 10, default_unit: 'm²' },
  { category: 'SOLS & EXTÉRIEURS', service_name: 'Nettoyage allée', description: '', default_price: 8, default_unit: 'm²' },
  { category: 'SOLS & EXTÉRIEURS', service_name: 'Traitement anti-mousse sol', description: '', default_price: 5, default_unit: 'm²' },
  { category: 'SOLS & EXTÉRIEURS', service_name: 'Nettoyage muret/clôture', description: '', default_price: 12, default_unit: 'm²' },
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
