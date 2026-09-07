import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { RangeKey } from "@/lib/osrs.server";
import { Home } from "./home";

type SortKey = "gainers" | "losers" | "expensive" | "cheap" | "value";

const DEFAULT_RANGE: RangeKey = "1m";
const DEFAULT_SORT: SortKey = "losers";
const DEFAULT_FILTER = "gear" as const;
const DEFAULT_TIER = "end";

const homeSearchSchema = z.object({
  filter: z.enum(["all", "gear", "skilling", "supplies"]).catch(DEFAULT_FILTER),
  sort: z.enum(["gainers", "losers", "expensive", "cheap", "value"]).catch(DEFAULT_SORT),
  range: z.enum(["1d", "1w", "1m", "3m", "6m", "1y"]).catch(DEFAULT_RANGE),
  q: z.string().catch(""),
  combat: z.string().catch("all"),
  slot: z.string().catch("all"),
  tier: z.string().catch(DEFAULT_TIER),
  set: z.string().catch("all"),
  skill: z.string().catch("all"),
  supply: z.string().catch("all"),
});

export type HomeSearch = z.infer<typeof homeSearchSchema>;

export const Route = createFileRoute("/prices")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => homeSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Prices — Cheapscape" },
      {
        name: "description",
        content:
          "Live OSRS Grand Exchange prices for gear and skilling supplies, with range-based buy signals so you know when an item is actually cheap.",
      },
      { property: "og:title", content: "Prices — Cheapscape" },
      {
        property: "og:description",
        content:
          "Live OSRS prices for gear upgrades and wiki-recommended skilling supplies, scored against their selected range.",
      },
    ],
  }),
  component: Home,
});
