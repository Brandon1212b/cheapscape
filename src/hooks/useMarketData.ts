import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { fetchSnapshot, fetchTrends } from "@/lib/osrs.functions";
import { readClientCache, writeClientCache } from "@/lib/client-cache";
import type { PriceRow, RangeKey, Trend } from "@/lib/osrs.server";

const SNAPSHOT_KEY = "osrs-snapshot";
const snapshotTtl = 10 * 60_000;

function trendsKey(range: RangeKey) {
  return `osrs-trends:${range}`;
}

function trendsTtl(range: RangeKey) {
  return range === "1d" || range === "1w" ? 10 * 60_000 : 45 * 60_000;
}

/** Shared GE snapshot + range trends. Query keys are stable so / and /methods share the cache. */
export function useMarketData(range: RangeKey = "6m", opts?: { trends?: boolean }) {
  const snapshotFn = useServerFn(fetchSnapshot);
  const trendsFn = useServerFn(fetchTrends);
  const wantTrends = opts?.trends !== false;

  const snapshot = useQuery({
    queryKey: ["osrs-snapshot"],
    queryFn: () => snapshotFn(),
    refetchInterval: 120_000,
    staleTime: 60_000,
    placeholderData: () => readClientCache<PriceRow[]>(SNAPSHOT_KEY, snapshotTtl),
  });

  const trends = useQuery({
    queryKey: ["osrs-trends", range],
    queryFn: () => trendsFn({ data: { range } }),
    enabled: wantTrends,
    staleTime: range === "1d" || range === "1w" ? 5 * 60_000 : 30 * 60_000,
    placeholderData: (prev) =>
      prev ?? readClientCache<Record<number, Trend>>(trendsKey(range), trendsTtl(range)),
  });

  useEffect(() => {
    if (snapshot.data) writeClientCache(SNAPSHOT_KEY, snapshot.data);
  }, [snapshot.data]);

  useEffect(() => {
    if (trends.data) writeClientCache(trendsKey(range), trends.data);
  }, [trends.data, range]);

  return { snapshot, trends };
}
