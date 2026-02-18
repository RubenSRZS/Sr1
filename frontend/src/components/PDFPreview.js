import React from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generatePDF } from './PDFGenerator';
import { toast } from 'sonner';

// Brand colors
const BRAND_BLUE = '#1e40af';
const BRAND_BLUE_LIGHT = '#3b82f6';
const BRAND_ORANGE = '#f97316';
const BRAND_ORANGE_LIGHT = '#fb923c';

const LOGO_SR = "https://customer-assets.emergentagent.com/job_538ea579-31dc-4f0d-9c02-673e8a0738ca/artifacts/srxb4k7u_Nouveau%20Logo%203.png";

const DiagnosticLabels = {
  mousses: 'Mousses', lichens: 'Lichens', tuiles_cassees: 'Tuiles cassées',
  faitage: 'Faîtage', gouttieres: 'Gouttières', facade: 'Façade',
};

// Services Table for preview
const ServicesTable = ({ services, title, compact }) => (
  <div className="mb-4">
    {title && (
      <div 
        className="text-sm font-bold mb-2 pb-1 border-b-2"
        style={{ color: BRAND_BLUE, borderColor: BRAND_BLUE }}
      >
        {title}
      </div>
    )}
    <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: compact ? '9px' : '11px' }}>
      <thead>
        <tr>
          <th className="text-left px-2 py-2 text-white font-semibold rounded-tl-lg" style={{ background: BRAND_BLUE }}>Description</th>
          <th className="text-center px-2 py-2 text-white font-semibold w-12" style={{ background: BRAND_BLUE }}>Qté</th>
          <th className="text-right px-2 py-2 text-white font-semibold w-16" style={{ background: BRAND_BLUE }}>P.U. HT</th>
          <th className="text-right px-2 py-2 text-white font-semibold w-20 rounded-tr-lg" style={{ background: BRAND_BLUE }}>Total HT</th>
        </tr>
      </thead>
      <tbody>
        {services && services.length > 0 ? services.map((service, i) => (
          <tr key={i} className={i % 2 === 0 ? 'bg-white' : ''} style={i % 2 !== 0 ? { background: '#f8fafc' } : {}}>
            <td className="px-2 py-1.5 text-gray-800">{service.description || '—'}</td>
            <td className="px-2 py-1.5 text-center text-gray-600">{service.quantity}</td>
            <td className="px-2 py-1.5 text-right text-gray-600">{Number(service.unit_price || 0).toFixed(2)} €</td>
            <td className="px-2 py-1.5 text-right font-semibold">{Number(service.total || 0).toFixed(2)} €</td>
          </tr>
        )) : (
          <tr><td colSpan={4} className="text-center py-3 text-gray-400 italic">Aucun service</td></tr>
        )}
      </tbody>
    </table>
  </div>
);

