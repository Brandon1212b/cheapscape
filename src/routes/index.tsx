import { useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ChartLine } from "lucide-react";

import { CheapscapeWordmark } from "@/components/BrandSurface";
import { WikiImage } from "@/components/WikiImage";
import { useMarketData } from "@/hooks/useMarketData";
import { useEndgameTrends } from "@/hooks/useEndgameTrends";
import { gp } from "@/lib/format";
import { lateEndgameOpportunities, type HomeFaller } from "@/lib/home-fallers";
import { lastHomeRange, lastTabSearch, writeLastSkill, writeTabSearch } from "@/lib/tab-memory";
import { buildPriceRowsByName } from "@/lib/price-lookup";

export type { HomeSearch } from "./prices";

/** Old bookmarks used `/?filter=gear`. Do not treat `range`/`sort` as prices params —
 *  those also belong to `/item/$id` and would bounce item clicks back to Prices. */
const PRICE_REDIRECT_KEYS = ["filter", "q", "combat", "slot", "tier", "set", "supply"] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cheapscape — OSRS prices & skilling methods" },
      {
        name: "description",
        content:
          "Cheapscape shows OSRS gear that is cheap today and ranks skilling methods by opportunity cost against your money-making rate.",
      },
      { property: "og:title", content: "Cheapscape — OSRS prices & skilling methods" },
      {
        property: "og:description",
        content:
          "Buy gear on a real dip. Train with methods scored against what your time is worth.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const { snapshot } = useMarketData("1m", { trends: false });
  const endgameTrends = useEndgameTrends();

  useEffect(() => {
    const search = location.search;
    if (!search || typeof search !== "object") return;
    const record = search as Record<string, unknown>;
    const hasPriceParams = PRICE_REDIRECT_KEYS.some((key) => {
      const value = record[key];
      return value != null && value !== "";
    });
    if (!hasPriceParams) return;
    void navigate({ to: "/prices", search: record as never, replace: true });
  }, [location.search, navigate]);

  const buyers = useMemo(
    () => lateEndgameOpportunities(snapshot.data ?? [], endgameTrends.data, "buy", 10),
    [snapshot.data, endgameTrends.data],
  );
  const sellers = useMemo(
    () => lateEndgameOpportunities(snapshot.data ?? [], endgameTrends.data, "sell", 10),
    [snapshot.data, endgameTrends.data],
  );

  const pricesSearch = {
    ...lastTabSearch("/prices"),
    filter: "gear",
    tier: "all",
    sort: "losers",
    range: "1m",
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4">
      <header className="flex flex-col items-center text-center">
        <h1 className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0" style={{ clip: "rect(0, 0, 0, 0)" }}>
          Cheapscape
        </h1>
        <CheapscapeWordmark />
      </header>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <section className="panel flex flex-col p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Top 10 buying opportunities</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Late & endgame
            </span>
          </div>

          {(snapshot.isLoading || (snapshot.data && !endgameTrends.data && endgameTrends.isLoading)) && (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-md bg-secondary/40" />
              ))}
            </div>
          )}

          {snapshot.isError && (
            <p className="py-6 text-center text-sm text-destructive">
              Couldn't load live prices right now.
            </p>
          )}

          {!snapshot.isLoading && !snapshot.isError && !endgameTrends.isLoading && buyers.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No late/endgame gear is down over the last month.
            </p>
          )}

          {!snapshot.isLoading && buyers.length > 0 && (
            <>
              <ChangeHeader />
              <ul className="divide-y divide-border/40">
                {buyers.map((row) => (
                  <li key={row.key}>
                    <HomeFallerLink row={row} pricesSearch={pricesSearch} />
                  </li>
                ))}
              </ul>
            </>
          )}

          <Link
            to="/prices"
            search={pricesSearch as never}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <ChartLine className="size-4" />
            Open prices
            <ArrowRight className="size-4" />
          </Link>
          <p className="mt-1.5 text-center text-[11px] leading-snug text-muted-foreground">
            Live GE prices focused on useful gear to buy, not to flip
          </p>
        </section>

        <section className="panel flex flex-col p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Top 10 selling opportunities</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Late & endgame
            </span>
          </div>

          {(snapshot.isLoading || (snapshot.data && !endgameTrends.data && endgameTrends.isLoading)) && (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-md bg-secondary/40" />
              ))}
            </div>
          )}

          {snapshot.isError && (
            <p className="py-6 text-center text-sm text-destructive">
              Couldn't load live prices right now.
            </p>
          )}

          {!snapshot.isLoading && !snapshot.isError && !endgameTrends.isLoading && sellers.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No late/endgame gear is up over the last month.
            </p>
          )}

          {!snapshot.isLoading && sellers.length > 0 && (
            <>
              <ChangeHeader />
              <ul className="divide-y divide-border/40">
                {sellers.map((row) => (
                  <li key={row.key}>
                    <HomeFallerLink row={row} pricesSearch={pricesSearch} />
                  </li>
                ))}
              </ul>
            </>
          )}

          <Link
            to="/prices"
            search={{ ...pricesSearch, sort: "gainers" } as never}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <ChartLine className="size-4" />
            Open prices
            <ArrowRight className="size-4" />
          </Link>
          <p className="mt-1.5 text-center text-[11px] leading-snug text-muted-foreground">
            Biggest risers among late and endgame gear
          </p>
        </section>
      </div>

      <p className="mx-auto mt-4 max-w-lg text-center text-[10px] leading-snug text-muted-foreground/80">
        Cheapscape is a fan project. Created using intellectual property belonging to Jagex Limited
        under the terms of Jagex's Fan Content Policy. This content is not endorsed by or affiliated
        with Jagex. Method rates and item icons come from the{" "}
        <a
          href="https://oldschool.runescape.wiki/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Old School RuneScape Wiki
        </a>
        . Live prices use the wiki Grand Exchange feed. Figures change and should be treated as
        estimates.
      </p>
    </main>
  );
}

