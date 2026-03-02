import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer';

// Brand colors
const BRAND_BLUE = '#1e40af';
const BRAND_ORANGE = '#f97316';

// Logo
const LOGO_SR = "https://customer-assets.emergentagent.com/job_538ea579-31dc-4f0d-9c02-673e8a0738ca/artifacts/srxb4k7u_Nouveau%20Logo%203.png";

const DiagnosticLabels = {
  mousses: 'Mousses', lichens: 'Lichens', tuiles_cassees: 'Tuiles cassées',
  faitage: 'Faîtage', gouttieres: 'Gouttières', facade: 'Façade',
};

// PDF Styles - Simplifié pour éviter les bugs
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 30,
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: BRAND_BLUE,
  },
  logo: {
    width: 100,
    height: 40,
  },
  headerRight: {
    textAlign: 'right',
  },
  docType: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  docNumber: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
  },
  docDate: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  
  // Info boxes
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoBox: {
    width: '48%',
    padding: 10,
    backgroundColor: '#f8fafc',
  },
  infoTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
    color: BRAND_BLUE,
  },
  infoName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  infoText: {
    fontSize: 9,
    color: '#333',
    lineHeight: 1.4,
  },
  
  // Work location
  workLocation: {
    backgroundColor: '#f8fafc',
    padding: 10,
    marginBottom: 15,
  },
  workLocationText: {
    fontSize: 9,
  },
  workLocationLabel: {
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
  },
  
  // Diagnostic
  diagnosticBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    marginBottom: 15,
  },
  diagnosticTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginBottom: 5,
  },
  diagnosticItem: {
    fontSize: 8,
    color: '#333',
    marginBottom: 2,
  },
  
  // Option title
  optionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginTop: 15,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_BLUE,
  },
  
  // Table
  table: {
    marginTop: 5,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND_BLUE,
    padding: 8,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#333',
  },
  colDesc: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '17%', textAlign: 'right' },
  colTotal: { width: '18%', textAlign: 'right' },
  
  // Totals
  totalsContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  totalsBox: {
    marginLeft: 'auto',
    width: 220,
    border: '1px solid #e5e7eb',
    padding: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 9,
    color: '#666',
  },
  totalValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  totalNetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: BRAND_BLUE,
    padding: 8,
    marginTop: 5,
  },
  totalNetLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  totalNetValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  acompteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: BRAND_ORANGE,
    padding: 6,
    marginTop: 5,
  },
  acompteLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  
  // Notes
  notesBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    marginTop: 15,
    marginBottom: 15,
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#333',
  },
  
  // TVA notice
  tvaNotice: {
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  
  // Signatures
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  signatureBox: {
    width: '48%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#999',
    padding: 15,
    minHeight: 60,
  },
  signatureTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  signatureSubtitle: {
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
  },
  
  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  footerCol: {
    width: '32%',
  },
  footerTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    marginBottom: 2,
  },
  footerText: {
    fontSize: 6,
    color: '#666',
    lineHeight: 1.3,
  },
  footerBrand: {
    textAlign: 'center',
    paddingTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: BRAND_BLUE,
  },
  footerBrandName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
  },
  footerBrandSlogan: {
    fontSize: 7,
    color: '#999',
    marginTop: 1,
  },
});

// Services table component
const ServicesTable = ({ services, title }) => (
  <View style={styles.table}>
    {title && <Text style={styles.optionTitle}>{title}</Text>}
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
      <Text style={[styles.tableHeaderCell, styles.colQty]}>Qté</Text>
      <Text style={[styles.tableHeaderCell, styles.colPrice]}>P.U. HT</Text>
      <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total HT</Text>
    </View>
    {services && services.length > 0 ? services.map((service, i) => (
      <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowEven]}>
        <Text style={[styles.tableCell, styles.colDesc]}>{service.description || '—'}</Text>
        <Text style={[styles.tableCell, styles.colQty]}>{service.quantity}</Text>
        <Text style={[styles.tableCell, styles.colPrice]}>{Number(service.unit_price || 0).toFixed(2)} €</Text>
        <Text style={[styles.tableCell, styles.colTotal]}>{Number(service.total || 0).toFixed(2)} €</Text>
      </View>
    )) : (
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { width: '100%', textAlign: 'center', color: '#999' }]}>
          Aucun service
        </Text>
      </View>
    )}
  </View>
);

