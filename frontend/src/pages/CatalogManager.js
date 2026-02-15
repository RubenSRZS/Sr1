import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Layers, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  'TOITURE',
  'FAÇADE',
  'ZINGUERIE & HABILLAGE',
  'SOLS & EXTÉRIEURS',
];

const CatalogManager = () => {
  const [catalogItems, setCatalogItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    service_name: '',
    description: '',
    default_price: '',
  });

  useEffect(() => {
    fetchCatalog();
  }, []);

  useEffect(() => {
    let filtered = catalogItems;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
  }, [searchTerm, selectedCategory, catalogItems]);

  const fetchCatalog = async () => {
    try {
      const res = await axios.get(`${API}/catalog`);
      setCatalogItems(res.data);
      setFilteredItems(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du catalogue');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      category: '',
      service_name: '',
      description: '',
      default_price: '',
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setFormData({
      category: '',
      service_name: '',
      description: '',
      default_price: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        default_price: formData.default_price ? parseFloat(formData.default_price) : null,
      };
      await axios.post(`${API}/catalog`, payload);
      toast.success('Service ajouté au catalogue');
      handleCloseDialog();
      fetchCatalog();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        await axios.delete(`${API}/catalog/${id}`);
        toast.success('Service supprimé');
        fetchCatalog();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Catalogue de Services
              </h1>
              <p className="text-slate-300">Phrases professionnelles pré-remplies</p>
            </div>
            <Button
              onClick={handleOpenDialog}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="create-catalog-item-btn"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Service
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Rechercher un service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-catalog-input"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger data-testid="category-filter">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Catalog Items */}
        {filteredItems.length > 0 ? (
          <div className="space-y-4">
            {CATEGORIES.map((category) => {
              const items = filteredItems.filter((item) => item.category === category);
              if (items.length === 0 && selectedCategory !== 'all') return null;
              if (items.length === 0) return null;

              return (
                <div key={category}>
                  <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-orange-500" />
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    {items.map((item) => (
                      <Card
                        key={item.id}
                        className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                              {item.service_name}
                            </h3>
                            <p className="text-slate-600 text-sm mb-2">{item.description}</p>
                            {item.default_price && (
                              <p className="text-sm font-medium text-orange-600">
                                Prix par défaut: {item.default_price.toFixed(2)} €
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:bg-red-50"
                            data-testid={`delete-catalog-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
            <Layers className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun service trouvé</h3>
            <p className="text-slate-600 mb-4">Ajoutez des phrases professionnelles à votre catalogue</p>
            <Button
              onClick={handleOpenDialog}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="mr-2 h-5 w-5" />
              Ajouter un service
            </Button>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Ajouter un service au catalogue</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger data-testid="catalog-category-select">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="service_name">Nom du service *</Label>
                <Input
                  id="service_name"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  required
                  placeholder="Ex: Nettoyage Toiture"
                  data-testid="catalog-service-name-input"
                />
              </div>
              <div>
                <Label htmlFor="description">Description professionnelle *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  placeholder="Ex: Nettoyage sur la totalité des tuiles de l'entièreté de la surface avec traitement haute pression professionnel..."
                  data-testid="catalog-description-input"
                />
              </div>
              <div>
                <Label htmlFor="default_price">Prix par défaut (optionnel)</Label>
                <Input
                  id="default_price"
                  type="number"
                  step="0.01"
                  value={formData.default_price}
                  onChange={(e) => setFormData({ ...formData, default_price: e.target.value })}
                  placeholder="Ex: 500.00"
                  data-testid="catalog-price-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                data-testid="cancel-catalog-btn"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="save-catalog-btn"
              >
                Ajouter
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CatalogManager;
