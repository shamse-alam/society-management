/**
 * Shared formatting utilities — Indian locale standards
 */

/**
 * Format a date string to "15 Apr 2026" (DD MMM YYYY)
 * @param {string|Date} value - ISO date string or Date object
 * @returns {string} Formatted date or '-' if invalid
 */
export function formatDate(value) {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format a number as Indian currency with ₹ symbol
 * Uses Indian comma grouping: ₹1,50,000
 * @param {number|string} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const n = Number(amount);
  if (isNaN(n)) return '₹0';
  return '₹' + n.toLocaleString('en-IN');
}

/**
 * Format a number with Indian comma grouping (no currency symbol)
 * @param {number|string} n
 * @returns {string}
 */
export function formatNumber(n) {
  const num = Number(n);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}

/**
 * Format a vehicle registration number with standard Indian spacing
 * "KA01AB1234" → "KA 01 AB 1234"
 * @param {string} num
 * @returns {string}
 */
export function formatVehicleNumber(num) {
  if (!num) return '-';
  // Remove existing spaces/hyphens, uppercase
  const clean = num.replace(/[\s-]/g, '').toUpperCase();
  // Match Indian format: XX 00 XX(X) 0000
  const match = clean.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/);
  if (match) return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  return num.toUpperCase();
}
