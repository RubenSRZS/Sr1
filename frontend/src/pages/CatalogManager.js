import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Layers, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CATEGORIES = ['TOITURE', 'FAÇADE', 'ZINGUERIE & HABILLAGE', 'SOLS & EXTÉRIEURS'];

const CatalogManager = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ category: '', service_name: '', description: '', default_price: '' });

  useEffect(() => { fetchCatalog(); }, []);
  const fetchCatalog = async () => {
    try { const r = await axios.get(`${API}/catalog`); setItems(r.data); }
    catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/catalog`, { ...form, default_price: form.default_price ? parseFloat(form.default_price) : null });
      toast.success('Service ajouté');
      setShowDialog(false);
      setForm({ category: '', service_name: '', description: '', default_price: '' });
      fetchCatalog();
    } catch { toast.error('Erreur ajout'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce service ?')) return;
    try { await axios.delete(`${API}/catalog/${id}`); toast.success('Supprimé'); fetchCatalog(); }
    catch { toast.error('Erreur suppression'); }
  };

  let filtered = items;
  if (catFilter !== 'all') filtered = filtered.filter(i => i.category === catFilter);
  if (search) filtered = filtered.filter(i => i.service_name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-10 w-10 border-3 border-[#3b82f6] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[var(--sr-cream)]" data-testid="catalog-page">
      <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Catalogue</h1>
            <p className="text-xs text-white/50">Phrases professionnelles pré-remplies</p>
          </div>
          <Button size="sm" onClick={() => setShowDialog(true)} className="text-white h-9" style={{ background: '#3b82f6' }} data-testid="create-catalog-item-btn">
            <Plus className="h-4 w-4 mr-1" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" data-testid="search-catalog-input" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="h-9 text-sm" data-testid="category-filter"><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {CATEGORIES.map(cat => {
          const catItems = filtered.filter(i => i.category === cat);
          if (catItems.length === 0) return null;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-4 w-4" style={{ color: '#3b82f6' }} />
                <span className="font-semibold text-sm">{cat}</span>
                <span className="text-xs text-gray-400">({catItems.length})</span>
              </div>
              <div className="space-y-2">
                {catItems.map(item => (
                  <Card key={item.id} className="bg-white border-0 shadow-sm p-3 flex items-start justify-between" data-testid={`catalog-card-${item.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.service_name}</div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                      {item.default_price && <span className="text-xs font-medium mt-1 inline-block" style={{ color: '#3b82f6' }}>{item.default_price.toFixed(2)} €</span>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="h-7 text-red-500 hover:bg-red-50 shrink-0 ml-2" data-testid={`delete-catalog-${item.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <Card className="bg-white border-0 shadow-sm p-10 text-center">
            <Layers className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">Aucun service trouvé</p>
          </Card>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[450px]" data-testid="catalog-dialog">
          <DialogHeader><DialogTitle>Ajouter un service</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-3 py-3">
              <div>
                <Label className="text-xs text-gray-500">Catégorie *</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-9 text-sm" data-testid="catalog-category-select"><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs text-gray-500">Nom *</Label><Input value={form.service_name} onChange={e => setForm({ ...form, service_name: e.target.value })} required className="h-9 text-sm" data-testid="catalog-service-name-input" /></div>
              <div><Label className="text-xs text-gray-500">Description *</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={3} className="text-sm" data-testid="catalog-description-input" /></div>
              <div><Label className="text-xs text-gray-500">Prix par défaut (€)</Label><Input type="number" step="0.01" value={form.default_price} onChange={e => setForm({ ...form, default_price: e.target.value })} className="h-9 text-sm" data-testid="catalog-price-input" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} size="sm">Annuler</Button>
              <Button type="submit" size="sm" style={{ background: '#3b82f6' }} className="text-white" data-testid="save-catalog-btn">Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CatalogManager;
