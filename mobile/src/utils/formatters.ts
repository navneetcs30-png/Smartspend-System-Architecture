/**
 * Indian Rupee Number Formatter for Mobile
 * Handles Indian comma grouping (e.g. ₹1,23,456.78)
 */
export const formatINR = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const parts = absVal.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  let result = '';
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${withCommas},${lastThree}.${decimalPart}`;
  } else {
    result = `${integerPart}.${decimalPart}`;
  }

  return isNegative ? `-₹${result}` : `₹${result}`;
};

export const formatPercent = (percent: number | null | undefined): string => {
  if (percent === null || percent === undefined || isNaN(percent)) return '0.0%';
  return `${percent.toFixed(1)}%`;
};

export const formatDate = (isoString?: string): string => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};
