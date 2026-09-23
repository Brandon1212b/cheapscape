import { createServerFn } from "@tanstack/react-start";
import { allTrackedItemNames, endgameItemNames } from "./tracked-item-names";
import type { ItemDetail, PriceRow, PlayerStatsResult, RangeKey, Trend } from "./osrs.server";
import type { WikiRecResult } from "./wiki-recommended";

export const fetchSnapshot = createServerFn({ method: "GET" }).handler(async (): Promise<PriceRow[]> => {
  const { getSnapshot } = await import("./osrs.server");
  return getSnapshot(allTrackedItemNames());
});

export const fetchTrends = createServerFn({ method: "GET" })
  .inputValidator((d: { range?: RangeKey } | undefined) => d ?? {})
  .handler(async ({ data }): Promise<Record<number, Trend>> => {
    const { getTrends } = await import("./osrs.server");
    return getTrends(allTrackedItemNames(), data.range ?? "6m");
  });

export const fetchEndgameTrends = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<number, Trend>> => {
    const { getTrends } = await import("./osrs.server");
    return getTrends(endgameItemNames(), "1m");
  },
);

export const fetchItemDetail = createServerFn({ method: "GET" })
  .inputValidator((d: { id: number; range: RangeKey }) => d)
  .handler(async ({ data }): Promise<ItemDetail> => {
    const { getItemDetail } = await import("./osrs.server");
    return getItemDetail(allTrackedItemNames(), data.id, data.range);
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
    return getItemRequirementsMap(allTrackedItemNames());
  },
);

export const fetchWikiRecommended = createServerFn({ method: "GET" })
  .inputValidator((d: { name: string }) => d)
  .handler(async ({ data }): Promise<WikiRecResult> => {
    const { getWikiRecommended } = await import("./wiki-recommended");
    return getWikiRecommended(data.name);
  });
