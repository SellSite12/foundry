const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND"]);

/** Formats integer cents as a localized currency string. */
export function formatMoney(cents: number, currency = "USD"): string {
  const divisor = ZERO_DECIMAL.has(currency) ? 1 : 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: ZERO_DECIMAL.has(currency) ? 0 : 2,
  }).format(cents / divisor);
}

/** Parses a user-entered amount ("19.99") into integer cents. */
export function toCents(amount: string | number): number {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}
