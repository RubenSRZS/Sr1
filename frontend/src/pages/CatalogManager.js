import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Layers, Trash2, Edit2, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Catégories avec couleurs
const CATEGORIES = [
  { name: 'TOITURE', color: '#3b82f6', bgLight: '#eff6ff', bgDark: '#1e3a5f', type: 'service' },
  { name: 'FAÇADE', color: '#f97316', bgLight: '#fff7ed', bgDark: '#4a2c17', type: 'service' },
  { name: 'ZINGUERIE & HABILLAGE', color: '#10b981', bgLight: '#ecfdf5', bgDark: '#134e3a', type: 'service' },
  { name: 'SOLS & EXTÉRIEURS', color: '#8b5cf6', bgLight: '#f5f3ff', bgDark: '#3b2d5e', type: 'service' },
  { name: 'NOTES & CONDITIONS', color: '#64748b', bgLight: '#f1f5f9', bgDark: '#1e293b', type: 'note_condition' },
];

const UNITS = ['unité', 'm²', 'ML', 'm', 'h', 'forfait', 'kg', 'pièce'];

const CatalogManager = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ category: '', service_name: '', description: '', default_price: '', default_unit: 'unité' });

  useEffect(() => { fetchCatalog(); }, []);
  
  const fetchCatalog = async () => {
    try { const r = await axios.get(`${API}/catalog`); setItems(r.data); }
    catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const openDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        category: item.category,
        service_name: item.service_name,
        description: item.description,
        default_price: item.default_price || '',
        default_unit: item.default_unit || 'unité',
      });
    } else {
      setEditingItem(null);
      setForm({ category: '', service_name: '', description: '', default_price: '', default_unit: 'unité' });
    }
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Auto-assign color from category
      const catDef = CATEGORIES.find(c => c.name === form.category);
      const payload = { 
        ...form, 
        default_price: form.default_price ? parseFloat(form.default_price) : null,
        color: catDef ? catDef.color : null,
      };
      
      if (editingItem) {
        await axios.put(`${API}/catalog/${editingItem.id}`, payload);
        toast.success('Service modifié');
      } else {
        await axios.post(`${API}/catalog`, payload);
        toast.success('Service ajouté');
      }
      setShowDialog(false);
      setEditingItem(null);
      setForm({ category: '', service_name: '', description: '', default_price: '', default_unit: 'unité' });
      fetchCatalog();
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce service ?')) return;
    try { await axios.delete(`${API}/catalog/${id}`); toast.success('Supprimé'); fetchCatalog(); }
    catch { toast.error('Erreur suppression'); }
  };

  const getCategoryStyle = (catName) => {
    const cat = CATEGORIES.find(c => c.name === catName);
    return cat || { color: '#6b7280', bgLight: '#f3f4f6', bgDark: '#374151' };
  };

  let filtered = items;
  if (catFilter !== 'all') filtered = filtered.filter(i => i.category === catFilter);
  if (search) filtered = filtered.filter(i => 
    i.service_name.toLowerCase().includes(search.toLowerCase()) || 
    i.description.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-[var(--sr-cream)]'}`}>
      <div className="h-10 w-10 border-3 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-[var(--sr-cream)]'}`} data-testid="catalog-page">
      <div style={{ background: darkMode ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Catalogue</h1>
            <p className="text-xs text-white/50">{items.length} prestations disponibles</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleDarkMode} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button size="sm" onClick={() => openDialog()} className="text-white h-9" style={{ background: '#3b82f6' }} data-testid="create-catalog-item-btn">
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Filtres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Rechercher une prestation..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className={`pl-9 h-9 text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
              data-testid="search-catalog-input" 
            />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className={`h-9 text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`} data-testid="category-filter">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent className={darkMode ? 'bg-slate-800 border-slate-700' : ''}>
              <SelectItem value="all" className={darkMode ? 'text-white' : ''}>Toutes les catégories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c.name} value={c.name} className={darkMode ? 'text-white' : ''}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Liste par catégorie */}
        {CATEGORIES.map(cat => {
          const catItems = filtered.filter(i => i.category === cat.name);
          if (catItems.length === 0 && catFilter !== 'all' && catFilter !== cat.name) return null;
          if (catItems.length === 0 && catFilter === 'all') return null;
          
          return (
            <div key={cat.name}>
              <div 
                className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg"
                style={{ background: darkMode ? cat.bgDark : cat.bgLight }}
              >
                <div className="w-4 h-4 rounded-full" style={{ background: cat.color }} />
                <span className="font-semibold text-sm" style={{ color: cat.color }}>{cat.name}</span>
                <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>({catItems.length})</span>
              </div>
              <div className="space-y-2">
                {catItems.map(item => (
                  <Card 
                    key={item.id} 
                    className={`border-0 shadow-sm p-3 flex items-start justify-between transition-all hover:shadow-md ${darkMode ? 'bg-slate-800' : 'bg-white'}`}
                    style={{ borderLeft: `4px solid ${cat.color}` }}
                    data-testid={`catalog-card-${item.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${darkMode ? 'text-white' : ''}`}>{item.service_name}</div>
                      <p className={`text-xs mt-0.5 line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{item.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {item.default_price && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: darkMode ? cat.bgDark : cat.bgLight, color: cat.color }}>
                            {item.default_price.toFixed(2)} €
                          </span>
                        )}
                        <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                          Unité: {item.default_unit || 'unité'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button variant="ghost" size="sm" onClick={() => openDialog(item)} className={`h-7 ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'hover:bg-gray-100'}`} data-testid={`edit-catalog-${item.id}`}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="h-7 text-red-500 hover:bg-red-50" data-testid={`delete-catalog-${item.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
        
        {filtered.length === 0 && (
          <Card className={`border-0 shadow-sm p-10 text-center ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <Layers className={`h-12 w-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Aucune prestation trouvée</p>
          </Card>
        )}
      </div>

      {/* Dialog ajout/édition */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={`sm:max-w-[500px] ${darkMode ? 'bg-slate-800 border-slate-700' : ''}`} data-testid="catalog-dialog">
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : ''}>
              {editingItem ? 'Modifier la prestation' : 'Ajouter une prestation'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-3 py-3">
              <div>
                <Label className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Catégorie *</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className={`h-9 text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`} data-testid="catalog-category-select">
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent className={darkMode ? 'bg-slate-700 border-slate-600' : ''}>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.name} value={c.name} className={darkMode ? 'text-white' : ''}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Nom de la prestation *</Label>
                <Input 
                  value={form.service_name} 
                  onChange={e => setForm({ ...form, service_name: e.target.value })} 
                  required 
                  className={`h-9 text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
                  placeholder="Ex: Nettoyage toiture"
                  data-testid="catalog-service-name-input" 
                />
              </div>
              
              <div>
                <Label className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Description *</Label>
                <Textarea 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                  required 
                  rows={3} 
                  className={`text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
                  placeholder="Description détaillée de la prestation..."
                  data-testid="catalog-description-input" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Prix par défaut (€)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={form.default_price} 
                    onChange={e => setForm({ ...form, default_price: e.target.value })} 
                    className={`h-9 text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
                    placeholder="0.00"
                    data-testid="catalog-price-input" 
                  />
                </div>
                <div>
                  <Label className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Unité par défaut</Label>
                  <Select value={form.default_unit} onValueChange={v => setForm({ ...form, default_unit: v })}>
                    <SelectTrigger className={`h-9 text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`} data-testid="catalog-unit-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={darkMode ? 'bg-slate-700 border-slate-600' : ''}>
                      {UNITS.map(u => <SelectItem key={u} value={u} className={darkMode ? 'text-white' : ''}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} size="sm" className={darkMode ? 'border-slate-600 text-slate-300' : ''}>
                Annuler
              </Button>
              <Button type="submit" size="sm" style={{ background: '#3b82f6' }} className="text-white" data-testid="save-catalog-btn">
                {editingItem ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CatalogManager;
