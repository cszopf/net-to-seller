
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { NetSheetData, CalculationResult } from '../types';
import { calculateNetSheet } from '../services/calcLogic';
import { DEFAULT_FEE_SCHEDULE } from '../constants';

const ResultsPage: React.FC<{ data: NetSheetData }> = ({ data }) => {
  const navigate = useNavigate();
  const [activePriceIndex, setActivePriceIndex] = useState(0);

  const prices = [data.salePrice];
  if (data.salePrice2 && data.salePrice2 > 0) prices.push(data.salePrice2);
  if (data.salePrice3 && data.salePrice3 > 0) prices.push(data.salePrice3);

  const results = prices.map(p => calculateNetSheet(data, DEFAULT_FEE_SCHEDULE, p));
  const activeResult = results[activePriceIndex];

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="no-print mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button onClick={() => navigate('/calculate')} className="text-brand-primary font-bold flex items-center hover:underline">
          <span className="mr-2">←</span> Edit Inputs
        </button>
        <div className="flex space-x-3">
          <button 
            onClick={handlePrint}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-full text-sm font-bold shadow hover:bg-slate-50 transition-all"
          >
            Print PDF
          </button>
          <button className="bg-brand-teal text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-brand-teal/20 hover:bg-[#58b7b4] transition-all">
            Share Link
          </button>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 print:shadow-none print:border-none print:p-0">
        {/* Header Branding */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-50 pb-8 mb-10">
          <div>
            <div className="mb-4">
              <img 
                src="https://images.squarespace-cdn.com/content/v1/5f4d40b11b4f1e6a11b920b5/1598967776211-2JVFU1R4U8PQM71BWUVE/WorldClassTitle_Logos-RGB-Primary.png?format=1500w" 
                alt="World Class Title Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="text-sm font-bold text-brand-gray uppercase tracking-widest">Net to Seller Estimate</p>
          </div>
          <div className="mt-4 md:mt-0 text-left md:text-right">
            <p className="text-sm text-slate-400">Generated on {new Date().toLocaleDateString()}</p>
            <p className="font-bold text-slate-700 max-w-[250px] md:ml-auto">{data.address || 'Address Not Provided'}</p>
          </div>
        </div>

        {/* Comparison Section */}
        {prices.length > 1 && (
          <div className="no-print mb-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Comparison Scenarios</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {results.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePriceIndex(idx)}
                  className={`p-6 rounded-3xl text-left transition-all border-2 ${activePriceIndex === idx ? 'bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/20 scale-105 z-10' : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100'}`}
                >
                  <p className={`text-[10px] font-bold uppercase mb-1 ${activePriceIndex === idx ? 'text-blue-200' : 'text-slate-400'}`}>Scenario {String.fromCharCode(65 + idx)}</p>
                  <p className="text-xl font-bold mb-2">{formatCurrency(prices[idx])}</p>
                  <div className={`h-px w-full my-3 ${activePriceIndex === idx ? 'bg-white/20' : 'bg-slate-200'}`}></div>
                  <p className={`text-[10px] font-bold uppercase mb-1 ${activePriceIndex === idx ? 'text-blue-200' : 'text-slate-400'}`}>Est. Net Proceeds</p>
                  <p className="text-lg font-display font-bold">{formatCurrency(res.netProceeds)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hero Result for Active Price */}
        <div className="bg-brand-primary rounded-[32px] p-8 md:p-10 text-white shadow-xl shadow-brand-primary/20 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
          <div className="text-center md:text-left">
            <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-1">
              Estimated Net Proceeds {prices.length > 1 ? `(Scenario ${String.fromCharCode(65 + activePriceIndex)})` : ''}
            </p>
            <p className="text-5xl md:text-6xl font-display font-bold">{formatCurrency(activeResult.netProceeds)}</p>
            {prices.length > 1 && (
              <p className="text-blue-200 text-xs font-bold mt-2 italic">Based on {formatCurrency(prices[activePriceIndex])} sale price</p>
            )}
          </div>
          <div className="h-px w-full md:h-16 md:w-px bg-white/20"></div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <div className="flex justify-between md:flex-col">
              <span className="text-blue-200 text-xs font-bold uppercase">Sale Price</span>
              <span className="text-xl font-bold">{formatCurrency(activeResult.grossProceeds)}</span>
            </div>
            <div className="flex justify-between md:flex-col">
              <span className="text-blue-200 text-xs font-bold uppercase">Closing Date</span>
              <span className="text-xl font-bold">{new Date(data.closingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-lg font-display font-bold text-brand-primary">Breakdown for Scenario {String.fromCharCode(65 + activePriceIndex)}</h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detail View</span>
            </div>
            <div className="space-y-3">
              <Row label="Agent Commissions" value={activeResult.totalCommission} isNegative />
              {activeResult.totalPayoffs > 0 && <Row label="Mortgage Payoffs" value={activeResult.totalPayoffs} isNegative />}
              <Row label="Closing Costs & Fees" value={activeResult.closingCosts} isNegative tooltip="Includes settlement, recording, and transfer tax." />
              {activeResult.totalCredits > 0 && <Row label="Seller Credits/Concessions" value={activeResult.totalCredits} isNegative />}
              {activeResult.taxProration > 0 && <Row label="Estimated Tax Proration" value={activeResult.taxProration} isNegative tooltip="Taxes are paid in arrears in Ohio. This is your share through closing." />}
              {activeResult.otherCostsTotal > 0 && <Row label="Other Adjustments" value={activeResult.otherCostsTotal} isNegative />}
            </div>
          </section>

          {activeResult.hoaProration > 0 && (
            <section>
              <h3 className="text-lg font-display font-bold text-brand-primary mb-4 border-b border-slate-100 pb-2">Credits & Adjustments</h3>
              <div className="space-y-3">
                <Row label="HOA Prepaid Credit" value={activeResult.hoaProration} />
              </div>
            </section>
          )}

          <section className="bg-slate-50 p-6 rounded-2xl mt-12">
            <div className="flex justify-between items-center text-xl font-display font-bold text-slate-900">
              <span>Total Reductions</span>
              <span className="text-red-600">
                ({formatCurrency(activeResult.grossProceeds - activeResult.netProceeds)})
              </span>
            </div>
          </section>
        </div>

        {/* Print Comparison Table */}
        {prices.length > 1 && (
          <div className="hidden print:block mt-12">
            <h3 className="text-lg font-display font-bold text-brand-primary mb-4 border-b border-slate-100 pb-2 uppercase tracking-widest">Scenario Comparison Summary</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-2">Line Item</th>
                  {prices.map((p, idx) => <th key={idx} className="py-2 text-right">Scenario {String.fromCharCode(65 + idx)}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 font-semibold">Sale Price</td>
                  {prices.map((p, idx) => <td key={idx} className="py-4 text-right font-bold">{formatCurrency(p)}</td>)}
                </tr>
                <tr className="bg-blue-50/50">
                  <td className="py-4 font-bold text-brand-primary">Net Proceeds</td>
                  {results.map((res, idx) => <td key={idx} className="py-4 text-right font-bold text-brand-primary">{formatCurrency(res.netProceeds)}</td>)}
                </tr>
                <tr>
                  <td className="py-3 text-slate-500 text-sm">Agent Commissions</td>
                  {results.map((res, idx) => <td key={idx} className="py-3 text-right text-slate-500 text-sm">{formatCurrency(res.totalCommission)}</td>)}
                </tr>
                <tr>
                  <td className="py-3 text-slate-500 text-sm">Total Closing Costs</td>
                  {results.map((res, idx) => <td key={idx} className="py-3 text-right text-slate-500 text-sm">{formatCurrency(res.closingCosts)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-16 text-center space-y-4">
          <p className="text-[10px] text-slate-400 leading-relaxed italic max-w-2xl mx-auto">
            Estimates are for illustration only and may vary based on lender requirements, contract terms, prorations, and county-specific charges. Final amounts will be confirmed by your World Class Title escrow officer. This tool does not constitute a binding quote.
          </p>
          <div className="no-print pt-6">
            <Link to="/" className="text-brand-primary font-bold hover:underline">Return Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: number; isNegative?: boolean; tooltip?: string }> = ({ label, value, isNegative, tooltip }) => (
  <div className="flex justify-between items-center group relative">
    <div className="flex items-center">
      <span className="text-slate-600 font-medium">{label}</span>
      {tooltip && (
        <div className="ml-2 w-4 h-4 bg-slate-200 text-[10px] flex items-center justify-center rounded-full text-slate-500 cursor-help no-print" title={tooltip}>i</div>
      )}
    </div>
    <span className={`font-bold ${isNegative ? 'text-slate-900' : 'text-green-600'}`}>
      {isNegative ? '-' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
    </span>
  </div>
);

export default ResultsPage;
