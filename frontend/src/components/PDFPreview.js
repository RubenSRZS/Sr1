import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PDFPreview = ({ document, type, onClose }) => {
  if (!document) return null;

  const isQuote = type === 'quote';
  
  // Calculer le numéro séquentiel (à implémenter vraiment dans le backend)
  const sequentialNumber = document.quote_number?.split('-')[2] || document.invoice_number?.split('-')[2] || '01';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto relative shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-900">
            Prévisualisation {isQuote ? 'Devis' : 'Facture'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="close-preview">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* PDF Content - A4 Size */}
        <div className="p-8 bg-slate-100">
          <div className="bg-white mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}>
            
            {/* Header - Simple and Clean */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <img
                  src="https://customer-assets.emergentagent.com/job_538ea579-31dc-4f0d-9c02-673e8a0738ca/artifacts/srxb4k7u_Nouveau%20Logo%203.png"
                  alt="SR Renovation"
                  className="h-20 mb-3"
                />
              </div>
              <div className="text-right">
                <div className="inline-block">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg mb-2">
                    <p className="text-sm font-semibold uppercase tracking-wide">{isQuote ? 'Devis' : 'Facture'}</p>
                    <p className="text-3xl font-bold">N° {sequentialNumber}</p>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">Date: {document.date}</p>
                </div>
              </div>
            </div>

            {/* Company + Client in 2 columns - Clear separation */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Company Info */}
              <div>
                <div className="bg-slate-900 text-white px-4 py-2 rounded-t-lg">
                  <h3 className="font-bold text-sm">ENTREPRISE</h3>
                </div>
                <div className="border-2 border-slate-900 border-t-0 rounded-b-lg p-4 bg-slate-50">
                  <p className="text-sm text-slate-800 leading-relaxed font-medium">
                    <strong className="block text-base mb-1">SR RÉNOVATION</strong>
                    Ruben SUAREZ-SAR<br />
                    1 Chemin de l'Etang Jean Guyon<br />
                    39570 COURLAOUX<br />
                    <br />
                    <strong>Tél:</strong> 06 80 33 45 46<br />
                    <strong>Email:</strong> SrRenovation03@gmail.com<br />
                    <strong>SIRET:</strong> 894 908 227 00024
                  </p>
                </div>
              </div>

              {/* Client Info */}
              <div>
                <div className="bg-orange-500 text-white px-4 py-2 rounded-t-lg">
                  <h3 className="font-bold text-sm">CLIENT</h3>
                </div>
                <div className="border-2 border-orange-500 border-t-0 rounded-b-lg p-4 bg-orange-50">
                  <p className="text-sm text-slate-800 leading-relaxed">
                    <strong className="block text-base mb-1 text-orange-900">{document.client_name}</strong>
                    {document.client_address}<br />
                    <br />
                    <strong>Tél:</strong> {document.client_phone}<br />
                    <strong>Email:</strong> {document.client_email}
                  </p>
                </div>
              </div>
            </div>

            {/* Work Details - Simple banner */}
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 border-l-4 border-orange-500 p-4 rounded-r-lg mb-6">
              <h3 className="font-bold text-slate-900 mb-1">Détails de l'intervention</h3>
              <p className="text-sm text-slate-700">
                <strong>Lieu:</strong> {document.work_location}
                {document.work_surface && (
                  <> • <strong>Surface:</strong> {document.work_surface}</>
                )}
              </p>
            </div>

            {/* Services - Very clean table */}
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 mb-3 text-lg pb-2 border-b-2 border-slate-300">
                Prestations
              </h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="text-left p-3 font-semibold">Description</th>
                    <th className="text-center p-3 font-semibold w-20">Qté</th>
                    <th className="text-right p-3 font-semibold w-28">Prix unit.</th>
                    <th className="text-right p-3 font-semibold w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {document.services.map((service, index) => (
                    <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-3 text-slate-800">{service.description}</td>
                      <td className="p-3 text-center text-slate-700">{service.quantity}</td>
                      <td className="p-3 text-right text-slate-700">{service.unit_price.toFixed(2)} €</td>
                      <td className="p-3 text-right font-semibold text-slate-900">{service.total.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals - Aligned right, very clear */}
            <div className="flex justify-end mb-8">
              <div style={{ width: '320px' }}>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 px-4 bg-slate-50 rounded">
                    <span className="text-slate-700">Total brut</span>
                    <span className="font-semibold text-slate-900">{document.total_brut.toFixed(2)} €</span>
                  </div>
                  {document.remise > 0 && (
                    <div className="flex justify-between py-2 px-4 bg-red-50 rounded">
                      <span className="text-slate-700">Remise</span>
                      <span className="font-semibold text-red-600">-{document.remise.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 px-4 bg-slate-900 text-white rounded-lg font-bold text-lg">
                    <span>TOTAL NET</span>
                    <span>{document.total_net.toFixed(2)} €</span>
                  </div>
                  {isQuote && (
                    <div className="flex justify-between py-3 px-4 bg-orange-500 text-white rounded-lg font-bold">
                      <span>Acompte 30%</span>
                      <span>{document.acompte_30.toFixed(2)} €</span>
                    </div>
                  )}
                  {!isQuote && (
                    <>
                      <div className="flex justify-between py-2 px-4 bg-green-50 rounded">
                        <span className="text-slate-700">Acompte versé</span>
                        <span className="font-semibold text-green-600">{document.acompte_paid.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between py-3 px-4 bg-red-600 text-white rounded-lg font-bold text-lg">
                        <span>RESTE À PAYER</span>
                        <span>{document.reste_a_payer.toFixed(2)} €</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {document.notes && (
              <div className="bg-slate-50 border-l-4 border-slate-400 p-4 rounded-r-lg mb-6">
                <h3 className="font-bold text-slate-900 mb-2 text-sm">Notes:</h3>
                <p className="text-xs text-slate-700 whitespace-pre-wrap">{document.notes}</p>
              </div>
            )}

            {/* Footer - Compact */}
            <div className="mt-8 pt-6 border-t-2 border-slate-300">
              <div className="grid grid-cols-3 gap-4 text-xs text-slate-600 mb-4">
                <div>
                  <p className="font-semibold text-slate-900 mb-1">Légal</p>
                  <p className="leading-relaxed">
                    SIRET: 894 908 227 00024<br />
                    TVA non applicable, art. 293 B du CGI
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-1">Assurance</p>
                  <p className="leading-relaxed">
                    RC Professionnelle<br />
                    Banque Populaire<br />
                    Garantie décennale
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 mb-1">Paiement</p>
                  <p className="leading-relaxed">
                    Chèque, Espèces, Virement<br />
                    {isQuote && 'Acompte 30% à la signature'}
                  </p>
                </div>
              </div>
              <div className="text-center pt-4 border-t border-slate-200">
                <p className="font-bold text-orange-600 text-sm">SR-Renovation.fr</p>
                <p className="text-xs text-slate-500">Expert en nettoyage de toitures, façades et terrasses dans le Jura</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;
