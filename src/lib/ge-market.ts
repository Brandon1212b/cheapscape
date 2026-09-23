import { cacheGetEntry, cacheSet } from "./durable-cache";
import { namesScope } from "./tracked-item-names";
import {
  HISCORES_URL,
  ITEM_META_URL,
  MIN,
  RANGES,
  UA,
  equipmentCache,
  getSnapshot,
  trendCaches,
  trendInFlights,
} from "./ge-core";
import { pool, summarise, timeseriesForRow } from "./ge-more";
import type { Cache, EquipmentStats, PriceRow, RangeKey, Trend } from "./ge-core";

export type { PriceRow, Trend, EquipmentStats, RangeKey } from "./ge-core";
export { RANGES, getSnapshot } from "./ge-core";

let requirementsMapCache: Cache<Record<number, Record<string, number>>> | null = null;

export async function getTrends(names: string[], range: RangeKey = "6m"): Promise<Record<number, Trend>> {
  const scope = `${range}:${namesScope(names)}`;
  const ttl = range === "1d" || range === "1w" ? 5 * MIN : 60 * MIN;
  const cached = trendCaches.get(scope);
  if (cached && Date.now() - cached.at < ttl) return cached.value;

  const durable = await cacheGetEntry<Record<number, Trend>>(`trends:${scope}`, ttl);
  if (durable) {
    trendCaches.set(scope, { at: durable.at, value: durable.value });
    return durable.value;
  }

  const inFlight = trendInFlights.get(scope);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const rows = await getSnapshot(names);
    const cfg = RANGES[range];
    const result: Record<number, Trend> = {};
    await pool(rows, 20, async (row) => {
      try {
        const points = await timeseriesForRow(row.id, cfg.step);
        if (!points) return;
        const t = summarise(row.id, points, cfg.points);
        if (t) result[row.id] = t;
      } catch {
        /* skip individual failures */
      }
    });
    const now = Date.now();
    trendCaches.set(scope, { at: now, value: result });
    await cacheSet(`trends:${scope}`, result, ttl);
    return result;
  })().finally(() => {
    trendInFlights.delete(scope);
  });

  trendInFlights.set(scope, promise);
  return promise;
}

export type PricePoint = {
  t: number;
  p: number;
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

  const [rawPoints, equipment] = await Promise.all([
    timeseriesForRow(id, cfg.step),
    getEquipmentStats(id),
  ]);
  const raw = rawPoints ?? [];
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
  const durableReqs = await cacheGetEntry<Record<number, Record<string, number>>>("item-reqs", reqTtl);
  if (durableReqs) {
    requirementsMapCache = { at: durableReqs.at, value: durableReqs.value };
    return durableReqs.value;
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
