import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Invoice, LineItem, TaxConfig, DiscountConfig } from '../types/invoice';
import {
  getBusinessProfile, getBankDetails, getSignatureInfo,
  getSettings, saveInvoice, generateInvoiceNumber, getInvoice, isInvoiceNumberTaken
} from '../services/storageService';
import { calculateTotals } from '../utils/invoiceCalculator';
import { validateInvoice } from '../utils/validation';
import { generatePDFFromElement } from '../services/pdfService';
import InvoicePreview from '../components/InvoicePreview/InvoicePreview';
import LineItemsTable from '../components/InvoiceForm/LineItemsTable';
import toast from 'react-hot-toast';
import {
  Save, Download, Printer, Eye, EyeOff, ChevronDown, ChevronUp, X, Check
} from 'lucide-react';

interface CreateInvoiceProps {
  editId?: string | null;
  onBack: () => void;
}

function buildDefaultInvoice(editId?: string | null): Invoice {
  const settings = getSettings();
  const business = getBusinessProfile();
  const bank = getBankDetails();
  const sig = getSignatureInfo();
  const now = new Date().toISOString().split('T')[0];

  if (editId) {
    const existing = getInvoice(editId);
    if (existing) return existing;
  }

  const invoiceNum = generateInvoiceNumber();

  return {
    id: crypto.randomUUID(),
    invoiceNumber: invoiceNum,
    invoiceDate: now,
    dueDate: '',
    placeOfSupply: '',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currencyStyle: settings.currencyStyle,
    notes: '',
    business: {
      name: business?.name || '',
      subtitle: business?.subtitle || '',
      address: business?.address || '',
      city: business?.city || '',
      state: business?.state || '',
      pinCode: business?.pinCode || '',
      phone1: business?.phone1 || '',
      phone2: business?.phone2 || '',
      email: business?.email || '',
      pan: business?.pan || '',
      gst: business?.gst || '',
      proprietorName: business?.proprietorName || '',
      logo: business?.logo || null,
    },
    customer: {
      name: '', address: '', city: '', state: '', pinCode: '',
      phone: '', email: '', pan: '', gst: '',
    },
    bank: {
      bankName: bank?.bankName || '',
      accountHolderName: bank?.accountHolderName || '',
      accountNumber: bank?.accountNumber || '',
      branch: bank?.branch || '',
      ifscCode: bank?.ifscCode || '',
      upiId: bank?.upiId || '',
    },
    signature: {
      image: sig?.image || null,
      authorizedName: sig?.authorizedName || '',
      designation: sig?.designation || '',
    },
    items: [],
    tax: {
      enabled: settings.defaultTaxEnabled,
      cgst: settings.defaultCgst,
      sgst: settings.defaultSgst,
      igst: settings.defaultIgst,
    },
    discount: {
      enabled: false,
      type: 'percentage',
      value: 0,
    },
    totals: {
      subtotal: 0, discountAmount: 0, taxableAmount: 0,
      cgstAmount: 0, sgstAmount: 0, igstAmount: 0, grandTotal: 0,
    },
  };
}

const SectionCard: React.FC<{ title: string; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean }> = ({
  title, children, collapsible = false, defaultOpen = true
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200"
        onClick={() => collapsible && setOpen(o => !o)}
        disabled={!collapsible}
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        {collapsible && (open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />)}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
};

const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; halfWidth?: boolean;
}> = ({ label, value, onChange, placeholder, type = 'text', required, halfWidth }) => (
  <div className={halfWidth ? 'col-span-1' : ''}>
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

// Scaled preview component
const PreviewScaled: React.FC<{ invoice: Invoice; previewRef: React.RefObject<HTMLDivElement | null> }> = ({ invoice, previewRef }) => {
  const [scale, setScale] = useState(0.75);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 32; // 16px padding each side
        const newScale = Math.min(containerWidth / 794, 1);
        setScale(newScale);
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="py-4 flex justify-center">
      <div style={{ width: `${794 * scale}px`, flexShrink: 0 }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: '794px' }}>
          <InvoicePreview ref={previewRef} invoice={invoice} />
        </div>
      </div>
    </div>
  );
};

