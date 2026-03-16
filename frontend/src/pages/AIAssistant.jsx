import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Sparkles, FileText, Receipt, Loader2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AIAssistant = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Initialiser la reconnaissance vocale
  React.useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'fr-FR';

      recog.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserInput(prev => prev + ' ' + transcript);
      };

      recog.onerror = (event) => {
        console.error('Erreur reconnaissance vocale:', event.error);
        setIsListening(false);
        toast.error('Erreur de reconnaissance vocale');
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, []);

  const toggleVoiceRecognition = () => {
    if (!recognition) {
      toast.error('Reconnaissance vocale non supportée par votre navigateur');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      toast.success('Dictée arrêtée');
    } else {
      recognition.start();
      setIsListening(true);
      toast.success('Dictée en cours... Parlez maintenant');
    }
  };

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      toast.error('Veuillez saisir une demande');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai/generate-document`, {
        user_input: userInput,
        document_type: 'quote'
      });

      if (response.data.status === 'success') {
        setResult(response.data.data);
        toast.success('Document généré avec succès !');
      }
    } catch (error) {
      console.error('Erreur génération IA:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = () => {
    if (!result) return;
    
    // Créer ou récupérer le client
    const clientData = {
      name: result.client?.name || '',
      address: result.client?.address || '',
      phone: result.client?.phone || '',
      email: result.client?.email || '',
    };

    // Préparer les données du devis
    const quoteData = {
      client: clientData,
      work_location: result.work_location || result.client?.address || '',
      items: result.services?.map(s => ({
        description: s.description,
        quantity: s.quantity,
        unit: s.unit,
        unit_price: s.unit_price,
        remise_percent: s.remise_percent || 0,
        total: s.total
      })) || [],
      notes: result.notes || '',
      ai_generated: true
    };
    
    // Sauvegarder dans sessionStorage
    sessionStorage.setItem('ai_generated_quote', JSON.stringify(quoteData));
    
    // Rediriger vers le formulaire de devis
    navigate('/quotes/new');
    toast.success('Redirection vers le formulaire...');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className={darkMode ? 'text-slate-300 hover:text-white' : ''}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Assistant IA
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Card className={`p-6 mb-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
            <h2 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
              💡 Comment ça marche ?
            </h2>
            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Dictez ou tapez votre demande en langage naturel. L'IA va automatiquement :
            </p>
            <ul className={`text-sm mt-2 space-y-1 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              <li>• Extraire les informations du client</li>
              <li>• Sélectionner les prestations de votre catalogue</li>
              <li>• Ajuster les quantités pour atteindre le montant que vous souhaitez</li>
              <li>• Inclure les notes et conditions que vous mentionnez</li>
            </ul>
          </div>

          <Label className={`text-sm mb-2 block ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
            Votre demande (dictée vocale ou texte)
          </Label>
          <div className="relative">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Exemple : Je veux un devis pour M. Dupont, 15 rue de Paris, 06 12 34 56 78. Nettoyage toiture + façade. Total 1200€. Ajoute les conditions standard."
              rows={8}
              className={`text-sm mb-4 pr-12 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              disabled={loading}
            />
            <Button
              type="button"
              onClick={toggleVoiceRecognition}
              className={`absolute right-2 top-2 ${isListening ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              size="sm"
              disabled={loading}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !userInput.trim()}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer avec l'IA
              </>
            )}
          </Button>
        </Card>

        {/* Résultat */}
        {result && (
          <Card className={`p-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📄 Document généré
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full ${
                result.confidence === 'high' 
                  ? 'bg-green-100 text-green-800' 
                  : result.confidence === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                Confiance: {result.confidence}
              </span>
            </div>

            {/* Client */}
            <div className="mb-4">
              <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                Client
              </h3>
              <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <p><strong>Nom :</strong> {result.client?.name}</p>
                <p><strong>Adresse :</strong> {result.client?.address}</p>
                <p><strong>Téléphone :</strong> {result.client?.phone}</p>
                {result.client?.email && <p><strong>Email :</strong> {result.client?.email}</p>}
              </div>
            </div>

            {/* Lieu des travaux */}
            {result.work_location && (
              <div className="mb-4">
                <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  Lieu des travaux
                </h3>
                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  {result.work_location}
                </p>
              </div>
            )}

            {/* Services */}
            <div className="mb-4">
              <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                Prestations ({result.services?.length})
              </h3>
              <div className="space-y-2">
                {result.services?.map((service, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {service.description}
                        </p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {service.quantity} {service.unit} × {service.unit_price.toFixed(2)} €
                        </p>
                      </div>
                      <p className={`text-sm font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                        {service.total.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex justify-between items-center">
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Total
                </span>
                <span className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  {result.services?.reduce((sum, s) => sum + s.total, 0).toFixed(2)} €
                </span>
              </div>
              {result.target_amount > 0 && (
                <p className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Montant cible demandé : {result.target_amount.toFixed(2)} €
                </p>
              )}
            </div>

            {/* Notes */}
            {result.notes && (
              <div className="mt-4">
                <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  Notes & Conditions
                </h3>
                <p className={`text-sm whitespace-pre-wrap ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  {result.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleCreateQuote}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Créer le devis
              </Button>
              <Button
                variant="outline"
                onClick={() => setResult(null)}
                className={darkMode ? 'border-slate-600 text-slate-300' : ''}
              >
                Nouvelle demande
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
