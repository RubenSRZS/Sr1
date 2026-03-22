import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Configuration des groupes de diagnostic avec leurs sous-options
// IMPORTANT: Les sous-options utilisent des labels COURTS sans répéter le groupe
// Ex: "Obstruée" et non "Gouttières obstruées"
export const DIAGNOSTIC_GROUPS = [
  {
    id: 'structure',
    label: 'Structure',
    options: [
      { id: 'structure_tuiles_cassees', label: 'Tuiles cassées' },
      { id: 'structure_faitage_defaillant', label: 'Faîtage défaillant' },
      { id: 'structure_fissures', label: 'Fissures' },
    ],
  },
  {
    id: 'type_toiture',
    label: 'Type de toiture',
    options: [
      { id: 'toiture_tuile_ciment', label: 'Tuile ciment' },
      { id: 'toiture_tuile_terre_cuite', label: 'Tuile terre cuite' },
      { id: 'toiture_ardoise', label: 'Ardoise' },
      { id: 'toiture_zinc', label: 'Zinc' },
      { id: 'toiture_bac_acier', label: 'Bac acier' },
      { id: 'toiture_pc_tole', label: 'PC tôle' },
      { id: 'toiture_fibro_ciment', label: 'Fibro-ciment' },
      { id: 'toiture_amiante', label: 'Amiante' },
    ],
  },
  {
    id: 'vegetation',
    label: 'Végétation / Taches',
    options: [
      { id: 'vegetation_mousses', label: 'Mousses' },
      { id: 'vegetation_lichens', label: 'Lichens' },
      { id: 'vegetation_trace_noire', label: 'Trace noire' },
    ],
  },
  {
    id: 'gouttieres',
    label: 'Gouttières',
    options: [
      { id: 'gouttieres_obstruee', label: 'Obstruée' },
      { id: 'gouttieres_encrassee', label: 'Encrassée' },
      { id: 'gouttieres_corrosion', label: 'Corrosion/Rouille' },
      { id: 'gouttieres_deformee', label: 'Déformée' },
      { id: 'gouttieres_decollee', label: 'Décollée' },
      { id: 'gouttieres_descente_ep', label: 'Descente EP défectueuse' },
    ],
  },
  {
    id: 'facade',
    label: 'Façade',
    options: [
      { id: 'facade_fissures', label: 'Fissures' },
      { id: 'facade_mousses', label: 'Mousses / Traces noires' },
      { id: 'facade_trace_verte', label: 'Trace verte' },
      { id: 'facade_trace_rouge', label: 'Trace rouge' },
      { id: 'facade_peinture_ecaillee', label: 'Peinture écaillée' },
    ],
  },
  {
    id: 'humidite',
    label: 'Humidité',
    options: [
      { id: 'humidite_forte', label: 'Forte humidité' },
      { id: 'humidite_infiltrations', label: 'Infiltrations' },
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
                <div className={`p-3 space-y-1.5 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                  {group.options.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors ${
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
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
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
