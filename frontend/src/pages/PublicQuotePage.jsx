import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Download, FileText, Phone, MapPin, Pen } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BRAND_BLUE = '#1e3a5f';
const BRAND_ORANGE = '#f59e0b';

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
        // Track opening
        fetch(`${API}/public/quote/${token}/opened`, { method: 'POST' });
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };
    fetchQuote();
  }, [token]);

  // Canvas signature handlers
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
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse text-slate-400">Chargement du devis...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-700 mb-2">Devis introuvable</h1>
        <p className="text-slate-500 text-sm">Ce lien est invalide ou a expiré.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" data-testid="public-quote-page">
      {/* Header */}
      <header style={{ background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, #2d5a8e 100%)` }} className="px-4 py-5 text-white print:bg-white print:text-black">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-slate-900 font-black text-xs">SR</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">SR RÉNOVATION</h1>
              <p className="text-blue-200 text-xs">Rénovation de toiture et façade</p>
            </div>
          </div>
          <Button onClick={handlePrint} size="sm" variant="ghost" className="text-white hover:bg-white/10 print:hidden" data-testid="print-btn">
            <Download className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Quote Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-testid="quote-info-card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Devis</p>
              <p className="text-lg font-bold" style={{ color: BRAND_BLUE }}>{quote.quote_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Date</p>
              <p className="text-sm font-semibold text-slate-700">{quote.date}</p>
            </div>
          </div>
          {quote.quote_title && (
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <p className="font-semibold text-sm" style={{ color: BRAND_BLUE }}>{quote.quote_title}</p>
            </div>
          )}
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Lieu des travaux</p>
                <p className="font-medium text-slate-700">{quote.work_location}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Client</p>
                <p className="font-medium text-slate-700">{quote.client_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-testid="services-table">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="font-semibold text-sm" style={{ color: BRAND_BLUE }}>
              {quote.option_1_title || 'Détail des prestations'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: `linear-gradient(90deg, ${BRAND_BLUE} 0%, ${BRAND_BLUE} 60%, ${BRAND_ORANGE} 100%)` }}>
                  <th className="text-left text-white py-2.5 px-4 font-semibold text-xs">Description</th>
                  <th className="text-center text-white py-2.5 px-2 font-semibold text-xs w-16">Qté</th>
                  <th className="text-right text-white py-2.5 px-2 font-semibold text-xs w-20">P.U.</th>
                  <th className="text-right text-white py-2.5 px-4 font-semibold text-xs w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.services.map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2.5 px-4 text-slate-700">{s.description}</td>
                    <td className="py-2.5 px-2 text-center text-slate-600">{s.quantity} {s.unit}</td>
                    <td className="py-2.5 px-2 text-right text-slate-600">{s.unit_price.toFixed(2)} €</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-slate-700">{s.total.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Option 2 */}
        {quote.option_2_services && quote.option_2_services.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <p className="font-semibold text-sm" style={{ color: BRAND_BLUE }}>
                {quote.option_2_title || 'Option 2'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: BRAND_BLUE }}>
                    <th className="text-left text-white py-2.5 px-4 font-semibold text-xs">Description</th>
                    <th className="text-center text-white py-2.5 px-2 font-semibold text-xs w-16">Qté</th>
                    <th className="text-right text-white py-2.5 px-2 font-semibold text-xs w-20">P.U.</th>
                    <th className="text-right text-white py-2.5 px-4 font-semibold text-xs w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.option_2_services.map((s, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-2.5 px-4 text-slate-700">{s.description}</td>
                      <td className="py-2.5 px-2 text-center text-slate-600">{s.quantity} {s.unit}</td>
                      <td className="py-2.5 px-2 text-right text-slate-600">{s.unit_price.toFixed(2)} €</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-700">{s.total.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 text-right border-t border-slate-100">
              <span className="text-sm font-bold" style={{ color: BRAND_BLUE }}>Total Option 2 : {quote.option_2_total_net.toFixed(2)} € TTC</span>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5" data-testid="quote-totals">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Total brut</span>
              <span>{quote.total_brut.toFixed(2)} €</span>
            </div>
            {quote.remise > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Remise</span>
                <span>-{quote.remise.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200" style={{ color: BRAND_BLUE }}>
              <span>Total net TTC</span>
              <span>{quote.total_net.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500 pt-1">
              <span>Acompte à la signature (30%)</span>
              <span>{quote.acompte_30.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1 uppercase">Remarques</p>
            <p className="text-sm text-amber-800 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Signature Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:break-inside-avoid" data-testid="signature-section">
          {signed || quote.signed_at ? (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-700 mb-1">Devis accepté et signé</h3>
              <p className="text-sm text-slate-500">
                {quote.signed_at ? `Signé le ${new Date(quote.signed_at).toLocaleDateString('fr-FR')}` : 'Merci pour votre confiance'}
              </p>
              {quote.signature_data && (
                <div className="mt-4 inline-block border border-slate-200 rounded-lg p-2 bg-slate-50">
                  <img src={quote.signature_data} alt="Signature" className="h-20" />
                </div>
              )}
            </div>
          ) : (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
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

              <div className="mb-3">
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
                style={{ background: hasSignature ? `linear-gradient(135deg, ${BRAND_ORANGE} 0%, #d97706 100%)` : '#cbd5e1' }}
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

        {/* Footer */}
        <div className="text-center py-6 text-slate-400 text-xs print:hidden">
          <p>SR Rénovation — Rénovation de toiture et façade</p>
        </div>
      </main>
    </div>
  );
};

export default PublicQuotePage;
