/**
 * Format a number using the Indian numbering system (lakhs, crores)
 * Returns string like "2,28,276.00"
 */
export function formatIndianNumber(num: number): string {
  if (isNaN(num) || !isFinite(num)) return '0.00';

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Get 2 decimal places
  const fixed = absNum.toFixed(2);
  const [intStr, decStr] = fixed.split('.');

  // Format integer part with Indian grouping
  const formatted = formatIndianInt(intStr);

  return (isNegative ? '-' : '') + formatted + '.' + decStr;
}

function formatIndianInt(intStr: string): string {
  if (intStr.length <= 3) return intStr;

  // Last 3 digits
  const last3 = intStr.slice(-3);
  const rest = intStr.slice(0, -3);

  if (rest.length === 0) return last3;

  // Remaining digits grouped in 2s from right
  const groups: string[] = [];
  let i = rest.length;
  while (i > 0) {
    const start = Math.max(0, i - 2);
    groups.unshift(rest.slice(start, i));
    i = start;
  }

  return groups.join(',') + ',' + last3;
}

/**
 * Format as currency with ₹ prefix and Indian number formatting
 */
export function formatCurrencySymbol(amount: number): string {
  return '₹' + formatIndianNumber(amount);
}

/**
 * Format based on user's chosen style
 */
export function formatCurrency(amount: number, style: '₹amount.00' | '₹amount/-'): string {
  const formatted = formatIndianNumber(amount);
  if (style === '₹amount/-') {
    const intPart = formatted.split('.')[0];
    return intPart + '/-';
  }
  return '₹' + formatted;
}
