import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, User, Trash2, Edit, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ClientsManager = () => {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', notes: '' });

  useEffect(() => { fetchClients(); }, []);
  const fetchClients = async () => {
    try { const r = await axios.get(`${API}/clients`); setClients(r.data); }
    catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const openDialog = (client = null) => {
    setEditing(client);
    setForm(client ? { name: client.name, address: client.address, phone: client.phone, email: client.email || '', notes: client.notes || '' }
      : { name: '', address: '', phone: '', email: '', notes: '' });
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await axios.put(`${API}/clients/${editing.id}`, form); toast.success('Client modifié'); }
      else { await axios.post(`${API}/clients`, form); toast.success('Client créé'); }
      setShowDialog(false);
      fetchClients();
    } catch { toast.error('Erreur sauvegarde'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce client ?')) return;
    try { await axios.delete(`${API}/clients/${id}`); toast.success('Supprimé'); fetchClients(); }
    catch { toast.error('Erreur suppression'); }
  };

  const filtered = search
    ? clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || (c.email || '').toLowerCase().includes(search.toLowerCase()))
    : clients;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-10 w-10 border-3 border-[#e8712a] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[var(--sr-cream)]" data-testid="clients-page">
      <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Mes Clients</h1>
            <p className="text-xs text-white/50">{clients.length} clients</p>
          </div>
          <Button size="sm" onClick={() => openDialog()} className="text-white h-9" style={{ background: '#e8712a' }} data-testid="create-client-btn">
            <Plus className="h-4 w-4 mr-1" /> Nouveau
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" data-testid="search-clients-input" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => (
            <Card key={c.id} className="bg-white border-0 shadow-sm p-4" data-testid={`client-card-${c.id}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#fff3e6' }}>
                  <User className="h-4 w-4" style={{ color: '#e8712a' }} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{c.name}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5"><Phone className="h-3 w-3" />{c.phone}</div>
                  {c.email && <div className="text-xs text-gray-500 truncate">{c.email}</div>}
                  <div className="flex items-start gap-1 text-xs text-gray-400 mt-0.5"><MapPin className="h-3 w-3 mt-0.5 shrink-0" /><span className="line-clamp-2">{c.address}</span></div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openDialog(c)} className="flex-1 h-7 text-xs" data-testid={`edit-client-${c.id}`}>
                  <Edit className="h-3 w-3 mr-1" /> Modifier
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="h-7 text-red-500 hover:bg-red-50" data-testid={`delete-client-${c.id}`}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {filtered.length === 0 && (
          <Card className="bg-white border-0 shadow-sm p-10 text-center">
            <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500 mb-3">Aucun client</p>
            <Button size="sm" onClick={() => openDialog()} style={{ background: '#e8712a' }} className="text-white"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
          </Card>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[450px]" data-testid="client-dialog">
          <DialogHeader><DialogTitle>{editing ? 'Modifier le client' : 'Nouveau client'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-3 py-3">
              <div><Label className="text-xs text-gray-500">Nom complet *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="h-9 text-sm" data-testid="client-name-input" /></div>
              <div><Label className="text-xs text-gray-500">Téléphone *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required className="h-9 text-sm" data-testid="client-phone-input" /></div>
              <div><Label className="text-xs text-gray-500">Adresse *</Label><Textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required rows={2} className="text-sm" data-testid="client-address-input" /></div>
              <div><Label className="text-xs text-gray-500">Email (optionnel)</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-9 text-sm" data-testid="client-email-input" /></div>
              <div><Label className="text-xs text-gray-500">Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="text-sm" data-testid="client-notes-input" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} size="sm" data-testid="cancel-client-btn">Annuler</Button>
              <Button type="submit" size="sm" style={{ background: '#e8712a' }} className="text-white" data-testid="save-client-btn">{editing ? 'Modifier' : 'Créer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsManager;
