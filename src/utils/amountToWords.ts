const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
  'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function convertBelow100(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return tens[t] + (o > 0 ? ' ' + ones[o] : '');
}

function convertBelow1000(n: number): string {
  if (n === 0) return '';
  if (n < 100) return convertBelow100(n);
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (rem === 0) return ones[h] + ' Hundred';
  return ones[h] + ' Hundred and ' + convertBelow100(rem);
}

function convertToIndianWords(n: number): string {
  if (n === 0) return 'Zero';

  const parts: string[] = [];
  let num = Math.floor(n);

  // Crores (10,000,000+)
  if (num >= 10000000) {
    const crore = Math.floor(num / 10000000);
    parts.push(convertBelow1000(crore) + ' Crore');
    num = num % 10000000;
  }

  // Lakhs (100,000+)
  if (num >= 100000) {
    const lakh = Math.floor(num / 100000);
    parts.push(convertBelow100(lakh) + ' Lakh');
    num = num % 100000;
  }

  // Thousands
  if (num >= 1000) {
    const thousand = Math.floor(num / 1000);
    parts.push(convertBelow100(thousand) + ' Thousand');
    num = num % 1000;
  }

  // Hundreds and below
  if (num > 0) {
    parts.push(convertBelow1000(num));
  }

  return parts.filter(Boolean).join(' ');
}

export function amountToWords(amount: number): string {
  if (isNaN(amount) || amount < 0) return 'Invalid Amount';
  if (amount === 0) return 'Zero Rupees Only';

  // Round to 2 decimal places to avoid floating point issues
  const rounded = Math.round(amount * 100);
  const rupees = Math.floor(rounded / 100);
  const paise = rounded % 100;

  let words = '';

  if (rupees > 0) {
    words = convertToIndianWords(rupees) + ' Rupees';
  }

  if (paise > 0) {
    if (words) words += ' and ';
    words += convertToIndianWords(paise) + ' Paise';
  }

  if (!words) words = 'Zero Rupees';

  return words + ' Only';
}

export default amountToWords;
