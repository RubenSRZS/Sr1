import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FormPersistContext = createContext();

export const useFormPersist = () => {
  const context = useContext(FormPersistContext);
  if (!context) {
    throw new Error('useFormPersist must be used within a FormPersistProvider');
  }
  return context;
};

export const FormPersistProvider = ({ children }) => {
  // Store for different form types
  const [quoteFormData, setQuoteFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('sr-quote-draft');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [invoiceFormData, setInvoiceFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('sr-invoice-draft');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Save quote form data
  const saveQuoteForm = useCallback((data, options = {}) => {
    const toSave = { 
      data, 
      options,
      savedAt: new Date().toISOString() 
    };
    localStorage.setItem('sr-quote-draft', JSON.stringify(toSave));
    setQuoteFormData(toSave);
  }, []);

  // Clear quote form data
  const clearQuoteForm = useCallback(() => {
    localStorage.removeItem('sr-quote-draft');
    setQuoteFormData(null);
  }, []);

  // Save invoice form data
  const saveInvoiceForm = useCallback((data, options = {}) => {
    const toSave = { 
      data, 
      options,
      savedAt: new Date().toISOString() 
    };
    localStorage.setItem('sr-invoice-draft', JSON.stringify(toSave));
    setInvoiceFormData(toSave);
  }, []);

  // Clear invoice form data
  const clearInvoiceForm = useCallback(() => {
    localStorage.removeItem('sr-invoice-draft');
    setInvoiceFormData(null);
  }, []);

  // Check if there's a draft
  const hasQuoteDraft = quoteFormData !== null;
  const hasInvoiceDraft = invoiceFormData !== null;

  return (
    <FormPersistContext.Provider value={{
      // Quote
      quoteFormData,
      saveQuoteForm,
      clearQuoteForm,
      hasQuoteDraft,
      // Invoice
      invoiceFormData,
      saveInvoiceForm,
      clearInvoiceForm,
      hasInvoiceDraft,
    }}>
      {children}
    </FormPersistContext.Provider>
  );
};
