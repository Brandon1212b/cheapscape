import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ChartLine, Pickaxe } from "lucide-react";

import { CheapscapeWordmark } from "@/components/BrandSurface";
import { WikiImage } from "@/components/WikiImage";
import { useMarketData } from "@/hooks/useMarketData";
import { useEndgameTrends } from "@/hooks/useEndgameTrends";
import { compactNum, gp } from "@/lib/format";
import { homeMethodRates } from "@/lib/home-highlights";
import { lateEndgameOpportunities, type HomeFaller, type Period } from "@/lib/home-fallers";
import { lastHomeRange, lastTabSearch, writeLastSkill, writeTabSearch } from "@/lib/tab-memory";
import { buildPriceRowsByName } from "@/lib/price-lookup";
import { CATALOG, GEAR_TYPE_FILTERS } from "@/lib/osrs-catalog";
import { geLookupName } from "@/lib/ge-name-aliases";

export type { HomeSearch } from "./prices";

/** Old bookmarks used `/?filter=gear`. Do not treat `range`/`sort` as prices params —
 *  those also belong to `/item/$id` and would bounce item clicks back to Prices. */
const PRICE_REDIRECT_KEYS = ["filter", "q", "combat", "slot", "tier", "set", "supply", "gearType"] as const;

const PERIODS: Period[] = ["1", "7", "30"];

const ARMOUR_SLOTS = ["head", "chest", "legs", "shield", "hands", "feet", "cape"];
const JEWELRY_SLOTS = ["neck", "ring"];

function nextPeriod(p: Period): Period {
  const i = PERIODS.indexOf(p);
  return PERIODS[(i + 1) % PERIODS.length]!;
}

function matchesGearType(tags: string[], gearType: string): boolean {
  if (gearType === "all") return true;
  if (gearType === "weapon") return tags.includes("weapon");
  if (gearType === "armour") return ARMOUR_SLOTS.some((s) => tags.includes(s));
  if (gearType === "jewelry") return JEWELRY_SLOTS.some((s) => tags.includes(s));
  return true;
}

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

  const [period, setPeriod] = useState<Period>("30");
  const [includeUnder1m, setIncludeUnder1m] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [gearType, setGearType] = useState<string>("all");

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

  const tagMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const g of CATALOG) {
      for (const i of g.items) {
        map.set(i.name.toLowerCase(), i.tags);
        map.set(geLookupName(i.name).toLowerCase(), i.tags);
      }
    }
    return map;
  }, []);

  const allBuyers = useMemo(
    () => lateEndgameOpportunities(snapshot.data ?? [], endgameTrends.data, "buy", 50, period),
    [snapshot.data, endgameTrends.data, period],
  );
  const allSellers = useMemo(
    () => lateEndgameOpportunities(snapshot.data ?? [], endgameTrends.data, "sell", 50, period),
    [snapshot.data, endgameTrends.data, period],
  );

  const filteredBuyers = useMemo(
    () =>
      allBuyers.filter((r) => {
        if (!(includeUnder1m || r.price >= 1_000_000)) return false;
        const tags = tagMap.get(r.name.toLowerCase()) ?? [];
        return matchesGearType(tags, gearType);
      }),
    [allBuyers, includeUnder1m, gearType, tagMap],
  );
  const filteredSellers = useMemo(
    () =>
      allSellers.filter((r) => {
        if (!(includeUnder1m || r.price >= 1_000_000)) return false;
        const tags = tagMap.get(r.name.toLowerCase()) ?? [];
        return matchesGearType(tags, gearType);
      }),
    [allSellers, includeUnder1m, gearType, tagMap],
  );

  const limit = showMore ? 50 : 10;
  const buyers = useMemo(() => filteredBuyers.slice(0, limit), [filteredBuyers, limit]);
  const sellers = useMemo(() => filteredSellers.slice(0, limit), [filteredSellers, limit]);

  const rowsByName = useMemo(() => buildPriceRowsByName(snapshot.data ?? []), [snapshot.data]);

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
    tier: "all",
    sort: "losers",
    range: "1m",
    gearType,
  };

  const periodLabel = period === "1" ? "1D" : period === "7" ? "7D" : "30D";

  const openSkill = (skill: string) => {
    writeLastSkill(skill);
    writeTabSearch("/methods", { skill });
    void navigate({ to: "/methods", search: { skill } });
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4">
      <header className="flex flex-col items-center text-center">
        <h1 className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0" style={{ clip: "rect(0, 0, 0, 0)" }}>
          Cheapscape
        </h1>
        <CheapscapeWordmark />
      </header>

      <div className="mt-4 flex justify-center gap-1.5">
        <button
          type="button"
          onClick={() => setGearType("all")}
          className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            gearType === "all" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary/40"
          }`}
        >
          All
        </button>
        {GEAR_TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setGearType(gearType === f.key ? "all" : f.key)}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              gearType === f.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary/40"
            }`}
          >
            <WikiImage icon={f.wikiIcon} alt="" width={14} height={14} className="size-3.5" />
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <section className="panel flex flex-col p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Buying opportunities</h2>
            <Under1mToggle includeUnder1m={includeUnder1m} setIncludeUnder1m={setIncludeUnder1m} />
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
              No gear is down over the last {periodLabel.toLowerCase()}.
            </p>
          )}

          {!snapshot.isLoading && buyers.length > 0 && (
            <>
              <ChangeHeader period={period} setPeriod={setPeriod} />
              <ul className="divide-y divide-border/40">
                {buyers.map((row) => (
                  <li key={row.key}>
                    <HomeFallerLink row={row} pricesSearch={pricesSearch} period={period} />
                  </li>
                ))}
              </ul>
              {filteredBuyers.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowMore(!showMore)}
                  className="mt-2 w-full py-1.5 text-center text-xs font-medium text-primary hover:underline"
                >
                  {showMore ? "Show less" : `Show more (${filteredBuyers.length - 10}+)`}
                </button>
              )}
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
            <h2 className="text-sm font-semibold">Selling opportunities</h2>
            <Under1mToggle includeUnder1m={includeUnder1m} setIncludeUnder1m={setIncludeUnder1m} />
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
              No gear is up over the last {periodLabel.toLowerCase()}.
            </p>
          )}

          {!snapshot.isLoading && sellers.length > 0 && (
            <>
              <ChangeHeader period={period} setPeriod={setPeriod} />
              <ul className="divide-y divide-border/40">
                {sellers.map((row) => (
                  <li key={row.key}>
                    <HomeFallerLink row={row} pricesSearch={pricesSearch} period={period} />
                  </li>
                ))}
              </ul>
              {filteredSellers.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowMore(!showMore)}
                  className="mt-2 w-full py-1.5 text-center text-xs font-medium text-primary hover:underline"
                >
                  {showMore ? "Show less" : `Show more (${filteredSellers.length - 10}+)`}
                </button>
              )}
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
            Biggest risers among gear
          </p>
        </section>
      </div>

      <section className="panel mt-3 flex flex-col p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Top methods</h2>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Best cost
          </span>
        </div>

        <ul className="grid grid-cols-2 gap-x-2 divide-y divide-border/40 sm:grid-cols-3">
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

