import type { Trend } from "./osrs.server";

/**
 * Compact number formatting with at most one decimal place.
 *
 * Rules:
 * - Below 10,000: exact integer with comma thousands separator
 * - 10,000+: k / m / b with a single decimal (trailing ".0" stripped)
 * - Negatives: leading "-"
 */
export function formatCompact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";

  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);

  if (abs < 10_000) {
    return `${sign}${Math.round(abs).toLocaleString("en-US")}`;
  }

  let divisor: number;
  let suffix: string;

  if (abs >= 1_000_000_000) {
    divisor = 1_000_000_000;
    suffix = "b";
  } else if (abs >= 1_000_000) {
    divisor = 1_000_000;
    suffix = "m";
  } else {
    divisor = 1_000;
    suffix = "k";
  }

  let body = (abs / divisor).toFixed(1);
  if (body.endsWith(".0")) body = body.slice(0, -2);

  return `${sign}${body}${suffix}`;
}

/** Compact gold amounts. Null/undefined → "—". */
export function gp(n: number | null | undefined): string {
  return formatCompact(n);
}

/** Compact number for XP rates / costs. Always numeric (no Free+). */
export function compactNum(n: number): string {
  return formatCompact(n);
}

/** Your-cost display: always the real number (including negatives / zero). */
export function formatCost(v: number | null): string {
  if (v == null) return "—";
  return compactNum(v);
}

/** Hours to a skill target. Always one decimal, e.g. "12.4h". */
export function formatHours(h: number | null | undefined): string {
  if (h == null || !Number.isFinite(h)) return "—";
  const n = Math.max(0, h);
  return `${n.toFixed(1)}h`;
}

export type Signal = {
  label: string;
  token: "deal" | "fair" | "steep";
  rank: number;
};

/** Turns the range percentile into a plain buying recommendation. */
export function signalOf(trend?: Trend): Signal {
  if (!trend) return { label: "No data", token: "fair", rank: 2 };
  const p = trend.percentile;
  if (p <= 15) return { label: "Great buy", token: "deal", rank: 0 };
  if (p <= 35) return { label: "Cheap", token: "deal", rank: 1 };
  if (p <= 70) return { label: "Fair", token: "fair", rank: 2 };
  if (p <= 88) return { label: "Pricey", token: "steep", rank: 3 };
  return { label: "Wait", token: "steep", rank: 4 };
}

export function timeAgo(unixSeconds: number | null | undefined) {
  if (!unixSeconds) return "unknown";
  const mins = Math.max(0, Math.round((Date.now() - unixSeconds * 1000) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}
