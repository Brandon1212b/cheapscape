import { COMPOSITE_BY_ID, COMPOSITE_ITEMS } from "./composite-items";
import { geLookupName } from "./ge-name-aliases";
import { cacheGet, cacheSet } from "./durable-cache";

const BASE = "https://prices.runescape.wiki/api/v1/osrs";
const UA = "OSRS Gear & Skilling Price Tracker - lovable.app";
const ITEM_META_URL = (id: number) =>
  `https://raw.githubusercontent.com/0xNeffarion/osrsreboxed-db/master/docs/items-json/${id}.json`;

const HISCORES_URL = "https://secure.runescape.com/m=hiscore_oldschool/index_lite.json";

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

type Cache<T> = { at: number; value: T };

let mappingCache: Cache<MappingEntry[]> | null = null;
let snapshotCache: Cache<PriceRow[]> | null = null;
const trendCaches = new Map<string, Cache<Record<number, Trend>>>();
const trendInFlights = new Map<string, Promise<Record<number, Trend>>>();
const equipmentCache = new Map<number, Cache<EquipmentStats | null>>();
let requirementsMapCache: Cache<Record<number, Record<string, number>>> | null = null;

const MIN = 60_000;

async function api<T>(path: string): Promise<T> {
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

export async function getSnapshot(names: string[]): Promise<PriceRow[]> {
  if (snapshotCache && Date.now() - snapshotCache.at < 2 * MIN) return snapshotCache.value;
  const durableSnap = await cacheGet<PriceRow[]>("snapshot", 2 * MIN);
  if (durableSnap) {
    snapshotCache = { at: Date.now(), value: durableSnap };
    return durableSnap;
  }

  const [mapping, latest, day] = await Promise.all([
    getMapping(),
    api<{ data: Record<string, LatestEntry> }>("/latest"),
    api<{ data: Record<string, { highPriceVolume: number; lowPriceVolume: number }> }>("/24h"),
  ]);

  const byName = new Map(mapping.map((m) => [m.name, m]));
  const byNameLower = new Map(mapping.map((m) => [m.name.toLowerCase(), m]));
  const wanted = new Set(names.map((n) => n.toLowerCase()));
  const rows: PriceRow[] = [];
  const seen = new Set<number>();

  for (const name of names) {
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
    let high = c.fixedCoins ?? 0;
    let low = c.fixedCoins ?? 0;
    let updated: number | null = null;
    let volume: number | null = c.fixedCoins != null ? 0 : null;
    let ok = c.fixedCoins != null || c.sources.length > 0;
    for (const src of c.sources) {
      const m = resolveMapping(src.name, byName, byNameLower);
      if (!m) {
        ok = false;
        break;
      }
      const l = latest.data[String(m.id)];
      const v = day.data[String(m.id)];
      high += (l?.high ?? 0) * src.qty;
      low += (l?.low ?? 0) * src.qty;
      const t = l?.highTime ?? l?.lowTime ?? null;
      if (t != null && (updated == null || t > updated)) updated = t;
      if (v) volume = (volume ?? 0) + (v.highPriceVolume ?? 0) + (v.lowPriceVolume ?? 0);
    }
    if (!ok) continue;
    seen.add(c.id);
    rows.push({
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
    });
  }

  snapshotCache = { at: Date.now(), value: rows };
  await cacheSet("snapshot", rows, 2 * MIN);
  return rows;
}

type TimeseriesPoint = {
  timestamp: number;
  avgHighPrice: number | null;
  avgLowPrice: number | null;
  highPriceVolume?: number | null;
  lowPriceVolume?: number | null;
};

function scalePoints(points: TimeseriesPoint[], qty: number) {
  if (qty === 1) return points;
  return points.map((p) => ({
    timestamp: p.timestamp,
    avgHighPrice: p.avgHighPrice != null ? p.avgHighPrice * qty : null,
    avgLowPrice: p.avgLowPrice != null ? p.avgLowPrice * qty : null,
    highPriceVolume: p.highPriceVolume,
    lowPriceVolume: p.lowPriceVolume,
  }));
}

function summarise(
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
  const sorted = [...prices].sort((a, b) => a - b);
  const below = sorted.filter((p) => p < current).length;
  const percentile = Math.round((below / sorted.length) * 100);

  const avgSlice = Math.max(1, Math.min(30, Math.floor(prices.length / 3)));
  const lastAvg = prices.slice(-avgSlice);
  const avg30 = Math.round(lastAvg.reduce((a, b) => a + b, 0) / lastAvg.length);

  const first = prices[0]!;
  const rangeChange = first ? Math.round(((current - first) / first) * 1000) / 10 : 0;

  const at = (back: number) => prices[Math.max(0, prices.length - 1 - back)]!;
  const pct = (from: number) => (from ? ((current - from) / from) * 100 : 0);

  const step = window.length > 120 ? 2 : 1;
  const spark = window.filter((_, i) => i % step === 0);

  return {
    id,
    percentile,
    low180: sorted[0]!,
    high180: sorted[sorted.length - 1]!,
    avg30,
    change30: rangeChange,
    change90: Math.round(pct(at(Math.min(90, prices.length - 1))) * 10) / 10,
    series: spark,
  };
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>) {
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

export type RangeKey = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";

export const RANGES: Record<RangeKey, { step: "5m" | "1h" | "6h" | "24h"; points: number; label: string }> = {
  "1d": { step: "5m", points: 288, label: "24 hours" },
  "1w": { step: "1h", points: 168, label: "7 days" },
  "1m": { step: "6h", points: 120, label: "30 days" },
  "3m": { step: "24h", points: 90, label: "3 months" },
  "6m": { step: "24h", points: 180, label: "6 months" },
  "1y": { step: "24h", points: 365, label: "1 year" },
};

async function sourceGeId(name: string): Promise<number | null> {
  const mapping = await getMapping();
  const hit = mapping.find((m) => m.name.toLowerCase() === geLookupName(name).toLowerCase());
  return hit?.id ?? null;
}

export async function getTrends(names: string[], range: RangeKey = "6m"): Promise<Record<number, Trend>> {
  const cached = trendCaches.get(range);
  const ttl = range === "1d" || range === "1w" ? 5 * MIN : 60 * MIN;
  if (cached && Date.now() - cached.at < ttl) return cached.value;

  const durable = await cacheGet<Record<number, Trend>>(`trends:${range}`, ttl);
  if (durable) {
    trendCaches.set(range, { at: Date.now(), value: durable });
    return durable;
  }

  const inFlight = trendInFlights.get(range);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const rows = await getSnapshot(names);
    const cfg = RANGES[range];
    const result: Record<number, Trend> = {};
    await pool(rows, 20, async (row) => {
      try {
        const comp = COMPOSITE_BY_ID.get(row.id);
        if (comp && (comp.fixedCoins != null || comp.sources.length === 0)) return;
        const primary = comp?.sources[0];
        const fetchId = primary ? await sourceGeId(primary.name) : row.id;
        if (fetchId == null) return;
        const res = await api<{ data: TimeseriesPoint[] }>(
          `/timeseries?timestep=${cfg.step}&id=${fetchId}`,
        );
        const points = scalePoints(res.data ?? [], primary?.qty ?? 1);
        const t = summarise(row.id, points, cfg.points);
        if (t) result[row.id] = t;
      } catch {
        /* skip individual failures */
      }
    });
    trendCaches.set(range, { at: Date.now(), value: result });
    await cacheSet(`trends:${range}`, result, ttl);
    trendInFlights.delete(range);
    return result;
  })();

  trendInFlights.set(range, promise);
  return promise;
}

