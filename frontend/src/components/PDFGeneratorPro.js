import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const BRAND_BLUE = '#3b82f6';
const BRAND_ORANGE = '#fb923c';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  // Header professionnel
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: BRAND_BLUE,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  logo: {
    width: 120,
    height: 50,
    marginBottom: 10,
  },
  companyInfo: {
    fontSize: 8,
    color: '#333',
    lineHeight: 1.5,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docType: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginBottom: 5,
  },
  docNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  docDate: {
    fontSize: 10,
    color: '#666',
  },
  
  // Info boxes
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderLeftWidth: 4,
  },
  infoBoxBlue: {
    borderLeftColor: BRAND_BLUE,
  },
  infoBoxOrange: {
    borderLeftColor: BRAND_ORANGE,
  },
  infoTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  infoText: {
    fontSize: 9,
    color: '#444',
    lineHeight: 1.6,
  },
  
  // Work location
  workLocation: {
    backgroundColor: '#eff6ff',
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_BLUE,
  },
  workLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
  },
  workText: {
    fontSize: 9,
    color: '#333',
  },
  
  // Diagnostic
  diagnosticBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    marginBottom: 20,
  },
  diagnosticTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginBottom: 8,
  },
  diagnosticItem: {
    fontSize: 9,
    color: '#1e40af',
    marginBottom: 3,
  },
  
  // Option title
  optionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_BLUE,
  },
  
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND_BLUE,
    padding: 10,
  },
  tableHeaderText: {
    color: 'white',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 9,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  cell: {
    fontSize: 9,
    color: '#333',
  },
  cellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '17%', textAlign: 'right' },
  col4: { width: '18%', textAlign: 'right' },
  
  // Totals box
  totalsBox: {
    marginTop: 15,
    marginLeft: 'auto',
    width: 250,
    backgroundColor: '#f8fafc',
    padding: 15,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 9,
    color: '#666',
  },
  totalValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
  },
  remiseLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff7ed',
    padding: 8,
    marginBottom: 8,
  },
  remiseText: {
    color: BRAND_ORANGE,
    fontFamily: 'Helvetica-Bold',
  },
  totalFinalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: BRAND_BLUE,
    padding: 12,
    marginTop: 8,
  },
  totalFinalText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: 'white',
  },
  acompteBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: BRAND_ORANGE,
    padding: 10,
    marginTop: 6,
  },
  acompteText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: 'white',
  },
  
  // Notes
  notesBox: {
    backgroundColor: '#fffbeb',
    padding: 15,
    marginTop: 20,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_ORANGE,
  },
  notesTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.5,
  },
  
  // TVA notice
  tvaNotice: {
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    fontStyle: 'italic',
    marginVertical: 15,
  },
  
  // Signatures
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 25,
  },
  signatureBox: {
    width: '48%',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    padding: 20,
    minHeight: 70,
  },
  signatureTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#666',
    marginBottom: 5,
  },
  signatureSubtitle: {
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
  },
  
  // Footer avec logos partenaires
  footer: {
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: BRAND_BLUE,
  },
  footerLogos: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
  },
  partnerLogo: {
    width: 60,
    height: 30,
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  footerCol: {
    width: '30%',
  },
  footerTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 7,
    color: '#666',
    lineHeight: 1.5,
  },
  footerBrand: {
    textAlign: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  brandName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
  },
  brandTagline: {
    fontSize: 8,
    color: '#999',
    marginTop: 2,
  },
});

const DiagnosticLabels = {
  mousses: 'Mousses',
  lichens: 'Lichens',
  tuiles_cassees: 'Tuiles cassées',
  faitage: 'Faîtage',
  gouttieres: 'Gouttières',
  facade: 'Façade',
};

