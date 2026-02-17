
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NetSheetData, MortgagePayoff, OtherCost } from '../types';
import { OHIO_COUNTIES, PROPERTY_TYPES } from '../constants';

interface Props {
  data: NetSheetData;
  setData: React.Dispatch<React.SetStateAction<NetSheetData>>;
}

const CalculatorWizard: React.FC<Props> = ({ data, setData }) => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const updateData = (fields: Partial<NetSheetData>) => {
    setData(prev => ({ ...prev, ...fields }));
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else navigate('/results');
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const addPayoff = () => {
    const newPayoff: MortgagePayoff = { id: crypto.randomUUID(), lenderName: '', amount: 0 };
    updateData({ mortgagePayoffs: [...data.mortgagePayoffs, newPayoff] });
  };

  const removePayoff = (id: string) => {
    updateData({ mortgagePayoffs: data.mortgagePayoffs.filter(p => p.id !== id) });
  };

  const updatePayoff = (id: string, fields: Partial<MortgagePayoff>) => {
    updateData({
      mortgagePayoffs: data.mortgagePayoffs.map(p => p.id === id ? { ...p, ...fields } : p)
    });
  };

  const addOtherCost = () => {
    const newCost: OtherCost = { id: crypto.randomUUID(), label: '', amount: 0 };
    updateData({ otherCosts: [...data.otherCosts, newCost] });
  };

  const removeOtherCost = (id: string) => {
    updateData({ otherCosts: data.otherCosts.filter(c => c.id !== id) });
  };

  const updateOtherCost = (id: string, fields: Partial<OtherCost>) => {
    updateData({
      otherCosts: data.otherCosts.map(c => c.id === id ? { ...c, ...fields } : c)
    });
  };

  const isValid = () => {
    if (step === 1) return data.salePrice > 0 && data.address !== '';
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-brand-primary uppercase tracking-wider">Step {step} of 5</span>
          <span className="text-sm text-slate-400">{Math.round((step / 5) * 100)}% Complete</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-teal transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[450px] flex flex-col">
        {/* Step Content */}
        <div className="flex-grow">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-display font-bold text-brand-primary">Property Basics</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Property Address</label>
                  <input 
                    type="text" 
                    placeholder="Enter full address"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all"
                    value={data.address}
                    onChange={e => updateData({ address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">County</label>
                    <select 
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none"
                      value={data.county}
                      onChange={e => updateData({ county: e.target.value })}
                    >
                      {OHIO_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Property Type</label>
                    <select 
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none"
                      value={data.propertyType}
                      onChange={e => updateData({ propertyType: e.target.value })}
                    >
                      {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="pt-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Sale Price Scenarios</label>
                      <p className="text-xs text-slate-400">Enter up to 3 prices to compare net proceeds.</p>
                    </div>
                    {!data.showComparisons && (
                      <button 
                        onClick={() => updateData({ showComparisons: true })}
                        className="text-xs font-bold text-brand-primary bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        + Add Scenarios
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scenario A (Primary)</label>
                      </div>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none text-xl font-bold text-brand-primary"
                        value={data.salePrice || ''}
                        onChange={e => updateData({ salePrice: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    {data.showComparisons && (
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Scenario B</label>
                          <input 
                            type="number" 
                            placeholder="Optional"
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-teal/10 outline-none font-semibold text-slate-700"
                            value={data.salePrice2 || ''}
                            onChange={e => updateData({ salePrice2: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scenario C</label>
                            <button 
                              onClick={() => updateData({ showComparisons: false, salePrice2: 0, salePrice3: 0 })}
                              className="text-[9px] font-bold text-red-400 hover:text-red-500"
                            >
                              CLEAR ALL
                            </button>
                          </div>
                          <input 
                            type="number" 
                            placeholder="Optional"
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-teal/10 outline-none font-semibold text-slate-700"
                            value={data.salePrice3 || ''}
                            onChange={e => updateData({ salePrice3: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Estimated Closing Date</label>
                  <input 
                    type="date" 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none"
                    value={data.closingDate}
                    onChange={e => updateData({ closingDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-display font-bold text-brand-primary">Mortgage Payoffs</h2>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-4">
                <span className="font-semibold text-slate-700">Do you have a mortgage to pay off?</span>
                <button 
                  onClick={() => updateData({ hasMortgage: !data.hasMortgage, mortgagePayoffs: !data.hasMortgage ? [{ id: '1', lenderName: '', amount: 0 }] : [] })}
                  className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${data.hasMortgage ? 'bg-brand-teal' : 'bg-slate-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${data.hasMortgage ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {data.hasMortgage && (
                <div className="space-y-4">
                  {data.mortgagePayoffs.map((payoff, idx) => (
                    <div key={payoff.id} className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase">Payoff #{idx + 1}</span>
                        {data.mortgagePayoffs.length > 1 && (
                          <button onClick={() => removePayoff(payoff.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">REMOVE</button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Lender Name"
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                          value={payoff.lenderName}
                          onChange={e => updatePayoff(payoff.id, { lenderName: e.target.value })}
                        />
                        <input 
                          type="number" 
                          placeholder="Amount ($)"
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm font-semibold"
                          value={payoff.amount || ''}
                          onChange={e => updatePayoff(payoff.id, { amount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={addPayoff}
                    className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 hover:text-brand-primary hover:border-brand-primary rounded-2xl text-sm font-bold transition-all"
                  >
                    + ADD ANOTHER PAYOFF
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-display font-bold text-brand-primary">Agent Compensation</h2>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-4">
                <span className="font-semibold text-slate-700">Are you paying agent commissions?</span>
                <button 
                  onClick={() => updateData({ hasCommission: !data.hasCommission })}
                  className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${data.hasCommission ? 'bg-brand-teal' : 'bg-slate-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${data.hasCommission ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {data.hasCommission && (
                <div className="space-y-6">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => updateData({ commissionType: 'percent' })}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${data.commissionType === 'percent' ? 'bg-brand-primary text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                    >
                      Percentage %
                    </button>
                    <button 
                      onClick={() => updateData({ commissionType: 'flat' })}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${data.commissionType === 'flat' ? 'bg-brand-primary text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                    >
                      Flat Amount $
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {data.commissionType === 'percent' ? 'Total Commission (%)' : 'Total Commission ($)'}
                    </label>
                    <input 
                      type="number" 
                      className="w-full p-4 border border-slate-200 rounded-xl text-2xl font-bold text-brand-primary focus:ring-2 focus:ring-brand-teal/20 outline-none"
                      value={data.commissionValue || ''}
                      onChange={e => updateData({ commissionValue: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-display font-bold text-brand-primary">Credits & Concessions</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Seller Credit to Buyer ($)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 bg-transparent border-b border-slate-300 focus:border-brand-teal outline-none font-bold text-lg"
                    value={data.concessions || ''}
                    onChange={e => updateData({ concessions: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Home Warranty ($)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 bg-transparent border-b border-slate-300 focus:border-brand-teal outline-none font-bold text-lg"
                    value={data.homeWarranty || ''}
                    onChange={e => updateData({ homeWarranty: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Repair Credits ($)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 bg-transparent border-b border-slate-300 focus:border-brand-teal outline-none font-bold text-lg"
                    value={data.repairCredits || ''}
                    onChange={e => updateData({ repairCredits: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-display font-bold text-brand-primary">Taxes, HOA & Misc</h2>
              
              <div className="p-4 bg-brand-light/20 rounded-2xl border border-brand-light/30">
                <label className="block text-sm font-semibold text-brand-primary mb-3">Property Taxes</label>
                <div className="flex space-x-2 mb-4">
                  <button 
                    onClick={() => updateData({ taxInputMethod: 'annual' })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${data.taxInputMethod === 'annual' ? 'bg-brand-primary text-white' : 'bg-white text-slate-400'}`}
                  >
                    Annual
                  </button>
                  <button 
                    onClick={() => updateData({ taxInputMethod: 'monthly' })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${data.taxInputMethod === 'monthly' ? 'bg-brand-primary text-white' : 'bg-white text-slate-400'}`}
                  >
                    Monthly
                  </button>
                </div>
                <input 
                  type="number" 
                  placeholder={data.taxInputMethod === 'annual' ? "Annual tax amount" : "Monthly escrow amount"}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal/20"
                  value={data.taxValue || ''}
                  onChange={e => updateData({ taxValue: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Monthly HOA Dues</label>
                  <input 
                    type="number" 
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                    value={data.hoaMonthly || ''}
                    onChange={e => updateData({ hoaMonthly: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">HOA Transfer Fee</label>
                  <input 
                    type="number" 
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                    value={data.hoaTransferFee || ''}
                    onChange={e => updateData({ hoaTransferFee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">Other Closing Costs</label>
                {data.otherCosts.map((cost) => (
                  <div key={cost.id} className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="Label"
                      className="flex-[2] p-2 border border-slate-200 rounded-lg text-sm"
                      value={cost.label}
                      onChange={e => updateOtherCost(cost.id, { label: e.target.value })}
                    />
                    <input 
                      type="number" 
                      placeholder="$"
                      className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                      value={cost.amount || ''}
                      onChange={e => updateOtherCost(cost.id, { amount: parseFloat(e.target.value) || 0 })}
                    />
                    <button onClick={() => removeOtherCost(cost.id)} className="text-red-400 p-2">×</button>
                  </div>
                ))}
                <button 
                  onClick={addOtherCost}
                  className="text-brand-primary text-xs font-bold hover:underline"
                >
                  + ADD OTHER COST
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-10 flex space-x-3">
          {step > 1 && (
            <button 
              onClick={handleBack}
              className="flex-1 py-4 border border-slate-200 text-slate-500 font-display font-bold rounded-2xl hover:bg-slate-50 transition-all"
            >
              Back
            </button>
          )}
          <button 
            onClick={handleNext}
            disabled={!isValid()}
            className={`flex-[2] py-4 font-display font-bold rounded-2xl transition-all shadow-lg shadow-brand-teal/20 ${isValid() ? 'bg-brand-teal text-white hover:bg-[#58b7b4]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {step === 5 ? 'Generate Net Sheet' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorWizard;
