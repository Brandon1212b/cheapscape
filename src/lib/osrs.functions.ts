import { createServerFn } from "@tanstack/react-start";
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
import type { ItemDetail, PriceRow, PlayerStatsResult, RangeKey, Trend } from "./osrs.server";
import type { WikiRecResult } from "./wiki-recommended";

const allNames = () => {
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
};

export const fetchSnapshot = createServerFn({ method: "GET" }).handler(async (): Promise<PriceRow[]> => {
  const { getSnapshot } = await import("./osrs.server");
  return getSnapshot(allNames());
});

export const fetchTrends = createServerFn({ method: "GET" })
  .inputValidator((d: { range?: RangeKey } | undefined) => d ?? {})
  .handler(async ({ data }): Promise<Record<number, Trend>> => {
    const { getTrends } = await import("./osrs.server");
    return getTrends(allNames(), data.range ?? "6m");
  });

export const fetchItemDetail = createServerFn({ method: "GET" })
  .inputValidator((d: { id: number; range: RangeKey }) => d)
  .handler(async ({ data }): Promise<ItemDetail> => {
    const { getItemDetail } = await import("./osrs.server");
    return getItemDetail(allNames(), data.id, data.range);
  });

export const fetchPlayerStats = createServerFn({ method: "GET" })
  .inputValidator((d: { rsn: string }) => d)
  .handler(async ({ data }): Promise<PlayerStatsResult> => {
    const { getPlayerStats } = await import("./osrs.server");
    return getPlayerStats(data.rsn);
  });

export const fetchItemRequirements = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<number, Record<string, number>>> => {
    const { getItemRequirementsMap } = await import("./osrs.server");
    return getItemRequirementsMap(allNames());
  },
);

export const fetchWikiRecommended = createServerFn({ method: "GET" })
  .inputValidator((d: { name: string }) => d)
  .handler(async ({ data }): Promise<WikiRecResult> => {
    const { getWikiRecommended } = await import("./wiki-recommended");
    return getWikiRecommended(data.name);
  });
