import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/context/ThemeContext';
import { FormPersistProvider } from '@/context/FormPersistContext';
import Dashboard from '@/pages/Dashboard';
import QuotesList from '@/pages/QuotesList';
import QuoteForm from '@/pages/QuoteForm';
import InvoicesList from '@/pages/InvoicesList';
import InvoiceForm from '@/pages/InvoiceForm';
import ClientsManager from '@/pages/ClientsManager';
import CatalogManager from '@/pages/CatalogManager';
import BottomNav from '@/components/BottomNav';
import DesktopNav from '@/components/DesktopNav';

function App() {
  return (
    <ThemeProvider>
      <FormPersistProvider>
        <AppContent />
      </FormPersistProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  return (
    <div className="App min-h-screen transition-colors duration-300">
      <BrowserRouter>
        <DesktopNav />
        <div className="pb-16 lg:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quotes" element={<QuotesList />} />
            <Route path="/quotes/new" element={<QuoteForm />} />
            <Route path="/quotes/edit/:id" element={<QuoteForm />} />
            <Route path="/invoices" element={<InvoicesList />} />
            <Route path="/invoices/new" element={<InvoiceForm />} />
            <Route path="/invoices/edit/:id" element={<InvoiceForm />} />
            <Route path="/clients" element={<ClientsManager />} />
            <Route path="/catalog" element={<CatalogManager />} />
          </Routes>
        </div>
        <BottomNav />
        <Toaster position="top-center" />
      </BrowserRouter>
    </div>
  );
}

export default App;
