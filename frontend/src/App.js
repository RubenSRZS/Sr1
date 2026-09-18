import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { FormPersistProvider } from '@/context/FormPersistContext';
import { DataCacheProvider, useDataCache } from '@/context/DataCacheContext';
import PinScreen from '@/components/PinScreen';
import ErrorBoundary from '@/components/ErrorBoundary';
import BottomNav from '@/components/BottomNav';
import DesktopNav from '@/components/DesktopNav';

// Lazy-loaded routes — only the bundle for the visited page is downloaded
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const QuotesList = lazy(() => import('@/pages/QuotesList'));
const QuoteForm = lazy(() => import('@/pages/QuoteForm'));
const InvoicesList = lazy(() => import('@/pages/InvoicesList'));
const InvoiceForm = lazy(() => import('@/pages/InvoiceForm'));
const ClientsManager = lazy(() => import('@/pages/ClientsManager'));
const CatalogManager = lazy(() => import('@/pages/CatalogManager'));
const CRM = lazy(() => import('@/pages/CRM'));
const AIAssistant = lazy(() => import('@/pages/AIAssistant'));
const ProfileManager = lazy(() => import('@/pages/ProfileManager'));
const PublicQuotePage = lazy(() => import('@/pages/PublicQuotePage'));
const RelanceSettings = lazy(() => import('@/pages/RelanceSettings'));
const QuoteView = lazy(() => import('@/pages/QuoteView'));

const RouteLoader = () => {
  const { darkMode } = useTheme();
  return (
    <div className={`min-h-[60vh] flex items-center justify-center ${darkMode ? 'bg-slate-900' : ''}`} data-testid="route-loader">
      <div className="h-9 w-9 border-[3px] border-[var(--sr-orange)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <FormPersistProvider>
        <DataCacheProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <AppRouter />
            </ErrorBoundary>
          </BrowserRouter>
        </DataCacheProvider>
      </FormPersistProvider>
    </ThemeProvider>
  );
}

function AppRouter() {
  const location = useLocation();
  const isPublicRoute = location.pathname.startsWith('/devis/public/');

  if (isPublicRoute) {
    return (
      <>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/devis/public/:token" element={<PublicQuotePage />} />
          </Routes>
        </Suspense>
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
  const { prefetchEssentials } = useDataCache();

  // Warm cache after first paint so navigation between pages is instant
  useEffect(() => {
    const id = setTimeout(() => prefetchEssentials(), 50);
    return () => clearTimeout(id);
  }, [prefetchEssentials]);

  return (
    <div className={`App min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-[var(--sr-cream)] text-gray-900'}`}>
      <DesktopNav />
      <div className="lg:pb-0" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quotes" element={<QuotesList />} />
            <Route path="/quotes/new" element={<QuoteForm />} />
            <Route path="/quotes/edit/:id" element={<QuoteForm />} />
            <Route path="/quotes/view/:id" element={<QuoteView />} />
            <Route path="/invoices" element={<InvoicesList />} />
            <Route path="/invoices/new" element={<InvoiceForm />} />
            <Route path="/invoices/edit/:id" element={<InvoiceForm />} />
            <Route path="/clients" element={<ClientsManager />} />
            <Route path="/catalog" element={<CatalogManager />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/profile" element={<ProfileManager />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/relances" element={<RelanceSettings />} />
          </Routes>
        </Suspense>
      </div>
      <BottomNav />
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
