
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import CalculatorWizard from './components/CalculatorWizard';
import ResultsPage from './components/ResultsPage';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import { NetSheetData } from './types';
import { INITIAL_DATA } from './constants';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-display font-bold text-brand-primary mb-4">
        Net to Seller Calculator
      </h1>

      {/* Primary CTA moved above info bar */}
      <div className="mt-6 mb-10">
        <Link 
          to="/calculate"
          className="bg-brand-teal hover:bg-[#58b7b4] text-white px-10 py-5 rounded-full text-lg font-display font-bold shadow-xl transition-transform hover:scale-105 inline-block"
        >
          Start My Estimate
        </Link>
      </div>

      <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl">
        Get an estimated breakdown of your closing costs and net proceeds in under 60 seconds.
      </p>

      <div className="bg-blue-50 border-l-4 border-brand-primary p-6 mb-16 text-left rounded-r-2xl max-w-xl mx-auto shadow-sm">
        <p className="text-sm text-brand-primary font-bold tracking-widest mb-1 uppercase">World Class Accuracy</p>
        <p className="text-sm text-slate-700 leading-relaxed">
          Estimates are based on typical Ohio closing cost ranges. Your escrow officer will confirm final numbers during the transaction.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left w-full">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-brand-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="font-display font-bold text-brand-primary mb-2">How net sheets work</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            A net sheet calculates the amount of money you'll receive after all closing costs, commissions, and liens are paid.
          </p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-4 text-brand-teal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
          </div>
          <h3 className="font-display font-bold text-brand-primary mb-2">Closing Specialist</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Need a formal quote or help with a complex transaction? Our world-class team is ready to assist you today.
          </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [data, setData] = useState<NetSheetData>(INITIAL_DATA);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('adminAuth') === 'true';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('adminAuth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
  };

  return (
    <Router>
      <Layout isAuthenticated={isAuthenticated} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calculate" element={<CalculatorWizard data={data} setData={setData} />} />
          <Route path="/results" element={<ResultsPage data={data} />} />
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/admin" replace /> : <LoginPage onLogin={handleLogin} />} 
          />
          <Route 
            path="/admin" 
            element={isAuthenticated ? <AdminPanel /> : <Navigate to="/login" replace />} 
          />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
