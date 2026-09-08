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

function filterRowsByNames(rows: PriceRow[], names: string[]): PriceRow[] {
  if (!names.length) return rows;
  const wanted = new Set(names.map((n) => n.toLowerCase()));
  return rows.filter((r) => wanted.has(r.name.toLowerCase()));
}

export async function getSnapshot(names: string[]): Promise<PriceRow[]> {
  if (snapshotCache && Date.now() - snapshotCache.at < 2 * MIN) {
    return filterRowsByNames(snapshotCache.value, names);
  }
  const durableSnap = await cacheGet<PriceRow[]>("snapshot", 2 * MIN);
  if (durableSnap) {
    snapshotCache = { at: Date.now(), value: durableSnap };
    return filterRowsByNames(durableSnap, names);
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

  if (names.length >= 200) {
    snapshotCache = { at: Date.now(), value: rows };
    await cacheSet("snapshot", rows, 2 * MIN);
  }
  return rows;
}