function ChangeHeader() {
  return (
    <div className="flex items-center gap-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      <span className="size-5 shrink-0" />
      <span className="min-w-0 flex-1">Item</span>
      <span className="w-16 shrink-0 text-right">Price</span>
      <span className="w-11 shrink-0 text-right">1D</span>
      <span className="w-11 shrink-0 text-right">7D</span>
      <span className="w-11 shrink-0 text-right">30D</span>
    </div>
  );
}

function ChangeCell({ value }: { value: number }) {
  const color = value >= 0 ? "var(--deal)" : "var(--steep)";
  return (
    <span className="w-11 shrink-0 text-right text-xs font-bold tabular-nums" style={{ color }}>
      {value > 0 ? "+" : ""}{value}%
    </span>
  );
}

const FALLER_ROW_CLASS = "flex items-center gap-2 py-2 hover:bg-secondary/30";

/** Single items open the detail page. Armour sets keep filtering Prices by name. */
function HomeFallerLink({
  row,
  pricesSearch,
}: {
  row: HomeFaller;
  pricesSearch: Record<string, unknown>;
}) {
  const inner = (
    <>
      <WikiImage icon={row.icon} alt="" width={22} height={22} className="size-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {row.name}
        {row.kind === "set" && (
          <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            set
          </span>
        )}
      </span>
      <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums gold-text">{gp(row.price)}</span>
      <ChangeCell value={row.change1} />
      <ChangeCell value={row.change7} />
      <ChangeCell value={row.change30} />
    </>
  );

  if (row.kind === "set") {
    return (
      <Link
        to="/prices"
        search={{ ...pricesSearch, q: row.query } as never}
        className={FALLER_ROW_CLASS}
      >
        {inner}
      </Link>
    );
  }

  const itemHref = `/item/${row.itemId}?range=${encodeURIComponent(lastHomeRange())}`;
  return (
    <Link
      to="/item/$id"
      params={{ id: String(row.itemId) }}
      search={{ range: lastHomeRange() }}
      href={itemHref}
      className={FALLER_ROW_CLASS}
    >
      {inner}
    </Link>
  );
}
