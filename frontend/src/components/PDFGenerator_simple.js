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
  // Header avec dégradé simulé
  headerGradient: {
    backgroundColor: BRAND_BLUE,
    padding: 25,
    marginBottom: 25,
    marginHorizontal: -30,
    marginTop: -30,
  },
  companyName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: 'white',
    marginBottom: 3,
  },
  companyTagline: {
    fontSize: 9,
    color: 'white',
    opacity: 0.9,
  },
  docInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  docType: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: 'white',
  },
  docNumber: {
    fontSize: 14,
    color: 'white',
    marginTop: 2,
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
    padding: 12,
    borderRadius: 4,
  },
  infoBoxBlue: {
    borderLeftWidth: 3,
    borderLeftColor: BRAND_BLUE,
  },
  infoBoxOrange: {
    borderLeftWidth: 3,
    borderLeftColor: BRAND_ORANGE,
  },
  infoTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  infoText: {
    fontSize: 9,
    color: '#444',
    lineHeight: 1.5,
  },
  // Work location
  workLocation: {
    backgroundColor: '#f0f9ff',
    padding: 10,
    marginBottom: 15,
    borderRadius: 4,
  },
  workLocationText: {
    fontSize: 9,
    color: '#333',
  },
  workLocationLabel: {
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
  },
  // Diagnostic
  diagnosticBox: {
    backgroundColor: '#eff6ff',
    padding: 10,
    marginBottom: 15,
    borderRadius: 4,
  },
  diagnosticTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginBottom: 5,
  },
  diagnosticItem: {
    fontSize: 8,
    color: '#1e40af',
    marginBottom: 2,
  },
  // Table
  tableTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginTop: 15,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_BLUE,
  },
  tableHeader: {
    flexDirection: 'row',
    background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, ${BRAND_ORANGE} 100%)`,
    backgroundColor: BRAND_BLUE,
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
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
    padding: 8,
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
  // Totals
  totalsBox: {
    marginTop: 12,
    marginLeft: 'auto',
    width: 240,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 4,
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
    marginBottom: 8,
    backgroundColor: '#fff7ed',
    padding: 6,
    borderRadius: 3,
  },
  remiseText: {
    color: BRAND_ORANGE,
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: BRAND_BLUE,
    padding: 12,
    marginTop: 8,
    borderRadius: 4,
  },
  totalFinalText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: 'white',
  },
  acompte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: BRAND_ORANGE,
    padding: 10,
    marginTop: 5,
    borderRadius: 4,
  },
  acompteText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: 'white',
  },
  // Notes
  notesBox: {
    backgroundColor: '#fffbeb',
    padding: 12,
    marginTop: 20,
    marginBottom: 15,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_ORANGE,
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.4,
  },
  // Footer
  footer: {
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: BRAND_BLUE,
  },
  footerRow: {
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
    marginBottom: 3,
  },
  footerText: {
    fontSize: 7,
    color: '#666',
    lineHeight: 1.4,
  },
  footerBrand: {
    textAlign: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 10,
  },
  brandName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
  },
  brandTagline: {
    fontSize: 7,
    color: '#999',
    marginTop: 2,
  },
  tvaNotice: {
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    fontStyle: 'italic',
    marginVertical: 12,
  },
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 15,
  },
  signatureBox: {
    width: '48%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    padding: 15,
    minHeight: 60,
    borderRadius: 4,
  },
  signatureTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#666',
  },
  signatureSubtitle: {
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
    marginTop: 3,
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
        {/* Header avec design bleu/orange */}
        <View style={styles.headerGradient}>
          <Text style={styles.companyName}>🏠 SR-RENOVATION.FR</Text>
          <Text style={styles.companyTagline}>Nettoyage toitures, façades et terrasses</Text>
          <View style={styles.docInfo}>
            <View>
              <Text style={styles.docType}>{isQuote ? 'DEVIS' : 'FACTURE'}</Text>
              <Text style={styles.docNumber}>N° {number || 'XX'}</Text>
            </View>
            <Text style={styles.docNumber}>Date: {document.date}</Text>
          </View>
        </View>
        
        {/* Info boxes */}
        <View style={styles.infoRow}>
          <View style={[styles.infoBox, styles.infoBoxBlue]}>
            <Text style={styles.infoTitle}>ENTREPRISE</Text>
            <Text style={styles.infoName}>Ruben SUAREZ-SAR</Text>
            <Text style={styles.infoText}>
              1 Chemin de l'Etang Jean Guyon{"\n"}
              39570 COURLAOUX{"\n"}
              06 80 33 45 46{"\n"}
              SrRenovation03@gmail.com{"\n"}
              SIRET: 894 908 227 00024
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
        
        {/* Lieu des travaux */}
        <View style={styles.workLocation}>
          <Text style={styles.workLocationText}>
            <Text style={styles.workLocationLabel}>📍 Lieu des travaux: </Text>
            {document.work_location || '—'}
          </Text>
        </View>
        
        {/* Diagnostic */}
        {isQuote && diagItems.length > 0 && (
          <View style={styles.diagnosticBox}>
            <Text style={styles.diagnosticTitle}>🔍 DIAGNOSTIC</Text>
            {diagItems.map(([key]) => (
              <Text key={key} style={styles.diagnosticItem}>
                ✓ {DiagnosticLabels[key] || key}
              </Text>
            ))}
          </View>
        )}
        
        {/* Services Option 1 */}
        {hasOption2 && <Text style={styles.tableTitle}>OPTION 1</Text>}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.col2]}>Qté</Text>
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
        
        {/* Totaux Option 1 */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total brut</Text>
            <Text style={styles.totalValue}>{Number(document.total_brut).toFixed(2)} €</Text>
          </View>
          
          {Number(document.remise) > 0 && (
            <View style={styles.remiseLine}>
              <Text style={[styles.totalLabel, styles.remiseText]}>
                Remise{document.remise_percent > 0 ? ` (${document.remise_percent}%)` : ''}
              </Text>
              <Text style={[styles.totalValue, styles.remiseText]}>-{Number(document.remise).toFixed(2)} €</Text>
            </View>
          )}
          
          <View style={styles.totalFinal}>
            <Text style={styles.totalFinalText}>{hasOption2 ? 'TOTAL OPTION 1' : 'TOTAL NET'}</Text>
            <Text style={styles.totalFinalText}>{Number(document.total_net).toFixed(2)} €</Text>
          </View>
          
          {isQuote && document.acompte_30 > 0 && (
            <View style={styles.acompte}>
              <Text style={styles.acompteText}>💰 Acompte 30%</Text>
              <Text style={styles.acompteText}>{Number(document.acompte_30).toFixed(2)} €</Text>
            </View>
          )}
        </View>
        
        {/* Option 2 */}
        {hasOption2 && (
          <>
            <Text style={styles.tableTitle}>OPTION 2</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.col2]}>Qté</Text>
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
                <Text style={styles.totalLabel}>Total brut</Text>
                <Text style={styles.totalValue}>{Number(document.option_2_total_brut).toFixed(2)} €</Text>
              </View>
              
              {Number(document.option_2_remise) > 0 && (
                <View style={styles.remiseLine}>
                  <Text style={[styles.totalLabel, styles.remiseText]}>
                    Remise{document.option_2_remise_percent > 0 ? ` (${document.option_2_remise_percent}%)` : ''}
                  </Text>
                  <Text style={[styles.totalValue, styles.remiseText]}>-{Number(document.option_2_remise).toFixed(2)} €</Text>
                </View>
              )}
              
              <View style={styles.totalFinal}>
                <Text style={styles.totalFinalText}>TOTAL OPTION 2</Text>
                <Text style={styles.totalFinalText}>{Number(document.option_2_total_net).toFixed(2)} €</Text>
              </View>
              
              {isQuote && document.option_2_acompte_30 > 0 && (
                <View style={styles.acompte}>
                  <Text style={styles.acompteText}>💰 Acompte 30%</Text>
                  <Text style={styles.acompteText}>{Number(document.option_2_acompte_30).toFixed(2)} €</Text>
                </View>
              )}
            </View>
          </>
        )}
        
        {/* Facture - Reste à payer */}
        {!isQuote && (
          <View style={styles.totalsBox}>
            <View style={[styles.totalLine, { backgroundColor: '#f0fdf4', padding: 8, borderRadius: 3 }]}>
              <Text style={[styles.totalLabel, { color: '#16a34a' }]}>✓ Acompte versé</Text>
              <Text style={[styles.totalValue, { color: '#16a34a' }]}>{Number(document.acompte_paid || 0).toFixed(2)} €</Text>
            </View>
            <View style={[styles.totalFinal, { backgroundColor: '#dc2626', marginTop: 5 }]}>
              <Text style={styles.totalFinalText}>RESTE À PAYER</Text>
              <Text style={styles.totalFinalText}>{Number(document.reste_a_payer || 0).toFixed(2)} €</Text>
            </View>
          </View>
        )}
        
        {/* Notes */}
        {document.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>📝 NOTES</Text>
            <Text style={styles.notesText}>{document.notes}</Text>
          </View>
        )}
        
        {/* TVA */}
        <Text style={styles.tvaNotice}>TVA non applicable, art. 293 B du CGI</Text>
        
        {/* Signatures */}
        {isQuote && (
          <View style={styles.signaturesRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>✍️ Signature entreprise</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>✍️ Bon pour accord</Text>
              <Text style={styles.signatureSubtitle}>Précédé de "Lu et approuvé"</Text>
            </View>
          </View>
        )}
        
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerCol}>
              <Text style={styles.footerTitle}>Informations</Text>
              <Text style={styles.footerText}>
                SIRET: 894 908 227 00024{"\n"}Micro-entreprise
              </Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerTitle}>Assurance</Text>
              <Text style={styles.footerText}>
                RC Pro: Banque Populaire{"\n"}Garantie décennale
              </Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerTitle}>Paiement</Text>
              <Text style={styles.footerText}>
                Chèque, Espèces, Virement
                {isQuote ? '\nAcompte 30% à la signature' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.footerBrand}>
            <Text style={styles.brandName}>Sr-Renovation.fr</Text>
            <Text style={styles.brandTagline}>Nettoyage toitures, façades et terrasses</Text>
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
