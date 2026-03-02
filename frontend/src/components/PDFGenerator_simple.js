import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const BRAND_BLUE = '#1e40af';
const BRAND_ORANGE = '#f97316';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10 },
  header: { marginBottom: 30, borderBottomWidth: 2, borderBottomColor: BRAND_BLUE, paddingBottom: 15 },
  title: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: BRAND_BLUE },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: BRAND_BLUE, marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 15 },
  col: { flex: 1 },
  label: { fontSize: 8, color: '#666', marginBottom: 2 },
  value: { fontSize: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: BRAND_BLUE, padding: 10, marginTop: 10 },
  tableHeaderText: { color: 'white', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', padding: 8 },
  tableRowAlt: { backgroundColor: '#f9fafb' },
  cell: { fontSize: 9 },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '17%', textAlign: 'right' },
  col4: { width: '18%', textAlign: 'right' },
  totalsBox: { marginTop: 10, marginLeft: 'auto', width: 250, border: '1 solid #ddd', padding: 15 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalFinal: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: BRAND_BLUE, padding: 10, marginTop: 10 },
  totalFinalText: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: 'white' },
  footer: { marginTop: 30, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#ddd', textAlign: 'center' },
  footerText: { fontSize: 8, color: '#666', marginBottom: 5 },
});

const QuotePDFDocument = ({ document, type = 'quote' }) => {
  const isQuote = type === 'quote';
  const number = isQuote ? document.quote_number : document.invoice_number;
  const hasOption2 = isQuote && document.option_2_services && document.option_2_services.length > 0;
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SR-RENOVATION.FR</Text>
          <Text style={styles.subtitle}>{isQuote ? 'DEVIS' : 'FACTURE'} {number || 'XX'}</Text>
          <Text style={styles.subtitle}>Date: {document.date}</Text>
        </View>
        
        {/* Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>ENTREPRISE</Text>
              <Text style={styles.value}>Ruben SUAREZ-SAR</Text>
              <Text style={styles.label}>1 Chemin de l'Etang Jean Guyon</Text>
              <Text style={styles.label}>39570 COURLAOUX</Text>
              <Text style={styles.label}>06 80 33 45 46</Text>
              <Text style={styles.label}>SIRET: 894 908 227 00024</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>CLIENT</Text>
              <Text style={styles.value}>{document.client_name}</Text>
              <Text style={styles.label}>{document.client_address}</Text>
              <Text style={styles.label}>{document.client_phone}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>Lieu des travaux: {document.work_location}</Text>
        </View>
        
        {/* Services Option 1 */}
        {hasOption2 && <Text style={styles.sectionTitle}>OPTION 1</Text>}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.col2]}>Qté</Text>
          <Text style={[styles.tableHeaderText, styles.col3]}>P.U.</Text>
          <Text style={[styles.tableHeaderText, styles.col4]}>Total</Text>
        </View>
        {document.services.map((s, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
            <Text style={[styles.cell, styles.col1]}>{s.description}</Text>
            <Text style={[styles.cell, styles.col2]}>{s.quantity}</Text>
            <Text style={[styles.cell, styles.col3]}>{Number(s.unit_price).toFixed(2)} €</Text>
            <Text style={[styles.cell, styles.col4]}>{Number(s.total).toFixed(2)} €</Text>
          </View>
        ))}
        
        {/* Totaux Option 1 */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text>Total brut</Text>
            <Text>{Number(document.total_brut).toFixed(2)} €</Text>
          </View>
          {Number(document.remise) > 0 && (
            <View style={styles.totalLine}>
              <Text style={{ color: BRAND_ORANGE }}>Remise</Text>
              <Text style={{ color: BRAND_ORANGE }}>-{Number(document.remise).toFixed(2)} €</Text>
            </View>
          )}
          <View style={styles.totalFinal}>
            <Text style={styles.totalFinalText}>TOTAL</Text>
            <Text style={styles.totalFinalText}>{Number(document.total_net).toFixed(2)} €</Text>
          </View>
        </View>
        
        {/* Option 2 si existe */}
        {hasOption2 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>OPTION 2</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.col2]}>Qté</Text>
              <Text style={[styles.tableHeaderText, styles.col3]}>P.U.</Text>
              <Text style={[styles.tableHeaderText, styles.col4]}>Total</Text>
            </View>
            {document.option_2_services.map((s, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.cell, styles.col1]}>{s.description}</Text>
                <Text style={[styles.cell, styles.col2]}>{s.quantity}</Text>
                <Text style={[styles.cell, styles.col3]}>{Number(s.unit_price).toFixed(2)} €</Text>
                <Text style={[styles.cell, styles.col4]}>{Number(s.total).toFixed(2)} €</Text>
              </View>
            ))}
            <View style={styles.totalsBox}>
              <View style={styles.totalLine}>
                <Text>Total brut</Text>
                <Text>{Number(document.option_2_total_brut).toFixed(2)} €</Text>
              </View>
              {Number(document.option_2_remise) > 0 && (
                <View style={styles.totalLine}>
                  <Text style={{ color: BRAND_ORANGE }}>Remise</Text>
                  <Text style={{ color: BRAND_ORANGE }}>-{Number(document.option_2_remise).toFixed(2)} €</Text>
                </View>
              )}
              <View style={styles.totalFinal}>
                <Text style={styles.totalFinalText}>TOTAL</Text>
                <Text style={styles.totalFinalText}>{Number(document.option_2_total_net).toFixed(2)} €</Text>
              </View>
            </View>
          </>
        )}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>TVA non applicable, art. 293 B du CGI</Text>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: BRAND_BLUE }}>Sr-Renovation.fr</Text>
          <Text style={styles.footerText}>Nettoyage toitures, façades et terrasses</Text>
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