// Totals section for preview
const TotalsSection = ({ totalBrut, remise, remisePercent, totalNet, acompte30, isQuote, label, compact }) => (
  <div className="flex justify-end mb-4">
    <div style={{ width: compact ? '100%' : '220px' }}>
      {label && (
        <div className="text-xs font-bold mb-1" style={{ color: BRAND_BLUE }}>{label}</div>
      )}
      <div className="flex justify-between py-1 px-2 text-xs text-gray-500">
        <span>Total brut</span>
        <span className="font-medium text-gray-700">{Number(totalBrut || 0).toFixed(2)} €</span>
      </div>
      {Number(remise || 0) > 0 && (
        <div className="flex justify-between py-1 px-2 text-xs rounded" style={{ color: BRAND_ORANGE, background: '#fff7ed' }}>
          <span>Remise{remisePercent > 0 ? ` (${remisePercent}%)` : ''}</span>
          <span className="font-semibold">-{Number(remise).toFixed(2)} €</span>
        </div>
      )}
      <div
        className="flex justify-between py-2 px-2 rounded-lg mt-1 text-white font-bold"
        style={{ background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_BLUE_LIGHT})`, fontSize: compact ? '12px' : '14px' }}
      >
        <span>TOTAL NET</span>
        <span>{Number(totalNet || 0).toFixed(2)} €</span>
      </div>
      {isQuote && acompte30 > 0 && (
        <div className="flex justify-between py-1.5 px-2 rounded-lg mt-1 text-white font-semibold text-xs"
          style={{ background: `linear-gradient(135deg, ${BRAND_ORANGE}, ${BRAND_ORANGE_LIGHT})` }}
        >
          <span>Acompte 30%</span>
          <span>{Number(acompte30).toFixed(2)} €</span>
        </div>
      )}
    </div>
  </div>
);

// Main preview document component (HTML version for live preview)
const PDFDocument = ({ document, type, compact = false }) => {
  if (!document) return null;
  const isQuote = type === 'quote';
  const docLabel = isQuote ? 'DEVIS' : 'FACTURE';
  const number = isQuote ? document.quote_number : document.invoice_number;
  const fs = compact ? '9px' : '11px';

  // Check if diagnostic has any checked items
  const diagItems = document.diagnostic
    ? Object.entries(document.diagnostic).filter(([, v]) => v === true)
    : [];

  // Check if multi-option
  const hasOption2 = isQuote && document.option_2_services && document.option_2_services.length > 0;

  return (
    <div
      className="bg-white text-gray-900 relative overflow-hidden"
      style={{
        width: compact ? '100%' : '210mm',
        minHeight: compact ? 'auto' : '297mm',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: fs,
        lineHeight: 1.4,
      }}
      data-testid="pdf-document"
    >
      {/* Header */}
      <div className="relative" style={{ background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, ${BRAND_BLUE_LIGHT} 40%, ${BRAND_ORANGE} 100%)` }}>
        <div className="px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <img src={LOGO_SR} alt="SR" className={compact ? "h-10" : "h-14"} style={{ filter: 'brightness(1.1)' }} />
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.2em] opacity-70 font-medium">{docLabel}</div>
            <div className={`font-black ${compact ? 'text-2xl' : 'text-4xl'}`} style={{ letterSpacing: '-1px' }}>
              {number || 'XX'}
            </div>
            <div className="text-sm opacity-80">{document.date}</div>
          </div>
        </div>
        <svg viewBox="0 0 1440 40" className="block w-full" preserveAspectRatio="none" style={{ height: '15px' }}>
          <path d="M0,20 C360,40 720,0 1080,20 C1260,30 1380,10 1440,20 L1440,40 L0,40 Z" fill="white" />
        </svg>
      </div>

      {/* Body */}
      <div className={compact ? "px-3 pb-3" : "px-6 pb-5"}>
        {/* Company + Client */}
        <div className="grid grid-cols-2 gap-3 mb-3 -mt-1">
          <div className="rounded-lg p-2.5" style={{ background: '#eff6ff', borderLeft: `3px solid ${BRAND_BLUE}` }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: BRAND_BLUE }}>Entreprise</div>
            <div className="font-bold text-sm">Ruben SUAREZ-SAR</div>
            <div className="text-xs text-gray-600 leading-relaxed">
              1 Chemin de l'Etang Jean Guyon<br />
              39570 COURLAOUX<br />
              06 80 33 45 46
            </div>
          </div>
          <div className="rounded-lg p-2.5" style={{ background: '#fff7ed', borderLeft: `3px solid ${BRAND_ORANGE}` }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: BRAND_ORANGE }}>Client</div>
            <div className="font-bold text-sm" style={{ color: '#1e3a5f' }}>{document.client_name || '—'}</div>
            <div className="text-xs text-gray-600 leading-relaxed">
              {document.client_address || '—'}<br />
              {document.client_phone || '—'}
            </div>
          </div>
        </div>

        {/* Work location */}
        <div className="rounded-lg px-3 py-1.5 mb-3 text-xs" style={{ background: '#f8fafc' }}>
          <span><strong style={{ color: BRAND_BLUE }}>Lieu:</strong> {document.work_location || '—'}</span>
        </div>

        {/* Diagnostic */}
        {isQuote && diagItems.length > 0 && (
          <div className="rounded-lg p-2.5 mb-3 border" style={{ borderColor: '#dbeafe', background: '#f8fafc' }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: BRAND_BLUE }}>Diagnostic</div>
            <div className="flex flex-wrap gap-1.5">
              {diagItems.map(([key]) => (
                <span key={key} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: '#dbeafe', color: '#2563eb' }}>
                  ✓ {DiagnosticLabels[key] || key}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Option 1 services */}
        <ServicesTable 
          services={document.services} 
          title={hasOption2 ? "OPTION 1" : null}
          compact={compact}
        />
        
        {/* Option 1 totals */}
        <TotalsSection
          totalBrut={document.total_brut}
          remise={document.remise}
          remisePercent={document.remise_percent}
          totalNet={document.total_net}
          acompte30={document.acompte_30}
          isQuote={isQuote}
          label={hasOption2 ? "Total Option 1" : null}
          compact={compact}
        />

        {/* Option 2 if exists */}
        {hasOption2 && (
          <>
            <ServicesTable 
              services={document.option_2_services} 
              title="OPTION 2"
              compact={compact}
            />
            <TotalsSection
              totalBrut={document.option_2_total_brut}
              remise={document.option_2_remise}
              remisePercent={document.option_2_remise_percent}
              totalNet={document.option_2_total_net}
              acompte30={document.option_2_acompte_30}
              isQuote={isQuote}
              label="Total Option 2"
              compact={compact}
            />
          </>
        )}

        {/* Invoice specifics */}
        {!isQuote && (
          <div className="flex justify-end mb-3">
            <div style={{ width: compact ? '100%' : '220px' }}>
              <div className="flex justify-between py-1 px-2 text-xs rounded" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <span>Acompte versé</span>
                <span className="font-semibold">{Number(document.acompte_paid || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-1.5 px-2 rounded-lg mt-1 font-bold text-white text-xs"
                style={{ background: '#dc2626' }}
              >
                <span>RESTE À PAYER</span>
                <span>{Number(document.reste_a_payer || 0).toFixed(2)} €</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {document.notes && (
          <div className="rounded-lg px-3 py-2 mb-3 text-xs" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="font-semibold text-gray-500 mb-0.5">Notes</div>
            <div className="text-gray-700 whitespace-pre-wrap">{document.notes}</div>
          </div>
        )}

        {/* TVA */}
        <div className="text-center text-xs text-gray-400 italic mb-3">
          TVA non applicable, art. 293 B du CGI
        </div>

        {/* Signatures */}
        {isQuote && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="border border-dashed rounded-lg p-2 text-center text-xs text-gray-400" style={{ borderColor: BRAND_BLUE_LIGHT }}>
              <div className="font-semibold mb-6">Signature entreprise</div>
            </div>
            <div className="border border-dashed rounded-lg p-2 text-center text-xs text-gray-400" style={{ borderColor: BRAND_ORANGE_LIGHT }}>
              <div className="font-semibold">Bon pour accord</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t pt-2" style={{ borderColor: '#e5e7eb' }}>
          <div className="text-center pt-1">
            <span className="font-bold text-sm" style={{ color: BRAND_BLUE }}>Sr-Renovation.fr</span>
            <span className="text-xs text-gray-400 ml-2">Nettoyage toitures, façades et terrasses</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Download function using the new PDF generator
const downloadPDF = async (document, type) => {
  const success = await generatePDF(document, type);
  if (success) {
    toast.success('PDF téléchargé');
  } else {
    toast.error('Erreur de téléchargement');
  }
  return success;
};

// Modal preview component
const PDFPreview = ({ document, type, onClose }) => {
  const handleDownload = async () => {
    await downloadPDF(document, type);
  };
  
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
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              className="text-sm"
              style={{ borderColor: BRAND_BLUE, color: BRAND_BLUE }}
              data-testid="download-pdf-btn"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Télécharger PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="close-preview-btn">
              <X className="h-5 w-5" />
            </Button>
          </div>
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

export { PDFDocument, downloadPDF, BRAND_BLUE, BRAND_ORANGE };
export default PDFPreview;
