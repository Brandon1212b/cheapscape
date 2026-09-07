import { useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ChartLine, Pickaxe } from "lucide-react";

import { WikiImage } from "@/components/WikiImage";
import { useMarketData } from "@/hooks/useMarketData";
import { compactNum, gp } from "@/lib/format";
import { homeMethodRates } from "@/lib/home-highlights";
import { endgameFallers } from "@/lib/home-fallers";
import { lastTabSearch } from "@/lib/tab-memory";
import type { PriceRow } from "@/lib/osrs.server";

export type { HomeSearch } from "./prices";

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

  const fallers = useMemo(
    () => endgameFallers(snapshot.data ?? [], trends.data, 6),
    [snapshot.data, trends.data],
  );

  const rowsByName = useMemo(() => {
    const map = new Map<string, PriceRow>();
    for (const row of snapshot.data ?? []) {
      map.set(row.name, row);
    }
    return map;
  }, [snapshot.data]);

  const methods = useMemo(() => homeMethodRates(rowsByName), [rowsByName]);

  const pricesSearch = {
    ...lastTabSearch("/prices"),
    filter: "gear",
    tier: "end",
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
              Endgame gear
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
              No endgame gear is down over the last month.
            </p>
          )}

          {!snapshot.isLoading && fallers.length > 0 && (
            <ul className="divide-y divide-border/40">
              {fallers.map((row) => (
                <li key={row.key}>
                  <Link
                    to="/item/$id"
                    params={{ id: String(row.itemId) }}
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
                      {gp(row.price)}
                    </span>
                    <span
                      className="w-12 shrink-0 text-right text-xs font-bold tabular-nums"
                      style={{ color: "var(--deal)" }}
                    >
                      {row.change}%
                    </span>
                  </Link>
                </li>
              ))}
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
              XP / GP
            </span>
          </div>

          <ul className="divide-y divide-border/40">
            {methods.map((row) => (
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <WikiImage
                        icon={row.methodIcon}
                        alt=""
                        width={16}
                        height={16}
                        className="size-4 shrink-0 opacity-80"
                      />
                      <span className="truncate text-sm font-medium">{row.method}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                      {row.xpPerHour != null ? `${compactNum(row.xpPerHour)} xp/h` : "— xp/h"}
                      {" · "}
                      <span
                        style={{
                          color:
                            row.gpPerHour == null
                              ? undefined
                              : row.gpPerHour >= 0
                                ? "var(--deal)"
                                : "var(--steep)",
                        }}
                      >
                        {row.gpPerHour != null ? `${gp(row.gpPerHour)} gp/h` : "— gp/h"}
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <Link
            to="/methods"
            search={lastTabSearch("/methods") as never}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Pickaxe className="size-4" />
            Skilling methods
            <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
