import { useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ChartLine, Pickaxe } from "lucide-react";

import { WikiImage } from "@/components/WikiImage";
import { useMarketData } from "@/hooks/useMarketData";
import { compactNum, gp } from "@/lib/format";
import { homeMethodRates } from "@/lib/home-highlights";
import { endgameFallers } from "@/lib/home-fallers";
import { lastTabSearch, writeLastSkill, writeTabSearch } from "@/lib/tab-memory";
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
  "supply",
] as const;

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

  const savedMethods = lastTabSearch("/methods");
  const moneyPerHour =
    typeof savedMethods.g === "number" && Number.isFinite(savedMethods.g)
      ? savedMethods.g
      : 2_000_000;
  const methods = useMemo(
    () => homeMethodRates(rowsByName, moneyPerHour),
    [rowsByName, moneyPerHour],
  );

  const pricesSearch = {
    ...lastTabSearch("/prices"),
    filter: "gear",
    tier: "end",
    sort: "losers",
    range: "1m",
  };

  const openSkill = (skill: string) => {
    writeLastSkill(skill);
    writeTabSearch("/methods", { skill });
    void navigate({ to: "/methods", search: { skill } });
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
              {fallers.map((row) => {
                const inner = (
                  <>
                    <WikiImage
                      icon={row.icon}
                      alt=""
                      width={22}
                      height={22}
                      className="size-5 shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {row.name}
                      {row.kind === "set" && (
                        <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          set
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs font-semibold tabular-nums gold-text">
                      {gp(row.price)}
                    </span>
                    <span
                      className="w-12 shrink-0 text-right text-xs font-bold tabular-nums"
                      style={{ color: "var(--deal)" }}
                    >
                      {row.change}%
                    </span>
                  </>
                );

                return (
                  <li key={row.key}>
                    {row.kind === "set" ? (
                      <Link
                        to="/prices"
                        search={
                          {
                            ...pricesSearch,
                            q: row.query,
                          } as never
                        }
                        className="flex items-center gap-2.5 py-2 hover:bg-secondary/30"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <Link
                        to="/item/$id"
                        params={{ id: String(row.itemId) }}
                        search={{ range: "1m" }}
                        className="flex items-center gap-2.5 py-2 hover:bg-secondary/30"
                      >
                        {inner}
                      </Link>
                    )}
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
          <p className="mt-1.5 text-center text-[11px] leading-snug text-muted-foreground">
            Live GE prices focused on useful gear to buy, not to flip
          </p>
        </section>

        <section className="panel flex flex-col p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Top methods</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Best cost
            </span>
          </div>

          <ul className="grid grid-cols-2 gap-x-2 divide-y divide-border/40">
            {methods.map((row) => (
              <li key={row.skill} className="min-w-0">
                <Link
                  to="/methods"
                  search={{ skill: row.skill }}
                  href={`/methods?skill=${encodeURIComponent(row.skill)}`}
                  onClick={() => {
                    writeLastSkill(row.skill);
                    writeTabSearch("/methods", { skill: row.skill });
                  }}
                  className="flex items-start gap-2 py-1.5 hover:bg-secondary/30"
                >
                  <WikiImage
                    icon={row.skillIcon}
                    alt=""
                    width={22}
                    height={22}
                    lazy={false}
                    className="mt-0.5 size-5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium leading-tight">{row.method}</span>
                    <p className="mt-0.5 truncate text-[10px] tabular-nums text-muted-foreground">
                      {row.xpPerHour != null ? `${compactNum(row.xpPerHour)} xp/h` : "—"}
                      {" \u00b7 "}
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
                        {row.gpPerHour != null ? `${gp(row.gpPerHour)}` : "—"}
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() =>
              openSkill(typeof savedMethods.skill === "string" ? savedMethods.skill : "smithing")
            }
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Pickaxe className="size-4" />
            Skilling methods
            <ArrowRight className="size-4" />
          </button>
          <p className="mt-1.5 text-center text-[11px] leading-snug text-muted-foreground">
            Skilling methods right from the wiki with the ability to account for opportunity cost
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
