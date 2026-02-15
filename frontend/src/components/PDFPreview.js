import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PDFPreview = ({ document, type, onClose }) => {
  if (!document) return null;

  const isQuote = type === 'quote';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto relative">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-900">
            Prévisualisation {isQuote ? 'Devis' : 'Facture'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="close-preview">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* PDF-like Preview */}
        <div className="p-8 bg-slate-50">
          <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '210mm', minHeight: '297mm', padding: '20mm' }}>
            {/* Header with Logo and Company Info */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b-4 border-orange-500">
              <div>
                <img
                  src="https://customer-assets.emergentagent.com/job_538ea579-31dc-4f0d-9c02-673e8a0738ca/artifacts/srxb4k7u_Nouveau%20Logo%203.png"
                  alt="SR Renovation"
                  className="h-16 mb-3"
                />
                <h1 className="text-3xl font-bold text-slate-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  SR RÉNOVATION
                </h1>
                <p className="text-sm text-slate-600">Nettoyage Professionnel • Toitures • Façades • Terrasses</p>
              </div>
              <div className="text-right">
                <div className="bg-orange-500 text-white px-4 py-2 rounded-lg inline-block mb-3">
                  <p className="text-xs font-semibold">{isQuote ? 'DEVIS' : 'FACTURE'}</p>
                  <p className="text-lg font-bold">{isQuote ? document.quote_number : document.invoice_number}</p>
                </div>
                <p className="text-sm text-slate-600">Date: {document.date}</p>
              </div>
            </div>

            {/* Company + Client Info */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-bold text-slate-900 mb-2 text-sm">SR RÉNOVATION</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ruben SUAREZ-SAR<br />
                  1 Chemin de l'Etang Jean Guyon<br />
                  39570 COURLAOUX<br />
                  Tél: 06 80 33 45 46<br />
                  Email: SrRenovation03@gmail.com
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h3 className="font-bold text-slate-900 mb-2 text-sm">CLIENT</h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  <strong>{document.client_name}</strong><br />
                  {document.client_address}<br />
                  Tél: {document.client_phone}<br />
                  Email: {document.client_email}
                </p>
              </div>
            </div>

            {/* Work Details */}
            <div className="bg-slate-50 p-4 rounded-lg mb-6">
              <h3 className="font-bold text-slate-900 mb-2">Détails de l'intervention</h3>
              <p className="text-sm text-slate-700">
                <strong>Lieu des travaux:</strong> {document.work_location}<br />
                {document.work_surface && (
                  <><strong>Surface:</strong> {document.work_surface}</>
                )}
              </p>
            </div>

            {/* Services Table */}
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 mb-3 text-lg border-b-2 border-slate-200 pb-2">
                Services
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left p-2 rounded-tl-lg">Description</th>
                    <th className="text-center p-2 w-20">Qté</th>
                    <th className="text-right p-2 w-24">P.U.</th>
                    <th className="text-right p-2 w-24 rounded-tr-lg">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {document.services.map((service, index) => (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="p-2 text-slate-700">{service.description}</td>
                      <td className="p-2 text-center text-slate-700">{service.quantity}</td>
                      <td className="p-2 text-right text-slate-700">{service.unit_price.toFixed(2)} €</td>
                      <td className="p-2 text-right font-semibold text-slate-900">{service.total.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="ml-auto" style={{ width: '300px' }}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Total brut:</span>
                  <span className="font-semibold text-slate-900">{document.total_brut.toFixed(2)} €</span>
                </div>
                {document.remise > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-600">Remise:</span>
                    <span className="font-semibold text-red-600">-{document.remise.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between py-3 bg-slate-100 px-3 rounded-lg font-bold text-lg">
                  <span className="text-slate-900">Total net:</span>
                  <span className="text-slate-900">{document.total_net.toFixed(2)} €</span>
                </div>
                {isQuote && (
                  <div className="flex justify-between py-2 bg-orange-50 px-3 rounded-lg border-l-4 border-orange-500">
                    <span className="text-slate-700">Acompte 30%:</span>
                    <span className="font-semibold text-orange-600">{document.acompte_30.toFixed(2)} €</span>
                  </div>
                )}
                {!isQuote && (
                  <>
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-600">Acompte versé:</span>
                      <span className="font-semibold text-green-600">{document.acompte_paid.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between py-3 bg-red-50 px-3 rounded-lg border-l-4 border-red-500 font-bold">
                      <span className="text-slate-900">Reste à payer:</span>
                      <span className="text-red-600">{document.reste_a_payer.toFixed(2)} €</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            {document.notes && (
              <div className="mt-6 bg-slate-50 p-4 rounded-lg">
                <h3 className="font-bold text-slate-900 mb-2 text-sm">Notes:</h3>
                <p className="text-xs text-slate-700 whitespace-pre-wrap">{document.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t-2 border-slate-200 text-xs text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold mb-1">Informations légales</p>
                  <p>SIRET: 894 908 227 00024<br />
                  TVA non applicable - Art. 293 B du CGI<br />
                  Assurance RC Pro: Banque Populaire</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold mb-1">Modalités de paiement</p>
                  <p>Chèque, Espèces ou Virement<br />
                  {isQuote && 'Acompte de 30% à la signature'}<br />
                  Garantie professionnelle 10 ans</p>
                </div>
              </div>
              <div className="text-center mt-4 pt-4 border-t border-slate-200">
                <p className="font-semibold text-orange-600">Sr-Renovation.fr</p>
                <p className="text-slate-500">Nettoyage Professionnel • Toitures • Façades • Terrasses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;
