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
  
  // Info section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  text: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  
  // Table
  table: {
    marginTop: 15,
    marginBottom: 20,
  },
  tableTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    marginBottom: 10,
  },
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
    borderBottomColor: '#ddd',
    padding: 8,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  cell: {
    fontSize: 9,
  },
  cellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '17%', textAlign: 'right' },
  col4: { width: '18%', textAlign: 'right' },
  
  // Totals
  totalsBox: {
    marginTop: 10,
    marginLeft: 'auto',
    width: 250,
    border: '1 solid #ddd',
    padding: 15,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 9,
  },
  totalValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: BRAND_BLUE,
    color: 'white',
    padding: 10,
    marginTop: 10,
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
    color: 'white',
    padding: 8,
    marginTop: 5,
  },
  acompteText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: 'white',
  },
  
  // Footer
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  footerText: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  brand: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    textAlign: 'center',
    marginTop: 10,
  },
});

// Table des services - ULTRA SIMPLE
const ServicesTable = ({ services, title }) => (
  <View style={styles.table}>
    {title && <Text style={styles.tableTitle}>{title}</Text>}
    
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
      <Text style={[styles.tableHeaderText, styles.col2]}>Qté</Text>
      <Text style={[styles.tableHeaderText, styles.col3]}>P.U.</Text>
      <Text style={[styles.tableHeaderText, styles.col4]}>Total</Text>
    </View>
    
    {services && services.length > 0 ? (
      services.map((s, i) => (
        <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
          <Text style={[styles.cell, styles.col1]}>{s.description}</Text>
          <Text style={[styles.cell, styles.col2]}>{s.quantity}</Text>
          <Text style={[styles.cell, styles.col3]}>{Number(s.unit_price).toFixed(2)} €</Text>
          <Text style={[styles.cellBold, styles.col4]}>{Number(s.total).toFixed(2)} €</Text>
        </View>
      ))
    ) : (
      <View style={styles.tableRow}>
        <Text style={[styles.cell, { width: '100%', textAlign: 'center' }]}>Aucun service</Text>
      </View>
    )}
  </View>
);

// Totaux - ULTRA SIMPLE
const TotalsSection = ({ totalBrut, remise, remisePercent, totalNet, acompte30, isQuote, label }) => (
  <View>
    {label && <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: BRAND_BLUE, marginBottom: 10, textAlign: 'right' }}>{label}</Text>}
    
    <View style={styles.totalsBox}>
      <View style={styles.totalLine}>
        <Text style={styles.totalLabel}>Total brut</Text>
        <Text style={styles.totalValue}>{Number(totalBrut).toFixed(2)} €</Text>
      </View>
      
      {Number(remise) > 0 && (
        <View style={styles.totalLine}>
          <Text style={[styles.totalLabel, { color: BRAND_ORANGE }]}>
            Remise{remisePercent > 0 ? ` (${remisePercent}%)` : ''}
          </Text>
          <Text style={[styles.totalValue, { color: BRAND_ORANGE }]}>-{Number(remise).toFixed(2)} €</Text>
        </View>
      )}
      
      <View style={styles.totalFinal}>
        <Text style={styles.totalFinalText}>TOTAL NET</Text>
        <Text style={styles.totalFinalText}>{Number(totalNet).toFixed(2)} €</Text>
      </View>
      
      {isQuote && acompte30 > 0 && (
        <View style={styles.acompte}>
          <Text style={styles.acompteText}>Acompte 30%</Text>
          <Text style={styles.acompteText}>{Number(acompte30).toFixed(2)} €</Text>
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
