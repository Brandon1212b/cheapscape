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

function WatchlistPage() {
  const snapshotFn = useServerFn(fetchSnapshot);
  const trendsFn = useServerFn(fetchTrends);

  const snapshot = useQuery({
    queryKey: ["snapshot"],
    queryFn: () => snapshotFn(),
    refetchInterval: 120_000,
  });
  const trends = useQuery({
    queryKey: ["trends", "6m"],
    queryFn: () => trendsFn({ data: { range: "6m" } }),
    staleTime: 30 * 60_000,
  });

  const watchlist = useWatchlist();
  const { remove, update } = useWatchlistMutations();
  const { rsn, setRsn } = useLocalRsn();
  const [rsnDraft, setRsnDraft] = useState("");

  useEffect(() => {
    if (rsn) setRsnDraft(rsn);
  }, [rsn]);

  const rowsById = useMemo(() => {
    const map = new Map<number, PriceRow>();
    for (const r of snapshot.data ?? []) map.set(r.id, r);
    return map;
  }, [snapshot.data]);

  const items = watchlist.data ?? [];
  const alerts = items.filter((i) => {
    const row = rowsById.get(i.item_id);
    return isTriggered(i, row?.high ?? row?.low, trends.data?.[i.item_id]);
  });

  return (
    <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">My watchlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Saved on this device only. Set a price target or a % drop from the 6-month high — items that hit either show as alerts.
      </p>

      <section className="panel mt-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-end sm:gap-4 sm:p-4">
        <label className="flex-1 text-xs font-medium text-muted-foreground">
          RuneScape name
          <input
            value={rsnDraft}
            onChange={(e) => setRsnDraft(e.target.value)}
            placeholder="Your RSN"
            className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-base text-foreground"
          />
        </label>
        <button
          onClick={() => {
            setRsn(rsnDraft);
            toast("Saved");
          }}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Save RSN
        </button>
      </section>

      {alerts.length > 0 && (
        <section className="mt-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bell className="size-4 text-[var(--deal)]" />
            {alerts.length} item{alerts.length > 1 ? "s" : ""} hit your target
          </h2>
        </section>
      )}

      {items.length === 0 ? (
        <div className="panel mt-6 flex flex-col items-center gap-3 p-8 text-center">
          <Star className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            You aren't tracking anything yet. Tap the star on any item to add it.
          </p>
          <Link to="/" search={{} as never} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
            Browse items
          </Link>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {items.map((item) => (
            <WatchRow
              key={item.id}
              item={item}
              row={rowsById.get(item.item_id)}
              trend={trends.data?.[item.item_id]}
              onRemove={() => remove.mutate(item.id, { onSuccess: () => toast(`Removed ${item.item_name}`) })}
              onUpdate={(patch) => update.mutate({ id: item.id, ...patch })}
            />
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Watchlist is stored in this browser. Clearing site data or switching devices will reset it. Accounts can come later if you want sync.
      </p>
    </main>
  );
}

function WatchRow({
  item,
  row,
  trend,
  onRemove,
  onUpdate,
}: {
  item: WatchItem;
  row?: PriceRow | undefined;
  trend?: Trend | undefined;
  onRemove: () => void;
  onUpdate: (patch: { target_price?: number | null; drop_pct?: number | null }) => void;
}) {
  const price = row?.high ?? row?.low ?? null;
  const pct = pctFromHigh(price, trend);
  const triggered = isTriggered(item, price, trend);

  const [target, setTarget] = useState(item.target_price?.toString() ?? "");
  const [drop, setDrop] = useState(item.drop_pct?.toString() ?? "");

  return (
    <li
      className={`panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center ${
        triggered ? "ring-1 ring-[var(--deal)]" : ""
      }`}
    >
      <Link to="/item/$id" params={{ id: String(item.item_id) }} className="flex min-w-0 flex-1 items-center gap-3">
        <WikiImage icon={row?.icon ?? `${item.item_name}.png`} alt={item.item_name} width={28} height={28} className="size-7 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{item.item_name}</p>
          <p className="text-sm font-bold tabular-nums gold-text">
            {gp(price)}
            {pct != null && <span className="ml-2 text-xs font-medium text-muted-foreground">{pct}% vs high</span>}
          </p>
        </div>
      </Link>

      {trend ? (
        <div className="w-full sm:w-40">
          <Sparkline series={trend.series} tone={triggered ? "deal" : "fair"} />
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <label className="text-[11px] font-medium text-muted-foreground">
          Target gp
          <input
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={() => onUpdate({ target_price: target ? Number(target) : null })}
            placeholder="—"
            className="mt-1 w-28 rounded-md border border-input bg-background px-2 py-1 text-base tabular-nums text-foreground"
          />
        </label>
        <label className="text-[11px] font-medium text-muted-foreground">
          Drop %
          <input
            inputMode="numeric"
            value={drop}
            onChange={(e) => setDrop(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={() => onUpdate({ drop_pct: drop ? Number(drop) : null })}
            placeholder="—"
            className="mt-1 w-16 rounded-md border border-input bg-background px-2 py-1 text-base tabular-nums text-foreground"
          />
        </label>
        <button
          onClick={onRemove}
          aria-label={`Remove ${item.item_name}`}
          className="mb-0.5 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}
