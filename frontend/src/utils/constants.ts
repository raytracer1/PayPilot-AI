import type { Country } from "../types/api";

/** Country data (mirrors backend; used for immediate rendering before API call). */
export const COUNTRIES: Country[] = [
  { code: "MX", name: "Mexico", currency: "MXN", currency_symbol: "$", flag: "🇲🇽", off_ramps: [] },
  { code: "BR", name: "Brazil", currency: "BRL", currency_symbol: "R$", flag: "🇧🇷", off_ramps: [] },
  { code: "AR", name: "Argentina", currency: "ARS", currency_symbol: "$", flag: "🇦🇷", off_ramps: [] },
  { code: "CO", name: "Colombia", currency: "COP", currency_symbol: "$", flag: "🇨🇴", off_ramps: [] },
  { code: "CL", name: "Chile", currency: "CLP", currency_symbol: "$", flag: "🇨🇱", off_ramps: [] },
  { code: "PE", name: "Peru", currency: "PEN", currency_symbol: "S/", flag: "🇵🇪", off_ramps: [] },
];

export const SPEED_LABELS: Record<string, { label: string; desc: string }> = {
  fast: { label: "⚡ Fast", desc: "Prioritize speed over cost" },
  cheapest: { label: "💰 Cheapest", desc: "Minimize fees and spreads" },
  balanced: { label: "⚖️ Balanced", desc: "Best overall value" },
};

export const RISK_COLORS: Record<number, string> = {
  1: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  2: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  3: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  4: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  5: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};
