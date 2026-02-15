import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import Dashboard from '@/pages/Dashboard';
import QuotesList from '@/pages/QuotesList';
import QuoteForm from '@/pages/QuoteForm';
import InvoicesList from '@/pages/InvoicesList';
import InvoiceForm from '@/pages/InvoiceForm';
import ClientsManager from '@/pages/ClientsManager';
import CatalogManager from '@/pages/CatalogManager';
import BottomNav from '@/components/BottomNav';

function App() {
  return (
    <div className="App min-h-screen bg-slate-50">
      <BrowserRouter>
        <div className="pb-20 lg:pb-0">
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
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;