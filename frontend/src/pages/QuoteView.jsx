import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Send, Pencil, Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFDocument, downloadPDF } from '@/components/PDFPreview';
import SendQuoteModal from '@/components/SendQuoteModal';
import { useTheme } from '@/context/ThemeContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS = {
  draft: { label: 'Brouillon', cls: 'bg-amber-100 text-amber-700' },
  sent: { label: 'Envoyé', cls: 'bg-sky-100 text-sky-700' },
  accepted: { label: 'Signé', cls: 'bg-emerald-100 text-emerald-700' },
  invoiced: { label: 'Facturé', cls: 'bg-purple-100 text-purple-700' },
  lost: { label: 'Perdu', cls: 'bg-gray-100 text-gray-500' },
};

export default function QuoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchQuote = useCallback(() => {
    axios.get(`${API}/quotes/${id}`)
      .then(r => setQuote(r.data))
      .catch(() => setError(true));
  }, [id]);

  useEffect(() => { window.scrollTo(0, 0); fetchQuote(); }, [fetchQuote]);

  const handleDownload = async () => {
    if (!quote) return;
    setDownloading(true);
    try { await downloadPDF(quote, 'quote'); } catch (e) { console.error(e); }
    setDownloading(false);
  };

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="text-center">
        <p className="text-slate-600 font-semibold mb-3">Devis introuvable</p>
        <Link to="/quotes"><Button variant="outline" size="sm">Retour aux devis</Button></Link>
      </div>
    </div>
  );

  if (!quote) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
      <div className="h-10 w-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const st = STATUS[quote.status] || STATUS.draft;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'}`} data-testid="quote-view-page">
      {/* Toolbar */}
      <div className={`sticky top-0 z-10 border-b px-3 py-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-[820px] mx-auto flex items-center gap-2 flex-wrap">
          <button onClick={() => navigate('/quotes')} className={`p-1.5 rounded-lg flex-shrink-0 ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`} data-testid="quote-view-back-btn">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{quote.quote_number}</span>
            <span className={`text-xs ml-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{quote.client_name}</span>
            <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <Button size="sm" onClick={() => setShowSend(true)} className="h-8 text-xs text-white bg-blue-600 hover:bg-blue-700" data-testid="quote-view-send-btn">
              <Send className="h-3.5 w-3.5 mr-1" /> Envoyer
            </Button>
            <Link to={`/quotes/edit/${quote.id}`}>
              <Button size="sm" variant="outline" className={`h-8 text-xs ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : ''}`} data-testid="quote-view-edit-btn">
                <Pencil className="h-3.5 w-3.5 mr-1" /> Modifier
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={handleDownload} disabled={downloading} className={`h-8 text-xs ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : ''}`} data-testid="quote-view-pdf-btn">
              <Download className="h-3.5 w-3.5 mr-1" /> {downloading ? '...' : 'PDF'}
            </Button>
          </div>
        </div>
      </div>

      {/* Document */}
      <div className="px-2 py-4">
        <div className="mx-auto shadow-lg rounded overflow-hidden bg-white" style={{ maxWidth: '794px' }}>
          <PDFDocument document={quote} type="quote" compact={true} />
        </div>
        <div className="max-w-[794px] mx-auto mt-3 flex justify-center">
          <div className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`} data-testid="quote-view-total">
            <Receipt className="h-4 w-4 text-orange-500" />
            Total : {Number(quote.total_net || 0).toFixed(2)} €
          </div>
        </div>
      </div>

      {showSend && <SendQuoteModal quote={quote} onClose={() => setShowSend(false)} onSent={fetchQuote} />}
    </div>
  );
}
