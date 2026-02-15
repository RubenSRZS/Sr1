import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultCatalogItems = [
  // TOITURE
  {
    category: 'TOITURE',
    service_name: 'Nettoyage Toiture',
    description: 'Nettoyage professionnel sur la totalité des tuiles de l\'entièreté de la surface par traitement basse pression ou manuel selon l\'état de la toiture',
    default_price: 15.0,
  },
  {
    category: 'TOITURE',
    service_name: 'Traitement Antimousse',
    description: 'Application de traitement antimousse curatif et préventif à action rapide sur l\'ensemble de la couverture pour éliminer mousses et lichens',
    default_price: 8.0,
  },
  {
    category: 'TOITURE',
    service_name: 'Hydrofuge Incolore',
    description: 'Application d\'hydrofuge incolore haute qualité pour imperméabilisation et protection durable de la toiture contre les intempéries',
    default_price: 12.0,
  },
  {
    category: 'TOITURE',
    service_name: 'Révision Faîtage',
    description: 'Contrôle et réfection complète du faîtage avec vérification de l\'étanchéité et rénovation de la cimenterie si nécessaire',
    default_price: 45.0,
  },
  {
    category: 'TOITURE',
    service_name: 'Nettoyage Panneaux Solaires',
    description: 'Nettoyage délicat des panneaux photovoltaïques à l\'eau pure avec brossage doux pour optimiser le rendement énergétique',
    default_price: 150.0,
  },
  
  // FAÇADE
  {
    category: 'FAÇADE',
    service_name: 'Nettoyage Façade',
    description: 'Nettoyage haute pression professionnel de la façade pour élimination complète des salissures, traces noires et rouges',
    default_price: 10.0,
  },
  {
    category: 'FAÇADE',
    service_name: 'Nettoyage Bardage',
    description: 'Nettoyage spécialisé du bardage PVC, bois ou composite avec produits adaptés pour une remise à neuf sans détérioration',
    default_price: 12.0,
  },
  {
    category: 'FAÇADE',
    service_name: 'Traitement Hydrofuge Façade',
    description: 'Application de traitement hydrofuge incolore pour protection longue durée des murs contre l\'humidité et les infiltrations',
    default_price: 15.0,
  },
  {
    category: 'FAÇADE',
    service_name: 'Réparation Fissures',
    description: 'Rebouchage professionnel et localisé des fissures avec enduit de qualité supérieure et finition soignée',
    default_price: 80.0,
  },
  {
    category: 'FAÇADE',
    service_name: 'Rénovation Appuis de Fenêtre',
    description: 'Nettoyage approfondi et peinture de rénovation des appuis de fenêtre avec peinture spéciale extérieur haute résistance',
    default_price: 25.0,
  },
  
  // ZINGUERIE & HABILLAGE
  {
    category: 'ZINGUERIE & HABILLAGE',
    service_name: 'Entretien Gouttières',
    description: 'Nettoyage complet et vidage des gouttières avec vérification des coudes et évacuation des déchets pour un écoulement optimal',
    default_price: 80.0,
  },
  {
    category: 'ZINGUERIE & HABILLAGE',
    service_name: 'Remplacement Gouttières',
    description: 'Dépose de l\'ancienne installation et pose de gouttières neuves en zinc, aluminium ou PVC selon choix avec garantie décennale',
    default_price: 65.0,
  },
  {
    category: 'ZINGUERIE & HABILLAGE',
    service_name: 'Habillage Rives',
    description: 'Installation d\'habillage des rives en planches aluminium ou tôle thermolaquée pour protection et finition esthétique',
    default_price: 55.0,
  },
  {
    category: 'ZINGUERIE & HABILLAGE',
    service_name: 'Sous-face Toiture',
    description: 'Pose d\'habillage de sous-face en PVC blanc ou couleur pour protection et isolation des débords de toiture',
    default_price: 45.0,
  },
  
  // SOLS & EXTÉRIEURS
  {
    category: 'SOLS & EXTÉRIEURS',
    service_name: 'Nettoyage Terrasse',
    description: 'Nettoyage haute pression professionnel de la terrasse en dalles, pavés ou bois avec traitement anti-verdissement',
    default_price: 8.0,
  },
  {
    category: 'SOLS & EXTÉRIEURS',
    service_name: 'Protection Sol',
    description: 'Application de traitement hydrofuge et oléofuge pour protection durable contre l\'eau, les taches et les salissures',
    default_price: 12.0,
  },
  {
    category: 'SOLS & EXTÉRIEURS',
    service_name: 'Rénovation Murets',
    description: 'Remise en état complète des murets et clôtures avec rejointoiement, rebouchage et finition soignée',
    default_price: 120.0,
  },
  {
    category: 'SOLS & EXTÉRIEURS',
    service_name: 'Traitement Boiseries',
    description: 'Application de lasure ou peinture de protection sur volets, portails et barrières en bois pour résistance aux intempéries',
    default_price: 35.0,
  },
];

export const initializeDefaultCatalog = async () => {
  try {
    // Check if catalog is empty
    const res = await axios.get(`${API}/catalog`);
    if (res.data.length === 0) {
      // Add all default items
      for (const item of defaultCatalogItems) {
        await axios.post(`${API}/catalog`, item);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error initializing catalog:', error);
    return false;
  }
};

export default defaultCatalogItems;
