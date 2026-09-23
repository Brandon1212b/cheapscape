import { COMPOSITE_BY_ID } from "./composite-items";
import { geLookupName } from "./ge-name-aliases";
import {
  api,
  sourceGeId,
  scalePoints,
  type TimeseriesPoint,
  type Trend,
} from "./ge-core";

export function summarise(
  id: number,
  points: TimeseriesPoint[],
  windowPoints = 180,
): Trend | null {
  const series = points
    .map((p) => {
      const hi = p.avgHighPrice;
      const lo = p.avgLowPrice;
      const mid = hi != null && lo != null ? (hi + lo) / 2 : (hi ?? lo);
      return mid != null ? { t: p.timestamp * 1000, p: Math.round(mid) } : null;
    })
    .filter((x): x is { t: number; p: number } => x !== null);

  if (series.length < 5) return null;

  const window = series.slice(-windowPoints);
  const prices = window.map((s) => s.p);
  const current = prices[prices.length - 1]!;
  const lastT = window[window.length - 1]!.t;
  const sorted = [...prices].sort((a, b) => a - b);
  const below = sorted.filter((p) => p < current).length;
  const percentile = Math.round((below / sorted.length) * 100);

  const DAY = 86_400_000;
  const last30 = series.filter((s) => s.t >= lastT - 30 * DAY);
  const avgSrc = last30.length >= 3 ? last30 : window;
  const avg30 = Math.round(avgSrc.reduce((a, s) => a + s.p, 0) / avgSrc.length);

  const pctFrom = (from: number) => (from ? Math.round(((current - from) / from) * 1000) / 10 : 0);
  const priceNear = (agoMs: number) => {
    const target = lastT - agoMs;
    let best = series[0]!;
    let bestDist = Math.abs(best.t - target);
    for (const s of series) {
      const d = Math.abs(s.t - target);
      if (d < bestDist) {
        best = s;
        bestDist = d;
      }
    }
    return best.p;
  };

  const first = prices[0]!;
  const changeWindow = first ? pctFrom(first) : 0;
  const change30 = pctFrom(priceNear(30 * DAY));
  const change90 = pctFrom(priceNear(90 * DAY));

  const step = window.length > 120 ? 2 : 1;
  const spark = window.filter((_, i) => i % step === 0);

  return {
    id,
    percentile,
    low180: sorted[0]!,
    high180: sorted[sorted.length - 1]!,
    avg30,
    change30,
    change90,
    changeWindow,
    series: spark,
  };
}

export async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>) {
  const out: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]!);
      }
    }),
  );
  return out;
}

function sumAlignedSeries(all: TimeseriesPoint[][], extraCoins = 0): TimeseriesPoint[] {
  if (all.length === 0) return [];
  if (all.length === 1 && extraCoins === 0) return all[0]!;
  const byT = new Map<number, { high: number; low: number; hv: number; lv: number; n: number }>();
  for (const pts of all) {
    for (const p of pts) {
      if (p.avgHighPrice == null && p.avgLowPrice == null) continue;
      const cur = byT.get(p.timestamp) ?? {
        high: extraCoins,
        low: extraCoins,
        hv: 0,
        lv: 0,
        n: 0,
      };
      cur.high += p.avgHighPrice ?? p.avgLowPrice ?? 0;
      cur.low += p.avgLowPrice ?? p.avgHighPrice ?? 0;
      cur.hv += p.highPriceVolume ?? 0;
      cur.lv += p.lowPriceVolume ?? 0;
      cur.n += 1;
      byT.set(p.timestamp, cur);
    }
  }
  const need = all.length;
  return [...byT.entries()]
    .filter(([, v]) => v.n === need)
    .sort((a, b) => a[0] - b[0])
    .map(([timestamp, v]) => ({
      timestamp,
      avgHighPrice: v.high,
      avgLowPrice: v.low,
      highPriceVolume: v.hv,
      lowPriceVolume: v.lv,
    }));
}

export async function timeseriesForRow(
  rowId: number,
  step: "5m" | "1h" | "6h" | "24h",
): Promise<TimeseriesPoint[] | null> {
  const comp = COMPOSITE_BY_ID.get(rowId);
  if (comp && comp.fixedCoins != null && comp.sources.length === 0) return null;
  if (comp && comp.sources.length > 0) {
    const parts: TimeseriesPoint[][] = [];
    for (const src of comp.sources) {
      const fetchId = await sourceGeId(src.name);
      if (fetchId == null) return null;
      const res = await api<{ data: TimeseriesPoint[] }>(`/timeseries?timestep=${step}&id=${fetchId}`);
      const scaled = scalePoints(res.data ?? [], src.qty);
      if (scaled.length === 0) return null;
      parts.push(scaled);
    }
    return sumAlignedSeries(parts, comp.fixedCoins ?? 0);
  }
  const res = await api<{ data: TimeseriesPoint[] }>(`/timeseries?timestep=${step}&id=${rowId}`);
  return res.data ?? [];
}
