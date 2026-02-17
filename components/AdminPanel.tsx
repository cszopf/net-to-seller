
import React, { useState } from 'react';
import { DEFAULT_FEE_SCHEDULE } from '../constants';

const AdminPanel: React.FC = () => {
  const [schedule, setSchedule] = useState(DEFAULT_FEE_SCHEDULE);

  const save = () => {
    // In a real app, this would hit an API
    alert('Fee schedule updated successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-bold text-brand-primary">Admin Settings</h1>
        <button 
          onClick={save}
          className="bg-brand-primary text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-800 transition-all"
        >
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center">
            <span className="w-8 h-8 bg-blue-50 text-brand-primary rounded-lg flex items-center justify-center mr-3 text-sm">Fees</span>
            Standard Fee Schedule
          </h2>
          <div className="space-y-4">
            <Input label="Settlement Fee" value={schedule.settlementFee} onChange={v => setSchedule({...schedule, settlementFee: v})} />
            <Input label="Recording Fee" value={schedule.recordingFee} onChange={v => setSchedule({...schedule, recordingFee: v})} />
            <Input label="Document Prep" value={schedule.docPrepFee} onChange={v => setSchedule({...schedule, docPrepFee: v})} />
            <Input label="Courier/Wire Fee" value={schedule.courierFee} onChange={v => setSchedule({...schedule, courierFee: v})} />
            <Input label="Release Tracking" value={schedule.releaseTrackingFee} onChange={v => setSchedule({...schedule, releaseTrackingFee: v})} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center">
            <span className="w-8 h-8 bg-teal-50 text-brand-teal rounded-lg flex items-center justify-center mr-3 text-sm">Tax</span>
            Transfer Tax Rates
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Central Ohio Rate (per $1k)</label>
              <input 
                type="number" 
                step="0.1"
                className="w-full bg-transparent border-b border-slate-200 outline-none font-bold text-xl text-brand-primary"
                value={schedule.transferTaxRate}
                onChange={e => setSchedule({...schedule, transferTaxRate: parseFloat(e.target.value)})}
              />
            </div>
            <p className="text-xs text-slate-400 italic">
              Most Central Ohio counties use a 0.1% to 0.4% rate (1.00 to 4.00 per $1,000).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Input: React.FC<{ label: string; value: number; onChange: (val: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm font-medium text-slate-600">{label}</span>
    <div className="flex items-center border border-slate-200 rounded-lg px-3 py-1 bg-slate-50">
      <span className="text-slate-400 mr-1">$</span>
      <input 
        type="number" 
        className="w-20 bg-transparent outline-none font-bold text-right"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  </div>
);

export default AdminPanel;
