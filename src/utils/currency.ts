/**
 * Financial & Currency Helpers
 * All monetary amounts are stored internally as integer paise (1 Rupee = 100 paise)
 * to eliminate IEEE-754 floating-point inaccuracies.
 */

/**
 * Format paise into Indian Rupee format (e.g., ₹1,25,000.50 or ₹500)
 */
export function formatPaise(
  paise: number,
  options?: {
    symbol?: string;
    showDecimalsIfZero?: boolean;
    useIndianFormat?: boolean;
  }
): string {
  const { symbol = '₹', showDecimalsIfZero = false, useIndianFormat = true } = options || {};

  if (!Number.isFinite(paise)) return `${symbol}0`;

  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupees = Math.floor(absPaise / 100);
  const remainderPaise = absPaise % 100;

  let rupeesFormatted = rupees.toString();
  if (useIndianFormat && rupees >= 1000) {
    // Indian Numbering System: Last 3 digits, then groups of 2 (e.g. 12,34,567)
    const lastThree = rupeesFormatted.slice(-3);
    const otherNumbers = rupeesFormatted.slice(0, -3);
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    rupeesFormatted = `${formattedOthers},${lastThree}`;
  } else {
    rupeesFormatted = rupees.toLocaleString('en-IN');
  }

  const sign = isNegative ? '-' : '';

  if (remainderPaise > 0 || showDecimalsIfZero) {
    const decimalPart = remainderPaise.toString().padStart(2, '0');
    return `${sign}${symbol}${rupeesFormatted}.${decimalPart}`;
  }

  return `${sign}${symbol}${rupeesFormatted}`;
}

/**
 * Safely converts Rupee string or number to integer paise
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const clean = rupees.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(clean);
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  }
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Converts paise to float rupees for editable input fields
 */
export function paiseToRupees(paise: number): number {
  if (!Number.isFinite(paise)) return 0;
  return Math.round(paise) / 100;
}
