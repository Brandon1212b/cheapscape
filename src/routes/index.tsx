import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ChartLine, ChevronDown } from "lucide-react";

import { CheapscapeWordmark } from "@/components/BrandSurface";
import { WikiImage } from "@/components/WikiImage";
import { useMarketData } from "@/hooks/useMarketData";
import { useEndgameTrends } from "@/hooks/useEndgameTrends";
import { gp } from "@/lib/format";
import { lateEndgameOpportunities, type HomeFaller, type Period } from "@/lib/home-fallers";
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

  const [period, setPeriod] = useState<Period>("30");
  const [includeUnder1m, setIncludeUnder1m] = useState(true);

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

  const allBuyers = useMemo(
    () => lateEndgameOpportunities(snapshot.data ?? [], endgameTrends.data, "buy", 50, period),
    [snapshot.data, endgameTrends.data, period],
  );
  const allSellers = useMemo(
    () => lateEndgameOpportunities(snapshot.data ?? [], endgameTrends.data, "sell", 50, period),
    [snapshot.data, endgameTrends.data, period],
  );

  const buyers = useMemo(
    () =>
      allBuyers
        .filter((r) => includeUnder1m || r.price >= 1_000_000)
        .slice(0, 10),
    [allBuyers, includeUnder1m],
  );
  const sellers = useMemo(
    () =>
      allSellers
        .filter((r) => includeUnder1m || r.price >= 1_000_000)
        .slice(0, 10),
    [allSellers, includeUnder1m],
  );

  const pricesSearch = {
    ...lastTabSearch("/prices"),
    filter: "gear",
    tier: "all",
    sort: "losers",
    range: "1m",
  };

  const periodLabel = period === "1" ? "1D" : period === "7" ? "7D" : "30D";

  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4">
      <header className="flex flex-col items-center text-center">
        <h1 className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0" style={{ clip: "rect(0, 0, 0, 0)" }}>
          Cheapscape
        </h1>
        <CheapscapeWordmark />
      </header>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <section className="panel flex flex-col p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Top 10 buying opportunities</h2>
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
  return (
    <div className="flex items-center gap-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      <span className="size-5 shrink-0" />
      <span className="min-w-0 flex-1 text-left">Item</span>
      <span className="hidden w-10 shrink-0 sm:block" />
      <span className="w-16 shrink-0 text-right">Price</span>
      <div className="relative w-10 shrink-0 text-right">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="w-full appearance-none bg-transparent pr-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground outline-none"
          style={{ fontSize: "10px", lineHeight: "1", height: "14px" }}
        >
          <option value="1">1D</option>
          <option value="7">7D</option>
          <option value="30">30D</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-0 top-0 size-2.5" />
      </div>
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
      className="w-12 shrink-0 text-right text-xs font-bold tabular-nums"
      style={{ color: base, opacity }}
    >
      {value > 0 ? "+" : ""}{value}%
    </span>
  );
}

function TinySparkline({ series }: { series: { t: number; p: number }[] }) {
  if (series.length < 2) return null;
  const w = 40;
  const h = 16;
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
    <svg viewBox={`0 0 ${w} ${h}`} className="hidden h-4 w-10 shrink-0 sm:block" preserveAspectRatio="none" aria-hidden>
      <path d={pts} fill="none" stroke={up ? "var(--deal)" : "var(--steep)"} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function NearTag({ row }: { row: HomeFaller }) {
  if (row.low180 == null || row.price <= 0) return null;
  const dist = (row.price - row.low180) / row.price;
  if (dist < 0.08 || (row.percentile != null && row.percentile <= 12)) {
    return (
      <span className="ml-1 align-middle rounded bg-steep/15 px-1 text-[9px] font-semibold uppercase tracking-wide text-steep">
        near low
      </span>
    );
  }
  if (row.high180 != null) {
    const distHigh = (row.high180 - row.price) / row.price;
    if (distHigh < 0.08 || (row.percentile != null && row.percentile >= 88)) {
      return (
        <span className="ml-1 align-middle rounded bg-deal/15 px-1 text-[9px] font-semibold uppercase tracking-wide text-deal">
          near high
        </span>
      );
    }
  }
  return null;
}

const FALLER_ROW_CLASS = "flex items-center gap-2 py-2 hover:bg-secondary/30";

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
      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
        {row.name}
        {row.kind === "set" && (
          <span className="ml-1 align-middle text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            set
          </span>
        )}
        <NearTag row={row} />
      </span>
      <TinySparkline series={row.series} />
      <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums gold-text">{gp(row.price)}</span>
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
