import { COMPOSITE_ITEMS, type CompositeItem } from "./composite-items";
import { geLookupName } from "./ge-name-aliases";
import { cacheGetEntry, cacheSet } from "./durable-cache";
import { allTrackedItemNames, namesScope } from "./tracked-item-names";

const BASE = "https://prices.runescape.wiki/api/v1/osrs";
export const UA = "OSRS Gear & Skilling Price Tracker - lovable.app";
export const ITEM_META_URL = (id: number) =>
  `https://raw.githubusercontent.com/0xNeffarion/osrsreboxed-db/master/docs/items-json/${id}.json`;

export const HISCORES_URL = "https://secure.runescape.com/m=hiscore_oldschool/index_lite.json";

type MappingEntry = {
  id: number;
  name: string;
  icon: string;
  limit?: number;
  members: boolean;
  highalch?: number;
  examine: string;
};

type LatestEntry = {
  high: number | null;
  low: number | null;
  highTime: number | null;
  lowTime: number | null;
};

export type PriceRow = {
  id: number;
  name: string;
  icon: string;
  members: boolean;
  limit: number | null;
  highalch: number | null;
  examine: string;
  high: number | null;
  low: number | null;
  updated: number | null;
  volume: number | null;
};

export type Trend = {
  id: number;
  percentile: number;
  low180: number;
  high180: number;
  avg30: number;
  change30: number;
  change90: number;
  changeWindow: number;
  series: { t: number; p: number }[];
};

export type EquipmentStats = {
  attack_stab: number;
  attack_slash: number;
  attack_crush: number;
  attack_magic: number;
  attack_ranged: number;
  defence_stab: number;
  defence_slash: number;
  defence_crush: number;
  defence_magic: number;
  defence_ranged: number;
  melee_strength: number;
  ranged_strength: number;
  magic_damage: number;
  prayer: number;
  slot: string;
  requirements: Record<string, number> | null;
  attack_speed: number | null;
  weapon_type: string | null;
};

export type Cache<T> = { at: number; value: T };

let mappingCache: Cache<MappingEntry[]> | null = null;
const snapshotCaches = new Map<string, Cache<PriceRow[]>>();
export const trendCaches = new Map<string, Cache<Record<number, Trend>>>();
export const trendInFlights = new Map<string, Promise<Record<number, Trend>>>();
export const equipmentCache = new Map<number, Cache<EquipmentStats | null>>();

export const MIN = 60_000;

