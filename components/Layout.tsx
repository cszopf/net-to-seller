
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, isAuthenticated, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/login');

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

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
              className={`text-sm font-bold uppercase tracking-wide transition-colors ${location.pathname === '/calculate' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-slate-600 hover:text-brand-primary'}`}
            >
              Net to Seller
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-6">
                <Link 
                  to="/admin" 
                  className={`text-sm font-bold uppercase tracking-wide transition-colors ${location.pathname === '/admin' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-slate-600 hover:text-brand-primary'}`}
                >
                  Admin
                </Link>
                <button 
                  onClick={handleLogoutClick}
                  className="text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest border border-slate-200 px-3 py-1 rounded-lg transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/admin" 
                className={`text-sm font-bold uppercase tracking-wide transition-colors ${isAdminPath ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-slate-600 hover:text-brand-primary'}`}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-100 py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 mb-2 font-medium">
            © {new Date().getFullYear()} World Class Title. All rights reserved.
          </p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-brand-primary uppercase tracking-tighter transition-colors">Privacy Policy</a>
            <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-brand-primary uppercase tracking-tighter transition-colors">Terms of Service</a>
            <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-brand-primary uppercase tracking-tighter transition-colors">Legal Disclaimers</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
