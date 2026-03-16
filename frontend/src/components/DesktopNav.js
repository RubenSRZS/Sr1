import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Receipt, Users, Layers, Sparkles } from 'lucide-react';

const LOGO_SR = "https://customer-assets.emergentagent.com/job_538ea579-31dc-4f0d-9c02-673e8a0738ca/artifacts/srxb4k7u_Nouveau%20Logo%203.png";

const DesktopNav = () => {
  const location = useLocation();
  const items = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/quotes', icon: FileText, label: 'Devis' },
    { path: '/invoices', icon: Receipt, label: 'Factures' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/catalog', icon: Layers, label: 'Catalogue' },
    { path: '/ai-assistant', icon: Sparkles, label: 'Assistant IA', gradient: true },
  ];

  return (
    <nav className="hidden lg:flex items-center h-14 px-6 border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50" data-testid="desktop-nav">
      <Link to="/" className="flex items-center gap-2 mr-8 shrink-0">
        <img src={LOGO_SR} alt="SR Renovation" className="h-8" />
      </Link>
      <div className="flex items-center gap-1">
        {items.map(({ path, icon: Icon, label, gradient }) => {
          const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link key={path} to={path} data-testid={`desktop-nav-${label.toLowerCase()}`}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'text-white' : gradient ? 'text-purple-600 hover:bg-purple-50' : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={active ? (gradient ? { background: 'linear-gradient(135deg, #3b82f6, #9333ea)' } : { background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }) : {}}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default DesktopNav;