export async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`OSRS price API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

async function getMapping(): Promise<MappingEntry[]> {
  if (mappingCache && Date.now() - mappingCache.at < 12 * 60 * MIN) return mappingCache.value;
  const value = await api<MappingEntry[]>("/mapping");
  mappingCache = { at: Date.now(), value };
  return value;
}

function resolveMapping(
  name: string,
  byName: Map<string, MappingEntry>,
  byNameLower: Map<string, MappingEntry>,
): MappingEntry | undefined {
  const lookup = geLookupName(name);
  return (
    byName.get(lookup) ??
    byNameLower.get(lookup.toLowerCase()) ??
    byName.get(name) ??
    byNameLower.get(name.toLowerCase())
  );
}

function priceComposite(
  c: CompositeItem,
  byName: Map<string, MappingEntry>,
  byNameLower: Map<string, MappingEntry>,
  latest: Record<string, LatestEntry>,
  day: Record<string, { highPriceVolume: number; lowPriceVolume: number }>,
): PriceRow | null {
  if (c.fixedCoins != null && c.sources.length === 0) {
    return {
      id: c.id,
      name: c.name,
      icon: c.icon,
      members: true,
      limit: null,
      highalch: null,
      examine: c.examine,
      high: c.fixedCoins,
      low: c.fixedCoins,
      updated: null,
      volume: 0,
    };
  }
  let high = c.fixedCoins ?? 0;
  let low = c.fixedCoins ?? 0;
  let updated: number | null = null;
  let volume: number | null = c.fixedCoins != null ? 0 : null;
  for (const src of c.sources) {
    const m = resolveMapping(src.name, byName, byNameLower);
    if (!m) return null;
    const l = latest[String(m.id)];
    const srcHigh = l?.high ?? null;
    const srcLow = l?.low ?? null;
    if (srcHigh == null && srcLow == null) return null;
    high += (srcHigh ?? srcLow ?? 0) * src.qty;
    low += (srcLow ?? srcHigh ?? 0) * src.qty;
    const t = l?.highTime ?? l?.lowTime ?? null;
    if (t != null && (updated == null || t > updated)) updated = t;
    const v = day[String(m.id)];
    if (v) volume = (volume ?? 0) + (v.highPriceVolume ?? 0) + (v.lowPriceVolume ?? 0);
  }
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    members: true,
    limit: null,
    highalch: null,
    examine: c.examine,
    high,
    low,
    updated,
    volume,
  };
}

export async function getSnapshot(names?: string[]): Promise<PriceRow[]> {
  const wantedNames = names && names.length > 0 ? names : allTrackedItemNames();
  const scope = namesScope(wantedNames);
  const ttl = 2 * MIN;
  const cached = snapshotCaches.get(scope);
  if (cached && Date.now() - cached.at < ttl) return cached.value;

  const durableSnap = await cacheGetEntry<PriceRow[]>(`snapshot:${scope}`, ttl);
  if (durableSnap) {
    snapshotCaches.set(scope, { at: durableSnap.at, value: durableSnap.value });
    return durableSnap.value;
  }

  const [mapping, latest, day] = await Promise.all([
    getMapping(),
    api<{ data: Record<string, LatestEntry> }>("/latest"),
    api<{ data: Record<string, { highPriceVolume: number; lowPriceVolume: number }> }>("/24h"),
  ]);

  const byName = new Map(mapping.map((m) => [m.name, m]));
  const byNameLower = new Map(mapping.map((m) => [m.name.toLowerCase(), m]));
  const wanted = new Set(wantedNames.map((n) => n.toLowerCase()));
  const rows: PriceRow[] = [];
  const seen = new Set<number>();

  for (const name of wantedNames) {
    const m = resolveMapping(name, byName, byNameLower);
    if (!m || seen.has(m.id)) continue;
    seen.add(m.id);
    const l = latest.data[String(m.id)];
    const v = day.data[String(m.id)];
    rows.push({
      id: m.id,
      name: m.name,
      icon: m.icon,
      members: m.members,
      limit: m.limit ?? null,
      highalch: m.highalch ?? null,
      examine: m.examine,
      high: l?.high ?? null,
      low: l?.low ?? null,
      updated: l?.highTime ?? l?.lowTime ?? null,
      volume: v ? (v.highPriceVolume ?? 0) + (v.lowPriceVolume ?? 0) : null,
    });
  }

  for (const c of COMPOSITE_ITEMS) {
    if (!wanted.has(c.name.toLowerCase()) || seen.has(c.id)) continue;
    const priced = priceComposite(c, byName, byNameLower, latest.data, day.data);
    if (!priced) continue;
    seen.add(c.id);
    rows.push(priced);
  }

  const now = Date.now();
  snapshotCaches.set(scope, { at: now, value: rows });
  await cacheSet(`snapshot:${scope}`, rows, ttl);
  return rows;
}

export type TimeseriesPoint = {
  timestamp: number;
  avgHighPrice: number | null;
  avgLowPrice: number | null;
  highPriceVolume?: number | null;
  lowPriceVolume?: number | null;
};

export function scalePoints(points: TimeseriesPoint[], qty: number) {
  if (qty === 1) return points;
  return points.map((p) => ({
    timestamp: p.timestamp,
    avgHighPrice: p.avgHighPrice != null ? p.avgHighPrice * qty : null,
    avgLowPrice: p.avgLowPrice != null ? p.avgLowPrice * qty : null,
    highPriceVolume: p.highPriceVolume,
    lowPriceVolume: p.lowPriceVolume,
  }));
}

export type RangeKey = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";

export const RANGES: Record<RangeKey, { step: "5m" | "1h" | "6h" | "24h"; points: number; label: string }> = {
  "1d": { step: "5m", points: 288, label: "24 hours" },
  "1w": { step: "1h", points: 168, label: "7 days" },
  "1m": { step: "6h", points: 120, label: "30 days" },
  "3m": { step: "24h", points: 90, label: "3 months" },
  "6m": { step: "24h", points: 180, label: "6 months" },
  "1y": { step: "24h", points: 365, label: "1 year" },
};

export async function sourceGeId(name: string): Promise<number | null> {
  const mapping = await getMapping();
  const lookup = geLookupName(name).toLowerCase();
  const hit = mapping.find((m) => m.name.toLowerCase() === lookup);
  return hit?.id ?? null;
}
