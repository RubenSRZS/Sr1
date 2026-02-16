import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO_SR = "https://customer-assets.emergentagent.com/job_538ea579-31dc-4f0d-9c02-673e8a0738ca/artifacts/srxb4k7u_Nouveau%20Logo%203.png";
const LOGO_QUALI = "https://customer-assets.emergentagent.com/job_intelinvoice/artifacts/ez8o3wbz_Logo%20Francais%20Detourer.png";
const LOGO_BP = "https://customer-assets.emergentagent.com/job_intelinvoice/artifacts/2lbuw6zf_Bpbfc.png";
const LOGO_CMA = "https://customer-assets.emergentagent.com/job_intelinvoice/artifacts/uldr9xy9_CMA.png";

const DiagnosticLabels = {
  mousses: 'Mousses', lichens: 'Lichens', tuiles_cassees: 'Tuiles cassées',
  faitage: 'Faîtage', gouttieres: 'Gouttières', facade: 'Façade',
};

const PDFDocument = ({ document, type, compact = false }) => {
  if (!document) return null;
  const isQuote = type === 'quote';
  const docLabel = isQuote ? 'DEVIS' : 'FACTURE';
  const number = isQuote ? document.quote_number : document.invoice_number;
  const fs = compact ? '10px' : '12.5px';

  // Check if diagnostic has any checked items
  const diagItems = document.diagnostic
    ? Object.entries(document.diagnostic).filter(([, v]) => v === true)
    : [];

  return (
    <div
      className="bg-white text-gray-900 relative overflow-hidden"
      style={{
        width: compact ? '100%' : '210mm',
        minHeight: compact ? 'auto' : '297mm',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: fs,
        lineHeight: 1.5,
      }}
      data-testid="pdf-document"
    >
      {/* === HEADER === */}
      <div className="relative" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 40%, #f59e0b 100%)' }}>
        <div className="px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <img src={LOGO_SR} alt="SR" className={compact ? "h-12" : "h-16"} style={{ filter: 'brightness(1.1)' }} />
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.3em] opacity-70 font-medium">{docLabel}</div>
            <div className={`font-black ${compact ? 'text-3xl' : 'text-5xl'}`} style={{ letterSpacing: '-1px' }}>
              {number || 'XX'}
            </div>
            <div className="text-sm opacity-80 mt-0.5">{document.date}</div>
          </div>
        </div>
        {/* Wave bottom */}
        <svg viewBox="0 0 1440 40" className="block w-full" preserveAspectRatio="none" style={{ height: '20px' }}>
          <path d="M0,20 C360,40 720,0 1080,20 C1260,30 1380,10 1440,20 L1440,40 L0,40 Z" fill="white" />
        </svg>
      </div>

      {/* === BODY === */}
      <div className={compact ? "px-4 pb-4" : "px-8 pb-6"}>
        {/* Company + Client row */}
        <div className="grid grid-cols-2 gap-4 mb-4 -mt-1">
          {/* Entreprise */}
          <div className="rounded-lg p-3" style={{ background: '#f0f7ff', borderLeft: '3px solid #3b82f6' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3b82f6' }}>Entreprise</span>
              <img src={LOGO_QUALI} alt="Qualibat" className="h-5 ml-auto" style={{ opacity: 0.7 }} />
            </div>
            <div className="font-bold text-sm">Ruben SUAREZ-SAR</div>
            <div className="text-xs text-gray-600 leading-relaxed mt-0.5">
              1 Chemin de l'Etang Jean Guyon<br />
              39570 COURLAOUX<br />
              06 80 33 45 46<br />
              SrRenovation03@gmail.com<br />
              <span className="text-gray-400">SIRET: 894 908 227 00024</span>
            </div>
          </div>
          {/* Client */}
          <div className="rounded-lg p-3" style={{ background: '#fff8f0', borderLeft: '3px solid #f59e0b' }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#f59e0b' }}>Client</div>
            <div className="font-bold text-sm" style={{ color: '#1e3a5f' }}>{document.client_name || '—'}</div>
            <div className="text-xs text-gray-600 leading-relaxed mt-0.5">
              {document.client_address || '—'}<br />
              {document.client_phone || '—'}
              {document.client_email && <><br />{document.client_email}</>}
            </div>
          </div>
        </div>

        {/* Work location */}
        <div className="rounded-lg px-4 py-2 mb-4 text-xs flex items-center gap-4" style={{ background: 'linear-gradient(90deg, #eff6ff, #fffbeb)' }}>
          <span><strong style={{ color: '#3b82f6' }}>Lieu des travaux:</strong> {document.work_location || '—'}</span>
        </div>

        {/* Diagnostic (if any checked) */}
        {isQuote && diagItems.length > 0 && (
          <div className="rounded-lg p-3 mb-4 border" style={{ borderColor: '#dbeafe', background: '#f8fbff' }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#3b82f6' }}>Diagnostic</div>
            <div className="flex flex-wrap gap-2">
              {diagItems.map(([key]) => (
                <span key={key} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: '#dbeafe', color: '#2563eb' }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>
                  {DiagnosticLabels[key] || key}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Services table */}
        <table className="w-full mb-4" style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: compact ? '10px' : '12px' }}>
          <thead>
            <tr>
              <th className="text-left px-3 py-2.5 text-white font-semibold rounded-tl-lg" style={{ background: '#3b82f6' }}>Description</th>
              <th className="text-center px-2 py-2.5 text-white font-semibold w-14" style={{ background: '#3b82f6' }}>Qté</th>
              <th className="text-right px-2 py-2.5 text-white font-semibold w-20" style={{ background: '#3b82f6' }}>P.U. HT</th>
              <th className="text-right px-3 py-2.5 text-white font-semibold w-24 rounded-tr-lg" style={{ background: '#3b82f6' }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {document.services && document.services.length > 0 ? document.services.map((service, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : ''} style={i % 2 !== 0 ? { background: '#f0f7ff' } : {}}>
                <td className="px-3 py-2 text-gray-800">{service.description}</td>
                <td className="px-2 py-2 text-center text-gray-600">{service.quantity}</td>
                <td className="px-2 py-2 text-right text-gray-600">{Number(service.unit_price).toFixed(2)} €</td>
                <td className="px-3 py-2 text-right font-semibold">{Number(service.total).toFixed(2)} €</td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="text-center py-4 text-gray-400 italic">Aucun service ajouté</td></tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-4">
          <div style={{ width: compact ? '100%' : '260px' }}>
            <div className="flex justify-between py-1.5 px-3 text-xs text-gray-500">
              <span>Total brut</span>
              <span className="font-medium text-gray-700">{Number(document.total_brut || 0).toFixed(2)} €</span>
            </div>
            {Number(document.remise || 0) > 0 && (
              <div className="flex justify-between py-1.5 px-3 text-xs rounded" style={{ color: '#f59e0b', background: '#fffbeb' }}>
                <span>Remise{document.remise_percent > 0 ? ` (${document.remise_percent}%)` : ''}</span>
                <span className="font-semibold">-{Number(document.remise).toFixed(2)} €</span>
              </div>
            )}
            <div
              className="flex justify-between py-2.5 px-3 rounded-lg mt-1.5 text-white font-bold"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', fontSize: compact ? '14px' : '17px' }}
            >
              <span>TOTAL NET</span>
              <span>{Number(document.total_net || 0).toFixed(2)} €</span>
            </div>
            {isQuote && (
              <div className="flex justify-between py-2 px-3 rounded-lg mt-1.5 text-white font-semibold text-xs"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
              >
                <span>Acompte 30% à la signature</span>
                <span>{Number(document.acompte_30 || 0).toFixed(2)} €</span>
              </div>
            )}
            {!isQuote && (
              <>
                <div className="flex justify-between py-1.5 px-3 text-xs mt-1 rounded" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <span>Acompte versé</span>
                  <span className="font-semibold">{Number(document.acompte_paid || 0).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg mt-1.5 font-bold text-white text-xs"
                  style={{ background: '#dc2626' }}
                >
                  <span>RESTE À PAYER</span>
                  <span>{Number(document.reste_a_payer || 0).toFixed(2)} €</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {document.notes && (
          <div className="rounded-lg px-4 py-2.5 mb-4 text-xs" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="font-semibold text-gray-500 mb-0.5">Notes</div>
            <div className="text-gray-700 whitespace-pre-wrap">{document.notes}</div>
          </div>
        )}

        {/* TVA notice */}
        <div className="text-center text-xs text-gray-400 italic mb-4">
          TVA non applicable, art. 293 B du CGI
        </div>

        {/* Signature (quotes only) */}
        {isQuote && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-dashed rounded-lg p-3 text-center text-xs text-gray-400" style={{ borderColor: '#93c5fd' }}>
              <div className="font-semibold mb-8">Signature de l'entreprise</div>
            </div>
            <div className="border border-dashed rounded-lg p-3 text-center text-xs text-gray-400" style={{ borderColor: '#fbbf24' }}>
              <div className="font-semibold mb-1">Bon pour accord</div>
              <div className="text-gray-300 mb-5 text-[9px]">Précédé de la mention "Lu et approuvé"</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t pt-3" style={{ borderColor: '#e5e7eb' }}>
          <div className="grid grid-cols-3 gap-3 text-xs text-gray-500 mb-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <img src={LOGO_CMA} alt="CMA" className="h-5" style={{ opacity: 0.6 }} />
                <span className="font-semibold text-gray-700">Informations</span>
              </div>
              SIRET: 894 908 227 00024<br />
              Micro-entreprise
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <img src={LOGO_BP} alt="BP" className="h-4" style={{ opacity: 0.6 }} />
                <span className="font-semibold text-gray-700">Assurance</span>
              </div>
              RC Pro: Banque Populaire<br />
              Garantie décennale
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-700 mb-1">Paiement</div>
              Chèque, Espèces, Virement
              {isQuote && <><br />Acompte 30% à la signature</>}
            </div>
          </div>
          {/* Brand footer */}
          <div className="text-center pt-2 pb-1" style={{ borderTop: '2px solid transparent', borderImage: 'linear-gradient(90deg, #3b82f6, #f59e0b) 1' }}>
            <span className="font-bold text-sm" style={{ color: '#3b82f6' }}>Sr-Renovation.fr</span>
            <span className="text-xs text-gray-400 ml-2">Nettoyage toitures, façades et terrasses</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PDFPreview = ({ document, type, onClose }) => {
  if (!document) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-8 backdrop-blur-sm overflow-y-auto"
      data-testid="pdf-preview-modal"
    >
      <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl animate-fade-in-up relative">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl">
          <h2 className="font-semibold text-gray-900" data-testid="preview-title">
            Aperçu {type === 'quote' ? 'Devis' : 'Facture'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="close-preview-btn">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4 bg-gray-100">
          <div className="mx-auto shadow-lg rounded overflow-hidden" style={{ maxWidth: '210mm' }}>
            <PDFDocument document={document} type={type} />
          </div>
        </div>
      </div>
    </div>
  );
};

export { PDFDocument };
export default PDFPreview;
