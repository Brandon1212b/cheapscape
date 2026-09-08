import { CATALOG, type CatalogItem } from "./osrs-catalog";

const PRAYER_SCROLLS: CatalogItem[] = [
  { name: "Dexterous prayer scroll", tags: ["supplies", "prayer", "late", "end"] },
  { name: "Arcane prayer scroll", tags: ["supplies", "prayer", "late", "end"] },
  { name: "Torn prayer scroll", tags: ["supplies", "prayer", "mid", "late"] },
];

/** Kept so existing imports stay valid. Items now live in osrs-catalog.ts. */
export function applyPvmCatalogAdditions(): void {
  for (const group of CATALOG) {
    if (group.id !== "utility" && group.id !== "prayer") continue;
    for (const item of PRAYER_SCROLLS) {
      if (group.items.some((existing) => existing.name === item.name)) continue;
      group.items.push({
        name: item.name,
        tags:
          group.id === "utility"
            ? item.tags
            : item.tags.filter((tag) => tag !== "supplies"),
      });
    }
  }
}

applyPvmCatalogAdditions();

export const PVM_ADDITION_NAMES: string[] = [
  "Archers ring",
  "Lightbearer",
  "Bellator ring",
  "Ring of suffering",
  "Ring of the gods",
  "Tyrannical ring",
  "Treasonous ring",
  "Sunfire fanatic helm",
  "Sunfire fanatic cuirass",
  "Sunfire fanatic chausses",
  "Avernic defender hilt",
  "Saradomin godsword",
  "Armadyl godsword",
  "Zamorak godsword",
  "Ancient godsword",
  "Ancient hilt",
  "Tormented synapse",
  "Master wand",
  "Scythe of vitur (uncharged)",
  "Elysian sigil",
  "Arcane sigil",
  "Spectral sigil",
  "Kodai insignia",
  "Harmonised orb",
  "Volatile orb",
  "Eldritch orb",
  "Volatile nightmare staff",
  "Eldritch nightmare staff",
  "Imbued heart",
  "Primordial crystal",
  "Pegasian crystal",
  "Eternal crystal",
  "Hydra leather",
  "Blood shard",
  "Dexterous prayer scroll",
  "Arcane prayer scroll",
  "Torn prayer scroll",
];
