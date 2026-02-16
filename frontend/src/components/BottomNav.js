import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Receipt, Users, Layers } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const items = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/quotes', icon: FileText, label: 'Devis' },
    { path: '/invoices', icon: Receipt, label: 'Factures' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/catalog', icon: Layers, label: 'Catalogue' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 h-14 flex items-center justify-around z-50 lg:hidden" data-testid="bottom-nav">
      {items.map(({ path, icon: Icon, label }) => {
        const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
        return (
          <Link key={path} to={path} data-testid={`nav-${label.toLowerCase()}`}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${active ? 'text-[#3b82f6]' : 'text-gray-400'}`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
            <span className="text-[10px] mt-0.5 font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
