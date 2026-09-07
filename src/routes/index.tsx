import { useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ChartLine, Pickaxe } from "lucide-react";

import { WikiImage } from "@/components/WikiImage";
import { useMarketData } from "@/hooks/useMarketData";
import { gp } from "@/lib/format";
import { HOME_SKILL_HIGHLIGHTS } from "@/lib/home-highlights";
import { lastTabSearch } from "@/lib/tab-memory";
import type { PriceRow, Trend } from "@/lib/osrs.server";

const PRICE_SEARCH_KEYS = [
  "filter",
  "sort",
  "range",
  "q",
  "combat",
  "slot",
  "tier",
  "set",
  "skill",
  "supply",
] as const;

function rangeChange(trend?: Trend): number {
  return trend?.change30 ?? 0;
}

function priceOf(row: PriceRow): number {
  return row.high ?? row.low ?? 0;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cheapscape — OSRS prices & skilling methods" },
      {
        name: "description",
        content:
          "Cheapscape tracks live Grand Exchange prices and wiki skilling methods so you can buy gear on a dip and train efficiently.",
      },
      { property: "og:title", content: "Cheapscape — OSRS prices & skilling methods" },
      {
        property: "og:description",
        content:
          "See this month's biggest GE fallers and top training methods for each skill.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const { snapshot, trends } = useMarketData("1m");

  useEffect(() => {
    const search = location.search;
    if (!search || typeof search !== "object") return;
    const record = search as Record<string, unknown>;
    const hasPriceParams = PRICE_SEARCH_KEYS.some((key) => {
      const value = record[key];
      return value != null && value !== "";
    });
    if (!hasPriceParams) return;
    void navigate({ to: "/prices", search: record as never, replace: true });
  }, [location.search, navigate]);

  const fallers = useMemo(() => {
    const rows = snapshot.data ?? [];
    const trendMap = trends.data ?? {};
    return [...rows]
      .filter((row) => {
        const change = rangeChange(trendMap[row.id]);
        const price = priceOf(row);
        if (!Number.isFinite(change) || change >= 0) return false;
        if (price < 1_000) return false;
        return true;
      })
      .sort((a, b) => {
        const ca = rangeChange(trendMap[a.id]);
        const cb = rangeChange(trendMap[b.id]);
        return ca - cb || priceOf(b) - priceOf(a);
      })
      .slice(0, 6);
  }, [snapshot.data, trends.data]);

  const pricesSearch = {
    ...lastTabSearch("/prices"),
    sort: "losers",
    range: "1m",
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4">
      <header className="flex flex-col items-center text-center">
        <img
          src="/IMG_3249.jpeg"
          alt="Cheapscape"
          width={96}
          height={96}
          className="size-20 rounded-2xl object-cover shadow-[0_10px_30px_-12px_oklch(0_0_0/0.7)] ring-1 ring-white/10 sm:size-24"
        />
        <h1 className="mt-3 font-sans text-2xl font-bold tracking-tight sm:text-3xl">Cheapscape</h1>
        <p className="mt-1.5 max-w-md text-sm leading-snug text-muted-foreground">
          Live Grand Exchange prices and wiki-backed skilling methods — buy gear on a dip and pick
          an efficient way to train.
        </p>
      </header>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <section className="panel flex flex-col p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Top fallers · 1 month</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Biggest drops
            </span>
          </div>

          {snapshot.isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-md bg-secondary/40" />
              ))}
            </div>
          )}

          {snapshot.isError && (
            <p className="py-6 text-center text-sm text-destructive">
              Couldn't load live prices right now.
            </p>
          )}

          {!snapshot.isLoading && !snapshot.isError && fallers.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No clear 1-month drops in the catalog yet.
            </p>
          )}

          {!snapshot.isLoading && fallers.length > 0 && (
            <ul className="divide-y divide-border/40">
              {fallers.map((row) => {
                const change = rangeChange(trends.data?.[row.id]);
                return (
                  <li key={row.id}>
                    <Link
                      to="/item/$id"
                      params={{ id: String(row.id) }}
                      search={{ range: "1m" }}
                      className="flex items-center gap-2.5 py-2 hover:bg-secondary/30"
                    >
                      <WikiImage
                        icon={row.icon}
                        alt=""
                        width={22}
                        height={22}
                        className="size-5 shrink-0"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.name}</span>
                      <span className="shrink-0 text-xs font-semibold tabular-nums gold-text">
                        {gp(priceOf(row))}
                      </span>
                      <span
                        className="w-12 shrink-0 text-right text-xs font-bold tabular-nums"
                        style={{ color: "var(--deal)" }}
                      >
                        {change}%
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
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
        </section>

        <section className="panel flex flex-col p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Top methods</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              By skill
            </span>
          </div>

          <ul className="divide-y divide-border/40">
            {HOME_SKILL_HIGHLIGHTS.map((row) => (
              <li key={row.skill}>
                <Link
                  to="/methods"
                  search={{ ...lastTabSearch("/methods"), skill: row.skill } as never}
                  className="flex items-center gap-2.5 py-2 hover:bg-secondary/30"
                >
                  <WikiImage
                    icon={row.skillIcon}
                    alt=""
                    width={22}
                    height={22}
                    lazy={false}
                    className="size-5 shrink-0"
                  />
                  <span className="w-[5.5rem] shrink-0 text-sm font-medium">{row.label}</span>
                  <WikiImage
                    icon={row.methodIcon}
                    alt=""
                    width={18}
                    height={18}
                    className="size-4 shrink-0 opacity-80"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {row.method}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-4">
        <Link
          to="/methods"
          search={lastTabSearch("/methods") as never}
          className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-secondary/40 px-3 text-sm font-semibold text-foreground hover:bg-secondary/70"
        >
          <Pickaxe className="size-4" />
          Skilling methods
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </main>
  );
}