// Totals component
const TotalsSection = ({ totalBrut, remise, remisePercent, totalNet, acompte30, isQuote, label }) => (
  <View style={styles.totalsContainer}>
    {label && <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: BRAND_BLUE, marginBottom: 4 }}>{label}</Text>}
    <View style={styles.totalsBox}>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total brut</Text>
        <Text style={styles.totalValue}>{Number(totalBrut || 0).toFixed(2)} €</Text>
      </View>
      {Number(remise || 0) > 0 && (
        <View style={[styles.totalRow, styles.remiseRow]}>
          <Text style={[styles.totalLabel, styles.remiseText]}>
            Remise{remisePercent > 0 ? ` (${remisePercent}%)` : ''}
          </Text>
          <Text style={[styles.totalValue, styles.remiseText]}>-{Number(remise).toFixed(2)} €</Text>
        </View>
      )}
      <View style={[styles.totalRow, styles.totalNetRow]}>
        <Text style={styles.totalNetLabel}>TOTAL NET</Text>
        <Text style={styles.totalNetValue}>{Number(totalNet || 0).toFixed(2)} €</Text>
      </View>
      {isQuote && acompte30 > 0 && (
        <View style={[styles.totalRow, styles.acompteRow]}>
          <Text style={styles.acompteText}>Acompte 30%</Text>
          <Text style={styles.acompteText}>{Number(acompte30).toFixed(2)} €</Text>
        </View>
      )}
    </View>
  </View>
);

