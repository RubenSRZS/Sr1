import React from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createRoot } from 'react-dom/client';

// Brand colors
const BRAND_BLUE = '#1e40af';
const BRAND_BLUE_LIGHT = '#3b82f6';
const BRAND_ORANGE = '#f97316';
const BRAND_ORANGE_LIGHT = '#fb923c';

const LOGO_SR = "https://customer-assets.emergentagent.com/job_538ea579-31dc-4f0d-9c02-673e8a0738ca/artifacts/srxb4k7u_Nouveau%20Logo%203.png";
const LOGO_SR_EMBEDDED = "data:image/webp;base64,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";

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

// Main preview document component (HTML version)
const PDFDocument = ({ document, type, compact = false }) => {
  if (!document) return null;
  const isQuote = type === 'quote';
  const docLabel = isQuote ? 'DEVIS' : 'FACTURE';
  const number = isQuote ? document.quote_number : document.invoice_number;
  const fs = compact ? '9px' : '11px';

  const diagItems = document.diagnostic
    ? Object.entries(document.diagnostic).filter(([, v]) => v === true)
    : [];

  const hasOption2 = isQuote && document.option_2_services && document.option_2_services.length > 0;

  return (
    <div
      className="bg-white text-gray-900 relative overflow-hidden"
      style={{
        width: compact ? '100%' : '210mm',
        minHeight: compact ? 'auto' : '297mm',
        fontFamily: "'Manrope', 'Inter', sans-serif",
        fontSize: fs,
        lineHeight: 1.4,
      }}
      data-testid="pdf-document"
    >
      {/* Header gradient */}
      <div className="relative" style={{ background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, ${BRAND_BLUE_LIGHT} 40%, ${BRAND_ORANGE} 100%)` }}>
        <div className="px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <img
              src={LOGO_SR}
              alt="SR Rénovation"
              className={compact ? "h-10" : "h-14"}
              style={{ filter: 'brightness(1.1)', objectFit: 'contain' }}
              crossOrigin="anonymous"
            />
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
              06 80 33 45 46<br />
              SIRET: 894 908 227 00024
            </div>
          </div>
          <div className="rounded-lg p-2.5" style={{ background: '#fff7ed', borderLeft: `3px solid ${BRAND_ORANGE}` }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: BRAND_ORANGE }}>Client</div>
            <div className="font-bold text-sm" style={{ color: '#1e3a5f' }}>{document.client_name || '—'}</div>
            <div className="text-xs text-gray-600 leading-relaxed">
              {document.client_address || '—'}<br />
              {document.client_phone || '—'}
              {document.client_email && <><br />{document.client_email}</>}
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

        {/* Option 2 */}
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
              <div className="text-gray-300 text-xs mt-1">Précédé de "Lu et approuvé"</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t pt-3" style={{ borderColor: '#e5e7eb' }}>
          {/* Partner badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
            <div className="px-2 py-1 rounded text-white font-bold" style={{ background: '#006231', fontSize: '7px', letterSpacing: '0.05em' }}>
              BANQUE POPULAIRE
            </div>
            <div className="px-2 py-1 rounded text-white font-bold" style={{ background: '#003C8F', fontSize: '7px', letterSpacing: '0.05em' }}>
              CHAMBRE DES MÉTIERS
            </div>
            <div className="px-2 py-1 rounded text-white font-bold" style={{ background: BRAND_ORANGE, fontSize: '7px', letterSpacing: '0.05em' }}>
              GARANTIE DÉCENNALE
            </div>
          </div>
          {/* Info row */}
          <div className="grid grid-cols-3 gap-2 text-center mb-2" style={{ fontSize: '8px', color: '#6b7280' }}>
            <div>
              <div className="font-semibold" style={{ color: BRAND_BLUE }}>Assurance</div>
              <div>RC Pro · Décennale</div>
            </div>
            <div>
              <div className="font-semibold" style={{ color: BRAND_BLUE }}>Paiement</div>
              <div>Chèque · Espèces · Virement</div>
            </div>
            <div>
              <div className="font-semibold" style={{ color: BRAND_BLUE }}>Contact</div>
              <div>06 80 33 45 46</div>
            </div>
          </div>
          <div className="text-center pt-1 border-t" style={{ borderColor: '#f3f4f6' }}>
            <span className="font-bold text-sm" style={{ color: BRAND_BLUE }}>Sr-Renovation.fr</span>
            <span className="text-xs text-gray-400 ml-2">Nettoyage toitures, façades et terrasses</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PDF generation using html2canvas + jsPDF ─────────────────────────────────
const generatePDFFromHTML = async (document, type) => {
  const isQuote = type === 'quote';
  const number = isQuote ? document.quote_number : document.invoice_number;
  const prefix = isQuote ? 'DEVIS' : 'FACTURE';
  const filename = `${prefix}_${number || 'XX'}_${(document.client_name || 'client').replace(/\s+/g, '_')}.pdf`;

  // 1. Use embedded logo data URI to avoid CORS issues with html2canvas
  const logoBase64 = LOGO_SR_EMBEDDED;

  // 2. Create a hidden container at A4 width
  const container = window.document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:-9999px;width:794px;background:white;z-index:-9999;pointer-events:none;';
  window.document.body.appendChild(container);

  // 3. Render PDFDocument component into container
  const root = createRoot(container);
  root.render(<PDFDocument document={document} type={type} compact={false} />);

  try {
    // 4. Wait for render + fonts
    await new Promise(r => setTimeout(r, 900));
    await window.document.fonts.ready;

    // 5. Capture with html2canvas
    const canvas = await html2canvas(container.firstChild, {
      scale: 2.5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: logoBase64 ? (clonedDoc) => {
        clonedDoc.querySelectorAll('img').forEach(img => {
          if (img.src && (img.src.includes('emergentagent.com') || img.src === LOGO_SR)) {
            img.src = logoBase64;
          }
        });
      } : undefined,
    });

    // 6. Build PDF from canvas slices (multi-page support)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidthMm = pdf.internal.pageSize.getWidth();   // 210mm
    const pageHeightMm = pdf.internal.pageSize.getHeight(); // 297mm

    // Calculate pixel height of one A4 page at the canvas scale
    const pxPerMm = canvas.width / pageWidthMm;
    const pageHeightPx = pageHeightMm * pxPerMm;
    const totalPages = Math.ceil(canvas.height / pageHeightPx);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      // Slice the canvas for this page
      const sliceCanvas = window.document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      const sliceStartPx = page * pageHeightPx;
      const sliceEndPx = Math.min(sliceStartPx + pageHeightPx, canvas.height);
      sliceCanvas.height = Math.ceil(sliceEndPx - sliceStartPx);

      const ctx = sliceCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, -sliceStartPx);

      const sliceHeightMm = (sliceCanvas.height / canvas.width) * pageWidthMm;
      const imgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, sliceHeightMm);
    }

    pdf.save(filename);
    return true;
  } finally {
    root.unmount();
    window.document.body.removeChild(container);
  }
};

// Download function exposed for external use
const downloadPDF = async (document, type) => {
  try {
    const success = await generatePDFFromHTML(document, type);
    if (success) {
      toast.success('PDF téléchargé avec succès');
    } else {
      toast.error('Erreur lors du téléchargement');
    }
    return success;
  } catch (err) {
    console.error('PDF error:', err);
    toast.error('Erreur lors de la génération du PDF');
    return false;
  }
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

export { PDFDocument, downloadPDF, generatePDFFromHTML, BRAND_BLUE, BRAND_ORANGE };
export default PDFPreview;
