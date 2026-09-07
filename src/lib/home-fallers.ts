import { CATALOG, type CatalogItem } from "@/lib/osrs-catalog";
import { geLookupName } from "@/lib/ge-name-aliases";
import type { PriceRow, Trend } from "@/lib/osrs.server";

export type HomeFaller = {
  key: string;
  name: string;
  query: string;
  icon: string;
  itemId: number;
  price: number;
  change: number;
  kind: "item" | "set";
};

type SetFamily = {
  key: string;
  label: string;
  query: string;
  pieces: string[];
};

const ARMOUR_SLOTS = new Set(["head", "chest", "legs"]);

/** Known multi-piece endgame armour. Weapons from the same brand stay as singles. */
const SET_PREFIXES: { test: (n: string) => boolean; key: string; label: string; query: string }[] = [
  { test: (n) => n.startsWith("torva "), key: "torva", label: "Torva armour", query: "Torva" },
  { test: (n) => n.startsWith("justiciar "), key: "justiciar", label: "Justiciar armour", query: "Justiciar" },
  {
    test: (n) => n.startsWith("inquisitor's ") && !n.includes("mace"),
    key: "inquisitor",
    label: "Inquisitor's armour",
    query: "Inquisitor",
  },
  {
    test: (n) => n.startsWith("masori ") && n.includes("(f)"),
    key: "masori-f",
    label: "Masori armour (f)",
    query: "Masori (f)",
  },
  { test: (n) => n.startsWith("masori "), key: "masori", label: "Masori armour", query: "Masori" },
  { test: (n) => n.startsWith("ancestral "), key: "ancestral", label: "Ancestral robes", query: "Ancestral" },
  { test: (n) => n.startsWith("virtus "), key: "virtus", label: "Virtus robes", query: "Virtus" },
  { test: (n) => n.startsWith("oathplate "), key: "oathplate", label: "Oathplate armour", query: "Oathplate" },
];

function isThirdAge(name: string) {
  const n = name.toLowerCase();
  return n.includes("3rd age") || n.includes("3rd-age") || n.includes("third age");
}

function priceOf(row: PriceRow): number {
  return row.high ?? row.low ?? 0;
}

function rangeChange(trend?: Trend): number {
  return trend?.change30 ?? 0;
}

function baselinePrice(current: number, changePct: number): number | null {
  if (!Number.isFinite(current) || current <= 0) return null;
  if (!Number.isFinite(changePct) || changePct <= -100) return null;
  return current / (1 + changePct / 100);
}

function catalogByName(): Map<string, CatalogItem> {
  const map = new Map<string, CatalogItem>();
  for (const group of CATALOG) {
    if (group.kind !== "gear") continue;
    for (const item of group.items) {
      map.set(item.name.toLowerCase(), item);
      map.set(geLookupName(item.name).toLowerCase(), item);
    }
  }
  return map;
}

function uniqueCatalogItems(catalog: Map<string, CatalogItem>): CatalogItem[] {
  const seen = new Set<string>();
  const out: CatalogItem[] = [];
  for (const item of catalog.values()) {
    const key = item.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function familyFor(name: string): (typeof SET_PREFIXES)[number] | null {
  const n = name.toLowerCase();
  return SET_PREFIXES.find((p) => p.test(n)) ?? null;
}

function buildSetFamilies(catalog: Map<string, CatalogItem>): SetFamily[] {
  const buckets = new Map<string, { label: string; query: string; pieces: Set<string> }>();

  for (const item of uniqueCatalogItems(catalog)) {
    if (!item.tags.includes("end")) continue;
    if (isThirdAge(item.name)) continue;
    if (!item.tags.some((t) => ARMOUR_SLOTS.has(t))) continue;
    const prefix = familyFor(item.name);
    if (!prefix) continue;
    const bucket = buckets.get(prefix.key) ?? {
      label: prefix.label,
      query: prefix.query,
      pieces: new Set<string>(),
    };
    bucket.pieces.add(item.name.toLowerCase());
    bucket.pieces.add(geLookupName(item.name).toLowerCase());
    buckets.set(prefix.key, bucket);
  }

  return [...buckets.entries()]
    .filter(([, b]) => b.pieces.size >= 2)
    .map(([key, b]) => ({ key, label: b.label, query: b.query, pieces: [...b.pieces] }));
}

export function endgameFallers(
  rows: PriceRow[],
  trends: Record<number, Trend> | undefined,
  limit = 6,
): HomeFaller[] {
  const catalog = catalogByName();
  const families = buildSetFamilies(catalog);

  const rowsByName = new Map<string, PriceRow>();
  for (const row of rows) {
    rowsByName.set(row.name.toLowerCase(), row);
    rowsByName.set(geLookupName(row.name).toLowerCase(), row);
  }

  const used = new Set<string>();
  const out: HomeFaller[] = [];

  const consider = (
    name: string,
    query: string,
    icon: string,
    itemId: number,
    price: number,
    change: number,
    kind: HomeFaller["kind"],
    key: string,
  ) => {
    if (!Number.isFinite(change) || change >= 0) return;
    if (price < 1_000) return;
    out.push({ key, name, query, icon, itemId, price, change, kind });
  };

  for (const family of families) {
    const pieces: PriceRow[] = [];
    for (const piece of family.pieces) {
      const row = rowsByName.get(piece);
      if (!row) continue;
      pieces.push(row);
      used.add(piece);
      used.add(row.name.toLowerCase());
      used.add(geLookupName(row.name).toLowerCase());
    }
    if (pieces.length < 2) {
      for (const row of pieces) {
        used.delete(row.name.toLowerCase());
        used.delete(geLookupName(row.name).toLowerCase());
      }
      continue;
    }

    let total = 0;
    let base = 0;
    let worst = pieces[0]!;
    let worstChange = rangeChange(trends?.[worst.id]);
    for (const row of pieces) {
      const price = priceOf(row);
      const change = rangeChange(trends?.[row.id]);
      total += price;
      const implied = baselinePrice(price, change);
      base += implied ?? price;
      if (change < worstChange) {
        worst = row;
        worstChange = change;
      }
    }
    const setChange =
      base > 0 ? Math.round(((total - base) / base) * 1000) / 10 : worstChange;
    consider(
      family.label,
      family.query,
      worst.icon,
      worst.id,
      total,
      setChange,
      "set",
      family.key,
    );
  }

  for (const row of rows) {
    const item =
      catalog.get(row.name.toLowerCase()) ?? catalog.get(geLookupName(row.name).toLowerCase());
    if (!item) continue;
    if (!item.tags.includes("end")) continue;
    if (isThirdAge(row.name) || isThirdAge(item.name)) continue;
    if (
      used.has(row.name.toLowerCase()) ||
      used.has(item.name.toLowerCase()) ||
      used.has(geLookupName(row.name).toLowerCase())
    ) {
      continue;
    }
    consider(
      row.name,
      row.name,
      row.icon,
      row.id,
      priceOf(row),
      rangeChange(trends?.[row.id]),
      "item",
      `item-${row.id}`,
    );
  }

  return out.sort((a, b) => a.change - b.change || b.price - a.price).slice(0, limit);
}
