import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { FormPersistProvider } from '@/context/FormPersistContext';
import Dashboard from '@/pages/Dashboard';
import QuotesList from '@/pages/QuotesList';
import QuoteForm from '@/pages/QuoteForm';
import InvoicesList from '@/pages/InvoicesList';
import InvoiceForm from '@/pages/InvoiceForm';
import ClientsManager from '@/pages/ClientsManager';
import CatalogManager from '@/pages/CatalogManager';
import AIAssistant from '@/pages/AIAssistant';
import PublicQuotePage from '@/pages/PublicQuotePage';
import PinScreen from '@/components/PinScreen';
import BottomNav from '@/components/BottomNav';
import DesktopNav from '@/components/DesktopNav';

function App() {
  return (
    <ThemeProvider>
      <FormPersistProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </FormPersistProvider>
    </ThemeProvider>
  );
}

function AppRouter() {
  const location = useLocation();
  // Public routes don't need PIN
  const isPublicRoute = location.pathname.startsWith('/devis/public/');

  if (isPublicRoute) {
    return (
      <>
        <Routes>
          <Route path="/devis/public/:token" element={<PublicQuotePage />} />
        </Routes>
        <Toaster position="top-center" />
      </>
    );
  }

  return <ProtectedApp />;
}

function ProtectedApp() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem('sr_auth') === 'true');

  if (!authenticated) {
    return (
      <>
        <PinScreen onSuccess={() => setAuthenticated(true)} />
        <Toaster position="top-center" />
      </>
    );
  }

  return <AppContent />;
}

function AppContent() {
  const { darkMode } = useTheme();
  return (
    <div className={`App min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-[var(--sr-cream)] text-gray-900'}`}>
      <DesktopNav />
      <div className="lg:pb-0" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
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
          <Route path="/ai-assistant" element={<AIAssistant />} />
        </Routes>
      </div>
      <BottomNav />
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
