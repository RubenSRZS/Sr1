import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Download, Pen, FileText } from 'lucide-react';
import { PDFDocument, BRAND_BLUE, BRAND_ORANGE } from '@/components/PDFPreview';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PublicQuotePage = () => {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signerName, setSignerName] = useState('');
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

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
      const res = await fetch(`${API}/public/quote/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_data: signatureData, signer_name: signerName }),
      });
      if (res.ok) setSigned(true);
    } catch (e) { console.error(e); }
    setSigning(false);
  };

  const handlePrint = useCallback(() => window.print(), []);

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
      {/* Download/Print bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between print:hidden sticky top-0 z-10" data-testid="public-quote-toolbar">
        <span style={{ color: BRAND_BLUE, fontWeight: 700, fontSize: '14px' }}>
          Devis {quote.quote_number}
        </span>
        <Button onClick={handlePrint} size="sm" variant="outline" style={{ borderColor: BRAND_BLUE, color: BRAND_BLUE }} data-testid="print-btn">
          <Download className="w-4 h-4 mr-1.5" /> PDF
        </Button>
      </div>

      {/* PDF Document — exact same rendering as the downloaded PDF */}
      <div className="p-4 print:p-0">
        <div className="mx-auto shadow-lg rounded overflow-hidden bg-white" style={{ maxWidth: '210mm' }}>
          <PDFDocument document={quote} type="quote" />
        </div>
      </div>

      {/* Signature Section — below the document */}
      <div className="p-4 print:p-0">
        <div className="mx-auto rounded-xl overflow-hidden bg-white shadow-lg" style={{ maxWidth: '210mm' }} data-testid="signature-section">
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
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Pen className="w-5 h-5" style={{ color: BRAND_BLUE }} />
                <h3 className="font-bold text-base" style={{ color: BRAND_BLUE }}>Signer le devis</h3>
              </div>

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
                En signant, vous acceptez les termes de ce devis. Vous recevrez une confirmation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-slate-400 text-xs print:hidden">
        <p>SR Rénovation — Rénovation de toiture et façade</p>
      </div>
    </div>
  );
};

export default PublicQuotePage;
