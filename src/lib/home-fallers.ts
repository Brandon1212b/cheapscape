import { CATALOG, type CatalogItem } from "@/lib/osrs-catalog";
import { geLookupName } from "@/lib/ge-name-aliases";
import type { PriceRow, Trend } from "@/lib/osrs.server";

export type HomeFaller = {
  key: string;
  name: string;
  icon: string;
  itemId: number;
  price: number;
  change: number;
  kind: "item" | "set";
};

type SetFamily = {
  key: string;
  label: string;
  pieces: string[];
};

const ARMOUR_SLOTS = new Set(["head", "chest", "legs"]);

function isThirdAge(name: string) {
  return name.toLowerCase().includes("3rd age");
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

function buildSetFamilies(catalog: Map<string, CatalogItem>): SetFamily[] {
  const buckets = new Map<string, { label: string; pieces: Set<string> }>();

  const add = (key: string, label: string, name: string) => {
    const bucket = buckets.get(key) ?? { label, pieces: new Set<string>() };
    bucket.pieces.add(name.toLowerCase());
    buckets.set(key, bucket);
  };

  for (const item of catalog.values()) {
    if (!item.tags.includes("end")) continue;
    if (isThirdAge(item.name)) continue;
    if (!item.tags.some((t) => ARMOUR_SLOTS.has(t))) continue;

    const n = item.name;
    const lower = n.toLowerCase();

    if (lower.startsWith("torva ")) add("torva", "Torva armour", n);
    else if (lower.startsWith("justiciar ")) add("justiciar", "Justiciar armour", n);
    else if (lower.startsWith("inquisitor's ") && !lower.includes("mace")) {
      add("inquisitor", "Inquisitor's armour", n);
    } else if (lower.startsWith("masori ") && lower.includes("(f)")) {
      add("masori-f", "Masori armour (f)", n);
    } else if (lower.startsWith("masori ")) add("masori", "Masori armour", n);
    else if (lower.startsWith("ancestral ")) add("ancestral", "Ancestral robes", n);
    else if (lower.startsWith("virtus ")) add("virtus", "Virtus robes", n);
    else if (lower.startsWith("oathplate ")) add("oathplate", "Oathplate armour", n);
  }

  return [...buckets.entries()]
    .filter(([, b]) => b.pieces.size >= 2)
    .map(([key, b]) => ({ key, label: b.label, pieces: [...b.pieces] }));
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
    icon: string,
    itemId: number,
    price: number,
    change: number,
    kind: HomeFaller["kind"],
    key: string,
  ) => {
    if (!Number.isFinite(change) || change >= 0) return;
    if (price < 1_000) return;
    out.push({ key, name, icon, itemId, price, change, kind });
  };

  for (const family of families) {
    const pieces: PriceRow[] = [];
    for (const piece of family.pieces) {
      const row = rowsByName.get(piece);
      if (!row) continue;
      pieces.push(row);
      used.add(piece);
      used.add(row.name.toLowerCase());
    }
    if (pieces.length < 2) {
      for (const row of pieces) used.delete(row.name.toLowerCase());
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
    consider(family.label, worst.icon, worst.id, total, setChange, "set", family.key);
  }

  for (const row of rows) {
    const item =
      catalog.get(row.name.toLowerCase()) ?? catalog.get(geLookupName(row.name).toLowerCase());
    if (!item) continue;
    if (!item.tags.includes("end")) continue;
    if (isThirdAge(row.name) || isThirdAge(item.name)) continue;
    if (used.has(row.name.toLowerCase()) || used.has(item.name.toLowerCase())) continue;
    consider(
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
