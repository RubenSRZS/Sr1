import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer';

// Brand colors
const BRAND_BLUE = '#1e40af';
const BRAND_BLUE_LIGHT = '#3b82f6';
const BRAND_ORANGE = '#f97316';

// Logos
const LOGO_SR = "https://customer-assets.emergentagent.com/job_538ea579-31dc-4f0d-9c02-673e8a0738ca/artifacts/srxb4k7u_Nouveau%20Logo%203.png";

const DiagnosticLabels = {
  mousses: 'Mousses', lichens: 'Lichens', tuiles_cassees: 'Tuiles cassées',
  faitage: 'Faîtage', gouttieres: 'Gouttières', facade: 'Façade',
};

// PDF Styles - Optimized for clean output
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 25,
    backgroundColor: '#ffffff',
    lineHeight: 1.3,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
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
    fontSize: 8,
    color: '#666',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  docNumber: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
  },
  docDate: {
    fontSize: 9,
    color: '#666',
    marginTop: 3,
  },
  
  // Info boxes
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoBox: {
    width: '48%',
    padding: 10,
    borderRadius: 3,
  },
  entrepriseBox: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 2,
    borderLeftColor: BRAND_BLUE,
  },
  clientBox: {
    backgroundColor: '#fff7ed',
    borderLeftWidth: 2,
    borderLeftColor: BRAND_ORANGE,
  },
  infoTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    marginBottom: 4,
    color: '#666',
  },
  infoTitleBlue: {
    color: BRAND_BLUE,
  },
  infoTitleOrange: {
    color: BRAND_ORANGE,
  },
  infoName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    color: '#1a1a1a',
  },
  infoText: {
    fontSize: 8,
    color: '#555',
    lineHeight: 1.4,
  },
  
  // Work location
  workLocation: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 3,
    marginBottom: 10,
  },
  workLocationText: {
    fontSize: 8,
  },
  workLocationLabel: {
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
  },
  
  // Diagnostic
  diagnosticBox: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  diagnosticTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  diagnosticItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  diagnosticItem: {
    backgroundColor: '#dbeafe',
    color: BRAND_BLUE,
    fontSize: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 3,
  },
  
  // Option title
  optionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginTop: 8,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND_BLUE,
  },
  
  // Table
  table: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND_BLUE,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 5,
    paddingHorizontal: 0,
  },
  tableRowEven: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 8,
    paddingHorizontal: 5,
    color: '#333',
  },
  colDesc: { width: '50%' },
  colQty: { width: '12%', textAlign: 'center' },
  colPrice: { width: '19%', textAlign: 'right' },
  colTotal: { width: '19%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  
  // Totals
  totalsContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontSize: 8,
    color: '#666',
  },
  totalValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
  },
  remiseRow: {
    backgroundColor: '#fff7ed',
    borderRadius: 2,
    marginTop: 2,
  },
  remiseText: {
    color: BRAND_ORANGE,
  },
  totalNetRow: {
    backgroundColor: BRAND_BLUE,
    borderRadius: 3,
    marginTop: 3,
    paddingVertical: 5,
  },
  totalNetLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  totalNetValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  acompteRow: {
    backgroundColor: BRAND_ORANGE,
    borderRadius: 3,
    marginTop: 2,
    paddingVertical: 4,
  },
  acompteText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  
  // Notes
  notesBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#444',
  },
  
  // TVA notice
  tvaNotice: {
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 15,
  },
  
  // Signatures
  signaturesRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 4,
    padding: 10,
    minHeight: 60,
    alignItems: 'center',
  },
  signatureBoxBlue: {
    borderColor: BRAND_BLUE_LIGHT,
  },
  signatureBoxOrange: {
    borderColor: BRAND_ORANGE,
  },
  signatureTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#666',
    marginBottom: 30,
  },
  signatureSubtitle: {
    fontSize: 7,
    color: '#999',
    marginTop: -25,
    marginBottom: 20,
  },
  
  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  footerCol: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    marginBottom: 3,
  },
  footerText: {
    fontSize: 7,
    color: '#666',
    lineHeight: 1.4,
  },
  footerBrand: {
    textAlign: 'center',
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: BRAND_BLUE,
  },
  footerBrandName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
  },
  footerBrandSlogan: {
    fontSize: 8,
    color: '#999',
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
        <Text style={[styles.tableCell, styles.colDesc]}>{service.description}</Text>
        <Text style={[styles.tableCell, styles.colQty]}>{service.quantity}</Text>
        <Text style={[styles.tableCell, styles.colPrice]}>{Number(service.unit_price).toFixed(2)} €</Text>
        <Text style={[styles.tableCell, styles.colTotal]}>{Number(service.total).toFixed(2)} €</Text>
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
    {label && <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: BRAND_BLUE, marginBottom: 5 }}>{label}</Text>}
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
              <View style={[styles.totalRow, { backgroundColor: '#f0fdf4', borderRadius: 3 }]}>
                <Text style={[styles.totalLabel, { color: '#16a34a' }]}>Acompte versé</Text>
                <Text style={[styles.totalValue, { color: '#16a34a' }]}>{Number(document.acompte_paid || 0).toFixed(2)} €</Text>
              </View>
              <View style={[styles.totalRow, { backgroundColor: '#dc2626', borderRadius: 4, marginTop: 4 }]}>
                <Text style={[styles.totalNetLabel, { fontSize: 10 }]}>RESTE À PAYER</Text>
                <Text style={[styles.totalNetValue, { fontSize: 10 }]}>{Number(document.reste_a_payer || 0).toFixed(2)} €</Text>
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
            <View style={[styles.footerCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.footerTitle}>Paiement</Text>
              <Text style={[styles.footerText, { textAlign: 'right' }]}>
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
