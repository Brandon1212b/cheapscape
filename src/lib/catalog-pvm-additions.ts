import { CATALOG, type CatalogItem } from "./osrs-catalog";

/** CoX prayer unlocks — tradeable GE items, shown on the Gear tab. */
const GEAR_SCROLLS: { name: string; groups: string[]; tags: string[] }[] = [
  {
    name: "Dexterous prayer scroll",
    groups: ["ranged", "prayer"],
    tags: ["range", "prayer", "late", "end"],
  },
  {
    name: "Arcane prayer scroll",
    groups: ["magic", "prayer"],
    tags: ["magic", "prayer", "late", "end"],
  },
  {
    name: "Torn prayer scroll",
    groups: ["melee", "ranged", "magic", "prayer"],
    tags: ["melee", "range", "magic", "prayer", "mid", "late"],
  },
];

function tagsForGroup(groupId: string, tags: string[]): string[] {
  if (groupId === "prayer") {
    return tags.filter((t) => t === "prayer" || t === "mid" || t === "late" || t === "end");
  }
  if (groupId === "ranged") {
    return tags.filter((t) => t !== "melee" && t !== "magic");
  }
  if (groupId === "magic") {
    return tags.filter((t) => t !== "melee" && t !== "range");
  }
  if (groupId === "melee") {
    return tags.filter((t) => t !== "range" && t !== "magic");
  }
  return tags;
}

/** Kept so existing imports stay valid. Items now live in osrs-catalog.ts. */
export function applyPvmCatalogAdditions(): void {
  for (const scroll of GEAR_SCROLLS) {
    for (const group of CATALOG) {
      if (!scroll.groups.includes(group.id)) continue;
      if (group.items.some((existing) => existing.name === scroll.name)) continue;
      group.items.push({
        name: scroll.name,
        tags: tagsForGroup(group.id, scroll.tags),
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
