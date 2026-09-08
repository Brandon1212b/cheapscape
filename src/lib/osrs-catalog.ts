export type CatalogItem = {
  name: string;
  tags: string[];
};

export type CatalogGroup = {
  id: string;
  label: string;
  kind: "gear" | "skilling";
  note: string;
  items: CatalogItem[];
};

export const CATALOG: CatalogGroup[] = [];

export const GEAR_COMBAT_FILTERS = [
  { key: "melee", label: "Melee", wikiIcon: "Attack_icon.png", skillKey: "attack" },
  { key: "range", label: "Range", wikiIcon: "Ranged_icon.png", skillKey: "ranged" },
  { key: "magic", label: "Magic", wikiIcon: "Magic_icon.png", skillKey: "magic" },
] as const;

export const GEAR_TIER_FILTERS = [
  { key: "early", label: "Early" },
  { key: "mid", label: "Mid" },
  { key: "late", label: "Late" },
  { key: "end", label: "End" },
] as const;

export const GEAR_SLOT_FILTERS = [
  { key: "head", label: "Head", wikiIcon: "Head_slot.png", row: 1, col: 2 },
  { key: "cape", label: "Cape", wikiIcon: "Cape_slot.png", row: 2, col: 1 },
  { key: "neck", label: "Neck", wikiIcon: "Neck_slot.png", row: 2, col: 2 },
  { key: "ammo", label: "Ammo", wikiIcon: "Ammo_slot.png", row: 2, col: 3 },
  { key: "weapon", label: "Weapon", wikiIcon: "Weapon_slot.png", row: 3, col: 1 },
  { key: "chest", label: "Body", wikiIcon: "Body_slot.png", row: 3, col: 2 },
  { key: "shield", label: "Shield", wikiIcon: "Shield_slot.png", row: 3, col: 3 },
  { key: "legs", label: "Legs", wikiIcon: "Legs_slot.png", row: 4, col: 2 },
  { key: "hands", label: "Hands", wikiIcon: "Hands_slot.png", row: 5, col: 1 },
  { key: "feet", label: "Feet", wikiIcon: "Feet_slot.png", row: 5, col: 2 },
  { key: "ring", label: "Ring", wikiIcon: "Ring_slot.png", row: 5, col: 3 },
] as const;

export const SKILLING_FILTERS = [
  { key: "herblore", label: "Herblore", wikiIcon: "Herblore_icon.png" },
  { key: "construction", label: "Construction", wikiIcon: "Construction_icon.png" },
  { key: "prayer", label: "Prayer", wikiIcon: "Prayer_icon.png" },
  { key: "crafting", label: "Crafting", wikiIcon: "Crafting_icon.png" },
  { key: "smithing", label: "Smithing", wikiIcon: "Smithing_icon.png" },
  { key: "magic", label: "Magic", wikiIcon: "Magic_icon.png" },
  { key: "runecraft", label: "Runecraft", wikiIcon: "Runecraft_icon.png" },
  { key: "farming", label: "Farming", wikiIcon: "Farming_icon.png" },
  { key: "fletching", label: "Fletching", wikiIcon: "Fletching_icon.png" },
  { key: "cooking", label: "Cooking", wikiIcon: "Cooking_icon.png" },
  { key: "agility", label: "Agility", wikiIcon: "Agility_icon.png" },
] as const;

export const SUPPLIES_FILTERS = [
  { key: "ammo", label: "Ammunition", wikiIcon: "Ammo_slot.png" },
  { key: "food", label: "Food", wikiIcon: "Shark.png" },
  { key: "potion", label: "Potions", wikiIcon: "Prayer_potion(4).png" },
] as const;