const MobilePreviewScaled: React.FC<{ invoice: Invoice }> = ({ invoice }) => {
  const [scale, setScale] = useState(0.4);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth - 16;
        setScale(Math.min(w / 794, 1));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div ref={containerRef} className="p-2">
      <div style={{ width: `${794 * scale}px` }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: '794px' }}>
          <InvoicePreview invoice={invoice} />
        </div>
      </div>
    </div>
  );
};

const CreateInvoice: React.FC<CreateInvoiceProps> = ({ editId, onBack }) => {
  const [invoice, setInvoice] = useState<Invoice>(() => buildDefaultInvoice(editId));
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const isEditing = !!editId;

  // Recalculate totals whenever items, tax, or discount change
  const updateTotals = useCallback((inv: Invoice) => {
    const totals = calculateTotals(inv.items, inv.tax, inv.discount);
    return { ...inv, totals };
  }, []);

  const setInvoiceAndRecalc = useCallback((updater: (prev: Invoice) => Invoice) => {
    setInvoice(prev => {
      const updated = updater(prev);
      return updateTotals(updated);
    });
  }, [updateTotals]);

  useEffect(() => {
    setInvoice(updateTotals(invoice));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleItemsChange = (items: LineItem[]) => {
    setInvoiceAndRecalc(prev => ({ ...prev, items }));
  };

  const handleTaxChange = (tax: TaxConfig) => {
    setInvoiceAndRecalc(prev => ({ ...prev, tax }));
  };

  const handleDiscountChange = (discount: DiscountConfig) => {
    setInvoiceAndRecalc(prev => ({ ...prev, discount }));
  };

  const handleSave = async (status: 'draft' | 'saved' = 'saved') => {
    const errs = validateInvoice(invoice);
    if (errs.length > 0) {
      setErrors(errs.map(e => e.message));
      toast.error('Please fix validation errors');
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      const toSave = { ...invoice, status, updatedAt: new Date().toISOString() };
      saveInvoice(toSave);
      setInvoice(toSave);
      toast.success(status === 'draft' ? 'Draft saved!' : isEditing ? 'Invoice updated!' : 'Invoice saved!');
      if (status === 'saved') setTimeout(onBack, 800);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    const errs = validateInvoice(invoice);
    if (errs.length > 0) {
      setErrors(errs.map(e => e.message));
      toast.error('Please fix errors before generating PDF');
      return;
    }
    setErrors([]);
    setGeneratingPdf(true);

    // Always use hidden render area for consistent PDF output
    const el = document.getElementById('pdf-hidden-render');
    const inner = el?.querySelector('#invoice-preview-content') as HTMLElement | null;

    try {
      if (!inner && !el) throw new Error('PDF render element not found');
      await generatePDFFromElement(inner || el!, `${invoice.invoiceNumber}.pdf`);
      toast.success('PDF downloaded!');
    } catch (e) {
      toast.error('PDF generation failed. Please try again.');
      console.error(e);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleReloadProfile = () => {
    const business = getBusinessProfile();
    const bank = getBankDetails();
    const sig = getSignatureInfo();
    setInvoice(prev => ({
      ...prev,
      business: {
        name: business?.name || prev.business.name,
        subtitle: business?.subtitle || prev.business.subtitle,
        address: business?.address || prev.business.address,
        city: business?.city || prev.business.city,
        state: business?.state || prev.business.state,
        pinCode: business?.pinCode || prev.business.pinCode,
        phone1: business?.phone1 || prev.business.phone1,
        phone2: business?.phone2 || prev.business.phone2,
        email: business?.email || prev.business.email,
        pan: business?.pan || prev.business.pan,
        gst: business?.gst || prev.business.gst,
        proprietorName: business?.proprietorName || prev.business.proprietorName,
        logo: business?.logo || prev.business.logo,
      },
      bank: {
        bankName: bank?.bankName || prev.bank.bankName,
        accountHolderName: bank?.accountHolderName || prev.bank.accountHolderName,
        accountNumber: bank?.accountNumber || prev.bank.accountNumber,
        branch: bank?.branch || prev.bank.branch,
        ifscCode: bank?.ifscCode || prev.bank.ifscCode,
        upiId: bank?.upiId || prev.bank.upiId,
      },
      signature: {
        image: sig?.image || prev.signature.image,
        authorizedName: sig?.authorizedName || prev.signature.authorizedName,
        designation: sig?.designation || prev.signature.designation,
      },
    }));
    toast.success('Business profile reloaded');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleInvoiceNumberChange = (num: string) => {
    const taken = isInvoiceNumberTaken(num, invoice.id);
    if (taken) toast.error('This invoice number is already in use');
    setInvoice(prev => ({ ...prev, invoiceNumber: num }));
  };

  const totals = invoice.totals;
  const hasTax = invoice.tax.enabled && (invoice.tax.cgst > 0 || invoice.tax.sgst > 0 || invoice.tax.igst > 0);
  const hasDiscount = invoice.discount.enabled && invoice.discount.value > 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      {/* Top Bar */}
      <div className="no-print bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-800 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900">{isEditing ? 'Edit Invoice' : 'New Invoice'}</h1>
            <p className="text-xs text-gray-500">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(s => !s)}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Draft</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={generatingPdf}
            className="flex items-center gap-1.5 px-3 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm hover:bg-blue-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{generatingPdf ? 'Generating...' : 'PDF'}</span>
          </button>
          <button
            onClick={() => handleSave('saved')}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Saving...' : isEditing ? 'Update' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="no-print bg-red-50 border-b border-red-200 px-4 py-2 flex-shrink-0">
          <ul className="text-red-700 text-xs space-y-0.5">
            {errors.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Form Panel */}
        <div className={`${showPreview ? 'hidden md:block md:w-1/2' : 'w-full'} overflow-y-auto p-4 no-print`}>

          {/* Invoice Info */}
          <SectionCard title="Invoice Information">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Invoice Number<span className="text-red-500 ml-0.5">*</span></label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={e => handleInvoiceNumberChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Invoice Date<span className="text-red-500 ml-0.5">*</span></label>
                <input
                  type="date"
                  value={invoice.invoiceDate}
                  onChange={e => setInvoice(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                <input
                  type="date"
                  value={invoice.dueDate}
                  onChange={e => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Place of Supply</label>
                <input
                  type="text"
                  value={invoice.placeOfSupply}
                  onChange={e => setInvoice(prev => ({ ...prev, placeOfSupply: e.target.value }))}
                  placeholder="e.g. Maharashtra"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Currency Format</label>
                <div className="flex gap-2">
                  {(['₹amount.00', '₹amount/-'] as const).map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setInvoice(prev => ({ ...prev, currencyStyle: style }))}
                      className={`flex-1 py-1.5 text-xs rounded-lg border-2 font-medium transition-all ${
                        invoice.currencyStyle === style ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {style === '₹amount.00' ? '₹1,00,000.00' : '1,00,000/-'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Customer Info */}
          <SectionCard title="Customer / Bill To">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Customer Name" required value={invoice.customer.name}
                  onChange={v => setInvoice(p => ({ ...p, customer: { ...p.customer, name: v } }))}
                  placeholder="Customer or company name" />
              </div>
              <div className="col-span-2">
                <Field label="Address" value={invoice.customer.address}
                  onChange={v => setInvoice(p => ({ ...p, customer: { ...p.customer, address: v } }))}
                  placeholder="Street address" />
              </div>
              <Field label="City" value={invoice.customer.city}
                onChange={v => setInvoice(p => ({ ...p, customer: { ...p.customer, city: v } }))} />
              <Field label="State" value={invoice.customer.state}
                onChange={v => setInvoice(p => ({ ...p, customer: { ...p.customer, state: v } }))} />
              <Field label="PIN Code" value={invoice.customer.pinCode}
                onChange={v => setInvoice(p => ({ ...p, customer: { ...p.customer, pinCode: v } }))} />
              <Field label="Phone" value={invoice.customer.phone} type="tel"
                onChange={v => setInvoice(p => ({ ...p, customer: { ...p.customer, phone: v } }))} />
              <div className="col-span-2">
                <Field label="Email" value={invoice.customer.email} type="email"
                  onChange={v => setInvoice(p => ({ ...p, customer: { ...p.customer, email: v } }))} />
              </div>
              <Field label="PAN" value={invoice.customer.pan}
                onChange={v => setInvoice(p => ({ ...p, customer: { ...p.customer, pan: v.toUpperCase() } }))}
                placeholder="ABCDE1234F" />
              <Field label="GST Number" value={invoice.customer.gst}
                onChange={v => setInvoice(p => ({ ...p, customer: { ...p.customer, gst: v.toUpperCase() } }))} />
            </div>
          </SectionCard>

          {/* From (Business) */}
          <SectionCard title="From (Business)" collapsible defaultOpen={false}>
            <button
              type="button"
              onClick={handleReloadProfile}
              className="mb-3 w-full text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg py-2 font-medium transition-colors"
            >
              ↻ Reload from Saved Business Profile
            </button>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Business Name" required value={invoice.business.name}
                  onChange={v => setInvoice(p => ({ ...p, business: { ...p.business, name: v } }))} />
              </div>
              <div className="col-span-2">
                <Field label="Subtitle / Profession" value={invoice.business.subtitle}
                  onChange={v => setInvoice(p => ({ ...p, business: { ...p.business, subtitle: v } }))} />
              </div>
              <div className="col-span-2">
                <Field label="Address" value={invoice.business.address}
                  onChange={v => setInvoice(p => ({ ...p, business: { ...p.business, address: v } }))} />
              </div>
              <Field label="City" value={invoice.business.city}
                onChange={v => setInvoice(p => ({ ...p, business: { ...p.business, city: v } }))} />
              <Field label="State" value={invoice.business.state}
                onChange={v => setInvoice(p => ({ ...p, business: { ...p.business, state: v } }))} />
              <Field label="Phone 1" value={invoice.business.phone1} type="tel"
                onChange={v => setInvoice(p => ({ ...p, business: { ...p.business, phone1: v } }))} />
              <Field label="PAN" value={invoice.business.pan}
                onChange={v => setInvoice(p => ({ ...p, business: { ...p.business, pan: v.toUpperCase() } }))} />
              <Field label="GST" value={invoice.business.gst}
                onChange={v => setInvoice(p => ({ ...p, business: { ...p.business, gst: v.toUpperCase() } }))} />
            </div>
          </SectionCard>

          {/* Line Items */}
          <SectionCard title="Line Items">
            <LineItemsTable items={invoice.items} onChange={handleItemsChange} />
          </SectionCard>

          {/* Discount & Tax */}
          <SectionCard title="Discount & Tax" collapsible defaultOpen={true}>
            {/* Discount */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Discount</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => handleDiscountChange({ ...invoice.discount, enabled: !invoice.discount.enabled })}
                    className={`relative w-9 h-5 rounded-full transition-colors ${invoice.discount.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${invoice.discount.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-gray-500">Enable</span>
                </label>
              </div>
              {invoice.discount.enabled && (
                <div className="flex gap-2">
                  <select
                    value={invoice.discount.type}
                    onChange={e => handleDiscountChange({ ...invoice.discount, type: e.target.value as 'percentage' | 'fixed' })}
                    className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">₹ Fixed</option>
                  </select>
                  <input
                    type="number"
                    value={invoice.discount.value}
                    onChange={e => handleDiscountChange({ ...invoice.discount, value: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                    placeholder="0"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Tax */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">GST / Tax</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => handleTaxChange({ ...invoice.tax, enabled: !invoice.tax.enabled })}
                    className={`relative w-9 h-5 rounded-full transition-colors ${invoice.tax.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${invoice.tax.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-gray-500">Enable</span>
                </label>
              </div>
              {invoice.tax.enabled && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'CGST (%)', key: 'cgst' as const },
                    { label: 'SGST (%)', key: 'sgst' as const },
                    { label: 'IGST (%)', key: 'igst' as const },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-600 mb-1">{label}</label>
                      <input
                        type="number"
                        value={invoice.tax[key]}
                        onChange={e => handleTaxChange({ ...invoice.tax, [key]: parseFloat(e.target.value) || 0 })}
                        min={0} max={100} step={0.5}
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals Summary */}
            <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>- ₹{totals.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {(hasTax || hasDiscount) && (
                  <div className="flex justify-between text-gray-600">
                    <span>Taxable Amount</span>
                    <span>₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {hasTax && invoice.tax.cgst > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>CGST ({invoice.tax.cgst}%)</span>
                    <span>₹{totals.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {hasTax && invoice.tax.sgst > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>SGST ({invoice.tax.sgst}%)</span>
                    <span>₹{totals.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {hasTax && invoice.tax.igst > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>IGST ({invoice.tax.igst}%)</span>
                    <span>₹{totals.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200 mt-1">
                  <span>Grand Total</span>
                  <span>₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Notes */}
          <SectionCard title="Notes" collapsible defaultOpen={false}>
            <textarea
              value={invoice.notes}
              onChange={e => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes, terms, payment instructions..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </SectionCard>

          {/* Bank Details */}
          <SectionCard title="Bank Details" collapsible defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Bank Name" value={invoice.bank.bankName}
                  onChange={v => setInvoice(p => ({ ...p, bank: { ...p.bank, bankName: v } }))} />
              </div>
              <div className="col-span-2">
                <Field label="Account Holder Name" value={invoice.bank.accountHolderName}
                  onChange={v => setInvoice(p => ({ ...p, bank: { ...p.bank, accountHolderName: v } }))} />
              </div>
              <div className="col-span-2">
                <Field label="Account Number" value={invoice.bank.accountNumber}
                  onChange={v => setInvoice(p => ({ ...p, bank: { ...p.bank, accountNumber: v } }))} />
              </div>
              <Field label="Branch" value={invoice.bank.branch}
                onChange={v => setInvoice(p => ({ ...p, bank: { ...p.bank, branch: v } }))} />
              <Field label="IFSC Code" value={invoice.bank.ifscCode}
                onChange={v => setInvoice(p => ({ ...p, bank: { ...p.bank, ifscCode: v.toUpperCase() } }))} />
              <div className="col-span-2">
                <Field label="UPI ID" value={invoice.bank.upiId}
                  onChange={v => setInvoice(p => ({ ...p, bank: { ...p.bank, upiId: v } }))} />
              </div>
            </div>
          </SectionCard>

          {/* Signature */}
          <SectionCard title="Signature" collapsible defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Authorized Person Name" value={invoice.signature.authorizedName}
                  onChange={v => setInvoice(p => ({ ...p, signature: { ...p.signature, authorizedName: v } }))} />
              </div>
              <div className="col-span-2">
                <Field label="Designation" value={invoice.signature.designation}
                  onChange={v => setInvoice(p => ({ ...p, signature: { ...p.signature, designation: v } }))} />
              </div>
            </div>
          </SectionCard>

          {/* Mobile Preview Button */}
          <div className="md:hidden mt-4 mb-8">
            <button
              onClick={() => setShowPreview(s => !s)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              {showPreview ? 'Hide' : 'Show'} Invoice Preview
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="flex-1 overflow-y-auto bg-slate-300 hidden md:block" style={{ minWidth: 0 }}>
            <div className="sticky top-0 z-10 bg-slate-300 px-4 py-2 flex items-center justify-between border-b border-slate-400">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Live Preview</span>
              <span className="text-xs text-slate-500">A4 Portrait • 1:0.75 scale</span>
            </div>
            <PreviewScaled invoice={invoice} previewRef={previewRef} />
          </div>
        )}

        {/* Mobile Preview */}
        {showPreview && (
          <div className="md:hidden fixed inset-0 bg-slate-300 z-40 overflow-y-auto no-print">
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-50 shadow-sm">
              <span className="font-semibold text-gray-800 text-sm">Invoice Preview</span>
              <button onClick={() => setShowPreview(false)} className="p-1.5 text-gray-500 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <MobilePreviewScaled invoice={invoice} />
          </div>
        )}
      </div>

      {/* Print-only area */}
      <div className="print-only hidden" style={{ position: 'fixed', top: 0, left: 0, width: '794px', zIndex: 9999, background: 'white' }}>
        <InvoicePreview invoice={invoice} forPrint />
      </div>

      {/* Hidden PDF render area (always in DOM for PDF export) */}
      <div
        id="pdf-hidden-render"
        style={{ position: 'absolute', top: '-99999px', left: '0', width: '794px', zIndex: -1, background: 'white' }}
        aria-hidden="true"
      >
        <InvoicePreview invoice={invoice} />
      </div>
    </div>
  );
};

export default CreateInvoice;
