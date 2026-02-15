import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Receipt, Users, Layers } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/quotes', icon: FileText, label: 'Devis' },
    { path: '/invoices', icon: Receipt, label: 'Factures' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/catalog', icon: Layers, label: 'Catalogue' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around z-50 lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            data-testid={`nav-${item.label.toLowerCase()}`}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive ? 'text-orange-500' : 'text-slate-600'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;