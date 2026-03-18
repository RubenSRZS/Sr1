import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle, Download, FileSignature } from 'lucide-react';
import { generatePDFBase64 } from '../components/PDFPreview';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PublicQuotePage = () => {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await axios.get(`${API}/quotes/public/${token}`);
        setQuote(res.data);
        if (res.data.is_signed) {
          setAlreadySigned(true);
          setSelectedOption(res.data.selected_option || 'option1');
        } else if (res.data.has_multiple_options) {
          setSelectedOption(null);
        } else {
          setSelectedOption('option1');
        }
      } catch (err) {
        console.error(err);
        setError('Ce devis n\'est pas accessible ou a expiré.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [token]);

  const handleSign = async () => {
    if (!quote) return;
    if (!alreadySigned && quote.has_multiple_options && !selectedOption) {
      alert('Veuillez choisir une option avant de signer');
      return;
    }
    setSigning(true);
    try {
      const payload = quote.has_multiple_options && !alreadySigned ? { selected_option: selectedOption } : {};
      const res = await axios.post(`${API}/quotes/public/${token}/sign`, payload);
      setQuote(res.data);
      setAlreadySigned(true);
      if (!alreadySigned) {
        alert('✅ Devis signé ! Vous allez recevoir un email de confirmation.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la signature. Veuillez réessayer.');
    } finally {
      setSigning(false);
    }
  };

  const handleDownloadPDF = useCallback(async () => {
    if (!quote) return;
    setDownloading(true);
    try {
      const { base64, filename } = await generatePDFBase64(quote, 'quote');
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      if (isIOS || isSafari) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
          window.open(url, '_blank');
        }, 100);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Erreur lors du téléchargement. Veuillez réessayer.');
    }
    setDownloading(false);
  }, [quote]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="p-6 max-w-md text-center">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!quote) return null;

  const displayOption = selectedOption || 'option1';
  const services = displayOption === 'option1' ? quote.services : displayOption === 'option2' ? quote.option_2_services : quote.option_3_services;
  const remiseType = displayOption === 'option1' ? quote.remise_type : displayOption === 'option2' ? quote.option_2_remise_type : quote.option_3_remise_type;
  const remisePercent = displayOption === 'option1' ? quote.remise_percent : displayOption === 'option2' ? quote.option_2_remise_percent : quote.option_3_remise_percent;
  const remiseMontant = displayOption === 'option1' ? quote.remise_montant : displayOption === 'option2' ? quote.option_2_remise_montant : quote.option_3_remise_montant;

  const subtotal = services.reduce((sum, s) => sum + (s.total || 0), 0);
  const remise = remiseType === 'percent' ? (subtotal * remisePercent / 100) : remiseMontant;
  const total = subtotal - remise;

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        {alreadySigned && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div className="text-green-800 text-sm">
              <strong>✅ Devis signé électroniquement</strong>
              <p className="text-xs mt-1">Un email de confirmation vous a été envoyé avec les prochaines étapes.</p>
            </div>
          </div>
        )}

        <Card className="p-6 mb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SR RÉNOVATION</h1>
              <p className="text-sm text-slate-600">Devis N° {quote.quote_number}</p>
            </div>
          </div>

          {quote.has_multiple_options && !alreadySigned && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-3">Choisissez une option :</p>
              <div className="space-y-2">
                {[1, 2, 3].map(num => {
                  const optKey = `option${num === 1 ? '' : `_${num}`}`;
                  const title = num === 1 ? quote.option_1_title : num === 2 ? quote.option_2_title : quote.option_3_title;
                  const svcs = num === 1 ? quote.services : num === 2 ? quote.option_2_services : quote.option_3_services;
                  if (!svcs || svcs.length === 0) return null;
                  const isSelected = selectedOption === `option${num}`;
                  return (
                    <button
                      key={num}
                      onClick={() => setSelectedOption(`option${num}`)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                    >
                      <div className="font-medium text-slate-900">{title || `Option ${num}`}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <h2 className="font-semibold text-lg mb-4">Prestations</h2>
            {services.map((s, i) => (
              <div key={i} className="flex justify-between text-sm py-2 border-b">
                <div className="flex-1">
                  <div className="font-medium">{s.description}</div>
                  <div className="text-xs text-slate-500">{s.quantity} {s.unit} × {s.unit_price.toFixed(2)}€</div>
                </div>
                <div className="font-medium">{s.total.toFixed(2)}€</div>
              </div>
            ))}

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>
              {remise > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Remise{remiseType === 'percent' ? ` (${remisePercent}%)` : ''}</span>
                  <span>-{remise.toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total TTC</span>
                <span>{total.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {quote.notes && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {alreadySigned ? (
              <Button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                {downloading ? 'Génération...' : 'Télécharger le devis signé'}
              </Button>
            ) : (
              <Button
                onClick={handleSign}
                disabled={signing || (quote.has_multiple_options && !selectedOption)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {signing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSignature className="h-4 w-4 mr-2" />}
                {signing ? 'Signature...' : 'Signer le devis'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PublicQuotePage;
