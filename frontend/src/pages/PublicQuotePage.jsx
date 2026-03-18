import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Download, Pen, FileText } from 'lucide-react';
import { PDFDocument, generatePDFBase64, BRAND_BLUE } from '@/components/PDFPreview';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PublicQuotePage = () => {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [selectedOption, setSelectedOption] = useState(1); // Nouvelle state pour l'option sélectionnée
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`${API}/public/quote/${token}`);
        if (!res.ok) throw new Error('Devis non trouvé');
        const data = await res.json();
        setQuote(data);
        if (data.signed_at) setSigned(true);
        fetch(`${API}/public/quote/${token}/opened`, { method: 'POST' });
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };
    fetchQuote();
  }, [token]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = BRAND_BLUE;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const endDraw = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (!hasSignature) return;
    setSigning(true);
    try {
      const signatureData = canvasRef.current.toDataURL('image/png');
      // First update local state so PDFDocument renders with signature
      const updatedQuote = { ...quote, signature_data: signatureData, signed_at: new Date().toISOString(), signer_name: signerName };

      // Generate signed PDF
      let pdfData = null;
      try {
        pdfData = await generatePDFBase64(updatedQuote, 'quote');
      } catch (err) {
        console.error('PDF generation for signature:', err);
      }

      const payload = {
        signature_data: signatureData,
        signer_name: signerName,
        selected_option: selectedOption, // Ajouter l'option sélectionnée
      };
      if (pdfData) {
        payload.pdf_base64 = pdfData.base64;
        payload.pdf_filename = pdfData.filename;
      }

      const res = await fetch(`${API}/public/quote/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSigned(true);
        setQuote(updatedQuote);
      }
    } catch (e) { console.error(e); }
    setSigning(false);
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="animate-pulse text-slate-400">Chargement du devis...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="text-center">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-700 mb-2">Devis introuvable</h1>
        <p className="text-slate-500 text-sm">Ce lien est invalide ou a expiré.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100" data-testid="public-quote-page">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between print:hidden sticky top-0 z-10" data-testid="public-quote-toolbar">
        <span style={{ color: BRAND_BLUE, fontWeight: 700, fontSize: '14px' }}>
          Devis {quote.quote_number}
        </span>
        <Button onClick={handleDownloadPDF} size="sm" variant="outline" disabled={downloading} style={{ borderColor: BRAND_BLUE, color: BRAND_BLUE }} data-testid="download-pdf-btn">
          <Download className="w-4 h-4 mr-1.5" /> {downloading ? 'Génération...' : 'Télécharger PDF'}
        </Button>
      </div>

      {/* PDF Document — responsive */}
      <div className="px-2 py-4 print:p-0">
        <div className="mx-auto shadow-lg rounded overflow-hidden bg-white" style={{ maxWidth: '794px' }}>
          <PDFDocument document={quote} type="quote" compact={true} />
        </div>
      </div>

      {/* Signature Section */}
      <div className="px-2 pb-4 print:p-0">
        <div className="mx-auto rounded-xl overflow-hidden bg-white shadow-lg" style={{ maxWidth: '580px' }} data-testid="signature-section">
          {signed || quote.signed_at ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: '#dcfce7' }}>
                <Check className="w-8 h-8" style={{ color: '#16a34a' }} />
              </div>
              <h3 className="text-xl font-bold mb-1" style={{ color: '#15803d' }}>Devis accepté et signé</h3>
              <p className="text-sm text-slate-500">
                {quote.signed_at ? `Signé le ${new Date(quote.signed_at).toLocaleDateString('fr-FR')}` : 'Merci pour votre confiance'}
              </p>
              {quote.signature_data && (
                <div className="mt-4 inline-block border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <img src={quote.signature_data} alt="Signature" className="h-20" />
                </div>
              )}
              <div className="mt-4">
                <Button onClick={handleDownloadPDF} size="sm" variant="outline" disabled={downloading} style={{ borderColor: BRAND_BLUE, color: BRAND_BLUE }} data-testid="download-signed-pdf-btn">
                  <Download className="w-4 h-4 mr-1.5" /> {downloading ? 'Génération...' : 'Télécharger le devis signé'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-5">
                <Pen className="w-5 h-5" style={{ color: BRAND_BLUE }} />
                <h3 className="font-bold text-base" style={{ color: BRAND_BLUE }}>Signer le devis</h3>
              </div>

              {/* Sélection d'option si plusieurs options disponibles */}
              {(quote.option_2_services?.length > 0 || quote.option_3_services?.length > 0) && (
                <div className="mb-5 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="text-sm font-semibold text-slate-700 mb-3 block">Choisissez l'option que vous souhaitez accepter :</label>
                  <div className="space-y-2">
                    {/* Option 1 */}
                    <label className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-white" style={{ borderColor: selectedOption === 1 ? BRAND_BLUE : '#e2e8f0', backgroundColor: selectedOption === 1 ? '#eff6ff' : 'white' }}>
                      <input
                        type="radio"
                        name="option"
                        value="1"
                        checked={selectedOption === 1}
                        onChange={() => setSelectedOption(1)}
                        className="mt-1"
                        style={{ accentColor: BRAND_BLUE }}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm" style={{ color: selectedOption === 1 ? BRAND_BLUE : '#1e293b' }}>
                          {quote.option_1_title || 'Option 1'}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          Montant : <span className="font-bold">{quote.total_net?.toFixed(2) || '0.00'} €</span>
                        </div>
                      </div>
                    </label>

                    {/* Option 2 */}
                    {quote.option_2_services?.length > 0 && (
                      <label className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-white" style={{ borderColor: selectedOption === 2 ? BRAND_BLUE : '#e2e8f0', backgroundColor: selectedOption === 2 ? '#eff6ff' : 'white' }}>
                        <input
                          type="radio"
                          name="option"
                          value="2"
                          checked={selectedOption === 2}
                          onChange={() => setSelectedOption(2)}
                          className="mt-1"
                          style={{ accentColor: BRAND_BLUE }}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm" style={{ color: selectedOption === 2 ? BRAND_BLUE : '#1e293b' }}>
                            {quote.option_2_title || 'Option 2'}
                          </div>
                          <div className="text-sm text-slate-600 mt-1">
                            Montant : <span className="font-bold">{quote.option_2_total_net?.toFixed(2) || '0.00'} €</span>
                          </div>
                        </div>
                      </label>
                    )}

                    {/* Option 3 */}
                    {quote.option_3_services?.length > 0 && (
                      <label className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-white" style={{ borderColor: selectedOption === 3 ? BRAND_BLUE : '#e2e8f0', backgroundColor: selectedOption === 3 ? '#eff6ff' : 'white' }}>
                        <input
                          type="radio"
                          name="option"
                          value="3"
                          checked={selectedOption === 3}
                          onChange={() => setSelectedOption(3)}
                          className="mt-1"
                          style={{ accentColor: BRAND_BLUE }}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm" style={{ color: selectedOption === 3 ? BRAND_BLUE : '#1e293b' }}>
                            {quote.option_3_title || 'Option 3'}
                          </div>
                          <div className="text-sm text-slate-600 mt-1">
                            Montant : <span className="font-bold">{quote.option_3_total_net?.toFixed(2) || '0.00'} €</span>
                          </div>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs text-slate-500 mb-1 block">Votre nom (optionnel)</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  placeholder="Nom du signataire"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-blue-400 focus:outline-none"
                  data-testid="signer-name-input"
                />
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">Signez ci-dessous avec votre doigt ou souris :</p>
                <div className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white" style={{ touchAction: 'none' }}>
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full cursor-crosshair"
                    style={{ height: '150px' }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                    data-testid="signature-canvas"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-slate-300 text-sm">Signez ici</span>
                    </div>
                  )}
                </div>
                {hasSignature && (
                  <button onClick={clearSignature} className="text-xs text-red-500 hover:text-red-700 mt-1" data-testid="clear-signature-btn">
                    Effacer la signature
                  </button>
                )}
              </div>

              <Button
                onClick={handleSign}
                disabled={!hasSignature || signing}
                className="w-full h-12 text-base font-bold text-white rounded-xl"
                style={{ background: hasSignature ? `linear-gradient(135deg, #f97316 0%, #ea580c 100%)` : '#cbd5e1' }}
                data-testid="accept-sign-btn"
              >
                {signing ? 'Signature en cours...' : 'Accepter et signer le devis'}
              </Button>

              <p className="text-xs text-slate-400 text-center mt-3">
                En signant, vous acceptez les termes de ce devis. Vous recevrez une confirmation par email.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-slate-400 text-xs print:hidden">
        <p>SR Rénovation — Nettoyage, toiture, façade, terrasse</p>
      </div>
    </div>
  );
};

export default PublicQuotePage;
