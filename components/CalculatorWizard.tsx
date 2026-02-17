
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NetSheetData, MortgagePayoff } from '../types';
import { OHIO_COUNTIES } from '../constants';

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
  const [attomDebug, setAttomDebug] = useState<{ a1: string; a2: string } | null>(null);
  const [useTaxEstimate, setUseTaxEstimate] = useState(true);
  
  const navigate = useNavigate();
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  const fetchAttom = async (address1: string, address2: string) => {
    setAttomStatus("loading");
    setAttomError(null);
    setAttomDebug({ a1: address1, a2: address2 });

    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 6000));

    try {
      const fetchPromise = fetch("/api/attom/property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address1, address2 }),
      });

      const r = (await Promise.race([fetchPromise, timeout])) as Response;
      const json = await r.json();

      if (!r.ok) {
        setAttomStatus("error");
        setAttomError(json?.message || "Property data unavailable. Enter details manually.");
        return null;
      }

      setAttomStatus("success");
      
      setData((f) => ({
        ...f,
        county: json.county || f.county,
        parcelId: json.apn || f.parcelId,
        sellerName: json.sellerName || f.sellerName || '',
        taxValue: useTaxEstimate ? (json.tax?.annual ?? f.taxValue) : f.taxValue,
        taxYear: json.tax?.year ?? f.taxYear,
        isHomestead: json.tax?.isHomestead,
        assessedTotal: json.assessed?.total ?? f.assessedTotal,
        // Snapshot data
        beds: json.snapshot?.beds,
        baths: json.snapshot?.baths,
        sqft: json.snapshot?.sqft,
        yearBuilt: json.snapshot?.yearBuilt,
        propertyType: json.snapshot?.propertyType || f.propertyType,
        lotSize: json.snapshot?.lotSize,
      }));
      
      return json;
    } catch (err) {
      setAttomStatus("error");
      setAttomError("Property data unavailable. Enter details manually.");
      return null;
    }
  };

  useEffect(() => {
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
            let streetNumber = '', route = '', city = '', state = '', zip = '', county = '';

            for (const component of place.address_components) {
              const types = component.types;
              if (types.includes('street_number')) streetNumber = component.long_name;
              if (types.includes('route')) route = component.long_name;
              if (types.includes('locality')) city = component.long_name;
              if (types.includes('administrative_area_level_1')) state = component.short_name;
              if (types.includes('postal_code')) zip = component.long_name;
              if (types.includes('administrative_area_level_2')) county = component.long_name.replace(' County', '').trim();
            }

            if (state && state !== 'OH') {
              setAddressError('Out of State: This tool only supports Ohio properties.');
              return;
            }

            setAddressError(null);
            const cleanA1 = `${streetNumber} ${route}`.trim();
            const cleanA2 = `${city}, ${state || 'OH'} ${zip}`.trim();
            const matchedCounty = OHIO_COUNTIES.find(c => c.toLowerCase() === county.toLowerCase()) || 'Other';

            setData(prev => ({
              ...prev,
              address: place.formatted_address || cleanA1,
              city,
              state: state || 'OH',
              zip,
              county: matchedCounty
            }));

            await fetchAttom(cleanA1, cleanA2);
          }
        });
      } catch (e) {
        console.warn('Maps Autocomplete error.', e);
      }
    }
  }, [step, setData]);

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

  const formatAsUSD = (value: number | undefined): string => {
    if (value === undefined || value === 0) return '';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const generateSmartDescription = () => {
    const { beds, baths, sqft, yearBuilt, propertyType } = data;
    if (beds && baths && sqft && yearBuilt) {
      return `${propertyType || 'Property'} featuring ${beds} bedrooms, ${baths} bathrooms and approximately ${sqft.toLocaleString()} square feet built in ${yearBuilt}.`;
    }
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-brand-primary uppercase tracking-wider">Step {step} of 5</span>
          <span className="text-sm text-slate-400">{Math.round((step / 5) * 100)}% Complete</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-teal transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }} />
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 min-h-[500px] flex flex-col relative overflow-hidden">
        {attomStatus === 'loading' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-teal/20 overflow-hidden">
            <div className="h-full bg-brand-teal animate-[shimmer_2s_infinite]" style={{ width: '40%', backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.8), transparent)' }}></div>
          </div>
        )}

        <div className="flex-grow">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-brand-primary uppercase tracking-tight">Property Basics</h2>
                <div className="flex gap-2">
                   <Badge label="Maps" status={(window as any).google?.maps ? 'success' : 'idle'} />
                   <Badge label="ATTOM" status={attomStatus} />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Property Search</label>
                  <input 
                    ref={autocompleteInputRef}
                    type="text" 
                    placeholder="Enter street address..."
                    className={`w-full p-4 border rounded-2xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all ${addressError ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                    value={data.address}
                    onChange={e => updateData({ address: e.target.value })}
                  />
                  {attomStatus === 'error' && (
                    <div className="mt-3 p-3 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-xl flex items-center border border-amber-100">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4a1 1 0 112 0 1 1 0 01-2 0zm1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" /></svg>
                      {attomError}
                    </div>
                  )}
                  {attomDebug && (
                    <div className="mt-1 text-[9px] text-slate-300 font-mono uppercase tracking-tighter opacity-50">
                      Search Query: {attomDebug.a1} | {attomDebug.a2}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Seller Name</label>
                      <input 
                        type="text" 
                        placeholder="Current Owner"
                        className="w-full p-4 border border-slate-200 rounded-2xl outline-none text-sm font-semibold"
                        value={data.sellerName}
                        onChange={e => updateData({ sellerName: e.target.value })}
                      />
                      {attomStatus === 'success' && data.sellerName && (
                        <p className="text-[9px] text-green-600 font-bold uppercase tracking-tighter flex items-center mt-1">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                          Verified via ATTOM
                        </p>
                      )}
                   </div>
                   <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Parcel ID / APN</label>
                      <input 
                        type="text" 
                        placeholder="APN #"
                        className="w-full p-4 border border-slate-200 rounded-2xl outline-none text-sm font-semibold"
                        value={data.parcelId}
                        onChange={e => updateData({ parcelId: e.target.value })}
                      />
                   </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Primary Sale Price ($)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-300 group-focus-within:text-brand-teal transition-colors">$</span>
                    <input 
                      type="text" 
                      placeholder="0"
                      className="w-full p-4 pl-10 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-teal/20 outline-none text-3xl font-bold text-brand-primary"
                      value={formatAsUSD(data.salePrice)}
                      onChange={e => updateData({ salePrice: parseFloat(e.target.value.replace(/,/g, '')) || 0 })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-brand-primary uppercase tracking-tight">Property Snapshot</h2>
                {attomStatus === 'success' && (
                  <span className="bg-green-50 text-green-600 text-[10px] font-bold px-3 py-1 rounded-full border border-green-100 uppercase tracking-wider flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                    Auditor Data Verified
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Beds" value={data.beds} />
                <StatCard label="Baths" value={data.baths} />
                <StatCard label="Sq Ft" value={data.sqft?.toLocaleString()} />
                <StatCard label="Built" value={data.yearBuilt} />
              </div>

              <div className="bg-brand-light/5 border border-brand-light/20 p-6 rounded-[32px] space-y-4">
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-bold text-brand-primary uppercase tracking-widest">Description</h3>
                   <span className="text-[10px] text-slate-400 font-bold uppercase">{data.propertyType}</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed italic">
                  {generateSmartDescription() || "Complete address details to auto-populate the property snapshot."}
                </p>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Estimated Market Value</div>
                  <div className="text-sm font-bold text-brand-primary">{data.assessedTotal ? formatAsUSD(data.assessedTotal) : '---'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-1.5 h-1.5 bg-brand-teal rounded-full"></div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Characteristics sourced from public auditor records.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-display font-bold text-brand-primary uppercase tracking-tight">Mortgage Payoffs</h2>
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                <span className="font-bold text-slate-700">Any Existing Mortgages?</span>
                <button 
                  onClick={() => updateData({ hasMortgage: !data.hasMortgage, mortgagePayoffs: !data.hasMortgage ? [{ id: '1', lenderName: '', amount: 0 }] : [] })}
                  className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${data.hasMortgage ? 'bg-brand-teal' : 'bg-slate-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${data.hasMortgage ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {data.hasMortgage && (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {data.mortgagePayoffs.map((payoff, idx) => (
                    <div key={payoff.id} className="p-5 border border-slate-100 rounded-[28px] bg-white shadow-sm space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                        <span>Lien #{idx + 1}</span>
                        {data.mortgagePayoffs.length > 1 && (
                          <button onClick={() => updateData({ mortgagePayoffs: data.mortgagePayoffs.filter(p => p.id !== payoff.id) })} className="text-red-400">REMOVE</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Lender Name" className="p-3 border rounded-xl text-sm" value={payoff.lenderName} onChange={e => updateData({ mortgagePayoffs: data.mortgagePayoffs.map(p => p.id === payoff.id ? {...p, lenderName: e.target.value} : p) })} />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                          <input placeholder="Approx. Payoff" className="w-full p-3 pl-7 border rounded-xl text-sm font-bold" value={formatAsUSD(payoff.amount)} onChange={e => updateData({ mortgagePayoffs: data.mortgagePayoffs.map(p => p.id === payoff.id ? {...p, amount: parseFloat(e.target.value.replace(/,/g, '')) || 0} : p) })} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => updateData({ mortgagePayoffs: [...data.mortgagePayoffs, {id: crypto.randomUUID(), lenderName: '', amount: 0}] })} className="w-full py-3 border-2 border-dashed border-slate-200 text-[10px] font-bold text-slate-400 rounded-2xl">+ ADD ANOTHER LIEN</button>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-display font-bold text-brand-primary uppercase tracking-tight">Commissions & Concessions</h2>
              
              <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Agent Commission (%)</label>
                  <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                    <button onClick={() => updateData({ commissionType: 'percent' })} className={`px-3 py-1 text-[10px] font-bold rounded-md ${data.commissionType === 'percent' ? 'bg-brand-primary text-white' : 'text-slate-400'}`}>%</button>
                    <button onClick={() => updateData({ commissionType: 'flat' })} className={`px-3 py-1 text-[10px] font-bold rounded-md ${data.commissionType === 'flat' ? 'bg-brand-primary text-white' : 'text-slate-400'}`}>$</button>
                  </div>
                </div>
                <div className="relative">
                  {data.commissionType === 'flat' && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">$</span>}
                  <input 
                    type="text" 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-2xl font-bold text-brand-primary outline-none focus:ring-2 focus:ring-brand-teal/10" 
                    value={data.commissionType === 'flat' ? formatAsUSD(data.commissionValue) : data.commissionValue}
                    onChange={e => updateData({ commissionValue: parseFloat(e.target.value.replace(/,/g, '')) || 0 })}
                  />
                  {data.commissionType === 'percent' && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">%</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <ConcessionInput label="Credit to Buyer" value={data.concessions} onChange={v => updateData({ concessions: v })} />
                 <ConcessionInput label="Home Warranty" value={data.homeWarranty} onChange={v => updateData({ homeWarranty: v })} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-display font-bold text-brand-primary uppercase tracking-tight">Closing & Taxes</h2>
              
              <div className="p-8 bg-brand-light/5 rounded-[40px] border border-brand-light/20">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[11px] font-bold text-brand-primary uppercase tracking-widest">Annual Property Taxes</label>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">Use Estimate</span>
                     <button onClick={() => setUseTaxEstimate(!useTaxEstimate)} className={`w-8 h-5 rounded-full relative flex items-center px-1 transition-colors ${useTaxEstimate ? 'bg-brand-primary' : 'bg-slate-300'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform ${useTaxEstimate ? 'translate-x-3' : 'translate-x-0'}`} />
                     </button>
                  </div>
                </div>

                <div className="relative mb-4">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">$</span>
                   <input 
                     type="text" 
                     className="w-full p-5 pl-10 bg-white border border-slate-200 rounded-2xl text-2xl font-bold text-slate-800 outline-none"
                     value={formatAsUSD(data.taxValue)}
                     onChange={e => updateData({ taxValue: parseFloat(e.target.value.replace(/,/g, '')) || 0 })}
                   />
                   {attomStatus === 'success' && (
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-50 text-green-600 text-[9px] font-bold px-2 py-1 rounded border border-green-100 uppercase">
                       Verified {data.taxYear || ''}
                     </span>
                   )}
                </div>

                <div className="space-y-3">
                   <Row label="Homestead Exemption" status={data.isHomestead ? 'active' : 'inactive'} />
                   <Row label="Proration Basis" value={new Date(data.closingDate).toLocaleDateString()} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Homeowner's Policy (PR-1.1)</label>
                    <button onClick={() => updateData({ isHomeownersPolicy: !data.isHomeownersPolicy })} className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${data.isHomeownersPolicy ? 'bg-brand-primary text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                      {data.isHomeownersPolicy ? 'Enabled (1.15x)' : 'Standard (1.0x)'}
                    </button>
                 </div>
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Reissue Credit (PR-4)</label>
                    <button onClick={() => updateData({ isReissueRate: !data.isReissueRate })} className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${data.isReissueRate ? 'bg-brand-teal text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                      {data.isReissueRate ? 'Active (-30%)' : 'None Available'}
                    </button>
                 </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex gap-3 no-print">
          {step > 1 && (
            <button onClick={handleBack} className="flex-1 py-5 border border-slate-200 text-slate-500 font-display font-bold rounded-[24px] hover:bg-slate-50 transition-all uppercase text-sm tracking-widest">Back</button>
          )}
          <button onClick={handleNext} disabled={!isValid()} className={`flex-[2] py-5 font-display font-bold rounded-[24px] transition-all shadow-xl shadow-brand-teal/20 uppercase text-sm tracking-widest ${isValid() ? 'bg-brand-teal text-white hover:bg-[#58b7b4]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            {step === 5 ? 'Finalize Estimate' : 'Next Step'}
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        Record Sync via <span className="text-brand-primary">ATTOM DATA SOLUTIONS</span>
      </p>
    </div>
  );

  function isValid() {
    if (step === 1) return data.salePrice > 0 && data.address !== '' && !addressError;
    return true;
  }
};

const Badge: React.FC<{ label: string; status: AttomStatus }> = ({ label, status }) => (
  <span className={`px-2 py-1 rounded-[6px] text-[9px] font-bold uppercase tracking-wider ${status === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : status === 'loading' ? 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse' : status === 'error' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
    {label}: {status === 'error' ? 'Error' : status === 'success' ? 'Connected' : status === 'loading' ? 'Syncing...' : 'Idle'}
  </span>
);

const StatCard: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">{label}</div>
    <div className="text-lg font-bold text-brand-primary">{value || '---'}</div>
  </div>
);

const ConcessionInput: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">{label}</label>
    <div className="relative">
       <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
       <input 
         type="text" 
         className="w-full bg-transparent pl-4 pb-1 border-b border-slate-200 font-bold text-brand-primary outline-none" 
         value={new Intl.NumberFormat('en-US').format(value) === '0' ? '' : new Intl.NumberFormat('en-US').format(value)}
         onChange={e => onChange(parseFloat(e.target.value.replace(/,/g, '')) || 0)}
       />
    </div>
  </div>
);

const Row: React.FC<{ label: string; status?: string; value?: string }> = ({ label, status, value }) => (
  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
    <span className="text-slate-400">{label}</span>
    {status ? (
      <span className={status === 'active' ? 'text-green-600' : 'text-slate-300'}>{status}</span>
    ) : (
      <span className="text-brand-primary">{value}</span>
    )}
  </div>
);

export default CalculatorWizard;