function Under1mToggle({
  includeUnder1m,
  setIncludeUnder1m,
}: {
  includeUnder1m: boolean;
  setIncludeUnder1m: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => setIncludeUnder1m(!includeUnder1m)}
      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors ${
        includeUnder1m
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
      }`}
    >
      {includeUnder1m ? "Under 1M" : "No under 1M"}
    </button>
  );
}

function ChangeHeader({
  period,
  setPeriod,
}: {
  period: Period;
  setPeriod: (p: Period) => void;
}) {
  const label = period === "1" ? "1D" : period === "7" ? "7D" : "30D";
  return (
    <div className="flex items-center gap-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:gap-2">
      <span className="size-5 shrink-0" />
      <span className="min-w-0 flex-1 text-left">Item</span>
      <span className="w-8 shrink-0 sm:w-10" />
      <span className="w-14 shrink-0 text-right sm:w-16">Price</span>
      <button
        type="button"
        onClick={() => setPeriod(nextPeriod(period))}
        className="w-9 shrink-0 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground sm:w-10"
      >
        {label}
      </button>
    </div>
  );
}

function ChangeCell({ value }: { value: number }) {
  const abs = Math.abs(value);
  const intensity = Math.min(1, abs / 15);
  const base = value >= 0 ? "var(--deal)" : "var(--steep)";
  const opacity = 0.45 + intensity * 0.55;
  return (
    <span
      className="w-10 shrink-0 text-right text-xs font-bold tabular-nums sm:w-12"
      style={{ color: base, opacity }}
    >
      {value > 0 ? "+" : ""}{value}%
    </span>
  );
}

function TinySparkline({ series }: { series: { t: number; p: number }[] }) {
  if (series.length < 2) return null;
  const w = 32;
  const h = 14;
  const prices = series.map((s) => s.p);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const pts = series.map((s, i) => {
    const x = (i / (series.length - 1)) * w;
    const y = h - ((s.p - min) / span) * (h - 2) - 1;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = series[series.length - 1]!.p;
  const first = series[0]!.p;
  const up = last >= first;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-3.5 w-8 shrink-0 sm:h-4 sm:w-10" preserveAspectRatio="none" aria-hidden>
      <path d={pts} fill="none" stroke={up ? "var(--deal)" : "var(--steep)"} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function NearTag({ row }: { row: HomeFaller }) {
  if (row.low180 == null || row.price <= 0) return null;
  const dist = (row.price - row.low180) / row.price;
  if (dist < 0.08 || (row.percentile != null && row.percentile <= 12)) {
    return (
      <span className="ml-1 align-middle rounded bg-steep/15 px-1 text-[8px] font-semibold uppercase tracking-wide text-steep sm:text-[9px]">
        near low
      </span>
    );
  }
  if (row.high180 != null) {
    const distHigh = (row.high180 - row.price) / row.price;
    if (distHigh < 0.08 || (row.percentile != null && row.percentile >= 88)) {
      return (
        <span className="ml-1 align-middle rounded bg-deal/15 px-1 text-[8px] font-semibold uppercase tracking-wide text-deal sm:text-[9px]">
          near high
        </span>
      );
    }
  }
  return null;
}

const FALLER_ROW_CLASS = "flex items-center gap-1.5 py-2 hover:bg-secondary/30 sm:gap-2";

/** Single items open the detail page. Armour sets keep filtering Prices by name. */
function HomeFallerLink({
  row,
  pricesSearch,
  period,
}: {
  row: HomeFaller;
  pricesSearch: Record<string, unknown>;
  period: Period;
}) {
  const change = period === "1" ? row.change1 : period === "7" ? row.change7 : row.change30;
  const inner = (
    <>
      <WikiImage icon={row.icon} alt="" width={22} height={22} className="size-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left text-xs font-medium sm:text-sm">
        {row.name}
        {row.kind === "set" && (
          <span className="ml-1 align-middle text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px]">
            set
          </span>
        )}
        <NearTag row={row} />
      </span>
      <TinySparkline series={row.series} />
      <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums gold-text sm:w-16">{gp(row.price)}</span>
      <ChangeCell value={change} />
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
