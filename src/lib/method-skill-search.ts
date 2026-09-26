import { SKILL_ICONS } from "@/lib/method-icons";

export type MethodSkillHit = {
  key: string;
  label: string;
  wikiIcon: string;
  terms: string;
};

/** Skills on /methods plus extra words people actually type. */
export const METHOD_SKILL_SEARCH: MethodSkillHit[] = [
  { key: "herblore", label: "Herblore", terms: "herbs potions mixology" },
  { key: "construction", label: "Construction", terms: "planks mahogany homes larder" },
  { key: "prayer", label: "Prayer", terms: "bones ensouled gilded altar" },
  { key: "crafting", label: "Crafting", terms: "hide glass battlestaff jewelry" },
  { key: "smithing", label: "Smithing", terms: "bars blast furnace giants foundry cannonball" },
  { key: "magic", label: "Magic", terms: "splashing barrage alch enchant mta" },
  { key: "runecraft", label: "Runecraft", terms: "runes gotr zmi bloods wraths" },
  { key: "farming", label: "Farming", terms: "herbs trees tithe contracts hespori" },
  { key: "fletching", label: "Fletching", terms: "bows darts bolts" },
  { key: "cooking", label: "Cooking", terms: "fish karambwan wine" },
  { key: "agility", label: "Agility", terms: "rooftop sepulchre wyrm wilderness" },
  { key: "mining", label: "Mining", terms: "ore mlm stars granite infernal shale" },
  { key: "fishing", label: "Fishing", terms: "angler tempoross barbarian" },
  { key: "woodcutting", label: "Woodcutting", terms: "trees forestry" },
  { key: "firemaking", label: "Firemaking", terms: "campfire wintertodt line burn pyre logs" },
  { key: "thieving", label: "Thieving", terms: "pickpocket pyramid plunder artefacts" },
  { key: "hunter", label: "Hunter", terms: "chins herbiboar rumours implings birdhouse letvek stymphike vampyrium" },
  { key: "sailing", label: "Sailing", terms: "courier charting port bounty kraken shark orca" },
].map((s) => ({
  ...s,
  wikiIcon: SKILL_ICONS[s.key] ?? `${s.label}_icon.png`,
}));

export function skillSearchText(s: MethodSkillHit): string {
  return `${s.key} ${s.label} ${s.terms}`.toLowerCase();
}
