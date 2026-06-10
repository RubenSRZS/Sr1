import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Check, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProfileManager = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    siret: '',
    email: '',
    phone: '',
    address: '',
    iban: '',
    bic: '',
    account_holder: '',
    bank_name: '',
    insurance_decennale: '',
    insurance_rc_pro: '',
    website: '',
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await axios.get(`${API}/profiles`);
      setProfiles(res.data);
    } catch (err) {
      toast.error('Erreur de chargement des profils');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingId('new');
    setFormData({
      name: '',
      company_name: '',
      siret: '',
      email: '',
      phone: '',
      address: '',
      iban: '',
      bic: '',
      account_holder: '',
      bank_name: '',
      insurance_decennale: '',
      insurance_rc_pro: '',
      website: '',
    });
  };

  const handleEdit = (profile) => {
    setEditingId(profile.id);
    setFormData({
      name: profile.name,
      company_name: profile.company_name,
      siret: profile.siret || '',
      email: profile.email,
      phone: profile.phone,
      address: profile.address || '',
      iban: profile.iban || '',
      bic: profile.bic || '',
      account_holder: profile.account_holder || '',
      bank_name: profile.bank_name || '',
      insurance_decennale: profile.insurance_decennale || '',
      insurance_rc_pro: profile.insurance_rc_pro || '',
      website: profile.website || '',
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.company_name || !formData.email || !formData.phone) {
      return toast.error('Remplissez les champs obligatoires');
    }

    try {
      if (editingId === 'new') {
        await axios.post(`${API}/profiles`, formData);
        toast.success('Profil créé');
      } else {
        await axios.put(`${API}/profiles/${editingId}`, formData);
        toast.success('Profil modifié');
      }
      setEditingId(null);
      fetchProfiles();
    } catch (err) {
      toast.error('Erreur de sauvegarde');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce profil ?')) return;
    try {
      await axios.delete(`${API}/profiles/${id}`);
      toast.success('Profil supprimé');
      fetchProfiles();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur de suppression');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await axios.patch(`${API}/profiles/${id}/set-default`);
      toast.success('Profil défini par défaut');
      fetchProfiles();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Profils d'Entreprise</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez les informations qui apparaissent sur vos devis et factures</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Nouveau Profil
        </Button>
      </div>

      {editingId && (
        <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-lg mb-4">{editingId === 'new' ? 'Nouveau Profil' : 'Modifier le Profil'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Nom *</label>
              <Input
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Prénom Nom"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Entreprise *</label>
              <Input
                value={formData.company_name}
                onChange={e => setFormData({...formData, company_name: e.target.value})}
                placeholder="SR Rénovation"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="contact@entreprise.fr"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Téléphone *</label>
              <Input
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="06 12 34 56 78"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Site web</label>
              <Input
                value={formData.website}
                onChange={e => setFormData({...formData, website: e.target.value})}
                placeholder="sr-renovation.fr"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">SIRET</label>
              <Input
                value={formData.siret}
                onChange={e => setFormData({...formData, siret: e.target.value})}
                placeholder="123 456 789 00012"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Adresse</label>
              <Input
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                placeholder="Ville, Département"
              />
            </div>
            <div className="md:col-span-2">
              <h4 className="font-semibold text-sm text-slate-700 mb-2 mt-2">Coordonnées Bancaires (RIB)</h4>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">IBAN</label>
              <Input
                value={formData.iban}
                onChange={e => setFormData({...formData, iban: e.target.value})}
                placeholder="FR76 1080 7000 1312 3197 7296 321"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">BIC</label>
              <Input
                value={formData.bic}
                onChange={e => setFormData({...formData, bic: e.target.value})}
                placeholder="CCBPFRPPDJN"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Titulaire du compte</label>
              <Input
                value={formData.account_holder}
                onChange={e => setFormData({...formData, account_holder: e.target.value})}
                placeholder="M RUBEN SUAREZ-SAR"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Nom de la banque</label>
              <Input
                value={formData.bank_name}
                onChange={e => setFormData({...formData, bank_name: e.target.value})}
                placeholder="Banque Populaire BFC"
              />
            </div>
            <div className="md:col-span-2">
              <h4 className="font-semibold text-sm text-slate-700 mb-2 mt-2">Assurances & Garanties</h4>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Garantie Décennale</label>
              <Input
                value={formData.insurance_decennale}
                onChange={e => setFormData({...formData, insurance_decennale: e.target.value})}
                placeholder="N° contrat + Nom assurance"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">RC Pro</label>
              <Input
                value={formData.insurance_rc_pro}
                onChange={e => setFormData({...formData, insurance_rc_pro: e.target.value})}
                placeholder="N° contrat + Nom assurance"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-2" /> Enregistrer
            </Button>
            <Button onClick={() => setEditingId(null)} variant="outline">
              <X className="w-4 h-4 mr-2" /> Annuler
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {profiles.map(profile => (
          <Card key={profile.id} className={`p-5 ${profile.is_default ? 'border-2 border-blue-500 bg-blue-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg text-slate-800">{profile.name}</h3>
                  {profile.is_default && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> Par défaut
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-slate-500">Entreprise:</span>
                    <span className="ml-2 font-medium">{profile.company_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <span className="ml-2 font-medium">{profile.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Téléphone:</span>
                    <span className="ml-2 font-medium">{profile.phone}</span>
                  </div>
                  {profile.siret && (
                    <div>
                      <span className="text-slate-500">SIRET:</span>
                      <span className="ml-2 font-medium">{profile.siret}</span>
                    </div>
                  )}
                  {profile.iban && (
                    <div>
                      <span className="text-slate-500">IBAN:</span>
                      <span className="ml-2 font-medium">{profile.iban}</span>
                    </div>
                  )}
                  {profile.insurance_decennale && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Garantie Décennale:</span>
                      <span className="ml-2 font-medium">{profile.insurance_decennale}</span>
                    </div>
                  )}
                  {profile.insurance_rc_pro && (
                    <div className="col-span-2">
                      <span className="text-slate-500">RC Pro:</span>
                      <span className="ml-2 font-medium">{profile.insurance_rc_pro}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div>
                      <span className="text-slate-500">Site web:</span>
                      <span className="ml-2 font-medium">{profile.website}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                {!profile.is_default && (
                  <Button
                    onClick={() => handleSetDefault(profile.id)}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    title="Définir par défaut"
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                <Button onClick={() => handleEdit(profile)} variant="outline" size="sm">
                  <Edit3 className="w-4 h-4" />
                </Button>
                {!profile.is_default && (
                  <Button onClick={() => handleDelete(profile.id)} variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProfileManager;
