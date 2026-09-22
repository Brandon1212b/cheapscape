/** Catalog nicknames / incomplete names → exact wiki GE mapping names. */
export const GE_NAME_ALIASES: Record<string, string> = {
  "ursine chainmace": "Ursine chainmace (u)",
  "serpentine helm": "Serpentine helm (uncharged)",
  "warped sceptre": "Warped sceptre (uncharged)",
  "tome of fire": "Tome of Fire (empty)",
  "tome of water": "Tome of Water (empty)",
  "tome of earth": "Tome of Earth (empty)",
};

export function geLookupName(name: string): string {
  return GE_NAME_ALIASES[name.toLowerCase()] ?? name;
}

type NamedPrice = { name: string };

/** Official name, lowercase, and catalog aliases all resolve to the same row. */
export function buildRowsByName<T extends NamedPrice>(rows: T[]): Map<string, T> {
  const map = new Map<string, T>();
  const add = (key: string | undefined, row: T) => {
    if (!key) return;
    map.set(key, row);
    const lower = key.toLowerCase();
    if (lower !== key) map.set(lower, row);
  };
  for (const row of rows) {
    add(row.name, row);
    add(geLookupName(row.name), row);
  }
  for (const [alias, official] of Object.entries(GE_NAME_ALIASES)) {
    const row = map.get(official) ?? map.get(official.toLowerCase());
    if (row) add(alias, row);
  }
  return map;
}

export function rowByName<T extends NamedPrice>(map: Map<string, T>, name: string): T | undefined {
  if (!name || name === "Coins") return undefined;
  return (
    map.get(name) ??
    map.get(name.toLowerCase()) ??
    map.get(geLookupName(name)) ??
    map.get(geLookupName(name).toLowerCase())
  );
}
