import React, { useState, useRef, useEffect } from 'react';
import { BusinessProfile as BusinessProfileType, BankDetails, SignatureInfo } from '../types/business';
import {
  getBusinessProfile, saveBusinessProfile,
  getBankDetails, saveBankDetails,
  getSignatureInfo, saveSignatureInfo,
} from '../services/storageService';
import { compressImage, compressSignature } from '../utils/imageUtils';
import toast from 'react-hot-toast';
import { Building2, CreditCard, PenTool, Upload, X, Save } from 'lucide-react';

const DEFAULT_BUSINESS: BusinessProfileType = {
  name: '', subtitle: '', address: '', city: '', state: '', pinCode: '',
  phone1: '', phone2: '', email: '', pan: '', gst: '', proprietorName: '', logo: null,
};

const DEFAULT_BANK: BankDetails = {
  bankName: '', accountHolderName: '', accountNumber: '', branch: '', ifscCode: '', upiId: '',
};

const DEFAULT_SIG: SignatureInfo = {
  image: null, authorizedName: '', designation: '',
};

const FormField: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}> = ({ label, value, onChange, placeholder, required, type = 'text' }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    />
  </div>
);

const BusinessProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<BusinessProfileType>(DEFAULT_BUSINESS);
  const [bank, setBank] = useState<BankDetails>(DEFAULT_BANK);
  const [sig, setSig] = useState<SignatureInfo>(DEFAULT_SIG);
  const [activeTab, setActiveTab] = useState<'business' | 'bank' | 'signature'>('business');
  const logoRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = getBusinessProfile();
    if (p) setProfile(p);
    const b = getBankDetails();
    if (b) setBank(b);
    const s = getSignatureInfo();
    if (s) setSig(s);
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpg', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Please upload PNG, JPG, JPEG, or WebP');
      return;
    }
    try {
      const compressed = await compressImage(file);
      setProfile(p => ({ ...p, logo: compressed }));
      toast.success('Logo uploaded');
    } catch {
      toast.error('Failed to process image');
    }
    e.target.value = '';
  };

  const handleSigUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpg', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Please upload PNG, JPG, JPEG, or WebP');
      return;
    }
    try {
      const compressed = await compressSignature(file);
      setSig(s => ({ ...s, image: compressed }));
      toast.success('Signature uploaded');
    } catch {
      toast.error('Failed to process image');
    }
    e.target.value = '';
  };

  const handleSaveBusiness = () => {
    if (!profile.name.trim()) { toast.error('Business name is required'); return; }
    saveBusinessProfile(profile);
    toast.success('Business profile saved!');
  };

  const handleSaveBank = () => {
    saveBankDetails(bank);
    toast.success('Bank details saved!');
  };

  const handleSaveSignature = () => {
    saveSignatureInfo(sig);
    toast.success('Signature saved!');
  };

  const tabs = [
    { id: 'business' as const, label: 'Business Info', icon: Building2 },
    { id: 'bank' as const, label: 'Bank Details', icon: CreditCard },
    { id: 'signature' as const, label: 'Signature', icon: PenTool },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Set up your business information used across all invoices</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Business Info Tab */}
      {activeTab === 'business' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Logo */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Business Logo</label>
            <div className="flex items-start gap-4">
              <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                {profile.logo ? (
                  <img src={profile.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center">
                    <Building2 className="w-6 h-6 text-gray-300 mx-auto" />
                    <span className="text-xs text-gray-400 mt-1 block">No logo</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={logoRef} type="file" accept="image/png,image/jpg,image/jpeg,image/webp" onChange={handleLogoUpload} className="hidden" />
                <button onClick={() => logoRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100">
                  <Upload className="w-4 h-4" />
                  {profile.logo ? 'Replace Logo' : 'Upload Logo'}
                </button>
                {profile.logo && (
                  <button onClick={() => setProfile(p => ({ ...p, logo: null }))} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">
                    <X className="w-4 h-4" />
                    Remove Logo
                  </button>
                )}
                <p className="text-xs text-gray-400">PNG, JPG, WebP. Max recommended: 1MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Business / Company Name" value={profile.name} onChange={v => setProfile(p => ({ ...p, name: v }))} placeholder="e.g. ABC Furniture Works" required />
            </div>
            <div className="sm:col-span-2">
              <FormField label="Business Subtitle / Profession" value={profile.subtitle} onChange={v => setProfile(p => ({ ...p, subtitle: v }))} placeholder="e.g. Furniture Work & Contractor" />
            </div>
            <div className="sm:col-span-2">
              <FormField label="Address" value={profile.address} onChange={v => setProfile(p => ({ ...p, address: v }))} placeholder="Street address" />
            </div>
            <FormField label="City" value={profile.city} onChange={v => setProfile(p => ({ ...p, city: v }))} placeholder="City" />
            <FormField label="State" value={profile.state} onChange={v => setProfile(p => ({ ...p, state: v }))} placeholder="State" />
            <FormField label="PIN Code" value={profile.pinCode} onChange={v => setProfile(p => ({ ...p, pinCode: v }))} placeholder="PIN Code" />
            <FormField label="Phone Number 1" value={profile.phone1} onChange={v => setProfile(p => ({ ...p, phone1: v }))} placeholder="+91 98765 43210" type="tel" />
            <FormField label="Phone Number 2" value={profile.phone2} onChange={v => setProfile(p => ({ ...p, phone2: v }))} placeholder="Optional" type="tel" />
            <div className="sm:col-span-2">
              <FormField label="Email" value={profile.email} onChange={v => setProfile(p => ({ ...p, email: v }))} placeholder="business@email.com" type="email" />
            </div>
            <FormField label="PAN Number" value={profile.pan} onChange={v => setProfile(p => ({ ...p, pan: v.toUpperCase() }))} placeholder="ABCDE1234F" />
            <FormField label="GST Number (Optional)" value={profile.gst} onChange={v => setProfile(p => ({ ...p, gst: v.toUpperCase() }))} placeholder="27ABCDE1234F1Z5" />
            <div className="sm:col-span-2">
              <FormField label="Proprietor / Owner Name" value={profile.proprietorName} onChange={v => setProfile(p => ({ ...p, proprietorName: v }))} placeholder="Owner's full name" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleSaveBusiness} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
              <Save className="w-4 h-4" />
              Save Business Profile
            </button>
          </div>
        </div>
      )}

      {/* Bank Details Tab */}
      {activeTab === 'bank' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Bank Name" value={bank.bankName} onChange={v => setBank(b => ({ ...b, bankName: v }))} placeholder="e.g. State Bank of India" />
            </div>
            <div className="sm:col-span-2">
              <FormField label="Account Holder Name" value={bank.accountHolderName} onChange={v => setBank(b => ({ ...b, accountHolderName: v }))} placeholder="Name as per bank records" />
            </div>
            <div className="sm:col-span-2">
              <FormField label="Account Number" value={bank.accountNumber} onChange={v => setBank(b => ({ ...b, accountNumber: v }))} placeholder="Bank account number" />
            </div>
            <FormField label="Branch" value={bank.branch} onChange={v => setBank(b => ({ ...b, branch: v }))} placeholder="Branch name/city" />
            <FormField label="IFSC Code" value={bank.ifscCode} onChange={v => setBank(b => ({ ...b, ifscCode: v.toUpperCase() }))} placeholder="SBIN0001234" />
            <div className="sm:col-span-2">
              <FormField label="UPI ID (Optional)" value={bank.upiId} onChange={v => setBank(b => ({ ...b, upiId: v }))} placeholder="yourname@upi" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleSaveBank} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
              <Save className="w-4 h-4" />
              Save Bank Details
            </button>
          </div>
        </div>
      )}

      {/* Signature Tab */}
      {activeTab === 'signature' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Signature Image</label>
            <div className="flex items-start gap-4">
              <div className="w-48 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                {sig.image ? (
                  <img src={sig.image} alt="Signature" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center">
                    <PenTool className="w-6 h-6 text-gray-300 mx-auto" />
                    <span className="text-xs text-gray-400 mt-1 block">No signature</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={sigRef} type="file" accept="image/png,image/jpg,image/jpeg,image/webp" onChange={handleSigUpload} className="hidden" />
                <button onClick={() => sigRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100">
                  <Upload className="w-4 h-4" />
                  {sig.image ? 'Replace Signature' : 'Upload Signature'}
                </button>
                {sig.image && (
                  <button onClick={() => setSig(s => ({ ...s, image: null }))} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                )}
                <p className="text-xs text-gray-400">Tip: Use white/transparent background PNG</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Authorized Person Name" value={sig.authorizedName} onChange={v => setSig(s => ({ ...s, authorizedName: v }))} placeholder="e.g. Vikesh Pipare" />
            </div>
            <div className="sm:col-span-2">
              <FormField label="Designation" value={sig.designation} onChange={v => setSig(s => ({ ...s, designation: v }))} placeholder="e.g. Proprietor / Manager" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleSaveSignature} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
              <Save className="w-4 h-4" />
              Save Signature
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessProfilePage;
