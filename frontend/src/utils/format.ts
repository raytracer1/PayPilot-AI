/** Format a number as USD currency. */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a number as compact (e.g., 1.2K, 3.4M). */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/** Format local currency amount with symbol. */
export function formatLocal(
  value: number,
  currency: string,
  symbol: string
): string {
  return `${symbol}${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} ${currency}`;
}

/** Format minutes into human-readable duration. */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  if (minutes === 1) return "1 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Format a percentage. */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Generate a short mock tx hash for display. */
export function shortHash(hash: string): string {
  if (!hash) return "";
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}
