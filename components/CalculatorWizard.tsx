
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NetSheetData, MortgagePayoff, OtherCost } from '../types';
import { OHIO_COUNTIES, PROPERTY_TYPES } from '../constants';

interface Props {
  data: NetSheetData;
  setData: React.Dispatch<React.SetStateAction<NetSheetData>>;
}

type AttomStatus = 'idle' | 'loading' | 'success' | 'error';

const CalculatorWizard: React.FC<Props> = ({ data, setData }) => {
  const [step, setStep] = useState(1);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [attomStatus, setAttomStatus] = useState<AttomStatus>('idle');
  const [attomError, setAttomError] = useState<string | null>(null);
  const [useTaxEstimate, setUseTaxEstimate] = useState(true);
  
  const navigate = useNavigate();
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  const fetchAttom = async (address1: string, address2: string) => {
    setAttomStatus("loading");
    setAttomError(null);

    try {
      const r = await fetch("/api/attom/property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address1, address2 }),
      });

      const json = await r.json();

      if (!r.ok) {
        setAttomStatus("error");
        setAttomError(json?.error || "ATTOM lookup failed");
        return null;
      }

      setAttomStatus("success");
      
      // Update data with normalized results
      setData((f) => ({
        ...f,
        county: json.county || f.county,
        parcelId: json.apn || f.parcelId,
        taxValue: useTaxEstimate ? (json.tax?.annual ?? f.taxValue) : f.taxValue,
        taxYear: json.tax?.year ?? f.taxYear,
        assessedTotal: json.assessed?.total ?? f.assessedTotal,
      }));
      
      return json;
    } catch (err) {
      setAttomStatus("error");
      setAttomError("Property record search unavailable.");
      return null;
    }
  };

  useEffect(() => {
    // Check for Maps initialization
    if (step === 1 && autocompleteInputRef.current && (window as any).google) {
      try {
        autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(autocompleteInputRef.current, {
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'formatted_address'],
          types: ['address']
        });

        autocompleteRef.current.addListener('place_changed', async () => {
          const place = autocompleteRef.current?.getPlace();
          if (place && place.address_components) {
            let streetNumber = '';
            let route = '';
            let city = '';
            let state = '';
            let zip = '';
            let county = '';

            for (const component of place.address_components) {
              const types = component.types;
              if (types.includes('street_number')) streetNumber = component.long_name;
              if (types.includes('route')) route = component.long_name;
              if (types.includes('locality')) city = component.long_name;
              if (types.includes('administrative_area_level_1')) state = component.short_name;
              if (types.includes('postal_code')) zip = component.long_name;
              if (types.includes('administrative_area_level_2')) {
                county = component.long_name.replace(' County', '').trim();
              }
            }

            // Ohio Specific Validation
            if (state && state !== 'OH') {
              setAddressError('Out of State: This tool only supports Ohio properties. Please contact info@worldclasstitle.com or call us at (614) 848-4000 for assistance.');
              setData(prev => ({ ...prev, address: place.formatted_address || '', state }));
              return;
            }

            setAddressError(null);
            const street1 = `${streetNumber} ${route}`.trim();
            const street2 = `${city}, ${state || 'OH'} ${zip}`;
            const matchedCounty = OHIO_COUNTIES.find(c => c.toLowerCase() === county.toLowerCase()) || 'Other';

            setData(prev => ({
              ...prev,
              address: place.formatted_address || street1,
              city,
              state: state || 'OH',
              zip,
              county: matchedCounty
            }));

            // Trigger ATTOM Lookup
            await fetchAttom(street1, street2);
          }
        });
      } catch (e) {
        console.warn('Maps Autocomplete error. This may be due to restricted API key referrers.', e);
      }
    }
  }, [step, setData]);

  const updateData = (fields: Partial<NetSheetData>) => {
    setData(prev => ({ ...prev, ...fields }));
  };

  const clearAddress = () => {
    updateData({ address: '', city: '', state: 'OH', zip: '', county: 'Franklin', parcelId: '', taxValue: 0, taxYear: undefined });
    setAttomStatus('idle');
    setAttomError(null);
    setAddressError(null);
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

  const isValid = () => {
    if (step === 1) return data.salePrice > 0 && data.address !== '' && !addressError;
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

      <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 min-h-[450px] flex flex-col">
        {/* Step Content */}
        <div className="flex-grow">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-2xl font-display font-bold text-brand-primary uppercase tracking-tight">Property Basics</h2>
                <div className="flex flex-wrap gap-2">
                   <span className={`px-2 py-1 rounded-[6px] text-[9px] font-bold uppercase tracking-wider ${(window as any).google?.maps ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                     Maps: {(window as any).google?.maps ? 'Connected' : 'Referer Error'}
                   </span>
                   <span className={`px-2 py-1 rounded-[6px] text-[9px] font-bold uppercase tracking-wider ${attomStatus === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : attomStatus === 'loading' ? 'bg-blue-50 text-blue-600 border border-blue-100' : attomStatus === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                     ATTOM: {attomStatus}
                   </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Search Address</label>
                    {data.address && (
                      <button onClick={clearAddress} className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-tight">Clear Address</button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      ref={autocompleteInputRef}
                      type="text" 
                      placeholder="Enter street address..."
                      className={`w-full p-4 border rounded-2xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all ${addressError ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                      value={data.address}
                      onChange={e => {
                        updateData({ address: e.target.value });
                        if (addressError) setAddressError(null);
                      }}
                    />
                  </div>
                  {addressError && (
                    <div className="mt-4 p-5 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded-r-2xl animate-in slide-in-from-top-1 shadow-sm">
                      {addressError}
                    </div>
                  )}
                  {attomStatus === 'loading' && (
                    <div className="mt-2 text-[11px] text-brand-primary font-bold flex items-center animate-pulse">
                      <svg className="animate-spin h-3 w-3 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Finding property record...
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 tracking-widest">County</label>
                    <select 
                      className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-teal/20 outline-none text-sm font-semibold"
                      value={data.county}
                      onChange={e => updateData({ county: e.target.value })}
                    >
                      {OHIO_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Parcel ID</label>
                    <input 
                      type="text" 
                      placeholder="APN #"
                      className="w-full p-4 border border-slate-200 rounded-2xl outline-none text-sm font-semibold"
                      value={data.parcelId}
                      onChange={e => updateData({ parcelId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    {attomStatus === 'success' && (
                       <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded border border-green-100 shadow-sm">Data Source: ATTOM</span>
                    )}
                  </div>
                  <button 
                    onClick={() => fetchAttom(data.address.split(',')[0], `${data.city}, ${data.state} ${data.zip}`)}
                    className="text-[10px] font-bold text-brand-primary flex items-center hover:underline uppercase tracking-wider"
                    disabled={!data.address || attomStatus === 'loading'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 mr-1 ${attomStatus === 'loading' ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Refresh Data
                  </button>
                </div>
                
                <div className="pt-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Sale Price Scenarios</label>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Primary target price</p>
                    </div>
                    {!data.showComparisons && (
                      <button 
                        onClick={() => updateData({ showComparisons: true })}
                        className="text-[10px] font-bold text-brand-primary bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm uppercase tracking-widest"
                      >
                        + Add Options
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scenario A (Target)</label>
                      </div>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none text-3xl font-bold text-brand-primary"
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
                            placeholder="Price"
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-teal/10 outline-none font-bold text-slate-700"
                            value={data.salePrice2 || ''}
                            onChange={e => updateData({ salePrice2: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scenario C</label>
                            <button 
                              onClick={() => updateData({ showComparisons: false, salePrice2: 0, salePrice3: 0 })}
                              className="text-[9px] font-bold text-red-500 hover:text-red-700 hover:underline uppercase tracking-tighter"
                            >
                              CLEAR
                            </button>
                          </div>
                          <input 
                            type="number" 
                            placeholder="Price"
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-teal/10 outline-none font-bold text-slate-700"
                            value={data.salePrice3 || ''}
                            onChange={e => updateData({ salePrice3: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Est. Closing Date</label>
                  <input 
                    type="date" 
                    className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-teal/20 outline-none font-bold text-slate-700"
                    value={data.closingDate}
                    onChange={e => updateData({ closingDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-display font-bold text-brand-primary uppercase tracking-tight">Mortgage Payoffs</h2>
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] mb-4 border border-slate-100">
                <span className="font-bold text-slate-700">Any Existing Mortgages?</span>
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
                    <div key={payoff.id} className="p-6 border border-slate-100 rounded-[32px] bg-white shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payoff #{idx + 1}</span>
                        {data.mortgagePayoffs.length > 1 && (
                          <button onClick={() => removePayoff(payoff.id)} className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase">REMOVE</button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Lender Name</label>
                           <input 
                             type="text" 
                             className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold"
                             value={payoff.lenderName}
                             onChange={e => updatePayoff(payoff.id, { lenderName: e.target.value })}
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Approx. Balance</label>
                           <input 
                             type="number" 
                             className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-brand-primary"
                             value={payoff.amount || ''}
                             onChange={e => updatePayoff(payoff.id, { amount: parseFloat(e.target.value) || 0 })}
                           />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={addPayoff}
                    className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 hover:text-brand-primary hover:border-brand-primary rounded-[32px] text-[10px] font-bold transition-all uppercase tracking-widest"
                  >
                    + ADD ANOTHER PAYOFF
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-display font-bold text-brand-primary uppercase tracking-tight">Agent Commissions</h2>
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] mb-4 border border-slate-100">
                <span className="font-bold text-slate-700">Paying Commissions?</span>
                <button 
                  onClick={() => updateData({ hasCommission: !data.hasCommission })}
                  className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${data.hasCommission ? 'bg-brand-teal' : 'bg-slate-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${data.hasCommission ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {data.hasCommission && (
                <div className="space-y-6">
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => updateData({ commissionType: 'percent' })}
                      className={`flex-1 py-4 rounded-2xl font-bold transition-all text-sm uppercase tracking-wider ${data.commissionType === 'percent' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                    >
                      Percentage %
                    </button>
                    <button 
                      onClick={() => updateData({ commissionType: 'flat' })}
                      className={`flex-1 py-4 rounded-2xl font-bold transition-all text-sm uppercase tracking-wider ${data.commissionType === 'flat' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                    >
                      Flat Amount $
                    </button>
                  </div>

                  <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 text-center">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      {data.commissionType === 'percent' ? 'Total Commission (%)' : 'Total Commission ($)'}
                    </label>
                    <div className="relative inline-block w-full max-w-[200px]">
                      {data.commissionType === 'flat' && <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-300">$</span>}
                      <input 
                        type="number" 
                        className={`w-full p-2 bg-transparent border-b-2 border-slate-200 text-center text-4xl font-bold text-brand-primary focus:border-brand-teal outline-none transition-colors ${data.commissionType === 'flat' ? 'pl-8' : ''}`}
                        value={data.commissionValue || ''}
                        onChange={e => updateData({ commissionValue: parseFloat(e.target.value) || 0 })}
                      />
                      {data.commissionType === 'percent' && <span className="absolute right-0 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-300">%</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-display font-bold text-brand-primary uppercase tracking-tight">Seller Concessions</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Credit to Buyer ($)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 bg-transparent border-b border-slate-200 focus:border-brand-teal outline-none font-bold text-2xl text-slate-800"
                    value={data.concessions || ''}
                    onChange={e => updateData({ concessions: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Home Warranty ($)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 bg-transparent border-b border-slate-200 focus:border-brand-teal outline-none font-bold text-2xl text-slate-800"
                    value={data.homeWarranty || ''}
                    onChange={e => updateData({ homeWarranty: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Repair Credits ($)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 bg-transparent border-b border-slate-200 focus:border-brand-teal outline-none font-bold text-2xl text-slate-800"
                    value={data.repairCredits || ''}
                    onChange={e => updateData({ repairCredits: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-display font-bold text-brand-primary uppercase tracking-tight">Closing & Taxes</h2>
              
              <div className="p-6 bg-slate-50 rounded-[40px] border border-slate-100">
                <h3 className="text-[11px] font-bold text-brand-primary uppercase mb-5 tracking-widest">Title Policy Options</h3>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="max-w-[70%]">
                      <span className="text-sm font-bold text-slate-700">Homeowner's Policy (PR-1.1)</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Premium coverage (1.15x multiplier)</p>
                    </div>
                    <button 
                      onClick={() => updateData({ isHomeownersPolicy: !data.isHomeownersPolicy })}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${data.isHomeownersPolicy ? 'bg-brand-primary' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${data.isHomeownersPolicy ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-slate-200">
                    <div className="max-w-[70%]">
                      <span className="text-sm font-bold text-slate-700">Reissue Credit (PR-4)</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">30% credit with prior policy</p>
                    </div>
                    <button 
                      onClick={() => updateData({ isReissueRate: !data.isReissueRate })}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${data.isReissueRate ? 'bg-brand-primary' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${data.isReissueRate ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {data.isReissueRate && (
                    <div className="animate-in slide-in-from-top-2 duration-300 pt-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Prior Policy Amount ($)</label>
                      <input 
                        type="number" 
                        className="w-full p-4 border border-slate-200 rounded-2xl text-lg font-bold text-brand-primary bg-white outline-none focus:ring-2 focus:ring-brand-teal/10"
                        value={data.priorPolicyAmount || ''}
                        onChange={e => updateData({ priorPolicyAmount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-brand-light/10 rounded-[40px] border border-brand-light/30">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-[11px] font-bold text-brand-primary uppercase tracking-widest">Property Taxes</label>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Use Estimates</span>
                     <button 
                      onClick={() => setUseTaxEstimate(!useTaxEstimate)}
                      className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-1 ${useTaxEstimate ? 'bg-brand-primary' : 'bg-slate-300'}`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform ${useTaxEstimate ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-2 mb-4">
                  <button 
                    onClick={() => updateData({ taxInputMethod: 'annual' })}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest ${data.taxInputMethod === 'annual' ? 'bg-brand-primary text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}
                  >
                    Annual
                  </button>
                  <button 
                    onClick={() => updateData({ taxInputMethod: 'monthly' })}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest ${data.taxInputMethod === 'monthly' ? 'bg-brand-primary text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}
                  >
                    Monthly
                  </button>
                </div>

                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full p-5 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-teal/20 text-2xl font-bold text-slate-800 bg-white"
                    value={data.taxValue || ''}
                    onChange={e => updateData({ taxValue: parseFloat(e.target.value) || 0 })}
                  />
                  {data.taxYear && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border uppercase tracking-tighter">Year: {data.taxYear}</span>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-brand-teal" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    Prorated through {new Date(data.closingDate).toLocaleDateString()}.
                  </p>
                  {attomStatus === 'success' && (
                     <p className="text-[9px] text-green-600 font-bold uppercase flex items-center">
                       <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>
                       Verified via ATTOM Data
                     </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 shadow-sm">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Monthly HOA</label>
                  <input type="number" className="w-full bg-transparent p-1 border-b border-slate-300 outline-none font-bold text-lg" value={data.hoaMonthly || ''} onChange={e => updateData({ hoaMonthly: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 shadow-sm">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">HOA Transfer</label>
                  <input type="number" className="w-full bg-transparent p-1 border-b border-slate-300 outline-none font-bold text-lg" value={data.hoaTransferFee || ''} onChange={e => updateData({ hoaTransferFee: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-10 flex space-x-3">
          {step > 1 && (
            <button onClick={handleBack} className="flex-1 py-5 border border-slate-200 text-slate-500 font-display font-bold rounded-[24px] hover:bg-slate-50 transition-all uppercase text-sm tracking-widest">Back</button>
          )}
          <button onClick={handleNext} disabled={!isValid()} className={`flex-[2] py-5 font-display font-bold rounded-[24px] transition-all shadow-xl shadow-brand-teal/20 uppercase text-sm tracking-widest ${isValid() ? 'bg-brand-teal text-white hover:bg-[#58b7b4]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            {step === 5 ? 'Finalize Net Sheet' : 'Next Step'}
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        Record lookup by <span className="text-brand-primary">ATTOM</span> & <span className="text-brand-primary">Google Places</span>
      </p>
    </div>
  );
};

export default CalculatorWizard;
