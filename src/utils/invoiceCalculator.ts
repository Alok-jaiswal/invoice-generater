import { LineItem, TaxConfig, DiscountConfig, InvoiceTotals } from '../types/invoice';

export function calculateLineItem(quantity: number, rate: number): number {
  return Math.round(quantity * rate * 100) / 100;
}

export function calculateTotals(
  items: LineItem[],
  tax: TaxConfig,
  discount: DiscountConfig
): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

  let discountAmount = 0;
  if (discount.enabled && discount.value > 0) {
    if (discount.type === 'percentage') {
      discountAmount = Math.round(subtotal * discount.value) / 100;
    } else {
      discountAmount = Math.min(discount.value, subtotal);
    }
  }

  const taxableAmount = subtotal - discountAmount;

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (tax.enabled) {
    cgstAmount = Math.round(taxableAmount * tax.cgst) / 100;
    sgstAmount = Math.round(taxableAmount * tax.sgst) / 100;
    igstAmount = Math.round(taxableAmount * tax.igst) / 100;
  }

  const grandTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstAmount: Math.round(sgstAmount * 100) / 100,
    igstAmount: Math.round(igstAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}
