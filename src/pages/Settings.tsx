import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types/business';
import { getSettings, saveSettings } from '../services/storageService';
import toast from 'react-hot-toast';
import { Settings2, Save } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    invoicePrefix: 'INV',
    invoiceStartNumber: 1,
    nextInvoiceNumber: 1,
    currencyStyle: '₹amount.00',
    defaultTaxEnabled: false,
    defaultCgst: 9,
    defaultSgst: 9,
    defaultIgst: 18,
  });

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    toast.success('Settings saved!');
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-indigo-600" />
          Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">Configure invoice numbering and defaults</p>
      </div>

      <div className="space-y-6">
        {/* Invoice Numbering */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Invoice Numbering</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={e => setSettings(s => ({ ...s, invoicePrefix: e.target.value.toUpperCase() }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="INV"
              />
              <p className="text-xs text-gray-400 mt-1">e.g. INV, BILL, FAC</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Next Invoice Number</label>
              <input
                type="number"
                value={settings.nextInvoiceNumber}
                onChange={e => setSettings(s => ({ ...s, nextInvoiceNumber: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min={1}
              />
              <p className="text-xs text-gray-400 mt-1">Next invoice will be: {settings.invoicePrefix}-{String(settings.nextInvoiceNumber).padStart(4, '0')}</p>
            </div>
          </div>
        </div>

        {/* Currency Format */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Currency Format</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: '₹amount.00' as const, label: '₹1,00,000.00', desc: 'With decimals' },
              { val: '₹amount/-' as const, label: '1,00,000/-', desc: 'Traditional format' },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setSettings(s => ({ ...s, currencyStyle: opt.val }))}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  settings.currencyStyle === opt.val
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900 text-sm">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Default Tax */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Default Tax Settings</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setSettings(s => ({ ...s, defaultTaxEnabled: !s.defaultTaxEnabled }))}
                className={`relative w-10 h-6 rounded-full transition-colors ${settings.defaultTaxEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.defaultTaxEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-gray-600">Enable by default</span>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Default CGST (%)</label>
              <input
                type="number"
                value={settings.defaultCgst}
                onChange={e => setSettings(s => ({ ...s, defaultCgst: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min={0} max={100} step={0.5}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Default SGST (%)</label>
              <input
                type="number"
                value={settings.defaultSgst}
                onChange={e => setSettings(s => ({ ...s, defaultSgst: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min={0} max={100} step={0.5}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Default IGST (%)</label>
              <input
                type="number"
                value={settings.defaultIgst}
                onChange={e => setSettings(s => ({ ...s, defaultIgst: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min={0} max={100} step={0.5}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
