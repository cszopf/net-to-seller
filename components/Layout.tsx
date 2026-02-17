
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="https://images.squarespace-cdn.com/content/v1/5f4d40b11b4f1e6a11b920b5/1598967776211-2JVFU1R4U8PQM71BWUVE/WorldClassTitle_Logos-RGB-Primary.png?format=1500w" 
              alt="World Class Title Logo" 
              className="h-12 w-auto object-contain"
            />
          </Link>

          <nav className="flex items-center space-x-6">
            <Link 
              to="/calculate" 
              className={`text-sm font-bold uppercase tracking-wide ${location.pathname === '/calculate' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-slate-600 hover:text-brand-primary'}`}
            >
              Net to Seller
            </Link>
            <Link 
              to="/admin" 
              className={`text-sm font-bold uppercase tracking-wide ${isAdmin ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-slate-600 hover:text-brand-primary'}`}
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-100 py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 mb-2">
            © {new Date().getFullYear()} World Class Title. All rights reserved.
          </p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="text-xs text-slate-500 hover:underline">Privacy Policy</a>
            <a href="#" className="text-xs text-slate-500 hover:underline">Terms of Service</a>
            <a href="#" className="text-xs text-slate-500 hover:underline">Legal Disclaimers</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
