export interface BusinessProfile {
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

export interface BankDetails {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branch: string;
  ifscCode: string;
  upiId: string;
}

export interface SignatureInfo {
  image: string | null;
  authorizedName: string;
  designation: string;
}

export interface AppSettings {
  invoicePrefix: string;
  invoiceStartNumber: number;
  nextInvoiceNumber: number;
  currencyStyle: '₹amount.00' | '₹amount/-';
  defaultTaxEnabled: boolean;
  defaultCgst: number;
  defaultSgst: number;
  defaultIgst: number;
}
