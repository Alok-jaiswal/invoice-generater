import { Invoice, LineItem } from '../types/invoice';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateInvoice(invoice: Partial<Invoice>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!invoice.business?.name?.trim()) {
    errors.push({ field: 'business.name', message: 'Business name is required' });
  }

  if (!invoice.customer?.name?.trim()) {
    errors.push({ field: 'customer.name', message: 'Customer name is required' });
  }

  if (!invoice.invoiceDate) {
    errors.push({ field: 'invoiceDate', message: 'Invoice date is required' });
  }

  if (!invoice.invoiceNumber?.trim()) {
    errors.push({ field: 'invoiceNumber', message: 'Invoice number is required' });
  }

  if (!invoice.items || invoice.items.length === 0) {
    errors.push({ field: 'items', message: 'At least one line item is required' });
  } else {
    invoice.items.forEach((item: LineItem, idx: number) => {
      if (!item.description?.trim()) {
        errors.push({ field: `items[${idx}].description`, message: `Item ${idx + 1}: Description is required` });
      }
      if (item.quantity <= 0) {
        errors.push({ field: `items[${idx}].quantity`, message: `Item ${idx + 1}: Quantity must be greater than 0` });
      }
      if (item.rate < 0) {
        errors.push({ field: `items[${idx}].rate`, message: `Item ${idx + 1}: Rate cannot be negative` });
      }
    });
  }

  if (invoice.discount?.enabled && (invoice.discount.value ?? 0) < 0) {
    errors.push({ field: 'discount.value', message: 'Discount cannot be negative' });
  }

  if (invoice.tax?.enabled) {
    if ((invoice.tax.cgst ?? 0) < 0 || (invoice.tax.cgst ?? 0) > 100) {
      errors.push({ field: 'tax.cgst', message: 'CGST must be between 0 and 100' });
    }
    if ((invoice.tax.sgst ?? 0) < 0 || (invoice.tax.sgst ?? 0) > 100) {
      errors.push({ field: 'tax.sgst', message: 'SGST must be between 0 and 100' });
    }
    if ((invoice.tax.igst ?? 0) < 0 || (invoice.tax.igst ?? 0) > 100) {
      errors.push({ field: 'tax.igst', message: 'IGST must be between 0 and 100' });
    }
  }

  return errors;
}
