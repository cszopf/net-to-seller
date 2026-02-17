
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import CalculatorWizard from './components/CalculatorWizard';
import ResultsPage from './components/ResultsPage';
import AdminPanel from './components/AdminPanel';
import Layout from './components/Layout';
import { NetSheetData } from './types';
import { INITIAL_DATA } from './constants';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-display font-bold text-brand-primary mb-4">
        Net to Seller Calculator
      </h1>
      <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl">
        Get an estimated breakdown of your closing costs and net proceeds in under 60 seconds.
      </p>
      <div className="bg-blue-50 border-l-4 border-brand-primary p-4 mb-10 text-left rounded-r-lg">
        <p className="text-sm text-brand-primary font-semibold">WORLD CLASS ACCURACY</p>
        <p className="text-sm text-slate-700">
          Estimates are based on typical Ohio closing cost ranges. Your escrow officer will confirm final numbers.
        </p>
      </div>
      <Link 
        to="/calculate"
        className="bg-brand-teal hover:bg-[#58b7b4] text-white px-8 py-4 rounded-full text-lg font-display font-bold shadow-lg transition-transform hover:scale-105"
      >
        Start My Estimate
      </Link>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-left w-full">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-display font-bold text-brand-primary mb-2">How net sheets work</h3>
          <p className="text-slate-600 text-sm">
            A net sheet calculates the amount of money you'll receive after all closing costs, commissions, and liens are paid.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-display font-bold text-brand-primary mb-2">Closing Specialist</h3>
          <p className="text-slate-600 text-sm">
            Need a formal quote or help with a complex transaction? Our team is ready to assist you today.
          </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [data, setData] = useState<NetSheetData>(INITIAL_DATA);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calculate" element={<CalculatorWizard data={data} setData={setData} />} />
          <Route path="/results" element={<ResultsPage data={data} />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
