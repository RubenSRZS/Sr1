import React from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO_SR = "https://customer-assets.emergentagent.com/job_538ea579-31dc-4f0d-9c02-673e8a0738ca/artifacts/srxb4k7u_Nouveau%20Logo%203.png";
const LOGO_QUALI = "https://customer-assets.emergentagent.com/job_intelinvoice/artifacts/ez8o3wbz_Logo%20Francais%20Detourer.png";
const LOGO_BP = "https://customer-assets.emergentagent.com/job_intelinvoice/artifacts/2lbuw6zf_Bpbfc.png";
const LOGO_CMA = "https://customer-assets.emergentagent.com/job_intelinvoice/artifacts/uldr9xy9_CMA.png";

const PDFDocument = ({ document, type, compact = false }) => {
  if (!document) return null;
  const isQuote = type === 'quote';
  const docLabel = isQuote ? 'DEVIS' : 'FACTURE';
  const number = isQuote ? document.quote_number : document.invoice_number;

  return (
    <div
      className="bg-white text-gray-900"
      style={{
        width: compact ? '100%' : '210mm',
        minHeight: compact ? 'auto' : '297mm',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: compact ? '11px' : '13px',
        lineHeight: 1.5,
      }}
      data-testid="pdf-document"
    >
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0c1829 0%, #1a2d4a 60%, #e8712a 100%)' }}
        className="text-white px-6 py-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <img src={LOGO_SR} alt="SR Renovation" className={compact ? "h-10" : "h-14"} />
        </div>
        <div className="text-right">
          <div className="uppercase tracking-widest text-xs opacity-80">{docLabel}</div>
          <div className={compact ? "text-2xl font-bold" : "text-4xl font-bold"}>
            N° {number || 'XX'}
          </div>
          <div className="text-sm opacity-75 mt-0.5">{document.date}</div>
        </div>
      </div>

      {/* Thin accent bar */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #0c1829 0%, #e8712a 100%)' }} />

      {/* Body */}
      <div className={compact ? "p-4" : "p-8"}>
        {/* Company + Client */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1.5">Entreprise</div>
            <div className="border border-gray-200 rounded-lg p-3" style={{ borderLeft: '3px solid #0c1829' }}>
              <div className="font-bold text-sm">Ruben SUAREZ-SAR</div>
              <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                1 Chemin de l'Etang Jean Guyon<br />
                39570 COURLAOUX<br />
                Tel: 06 80 33 45 46<br />
                SrRenovation03@gmail.com<br />
                SIRET: 894 908 227 00024
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1.5">Client</div>
            <div className="border border-gray-200 rounded-lg p-3" style={{ borderLeft: '3px solid #e8712a' }}>
              <div className="font-bold text-sm" style={{ color: '#e8712a' }}>{document.client_name || '—'}</div>
              <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                {document.client_address || '—'}<br />
                Tel: {document.client_phone || '—'}
                {document.client_email && <><br />{document.client_email}</>}
              </div>
            </div>
          </div>
        </div>

        {/* Work info */}
        <div className="flex items-center gap-4 bg-gray-50 rounded-lg px-4 py-2.5 mb-5 text-xs">
          <span><strong className="text-gray-500">Lieu:</strong> {document.work_location || '—'}</span>
          {document.work_surface && (
            <span><strong className="text-gray-500">Surface:</strong> {document.work_surface}</span>
          )}
        </div>

        {/* Services table */}
        <table className="w-full mb-5 text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#0c1829', color: 'white' }}>
              <th className="text-left px-3 py-2.5 rounded-tl-lg font-medium">Description</th>
              <th className="text-center px-2 py-2.5 font-medium w-16">Qté</th>
              <th className="text-right px-2 py-2.5 font-medium w-20">P.U. HT</th>
              <th className="text-right px-3 py-2.5 rounded-tr-lg font-medium w-24">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {document.services && document.services.length > 0 ? document.services.map((service, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
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
        <div className="flex justify-end mb-5">
          <div style={{ width: compact ? '100%' : '280px' }}>
            <div className="flex justify-between py-1.5 px-3 text-xs">
              <span className="text-gray-500">Total brut</span>
              <span className="font-medium">{Number(document.total_brut || 0).toFixed(2)} €</span>
            </div>
            {Number(document.remise || 0) > 0 && (
              <div className="flex justify-between py-1.5 px-3 text-xs" style={{ color: '#e8712a' }}>
                <span>Remise ({document.remise_percent || 0}%)</span>
                <span className="font-medium">-{Number(document.remise).toFixed(2)} €</span>
              </div>
            )}
            <div
              className="flex justify-between py-2.5 px-3 rounded-lg mt-1 text-white font-bold"
              style={{ background: '#0c1829', fontSize: compact ? '13px' : '16px' }}
            >
              <span>TOTAL NET</span>
              <span>{Number(document.total_net || 0).toFixed(2)} €</span>
            </div>
            {isQuote && (
              <div className="flex justify-between py-2 px-3 rounded-lg mt-1.5 text-white font-semibold text-xs"
                style={{ background: '#e8712a' }}
              >
                <span>Acompte 30%</span>
                <span>{Number(document.acompte_30 || 0).toFixed(2)} €</span>
              </div>
            )}
            {!isQuote && (
              <>
                <div className="flex justify-between py-1.5 px-3 text-xs mt-1 text-green-700 bg-green-50 rounded">
                  <span>Acompte versé</span>
                  <span className="font-medium">{Number(document.acompte_paid || 0).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg mt-1.5 font-bold text-xs"
                  style={{ background: '#dc2626', color: 'white' }}
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
          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-5 text-xs">
            <div className="font-semibold text-gray-500 mb-1">Notes</div>
            <div className="text-gray-700 whitespace-pre-wrap">{document.notes}</div>
          </div>
        )}

        {/* TVA notice */}
        <div className="text-center text-xs text-gray-400 italic mb-5">
          TVA non applicable, art. 293 B du CGI
        </div>

        {/* Signature area for quotes */}
        {isQuote && (
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="border border-dashed border-gray-300 rounded-lg p-3 text-center text-xs text-gray-400">
              <div className="font-semibold mb-8">Signature de l'entreprise</div>
            </div>
            <div className="border border-dashed border-gray-300 rounded-lg p-3 text-center text-xs text-gray-400">
              <div className="font-semibold mb-1">Bon pour accord - Signature client</div>
              <div className="text-gray-300 mb-6">Précédé de la mention "Lu et approuvé"</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-3 gap-3 text-xs text-gray-500 mb-3">
            <div>
              <div className="font-semibold text-gray-700 mb-1">Informations légales</div>
              SIRET: 894 908 227 00024<br />
              Micro-entreprise
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-1">Assurance</div>
              RC Pro: Banque Populaire<br />
              Garantie décennale
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-700 mb-1">Paiement</div>
              Chèque, Espèces, Virement
              {isQuote && <><br />Acompte 30% à la signature</>}
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 pt-3 border-t border-gray-100">
            <img src={LOGO_QUALI} alt="Qualibat" className={compact ? "h-6" : "h-8"} style={{ opacity: 0.6 }} />
            <img src={LOGO_BP} alt="Banque Populaire" className={compact ? "h-5" : "h-7"} style={{ opacity: 0.6 }} />
            <img src={LOGO_CMA} alt="CMA" className={compact ? "h-6" : "h-8"} style={{ opacity: 0.6 }} />
          </div>
          <div className="text-center mt-3">
            <span className="font-bold text-sm" style={{ color: '#0c1829' }}>Sr-Renovation.fr</span>
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
