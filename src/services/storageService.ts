import { Invoice } from '../types/invoice';
import { BusinessProfile, BankDetails, SignatureInfo, AppSettings } from '../types/business';

const KEYS = {
  BUSINESS_PROFILE: 'invoicegen_business_profile',
  BANK_DETAILS: 'invoicegen_bank_details',
  SIGNATURE: 'invoicegen_signature',
  INVOICES: 'invoicegen_invoices',
  SETTINGS: 'invoicegen_settings',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('LocalStorage write error:', e);
    return false;
  }
}

// Business Profile
export function getBusinessProfile(): BusinessProfile | null {
  return safeGet<BusinessProfile | null>(KEYS.BUSINESS_PROFILE, null);
}

export function saveBusinessProfile(profile: BusinessProfile): boolean {
  return safeSet(KEYS.BUSINESS_PROFILE, profile);
}

// Bank Details
export function getBankDetails(): BankDetails | null {
  return safeGet<BankDetails | null>(KEYS.BANK_DETAILS, null);
}

export function saveBankDetails(details: BankDetails): boolean {
  return safeSet(KEYS.BANK_DETAILS, details);
}

// Signature
export function getSignatureInfo(): SignatureInfo | null {
  return safeGet<SignatureInfo | null>(KEYS.SIGNATURE, null);
}

export function saveSignatureInfo(sig: SignatureInfo): boolean {
  return safeSet(KEYS.SIGNATURE, sig);
}

// Invoices
export function getInvoices(): Invoice[] {
  return safeGet<Invoice[]>(KEYS.INVOICES, []);
}

export function getInvoice(id: string): Invoice | null {
  const invoices = getInvoices();
  return invoices.find(inv => inv.id === id) ?? null;
}

export function saveInvoice(invoice: Invoice): boolean {
  const invoices = getInvoices();
  const existing = invoices.findIndex(inv => inv.id === invoice.id);
  if (existing >= 0) {
    invoices[existing] = { ...invoice, updatedAt: new Date().toISOString() };
  } else {
    invoices.push({ ...invoice, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  return safeSet(KEYS.INVOICES, invoices);
}

export function deleteInvoice(id: string): boolean {
  const invoices = getInvoices().filter(inv => inv.id !== id);
  return safeSet(KEYS.INVOICES, invoices);
}

export function duplicateInvoice(id: string, newInvoiceNumber: string): Invoice | null {
  const original = getInvoice(id);
  if (!original) return null;
  const now = new Date().toISOString();
  const duplicate: Invoice = {
    ...original,
    id: crypto.randomUUID(),
    invoiceNumber: newInvoiceNumber,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
  saveInvoice(duplicate);
  return duplicate;
}

// Settings
const DEFAULT_SETTINGS: AppSettings = {
  invoicePrefix: 'INV',
  invoiceStartNumber: 1,
  nextInvoiceNumber: 1,
  currencyStyle: '₹amount.00',
  defaultTaxEnabled: false,
  defaultCgst: 9,
  defaultSgst: 9,
  defaultIgst: 18,
};

export function getSettings(): AppSettings {
  return safeGet<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): boolean {
  return safeSet(KEYS.SETTINGS, settings);
}

export function generateInvoiceNumber(): string {
  const settings = getSettings();
  const num = settings.nextInvoiceNumber;
  const padded = String(num).padStart(4, '0');
  const invoiceNum = `${settings.invoicePrefix}-${padded}`;
  // Increment the counter
  saveSettings({ ...settings, nextInvoiceNumber: num + 1 });
  return invoiceNum;
}

export function isInvoiceNumberTaken(num: string, excludeId?: string): boolean {
  const invoices = getInvoices();
  return invoices.some(inv => inv.invoiceNumber === num && inv.id !== excludeId);
}

const storageService = {
  getBusinessProfile,
  saveBusinessProfile,
  getBankDetails,
  saveBankDetails,
  getSignatureInfo,
  saveSignatureInfo,
  getInvoices,
  getInvoice,
  saveInvoice,
  deleteInvoice,
  duplicateInvoice,
  getSettings,
  saveSettings,
  generateInvoiceNumber,
  isInvoiceNumberTaken,
};

export default storageService;
