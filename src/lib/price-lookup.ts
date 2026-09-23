import { geLookupName } from "./ge-name-aliases";
import type { PriceRow } from "./osrs.server";

function indexRow(map: Map<string, PriceRow>, key: string, row: PriceRow) {
  if (!key) return;
  if (!map.has(key)) map.set(key, row);
}

/**
 * Lookup map keyed by official GE name, lowercase, and catalog aliases.
 * Home, methods, and search must share this so a method input like
 * "Tome of fire" still hits "Tome of Fire (empty)".
 */
export function buildPriceRowsByName(rows: PriceRow[]): Map<string, PriceRow> {
  const map = new Map<string, PriceRow>();
  for (const row of rows) {
    indexRow(map, row.name, row);
    indexRow(map, row.name.toLowerCase(), row);
    const alias = geLookupName(row.name);
    indexRow(map, alias, row);
    indexRow(map, alias.toLowerCase(), row);
    const stripped = row.name.toLowerCase().replace(/ \([^)]*\)$/, "");
    if (stripped !== row.name.toLowerCase()) indexRow(map, stripped, row);
  }
  return map;
}

export function lookupPriceRow(
  rowsByName: Map<string, PriceRow>,
  name: string,
): PriceRow | undefined {
  if (!name || name === "Coins") return undefined;
  return (
    rowsByName.get(name) ??
    rowsByName.get(name.toLowerCase()) ??
    rowsByName.get(geLookupName(name)) ??
    rowsByName.get(geLookupName(name).toLowerCase()) ??
    rowsByName.get(name.toLowerCase().replace(/ \([^)]*\)$/, ""))
  );
}