export type PricePoint = {
  t: number;
  p: number;
  /** Combined high+low GE volume for this timestep. */
  v: number;
};

export type ItemDetail = {
  row: PriceRow;
  range: RangeKey;
  rangeLabel: string;
  series: PricePoint[];
  min: number;
  max: number;
  avg: number;
  change: number;
  volumeTotal: number;
  trend: Trend | null;
  equipment: EquipmentStats | null;
};

const detailCache = new Map<string, Cache<ItemDetail>>();

async function getEquipmentStats(id: number): Promise<EquipmentStats | null> {
  const cached = equipmentCache.get(id);
  if (cached && Date.now() - cached.at < 24 * 60 * MIN) return cached.value;

  try {
    const res = await fetch(ITEM_META_URL(id), {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) {
      equipmentCache.set(id, { at: Date.now(), value: null });
      return null;
    }
    const data = (await res.json()) as {
      equipable_by_player?: boolean;
      equipment?: {
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
        requirements?: Record<string, number> | null;
      };
      weapon?: { attack_speed?: number; weapon_type?: string };
    };

    if (!data.equipable_by_player || !data.equipment) {
      equipmentCache.set(id, { at: Date.now(), value: null });
      return null;
    }

    const e = data.equipment;
    const value: EquipmentStats = {
      attack_stab: e.attack_stab ?? 0,
      attack_slash: e.attack_slash ?? 0,
      attack_crush: e.attack_crush ?? 0,
      attack_magic: e.attack_magic ?? 0,
      attack_ranged: e.attack_ranged ?? 0,
      defence_stab: e.defence_stab ?? 0,
      defence_slash: e.defence_slash ?? 0,
      defence_crush: e.defence_crush ?? 0,
      defence_magic: e.defence_magic ?? 0,
      defence_ranged: e.defence_ranged ?? 0,
      melee_strength: e.melee_strength ?? 0,
      ranged_strength: e.ranged_strength ?? 0,
      magic_damage: e.magic_damage ?? 0,
      prayer: e.prayer ?? 0,
      slot: e.slot ?? "",
      requirements: e.requirements ?? null,
      attack_speed: data.weapon?.attack_speed ?? null,
      weapon_type: data.weapon?.weapon_type ?? null,
    };
    equipmentCache.set(id, { at: Date.now(), value });
    return value;
  } catch {
    equipmentCache.set(id, { at: Date.now(), value: null });
    return null;
  }
}

export async function getItemDetail(names: string[], id: number, range: RangeKey): Promise<ItemDetail> {
  const key = `${id}:${range}`;
  const cached = detailCache.get(key);
  const ttl = range === "1d" ? 2 * MIN : 15 * MIN;
  if (cached && Date.now() - cached.at < ttl) return cached.value;

  const rows = await getSnapshot(names);
  const row = rows.find((r) => r.id === id);
  if (!row) throw new Error("Unknown item");

  const cfg = RANGES[range];
  const comp = COMPOSITE_BY_ID.get(id);
  const primary = comp?.sources[0];
  const fetchId = primary ? await sourceGeId(primary.name) : comp?.fixedCoins != null ? null : id;

  const [res, equipment] = await Promise.all([
    fetchId != null
      ? api<{ data: TimeseriesPoint[] }>(
          `/timeseries?timestep=${cfg.step}&id=${fetchId}`,
        )
      : Promise.resolve({ data: [] }),
    getEquipmentStats(id),
  ]);
  const raw = scalePoints(res.data ?? [], primary?.qty ?? 1);
  const series = raw
    .map((p) => {
      const mid =
        p.avgHighPrice != null && p.avgLowPrice != null
          ? (p.avgHighPrice + p.avgLowPrice) / 2
          : (p.avgHighPrice ?? p.avgLowPrice);
      const v = (p.highPriceVolume ?? 0) + (p.lowPriceVolume ?? 0);
      return mid != null ? { t: p.timestamp * 1000, p: Math.round(mid), v } : null;
    })
    .filter((x): x is PricePoint => x !== null)
    .slice(-cfg.points);

  const prices = series.map((s) => s.p);
  const first = prices[0] ?? 0;
  const last = prices[prices.length - 1] ?? 0;
  const trend = series.length ? summarise(id, raw, Math.max(cfg.points, 180)) : null;
  const volumeTotal = series.reduce((sum, s) => sum + (s.v || 0), 0);

  const value: ItemDetail = {
    row,
    range,
    rangeLabel: cfg.label,
    series,
    min: prices.length ? Math.min(...prices) : row.low ?? 0,
    max: prices.length ? Math.max(...prices) : row.high ?? 0,
    avg: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : row.high ?? 0,
    change: first ? Math.round(((last - first) / first) * 1000) / 10 : 0,
    volumeTotal,
    trend,
    equipment,
  };
  detailCache.set(key, { at: Date.now(), value });
  return value;
}

export type PlayerStatsResult = {
  name: string;
  skills: Record<string, number>;
  xp: Record<string, number>;
};

export async function getPlayerStats(rsn: string): Promise<PlayerStatsResult> {
  const trimmed = rsn.trim();
  if (!trimmed) throw new Error("Enter a username");

  const url = `${HISCORES_URL}?player=${encodeURIComponent(trimmed)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (res.status === 404) throw new Error("Player not found on the hiscores");
  if (!res.ok) throw new Error(`Hiscores error ${res.status}`);

  const data = (await res.json()) as {
    name?: string;
    skills?: { id: number; name: string; rank: number; level: number; xp: number }[];
  };

  if (!data.skills?.length) throw new Error("Player not found on the hiscores");

  const skills: Record<string, number> = {};
  const xp: Record<string, number> = {};
  for (const s of data.skills) {
    if (s.id === 0) continue;
    const key = s.name.toLowerCase();
    skills[key] = Math.max(1, s.level || 1);
    xp[key] = Math.max(0, s.xp || 0);
  }

  return {
    name: data.name ?? trimmed,
    skills,
    xp,
  };
}

export async function getItemRequirementsMap(names: string[]): Promise<Record<number, Record<string, number>>> {
  const reqTtl = 24 * 60 * MIN;
  if (requirementsMapCache && Date.now() - requirementsMapCache.at < reqTtl) {
    return requirementsMapCache.value;
  }
  const durableReqs = await cacheGet<Record<number, Record<string, number>>>("item-reqs", reqTtl);
  if (durableReqs) {
    requirementsMapCache = { at: Date.now(), value: durableReqs };
    return durableReqs;
  }

  const rows = await getSnapshot(names);
  const result: Record<number, Record<string, number>> = {};

  await pool(rows, 8, async (row) => {
    const eq = await getEquipmentStats(row.id);
    if (eq?.requirements && Object.keys(eq.requirements).length > 0) {
      const norm: Record<string, number> = {};
      for (const [k, v] of Object.entries(eq.requirements)) {
        norm[k.toLowerCase()] = v;
      }
      result[row.id] = norm;
    }
  });

  requirementsMapCache = { at: Date.now(), value: result };
  await cacheSet("item-reqs", result, reqTtl);
  return result;
}