// Main PDF Document component
const QuotePDFDocument = ({ document, type = 'quote' }) => {
  const isQuote = type === 'quote';
  const docLabel = isQuote ? 'DEVIS' : 'FACTURE';
  const number = isQuote ? document.quote_number : document.invoice_number;
  
  // Diagnostic items
  const diagItems = document.diagnostic
    ? Object.entries(document.diagnostic).filter(([, v]) => v === true)
    : [];
  
  // Check if multi-option quote
  const hasOption2 = isQuote && document.option_2_services && document.option_2_services.length > 0;
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={LOGO_SR} style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={styles.docType}>{docLabel}</Text>
            <Text style={styles.docNumber}>{number || 'XX'}</Text>
            <Text style={styles.docDate}>{document.date}</Text>
          </View>
        </View>
        
        {/* Info boxes */}
        <View style={styles.infoRow}>
          <View style={[styles.infoBox, styles.entrepriseBox]}>
            <Text style={[styles.infoTitle, styles.infoTitleBlue]}>ENTREPRISE</Text>
            <Text style={styles.infoName}>Ruben SUAREZ-SAR</Text>
            <Text style={styles.infoText}>
              1 Chemin de l'Etang Jean Guyon{'\n'}
              39570 COURLAOUX{'\n'}
              06 80 33 45 46{'\n'}
              SrRenovation03@gmail.com{'\n'}
              SIRET: 894 908 227 00024
            </Text>
          </View>
          <View style={[styles.infoBox, styles.clientBox]}>
            <Text style={[styles.infoTitle, styles.infoTitleOrange]}>CLIENT</Text>
            <Text style={styles.infoName}>{document.client_name || '—'}</Text>
            <Text style={styles.infoText}>
              {document.client_address || '—'}{'\n'}
              {document.client_phone || '—'}
              {document.client_email ? `\n${document.client_email}` : ''}
            </Text>
          </View>
        </View>
        
        {/* Work location */}
        <View style={styles.workLocation}>
          <Text style={styles.workLocationText}>
            <Text style={styles.workLocationLabel}>Lieu des travaux: </Text>
            {document.work_location || '—'}
          </Text>
        </View>
        
        {/* Diagnostic */}
        {isQuote && diagItems.length > 0 && (
          <View style={styles.diagnosticBox}>
            <Text style={styles.diagnosticTitle}>DIAGNOSTIC</Text>
            <View style={styles.diagnosticItems}>
              {diagItems.map(([key]) => (
                <Text key={key} style={styles.diagnosticItem}>
                  ✓ {DiagnosticLabels[key] || key}
                </Text>
              ))}
            </View>
          </View>
        )}
        
        {/* Services - Option 1 or single option */}
        <ServicesTable 
          services={document.services} 
          title={hasOption2 ? "OPTION 1" : null}
        />
        
        {/* Totals for Option 1 */}
        <TotalsSection
          totalBrut={document.total_brut}
          remise={document.remise}
          remisePercent={document.remise_percent}
          totalNet={document.total_net}
          acompte30={document.acompte_30}
          isQuote={isQuote}
          label={hasOption2 ? "Total Option 1" : null}
        />
        
        {/* Option 2 if exists */}
        {hasOption2 && (
          <>
            <ServicesTable 
              services={document.option_2_services} 
              title="OPTION 2"
            />
            <TotalsSection
              totalBrut={document.option_2_total_brut}
              remise={document.option_2_remise}
              remisePercent={document.option_2_remise_percent}
              totalNet={document.option_2_total_net}
              acompte30={document.option_2_acompte_30}
              isQuote={isQuote}
              label="Total Option 2"
            />
          </>
        )}
        
        {/* Invoice specific */}
        {!isQuote && (
          <View style={styles.totalsContainer}>
            <View style={styles.totalsBox}>
              <View style={[styles.totalRow, { backgroundColor: '#f0fdf4', borderRadius: 2, marginTop: 2 }]}>
                <Text style={[styles.totalLabel, { color: '#16a34a' }]}>Acompte versé</Text>
                <Text style={[styles.totalValue, { color: '#16a34a' }]}>{Number(document.acompte_paid || 0).toFixed(2)} €</Text>
              </View>
              <View style={[styles.totalRow, { backgroundColor: '#dc2626', borderRadius: 3, marginTop: 3, paddingVertical: 5 }]}>
                <Text style={[styles.totalNetLabel, { fontSize: 9 }]}>RESTE À PAYER</Text>
                <Text style={[styles.totalNetValue, { fontSize: 9 }]}>{Number(document.reste_a_payer || 0).toFixed(2)} €</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Notes */}
        {document.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>NOTES</Text>
            <Text style={styles.notesText}>{document.notes}</Text>
          </View>
        )}
        
        {/* TVA notice */}
        <Text style={styles.tvaNotice}>TVA non applicable, art. 293 B du CGI</Text>
        
        {/* Signatures (quotes only) */}
        {isQuote && (
          <View style={styles.signaturesRow}>
            <View style={[styles.signatureBox, styles.signatureBoxBlue]}>
              <Text style={styles.signatureTitle}>Signature de l'entreprise</Text>
            </View>
            <View style={[styles.signatureBox, styles.signatureBoxOrange]}>
              <Text style={styles.signatureTitle}>Bon pour accord</Text>
              <Text style={styles.signatureSubtitle}>Précédé de "Lu et approuvé"</Text>
            </View>
          </View>
        )}
        
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerCol}>
              <Text style={styles.footerTitle}>Informations</Text>
              <Text style={styles.footerText}>SIRET: 894 908 227 00024{'\n'}Micro-entreprise</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerTitle}>Assurance</Text>
              <Text style={styles.footerText}>RC Pro: Banque Populaire{'\n'}Garantie décennale</Text>
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
            <Text style={styles.footerBrandName}>Sr-Renovation.fr</Text>
            <Text style={styles.footerBrandSlogan}>Nettoyage toitures, façades et terrasses</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// Function to generate and download PDF
const generatePDF = async (document, type = 'quote') => {
  const isQuote = type === 'quote';
  const number = isQuote ? document.quote_number : document.invoice_number;
  const prefix = isQuote ? 'DEVIS' : 'FACTURE';
  const clientName = document.client_name?.replace(/\s+/g, '_') || 'client';
  const filename = `${prefix}_${number || 'XX'}_${clientName}.pdf`;
  
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
    console.error('PDF generation error:', error);
    return false;
  }
};

export { QuotePDFDocument, generatePDF };
export default QuotePDFDocument;
