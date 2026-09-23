import { CATALOG } from "./osrs-catalog";
import "./catalog-pvm-additions";
import { craftingMethodItemNames } from "./crafting-methods";
import { constructionMethodItemNames } from "./construction-methods";
import { prayerMethodItemNames } from "./prayer-methods";
import { smithingMethodItemNames } from "./smithing-methods";
import { magicMethodItemNames } from "./magic-methods";
import { runecraftMethodItemNames } from "./runecraft-methods";
import { farmingMethodItemNames } from "./farming-methods";
import { fletchingMethodItemNames } from "./fletching-methods";
import { cookingMethodItemNames } from "./cooking-methods";
import { agilityMethodItemNames } from "./agility-methods";
import { herbloreMethodItemNames } from "./herblore-methods";
import { thievingMethodItemNames } from "./thieving-methods";
import { miningMethodItemNames } from "./mining-methods";
import { fishingMethodItemNames } from "./fishing-methods";
import { woodcuttingMethodItemNames } from "./woodcutting-methods";
import { firemakingMethodItemNames } from "./firemaking-methods";
import { hunterMethodItemNames } from "./hunter-methods";
import { sailingMethodItemNames } from "./sailing-methods";
import { sailingActivityItemNames } from "./sailing-activity-methods";
import { activityMethodItemNames } from "./activity-methods";
import { wikiAuditActivityItemNames } from "./wiki-audit-activities";
import { sepulchreFloor5ItemNames } from "./sepulchre-floor5";
import { sepulchreFloor4ItemNames } from "./sepulchre-floor4";

/** Catalog + every method/activity input and output. Warm and live fetches must use this same set. */
export function allTrackedItemNames(): string[] {
  const fromCatalog = CATALOG.flatMap((g) => g.items.map((i) => i.name));
  return [
    ...new Set([
      ...fromCatalog,
      ...craftingMethodItemNames(),
      ...constructionMethodItemNames(),
      ...prayerMethodItemNames(),
      ...smithingMethodItemNames(),
      ...magicMethodItemNames(),
      ...runecraftMethodItemNames(),
      ...farmingMethodItemNames(),
      ...fletchingMethodItemNames(),
      ...cookingMethodItemNames(),
      ...agilityMethodItemNames(),
      ...herbloreMethodItemNames(),
      ...thievingMethodItemNames(),
      ...miningMethodItemNames(),
      ...fishingMethodItemNames(),
      ...woodcuttingMethodItemNames(),
      ...firemakingMethodItemNames(),
      ...hunterMethodItemNames(),
      ...sailingMethodItemNames(),
      ...sailingActivityItemNames(),
      ...activityMethodItemNames(),
      ...wikiAuditActivityItemNames(),
      ...sepulchreFloor5ItemNames(),
      ...sepulchreFloor4ItemNames(),
    ]),
  ];
}

export function endgameItemNames(): string[] {
  return [
    ...new Set(
      CATALOG.flatMap((g) =>
        g.kind === "gear" ? g.items.filter((i) => i.tags.includes("end")).map((i) => i.name) : [],
      ),
    ),
  ];
}

/** Stable short key so snapshot/trend caches do not collide across different name lists. */
export function namesScope(names: string[]): string {
  const uniq = [...new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean))].sort();
  let h = 2166136261;
  for (const s of uniq) {
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 124;
    h = Math.imul(h, 16777619);
  }
  return `${uniq.length}_${(h >>> 0).toString(36)}`;
}