const QuotePDFDocument = ({ document, type = 'quote' }) => {
  const isQuote = type === 'quote';
  const number = isQuote ? document.quote_number : document.invoice_number;
  const hasOption2 = isQuote && document.option_2_services && document.option_2_services.length > 0;
  
  const diagItems = document.diagnostic
    ? Object.entries(document.diagnostic).filter(([, v]) => v === true)
    : [];
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER PROFESSIONNEL AVEC LOGO TEXTE */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Logo texte stylisé */}
            <View style={{ backgroundColor: BRAND_BLUE, padding: 8, marginBottom: 10, width: 180 }}>
              <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: 'white', letterSpacing: 1 }}>
                SR-RENOVATION
              </Text>
              <Text style={{ fontSize: 8, color: 'white', opacity: 0.9 }}>
                Nettoyage professionnel
              </Text>
            </View>
            <Text style={styles.companyInfo}>
              Ruben SUAREZ-SAR{"\n"}
              1 Chemin de l'Etang Jean Guyon{"\n"}
              39570 COURLAOUX{"\n"}
              Tél: 06 80 33 45 46{"\n"}
              Email: SrRenovation03@gmail.com
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docType}>{isQuote ? 'DEVIS' : 'FACTURE'}</Text>
            <Text style={styles.docNumber}>N° {number || 'XX'}</Text>
            <Text style={styles.docDate}>Date: {document.date}</Text>
          </View>
        </View>
        
        {/* INFO CLIENT ET ENTREPRISE */}
        <View style={styles.infoRow}>
          <View style={[styles.infoBox, styles.infoBoxBlue]}>
            <Text style={styles.infoTitle}>INFORMATIONS ENTREPRISE</Text>
            <Text style={styles.infoText}>
              SIRET: 894 908 227 00024{"\n"}
              Micro-entreprise{"\n"}
              TVA non applicable, art. 293 B du CGI
            </Text>
          </View>
          
          <View style={[styles.infoBox, styles.infoBoxOrange]}>
            <Text style={styles.infoTitle}>CLIENT</Text>
            <Text style={styles.infoName}>{document.client_name || '—'}</Text>
            <Text style={styles.infoText}>
              {document.client_address || '—'}{"\n"}
              {document.client_phone || '—'}
              {document.client_email ? `\n${document.client_email}` : ''}
            </Text>
          </View>
        </View>
        
        {/* LIEU DES TRAVAUX */}
        <View style={styles.workLocation}>
          <Text style={styles.workLabel}>Lieu des travaux:</Text>
          <Text style={styles.workText}>{document.work_location || '—'}</Text>
        </View>
        
        {/* DIAGNOSTIC */}
        {isQuote && diagItems.length > 0 && (
          <View style={styles.diagnosticBox}>
            <Text style={styles.diagnosticTitle}>DIAGNOSTIC EFFECTUÉ</Text>
            {diagItems.map(([key]) => (
              <Text key={key} style={styles.diagnosticItem}>
                ✓ {DiagnosticLabels[key] || key}
              </Text>
            ))}
          </View>
        )}
        
        {/* SERVICES OPTION 1 */}
        {hasOption2 && <Text style={styles.optionTitle}>OPTION 1</Text>}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.col2]}>Quantité</Text>
          <Text style={[styles.tableHeaderText, styles.col3]}>P.U. HT</Text>
          <Text style={[styles.tableHeaderText, styles.col4]}>Total HT</Text>
        </View>
        {document.services.map((s, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
            <Text style={[styles.cell, styles.col1]}>{s.description}</Text>
            <Text style={[styles.cell, styles.col2]}>{s.quantity}</Text>
            <Text style={[styles.cell, styles.col3]}>{Number(s.unit_price).toFixed(2)} €</Text>
            <Text style={[styles.cellBold, styles.col4]}>{Number(s.total).toFixed(2)} €</Text>
          </View>
        ))}
        
        {/* TOTAUX OPTION 1 */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total brut HT</Text>
            <Text style={styles.totalValue}>{Number(document.total_brut).toFixed(2)} €</Text>
          </View>
          
          {Number(document.remise) > 0 && (
            <View style={styles.remiseLine}>
              <Text style={styles.remiseText}>
                Remise{document.remise_percent > 0 ? ` (${document.remise_percent}%)` : ''}
              </Text>
              <Text style={styles.remiseText}>-{Number(document.remise).toFixed(2)} €</Text>
            </View>
          )}
          
          <View style={styles.totalFinalBox}>
            <Text style={styles.totalFinalText}>{hasOption2 ? 'TOTAL OPTION 1' : 'TOTAL NET HT'}</Text>
            <Text style={styles.totalFinalText}>{Number(document.total_net).toFixed(2)} €</Text>
          </View>
          
          {isQuote && document.acompte_30 > 0 && (
            <View style={styles.acompteBox}>
              <Text style={styles.acompteText}>Acompte 30% à la signature</Text>
              <Text style={styles.acompteText}>{Number(document.acompte_30).toFixed(2)} €</Text>
            </View>
          )}
        </View>
        
        {/* OPTION 2 */}
        {hasOption2 && (
          <>
            <Text style={styles.optionTitle}>OPTION 2</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.col2]}>Quantité</Text>
              <Text style={[styles.tableHeaderText, styles.col3]}>P.U. HT</Text>
              <Text style={[styles.tableHeaderText, styles.col4]}>Total HT</Text>
            </View>
            {document.option_2_services.map((s, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.cell, styles.col1]}>{s.description}</Text>
                <Text style={[styles.cell, styles.col2]}>{s.quantity}</Text>
                <Text style={[styles.cell, styles.col3]}>{Number(s.unit_price).toFixed(2)} €</Text>
                <Text style={[styles.cellBold, styles.col4]}>{Number(s.total).toFixed(2)} €</Text>
              </View>
            ))}
            
            <View style={styles.totalsBox}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Total brut HT</Text>
                <Text style={styles.totalValue}>{Number(document.option_2_total_brut).toFixed(2)} €</Text>
              </View>
              
              {Number(document.option_2_remise) > 0 && (
                <View style={styles.remiseLine}>
                  <Text style={styles.remiseText}>
                    Remise{document.option_2_remise_percent > 0 ? ` (${document.option_2_remise_percent}%)` : ''}
                  </Text>
                  <Text style={styles.remiseText}>-{Number(document.option_2_remise).toFixed(2)} €</Text>
                </View>
              )}
              
              <View style={styles.totalFinalBox}>
                <Text style={styles.totalFinalText}>TOTAL OPTION 2</Text>
                <Text style={styles.totalFinalText}>{Number(document.option_2_total_net).toFixed(2)} €</Text>
              </View>
              
              {isQuote && document.option_2_acompte_30 > 0 && (
                <View style={styles.acompteBox}>
                  <Text style={styles.acompteText}>Acompte 30% à la signature</Text>
                  <Text style={styles.acompteText}>{Number(document.option_2_acompte_30).toFixed(2)} €</Text>
                </View>
              )}
            </View>
          </>
        )}
        
        {/* FACTURE - RESTE A PAYER */}
        {!isQuote && (
          <View style={styles.totalsBox}>
            <View style={[styles.totalLine, { backgroundColor: '#f0fdf4', padding: 8 }]}>
              <Text style={[styles.totalLabel, { color: '#16a34a' }]}>Acompte versé</Text>
              <Text style={[styles.totalValue, { color: '#16a34a' }]}>{Number(document.acompte_paid || 0).toFixed(2)} €</Text>
            </View>
            <View style={[styles.totalFinalBox, { backgroundColor: '#dc2626' }]}>
              <Text style={styles.totalFinalText}>RESTE À PAYER</Text>
              <Text style={styles.totalFinalText}>{Number(document.reste_a_payer || 0).toFixed(2)} €</Text>
            </View>
          </View>
        )}
        
        {/* NOTES */}
        {document.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>NOTES / CONDITIONS PARTICULIÈRES</Text>
            <Text style={styles.notesText}>{document.notes}</Text>
          </View>
        )}
        
        {/* TVA */}
        <Text style={styles.tvaNotice}>TVA non applicable, article 293 B du CGI</Text>
        
        {/* SIGNATURES */}
        {isQuote && (
          <View style={styles.signaturesRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Signature de l'entreprise</Text>
              <Text style={styles.signatureSubtitle}>Date et cachet</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Signature du client</Text>
              <Text style={styles.signatureSubtitle}>Précédé de "Lu et approuvé"</Text>
            </View>
          </View>
        )}
        
        {/* FOOTER AVEC LOGOS PARTENAIRES */}
        <View style={styles.footer}>
          {/* Section pour les logos partenaires */}
          <View style={styles.footerLogos}>
            <Text style={{ fontSize: 7, color: '#999' }}>Certifications et partenaires:</Text>
            <Text style={{ fontSize: 8, color: BRAND_BLUE, fontFamily: 'Helvetica-Bold' }}>Banque Populaire</Text>
            <Text style={{ fontSize: 8, color: BRAND_BLUE, fontFamily: 'Helvetica-Bold' }}>Chambre des Métiers</Text>
          </View>
          
          <View style={styles.footerInfo}>
            <View style={styles.footerCol}>
              <Text style={styles.footerTitle}>Assurance</Text>
              <Text style={styles.footerText}>
                RC Pro: Banque Populaire{"\n"}
                Garantie décennale
              </Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerTitle}>Conditions de paiement</Text>
              <Text style={styles.footerText}>
                Chèque{"\n"}
                Espèces{"\n"}
                Virement bancaire
              </Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerTitle}>Contact</Text>
              <Text style={styles.footerText}>
                06 80 33 45 46{"\n"}
                SrRenovation03@gmail.com{"\n"}
                www.sr-renovation.fr
              </Text>
            </View>
          </View>
          
          <View style={styles.footerBrand}>
            <Text style={styles.brandName}>Sr-Renovation.fr</Text>
            <Text style={styles.brandTagline}>Nettoyage toitures, façades et terrasses - Professionnel certifié</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const generatePDF = async (document, type = 'quote') => {
  const isQuote = type === 'quote';
  const number = isQuote ? document.quote_number : document.invoice_number;
  const prefix = isQuote ? 'DEVIS' : 'FACTURE';
  const filename = `${prefix}_${number}_${document.client_name?.replace(/\s+/g, '_')}.pdf`;
  
  try {
    const blob = await pdf(<QuotePDFDocument document={document} type={type} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('PDF error:', error);
    return false;
  }
};

export { QuotePDFDocument, generatePDF };
export default QuotePDFDocument;
