import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PDFPreview = ({ document, type, onClose }) => {
  if (!document) return null;

  const isQuote = type === 'quote';
  const sequentialNumber = document.quote_number?.replace('APERÇU', 'XX') || document.invoice_number || 'XX';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto relative shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="text-xl font-bold">Prévisualisation {isQuote ? 'Devis' : 'Facture'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20" data-testid="close-preview">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* PDF A4 */}
        <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="bg-white mx-auto shadow-2xl rounded-lg overflow-hidden" style={{ width: '210mm', minHeight: '297mm' }}>
            
            {/* Header avec dégradé bleu-orange */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-orange-600 text-white px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src="https://customer-assets.emergentagent.com/job_intelinvoice/artifacts/ez8o3wbz_Logo%20Francais%20Detourer.png"
                    alt="Quali Pro"
                    className="h-16 bg-white/10 rounded-lg p-2"
                  />
                  <img
                    src="https://customer-assets.emergentagent.com/job_538ea579-31dc-4f0d-9c02-673e8a0738ca/artifacts/srxb4k7u_Nouveau%20Logo%203.png"
                    alt="SR Renovation"
                    className="h-20"
                  />
                </div>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-wider opacity-90">{isQuote ? 'Devis' : 'Facture'}</p>
                  <p className="text-5xl font-bold">N° {sequentialNumber}</p>
                  <p className="text-sm opacity-75 mt-1">{document.date}</p>
                </div>
              </div>
            </div>

            {/* Content avec padding */}
            <div className="p-8">
              
              {/* Infos Entreprise + Client */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Entreprise */}
                <div>
                  <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-2 rounded-t-lg">
                    <h3 className="font-bold text-sm">DE : SR RÉNOVATION</h3>
                  </div>
                  <div className="border-2 border-slate-900 border-t-0 rounded-b-lg p-4 bg-slate-50">
                    <p className="text-sm leading-relaxed font-medium text-slate-800">
                      <strong className="block text-base mb-2">Ruben SUAREZ-SAR</strong>
                      1 Chemin de l'Etang Jean Guyon<br />
                      39570 COURLAOUX<br />
                      <br />
                      ☎ 06 80 33 45 46<br />
                      ✉ SrRenovation03@gmail.com<br />
                      <strong className="text-xs">SIRET:</strong> 894 908 227 00024
                    </p>
                  </div>
                </div>

                {/* Client */}
                <div>
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-lg">
                    <h3 className="font-bold text-sm">À : CLIENT</h3>
                  </div>
                  <div className="border-2 border-orange-500 border-t-0 rounded-b-lg p-4 bg-gradient-to-br from-orange-50 to-orange-100">
                    <p className="text-sm leading-relaxed text-slate-800">
                      <strong className="block text-base mb-2 text-orange-900">{document.client_name}</strong>
                      {document.client_address}<br />
                      <br />
                      ☎ {document.client_phone}<br />
                      {document.client_email && <>✉ {document.client_email}</>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lieu travaux */}
              <div className="bg-gradient-to-r from-slate-100 to-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg mb-6">
                <p className="text-sm font-semibold text-slate-900">
                  <span className="text-orange-600">📍 Lieu des travaux :</span> {document.work_location}
                  {document.work_surface && <> • <span className="text-orange-600">📐 Surface :</span> {document.work_surface}</>}
                </p>
              </div>

              {/* Services */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-3 rounded-t-lg">
                  <h3 className="font-bold text-lg">Détail des Prestations</h3>
                </div>
                <table className="w-full text-sm border-2 border-slate-900 border-t-0">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="text-left p-3 font-semibold text-slate-900">Description</th>
                      <th className="text-center p-3 font-semibold text-slate-900 w-20">Qté</th>
                      <th className="text-right p-3 font-semibold text-slate-900 w-28">P.U.</th>
                      <th className="text-right p-3 font-semibold text-slate-900 w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {document.services.map((service, index) => (
                      <tr key={index} className="border-b border-slate-200">
                        <td className="p-3 text-slate-800">{service.description}</td>
                        <td className="p-3 text-center text-slate-700">{service.quantity}</td>
                        <td className="p-3 text-right text-slate-700">{service.unit_price.toFixed(2)} €</td>
                        <td className="p-3 text-right font-bold text-slate-900">{service.total.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totaux */}
              <div className="flex justify-end mb-6">
                <div style={{ width: '340px' }} className="space-y-2">
                  <div className="flex justify-between py-2 px-4 bg-slate-100 rounded">
                    <span className="text-slate-700">Total brut</span>
                    <span className="font-semibold text-slate-900">{document.total_brut.toFixed(2)} €</span>
                  </div>
                  {document.remise > 0 && (
                    <div className="flex justify-between py-2 px-4 bg-red-50 border border-red-200 rounded">
                      <span className="text-red-700">Remise</span>
                      <span className="font-semibold text-red-600">-{document.remise.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between py-4 px-4 bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-lg font-bold text-xl shadow-lg">
                    <span>TOTAL NET</span>
                    <span>{document.total_net.toFixed(2)} €</span>
                  </div>
                  {isQuote && (
                    <div className="flex justify-between py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold shadow-md">
                      <span>Acompte 30%</span>
                      <span>{document.acompte_30.toFixed(2)} €</span>
                    </div>
                  )}
                  {!isQuote && (
                    <>
                      <div className="flex justify-between py-2 px-4 bg-green-50 border border-green-200 rounded">
                        <span className="text-green-700">Acompte versé</span>
                        <span className="font-semibold text-green-600">{document.acompte_paid.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between py-4 px-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-bold text-xl shadow-lg">
                        <span>RESTE À PAYER</span>
                        <span>{document.reste_a_payer.toFixed(2)} €</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              {document.notes && (
                <div className="bg-slate-50 border-l-4 border-slate-400 p-4 rounded-r-lg mb-6">
                  <p className="text-sm font-semibold text-slate-900 mb-1">📝 Notes :</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{document.notes}</p>
                </div>
              )}

              {/* Footer avec logos */}
              <div className="mt-8 pt-6 border-t-2 border-slate-200">
                <div className="grid grid-cols-3 gap-6 mb-4">
                  <div className="text-xs text-slate-600">
                    <p className="font-bold text-slate-900 mb-2">Informations légales</p>
                    <p className="leading-relaxed">
                      SIRET: 894 908 227 00024<br />
                      TVA non applicable<br />
                      Art. 293 B du CGI
                    </p>
                  </div>
                  <div className="text-xs text-slate-600">
                    <p className="font-bold text-slate-900 mb-2">Assurance & Garantie</p>
                    <p className="leading-relaxed">
                      RC Pro: Banque Populaire<br />
                      Garantie décennale<br />
                      Entreprise certifiée
                    </p>
                  </div>
                  <div className="text-xs text-slate-600 text-right">
                    <p className="font-bold text-slate-900 mb-2">Modalités de paiement</p>
                    <p className="leading-relaxed">
                      Chèque • Espèces • Virement<br />
                      {isQuote && 'Acompte 30% à la signature'}
                    </p>
                  </div>
                </div>
                
                {/* Logos partenaires */}
                <div className="flex items-center justify-center gap-8 py-4 border-t border-slate-200">
                  <img src="https://customer-assets.emergentagent.com/job_intelinvoice/artifacts/2lbuw6zf_Bpbfc.png" alt="Banque Populaire" className="h-8 opacity-70" />
                  <img src="https://customer-assets.emergentagent.com/job_intelinvoice/artifacts/uldr9xy9_CMA.png" alt="CMA" className="h-10 opacity-70" />
                  <img src="https://customer-assets.emergentagent.com/job_intelinvoice/artifacts/sc6i5j2l_1.jpeg" alt="Quali" className="h-12 opacity-70" />
                </div>
                
                <div className="text-center mt-4 pt-4 border-t border-slate-200">
                  <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-orange-600 text-lg">Sr-Renovation.fr</p>
                  <p className="text-xs text-slate-500 mt-1">Expert en nettoyage de toitures, façades et terrasses • Jura</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;