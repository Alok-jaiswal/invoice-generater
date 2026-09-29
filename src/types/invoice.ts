export interface LineItem {
  id: string;
  srNo: number;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface TaxConfig {
  enabled: boolean;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface DiscountConfig {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
}

export interface CustomerInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  email: string;
  pan: string;
  gst: string;
}

export interface BusinessSnapshot {
  name: string;
  subtitle: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone1: string;
  phone2: string;
  email: string;
  pan: string;
  gst: string;
  proprietorName: string;
  logo: string | null;
}

export interface BankSnapshot {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branch: string;
  ifscCode: string;
  upiId: string;
}

export interface SignatureSnapshot {
  image: string | null;
  authorizedName: string;
  designation: string;
}

export type InvoiceStatus = 'draft' | 'saved' | 'paid';

export interface CurrencyFormat {
  style: '₹amount.00' | '₹amount/-';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  placeOfSupply: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;

  business: BusinessSnapshot;
  customer: CustomerInfo;
  bank: BankSnapshot;
  signature: SignatureSnapshot;

  items: LineItem[];
  tax: TaxConfig;
  discount: DiscountConfig;
  totals: InvoiceTotals;

  currencyStyle: '₹amount.00' | '₹amount/-';
  notes: string;
}
