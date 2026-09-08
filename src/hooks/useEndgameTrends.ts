import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { fetchEndgameTrends } from "@/lib/osrs.functions";
import { readClientCache, writeClientCache } from "@/lib/client-cache";
import type { Trend } from "@/lib/osrs.server";

const KEY = "osrs-trends:1m-endgame";
const TTL = 45 * 60_000;

/** 1-month trends for endgame gear only — used by homepage fallers. */
export function useEndgameTrends() {
  const fn = useServerFn(fetchEndgameTrends);
  const trends = useQuery({
    queryKey: ["osrs-trends", "1m", "endgame"],
    queryFn: () => fn(),
    staleTime: 30 * 60_000,
    placeholderData: () => readClientCache<Record<number, Trend>>(KEY, TTL),
  });

  useEffect(() => {
    if (trends.data) writeClientCache(KEY, trends.data);
  }, [trends.data]);

  return trends;
}
