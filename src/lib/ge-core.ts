import { COMPOSITE_BY_ID, COMPOSITE_ITEMS, type CompositeItem } from "./composite-items";
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
  /** Mean price of points in the last 30 calendar days (falls back to the selected window). */
  avg30: number;
  /** % change vs ~30 calendar days ago (falls back to the oldest point in the window). */
  change30: number;
  /** % change vs ~90 calendar days ago (falls back to the oldest point in the window). */
  change90: number;
  /** % change from the first point in the selected window to the last. */
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
