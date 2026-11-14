/**
 * Safe number parsing and currency formatting utilities.
 * Ensures no NaN, undefined, or malformed strings leak into UI displays.
 */

/**
 * Parses any value into a finite number, returning a fallback if invalid.
 * Handles numbers, formatted strings (e.g., "₹ 85,000.50", "1,200"), null, undefined, NaN, Infinity.
 */
export function parseSafeNumber(val: unknown, fallback: number | null = null): number | null {
  if (val === null || val === undefined) {
    return fallback;
  }

  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : fallback;
  }

  if (typeof val === 'string') {
    const cleaned = val.replace(/[₹$,\s]/g, '').trim();
    if (cleaned === '') {
      return fallback;
    }
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

/**
 * Formats a value as Indian Rupee currency (e.g., "₹85,000"), or a safe fallback string.
 * Never outputs "₹NaN" or "NaN".
 */
export function formatCurrency(
  val: unknown,
  fallback: string = 'No data yet',
  options: { showSymbol?: boolean; locale?: string } = {}
): string {
  const { showSymbol = true, locale = 'en-IN' } = options;
  const num = parseSafeNumber(val, null);

  if (num === null) {
    return fallback;
  }

  const rounded = Math.round(num);
  const formatted = rounded.toLocaleString(locale);
  return showSymbol ? `₹${formatted}` : formatted;
}

/**
 * Formats a value to fixed decimal places, or a safe fallback string.
 * Never outputs "NaN".
 */
export function formatNumber(
  val: unknown,
  decimals: number = 0,
  fallback: string = 'No data yet'
): string {
  const num = parseSafeNumber(val, null);

  if (num === null) {
    return fallback;
  }

  return num.toFixed(decimals);
}
