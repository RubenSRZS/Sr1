import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Configuration des groupes de diagnostic avec leurs sous-options
// IMPORTANT: Les sous-options utilisent des labels COURTS sans répéter le groupe
// Ex: "Obstruée" et non "Gouttières obstruées"
// ⚠ Ne jamais changer ni supprimer un "id" existant : les anciens devis les utilisent.
// On peut changer les libellés, l'ordre, et ajouter des cases.
export const DIAGNOSTIC_GROUPS = [
  {
    id: 'type_toiture',
    label: 'Type de couverture',
    options: [
      { id: 'toiture_tuile_terre_cuite', label: 'Tuile terre cuite' },
      { id: 'toiture_tuile_ciment', label: 'Tuile ciment / béton' },
      { id: 'toiture_tuile_plate', label: 'Tuile plate' },
      { id: 'toiture_tuile_canal', label: 'Tuile canal / romane' },
      { id: 'toiture_ardoise', label: 'Ardoise naturelle' },
      { id: 'toiture_fibro_ciment', label: 'Ardoise / plaque fibro-ciment' },
      { id: 'toiture_amiante', label: 'Amiante (présence possible)' },
      { id: 'toiture_bac_acier', label: 'Bac acier' },
      { id: 'toiture_pc_tole', label: 'PC tôle' },
      { id: 'toiture_zinc', label: 'Zinc' },
      { id: 'toiture_shingle', label: 'Shingle' },
      { id: 'toiture_toit_plat', label: 'Toit plat / membrane' },
    ],
  },
  {
    id: 'vegetation',
    label: 'Encrassement de la toiture',
    options: [
      { id: 'vegetation_mousses', label: 'Mousses' },
      { id: 'vegetation_mousses_epaisses', label: 'Mousses épaisses (démoussage manuel)' },
      { id: 'vegetation_lichens', label: 'Lichens' },
      { id: 'vegetation_trace_noire', label: 'Traces noires' },
      { id: 'vegetation_algues_vertes', label: 'Algues / traces vertes' },
      { id: 'vegetation_traces_rouges', label: 'Traces rouges / orangées' },
      { id: 'vegetation_debris', label: 'Feuilles / débris' },
      { id: 'vegetation_toiture_terne', label: 'Toiture terne / décolorée' },
      { id: 'vegetation_tuiles_poreuses', label: 'Tuiles poreuses (boivent l\'eau)' },
    ],
  },
  {
    id: 'structure',
    label: 'État de la couverture',
    options: [
      { id: 'structure_tuiles_cassees', label: 'Tuiles cassées / fendues' },
      { id: 'structure_tuiles_deplacees', label: 'Tuiles déplacées / glissées' },
      { id: 'structure_tuiles_gelives', label: 'Tuiles gélives / effritées' },
      { id: 'structure_faitage_defaillant', label: 'Faîtage défaillant' },
      { id: 'structure_mortier_fissure', label: 'Mortier fissuré / qui tombe' },
      { id: 'structure_rives', label: 'Rives abîmées' },
      { id: 'structure_solins', label: 'Solins / abergements défectueux' },
      { id: 'structure_noues', label: 'Noues encombrées ou abîmées' },
      { id: 'structure_cheminee', label: 'Cheminée abîmée' },
      { id: 'structure_fissures', label: 'Fissures' },
      { id: 'structure_affaissement', label: 'Affaissement / ondulation' },
    ],
  },
  {
    id: 'gouttieres',
    label: 'Gouttières / Zinguerie',
    options: [
      { id: 'gouttieres_obstruee', label: 'Obstruées' },
      { id: 'gouttieres_encrassee', label: 'Encrassées' },
      { id: 'gouttieres_vegetation', label: 'Végétation dedans' },
      { id: 'gouttieres_debordement', label: 'Débordent par forte pluie' },
      { id: 'gouttieres_pente', label: 'Mauvaise pente (eau stagnante)' },
      { id: 'gouttieres_fuites', label: 'Fuites aux jonctions' },
      { id: 'gouttieres_corrosion', label: 'Corrosion / rouille' },
      { id: 'gouttieres_deformee', label: 'Déformées' },
      { id: 'gouttieres_decollee', label: 'Décollées' },
      { id: 'gouttieres_crochets', label: 'Crochets cassés / manquants' },
      { id: 'gouttieres_descente_ep', label: 'Descente EP défectueuse' },
      { id: 'gouttieres_sous_face', label: 'Sous-face / bandeau abîmé' },
    ],
  },
  {
    id: 'facade',
    label: 'Façade',
    options: [
      { id: 'facade_mousses', label: 'Mousses / traces noires' },
      { id: 'facade_trace_verte', label: 'Traces vertes' },
      { id: 'facade_trace_rouge', label: 'Traces rouges' },
      { id: 'facade_crepi_encrasse', label: 'Crépi encrassé / grisé' },
      { id: 'facade_coulures', label: 'Coulures sous fenêtres / appuis' },
      { id: 'facade_pollution', label: 'Pollution / suie' },
      { id: 'facade_peinture_ecaillee', label: 'Peinture écaillée' },
      { id: 'facade_enduit_decolle', label: 'Enduit qui se décolle' },
      { id: 'facade_fissures', label: 'Fissures' },
      { id: 'facade_salpetre', label: 'Salpêtre / remontées d\'humidité' },
    ],
  },
  {
    id: 'sols',
    label: 'Terrasse / Sols',
    options: [
      { id: 'sols_encrasse', label: 'Encrassé / noirci' },
      { id: 'sols_mousses', label: 'Mousses / lichens' },
      { id: 'sols_glissant', label: 'Glissant' },
      { id: 'sols_joints', label: 'Joints abîmés / herbe' },
      { id: 'sols_dalles', label: 'Dalles décollées / cassées' },
      { id: 'sols_bois_grise', label: 'Bois grisé' },
    ],
  },
  {
    id: 'humidite',
    label: 'Humidité / Infiltrations',
    options: [
      { id: 'humidite_infiltrations', label: 'Infiltrations' },
      { id: 'humidite_combles', label: 'Traces d\'eau dans les combles' },
      { id: 'humidite_plafond', label: 'Taches au plafond' },
      { id: 'humidite_charpente', label: 'Charpente humide / bois abîmé' },
      { id: 'humidite_condensation', label: 'Condensation' },
      { id: 'humidite_forte', label: 'Forte humidité / zone ombragée' },
    ],
  },
  {
    id: 'acces',
    label: 'Accès / Chantier',
    options: [
      { id: 'acces_nacelle', label: 'Accès nacelle possible' },
      { id: 'acces_difficile', label: 'Accès difficile (drone)' },
      { id: 'acces_hauteur', label: 'Grande hauteur' },
      { id: 'acces_pente', label: 'Forte pente' },
      { id: 'acces_toiture_fragile', label: 'Toiture fragile (ne pas marcher)' },
      { id: 'acces_arbres', label: 'Arbres à proximité' },
      { id: 'acces_protections', label: 'Protections à prévoir (véranda, plantes, voitures)' },
    ],
  },
];

