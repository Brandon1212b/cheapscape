import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fetchSnapshot, fetchTrends } from "@/lib/osrs.functions";
import type { PriceRow, Trend } from "@/lib/osrs.server";
import { WikiImage } from "@/components/WikiImage";
import { Sparkline } from "@/components/Sparkline";
import { gp } from "@/lib/format";
import {
  isTriggered,
  pctFromHigh,
  useLocalRsn,
  useWatchlist,
  useWatchlistMutations,
  type WatchItem,
} from "@/lib/watchlist";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "My watchlist — Cheapscape" },
      {
        name: "description",
        content:
          "Track your OSRS gear and skilling items, set price targets or percentage-drop alerts, and see which ones are cheap right now.",
      },
      { property: "og:title", content: "My watchlist — Cheapscape" },
      {
        property: "og:description",
        content: "Your tracked Old School RuneScape items with live prices and buy alerts.",
      },
    ],
  }),
  component: WatchlistPage,
});
