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

  // Devis mis en pause (plusieurs possibles)
  const [parkedQuotes, setParkedQuotes] = useState(() => {
    try {
      const saved = localStorage.getItem('sr-quote-parked');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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

  const writeParked = useCallback((list) => {
    try { localStorage.setItem('sr-quote-parked', JSON.stringify(list)); } catch { /* stockage plein */ }
    setParkedQuotes(list);
  }, []);

  const readCurrent = () => {
    try { return JSON.parse(localStorage.getItem('sr-quote-draft') || 'null'); } catch { return null; }
  };
  const readParked = () => {
    try { return JSON.parse(localStorage.getItem('sr-quote-parked') || '[]'); } catch { return []; }
  };
  const draftHasContent = (d) => {
    const x = d?.data;
    return !!x && ((x.services && x.services.length > 0) || x.work_location || x.quote_title || x.client_id || d?.options?.newClient?.name);
  };

  // Met le devis en cours de côté et libère la place pour un nouveau
  const parkQuoteDraft = useCallback(() => {
    const current = readCurrent();
    if (!draftHasContent(current)) { clearQuoteForm(); return false; }
    const item = { ...current, pid: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, parkedAt: new Date().toISOString() };
    writeParked([item, ...readParked()]);
    clearQuoteForm();
    return true;
  }, [clearQuoteForm, writeParked]);

  // Reprend un devis en pause (le devis en cours, s'il y en a un, est mis en pause à sa place)
  const resumeParkedQuote = useCallback((pid) => {
    const list = readParked();
    const item = list.find((x) => x.pid === pid);
    if (!item) return false;
    let rest = list.filter((x) => x.pid !== pid);
    const current = readCurrent();
    if (draftHasContent(current)) {
      rest = [{ ...current, pid: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, parkedAt: new Date().toISOString() }, ...rest];
    }
    writeParked(rest);
    const { pid: _p, parkedAt: _a, ...draft } = item;
    localStorage.setItem('sr-quote-draft', JSON.stringify(draft));
    setQuoteFormData(draft);
    return true;
  }, [writeParked]);

  const deleteParkedQuote = useCallback((pid) => {
    writeParked(readParked().filter((x) => x.pid !== pid));
  }, [writeParked]);

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
      parkedQuotes,
      parkQuoteDraft,
      resumeParkedQuote,
      deleteParkedQuote,
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