export const DiagnosticSection = ({ diagnostic = {}, updateDiagnostic, darkMode }) => {
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleGroupCheck = (groupId, checked) => {
    const group = DIAGNOSTIC_GROUPS.find(g => g.id === groupId);
    if (!group) return;

    const newDiagnostic = { ...diagnostic };
    
    if (checked) {
      // Cocher le groupe principal
      newDiagnostic[groupId] = true;
      // Décocher toutes les sous-options pour éviter la redondance
      group.options.forEach(opt => {
        newDiagnostic[opt.id] = false;
      });
    } else {
      // Décocher le groupe
      newDiagnostic[groupId] = false;
    }

    updateDiagnostic(newDiagnostic);
  };

  const handleOptionCheck = (groupId, optionId, checked) => {
    const newDiagnostic = { ...diagnostic };
    newDiagnostic[optionId] = checked;
    
    // Si on coche une sous-option, décocher le groupe principal
    if (checked) {
      newDiagnostic[groupId] = false;
    }

    updateDiagnostic(newDiagnostic);
  };

  const isGroupChecked = (groupId) => {
    return diagnostic[groupId] === true;
  };

  const getCheckedOptionsCount = (group) => {
    return group.options.filter(opt => diagnostic[opt.id] === true).length;
  };

  return (
    <Card className={`p-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-0'} shadow-sm`} data-testid="diagnostic-section">
      <span className={`font-semibold text-sm ${darkMode ? 'text-slate-200' : 'text-gray-800'} mb-3 block`}>
        Diagnostic visuel
      </span>
      
      <div className="space-y-2">
        {DIAGNOSTIC_GROUPS.map((group) => {
          const isExpanded = expandedGroups[group.id];
          const checkedCount = getCheckedOptionsCount(group);
          const groupChecked = isGroupChecked(group.id);

          return (
            <div
              key={group.id}
              className={`rounded-lg border ${darkMode ? 'border-slate-600' : 'border-gray-200'} overflow-hidden`}
            >
              {/* En-tête du groupe */}
              <div className={`p-3 ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className={`flex-shrink-0 ${darkMode ? 'text-slate-300' : 'text-gray-500'} transition-colors`}>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={groupChecked}
                      onChange={(e) => handleGroupCheck(group.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`font-medium text-sm ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                      {group.label}
                      {checkedCount > 0 && !groupChecked && (
                        <span className="ml-2 text-xs text-blue-600 font-normal">
                          ({checkedCount} sélectionné{checkedCount > 1 ? 's' : ''})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sous-options */}
              {isExpanded && (
                <div className={`p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                  {group.options.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors ${
                        darkMode
                          ? 'hover:bg-slate-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={diagnostic[option.id] === true}
                        onChange={(e) => handleOptionCheck(group.id, option.id, e.target.checked)}
                        disabled={groupChecked}
                        className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-600'} ${groupChecked ? 'opacity-50' : ''}`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={`mt-3 text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'} italic`}>
        Cochez un groupe complet ou développez-le pour sélectionner des sous-options spécifiques.
      </div>
    </Card>
  );
};

export default DiagnosticSection;
