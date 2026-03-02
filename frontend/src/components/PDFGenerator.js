import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// Couleurs
const BRAND_BLUE = '#1e40af';
const BRAND_ORANGE = '#f97316';

const DiagnosticLabels = {
  mousses: 'Mousses', lichens: 'Lichens', tuiles_cassees: 'Tuiles cassées',
  faitage: 'Faîtage', gouttieres: 'Gouttières', facade: 'Façade',
};

// Styles ultra-simplifiés
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  // Header
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_BLUE,
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginBottom: 5,
  },
  docType: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginTop: 10,
  },
  docNumber: {
    fontSize: 16,
    color: '#666',
    marginTop: 3,
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
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  footerCol: {
    width: '30%',
  },
  footerTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  footerText: {
    fontSize: 7,
    color: '#666',
  },
  footerBrand: {
    textAlign: 'center',
    paddingTop: 8,
    borderTopWidth: 2,
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
  },
});

// Services table component - SIMPLIFIÉ
const ServicesTable = ({ services, title }) => (
  <View style={styles.table}>
    {title && <Text style={styles.optionTitle}>{title}</Text>}
    
    {/* Header */}
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
      <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
      <Text style={[styles.tableHeaderText, styles.colPrice]}>P.U. HT</Text>
      <Text style={[styles.tableHeaderText, styles.colTotal]}>Total HT</Text>
    </View>
    
    {/* Rows */}
    {services && services.length > 0 ? (
      services.map((service, i) => (
        <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
          <Text style={[styles.tableCell, styles.colDesc]}>{service.description || '—'}</Text>
          <Text style={[styles.tableCell, styles.colQty]}>{service.quantity}</Text>
          <Text style={[styles.tableCell, styles.colPrice]}>{Number(service.unit_price || 0).toFixed(2)} €</Text>
          <Text style={[styles.tableCell, styles.colTotal, { fontFamily: 'Helvetica-Bold' }]}>
            {Number(service.total || 0).toFixed(2)} €
          </Text>
        </View>
      ))
    ) : (
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { width: '100%', textAlign: 'center', color: '#999' }]}>
          Aucun service
        </Text>
      </View>
    )}
  </View>
);

// Totals component - SIMPLIFIÉ
const TotalsSection = ({ totalBrut, remise, remisePercent, totalNet, acompte30, isQuote, label }) => (
  <View style={styles.totalsContainer}>
    {label && (
      <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: BRAND_BLUE, marginBottom: 8, textAlign: 'right' }}>
        {label}
      </Text>
    )}
    
    <View style={styles.totalsBox}>
      {/* Total brut */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total brut</Text>
        <Text style={styles.totalValue}>{Number(totalBrut || 0).toFixed(2)} €</Text>
      </View>
      
      {/* Remise */}
      {Number(remise || 0) > 0 && (
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: BRAND_ORANGE }]}>
            Remise{remisePercent > 0 ? ` (${remisePercent}%)` : ''}
          </Text>
          <Text style={[styles.totalValue, { color: BRAND_ORANGE }]}>
            -{Number(remise).toFixed(2)} €
          </Text>
        </View>
      )}
      
      {/* Total net */}
      <View style={styles.totalNetRow}>
        <Text style={styles.totalNetLabel}>TOTAL NET</Text>
        <Text style={styles.totalNetValue}>{Number(totalNet || 0).toFixed(2)} €</Text>
      </View>
      
      {/* Acompte */}
      {isQuote && acompte30 > 0 && (
        <View style={styles.acompteRow}>
          <Text style={styles.acompteLabel}>Acompte 30%</Text>
          <Text style={styles.acompteLabel}>{Number(acompte30).toFixed(2)} €</Text>
        </View>
      )}
    </View>
  </View>
);

// Main PDF Document component - STRUCTURE SIMPLIFIÉE
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
        
        {/* Info boxes - Entreprise et Client */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ENTREPRISE</Text>
            <Text style={styles.infoName}>Ruben SUAREZ-SAR</Text>
            <Text style={styles.infoText}>
              1 Chemin de l'Etang Jean Guyon{'\n'}
              39570 COURLAOUX{'\n'}
              06 80 33 45 46{'\n'}
              SrRenovation03@gmail.com{'\n'}
              SIRET: 894 908 227 00024
            </Text>
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>CLIENT</Text>
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
            {diagItems.map(([key]) => (
              <Text key={key} style={styles.diagnosticItem}>
                ✓ {DiagnosticLabels[key] || key}
              </Text>
            ))}
          </View>
        )}
        
        {/* Services - Option 1 ou liste unique */}
        <ServicesTable 
          services={document.services} 
          title={hasOption2 ? "OPTION 1" : null}
        />
        
        {/* Totals Option 1 */}
        <TotalsSection
          totalBrut={document.total_brut}
          remise={document.remise}
          remisePercent={document.remise_percent}
          totalNet={document.total_net}
          acompte30={document.acompte_30}
          isQuote={isQuote}
          label={hasOption2 ? "Total Option 1" : null}
        />
        
        {/* Option 2 si elle existe */}
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
        
        {/* Spécifique factures - Reste à payer */}
        {!isQuote && (
          <View style={styles.totalsContainer}>
            <View style={styles.totalsBox}>
              <View style={[styles.totalRow, { backgroundColor: '#f0fdf4', padding: 5, marginBottom: 5 }]}>
                <Text style={[styles.totalLabel, { color: '#16a34a' }]}>Acompte versé</Text>
                <Text style={[styles.totalValue, { color: '#16a34a' }]}>
                  {Number(document.acompte_paid || 0).toFixed(2)} €
                </Text>
              </View>
              <View style={[styles.totalNetRow, { backgroundColor: '#dc2626' }]}>
                <Text style={styles.totalNetLabel}>RESTE À PAYER</Text>
                <Text style={styles.totalNetValue}>
                  {Number(document.reste_a_payer || 0).toFixed(2)} €
                </Text>
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
        
        {/* Signatures (devis uniquement) */}
        {isQuote && (
          <View style={styles.signaturesRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Signature de l'entreprise</Text>
            </View>
            <View style={styles.signatureBox}>
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
              <Text style={styles.footerText}>
                SIRET: 894 908 227 00024{'\n'}Micro-entreprise
              </Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerTitle}>Assurance</Text>
              <Text style={styles.footerText}>
                RC Pro: Banque Populaire{'\n'}Garantie décennale
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
