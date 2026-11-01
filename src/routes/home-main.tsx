import { useState, useMemo } from "react";
import { ChevronDown, Search, X, Swords, TrendingDown, Calendar, Layers } from "lucide-react";
import {
  GEAR_COMBAT_FILTERS,
  GEAR_TYPE_FILTERS,
} from "@/lib/osrs-catalog";
import { formatCompact } from "@/lib/format";
import { ItemCard } from "@/components/ItemCard";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { meetsRequirements, firstMissingRequirement, type PlayerSkills } from "@/lib/player-stats";
import type { PriceRow, RangeKey, Trend } from "@/lib/osrs.server";
import type { UseQueryResult } from "@tanstack/react-query";
import { EquipmentPaperDoll, WikiIconTab } from "./home-ui";
import type { HomeSearch } from "./prices";
import { WikiImage } from "@/components/WikiImage";

type Filter = "all" | "gear" | "skilling" | "supplies";
type SortKey = "gainers" | "losers" | "expensive" | "cheap";

type HomeMainProps = {
  filter: Filter;
  handleFilterChange: (next: Filter) => void;
  gearCombat: string;
  gearSlot: string;
  gearType: string;
  skill: string;
  supplyType: string;
  query: string;
  sort: SortKey;
  range: RangeKey;
  priceMin?: number;
  priceMax?: number;
  patchSearch: (patch: Partial<HomeSearch>) => void;
  rsnDraft: string;
  setRsnDraft: (v: string) => void;
  activeRsn: string | null;
  playerQuery: UseQueryResult<{ name?: string; skills?: PlayerSkills }, Error>;
  playerSkills: PlayerSkills | null;
  loadRsn: (rsn: string) => void;
  clearRsn: (rsn?: string) => void;
  showGearSub: boolean;
  showSkillSub: boolean;
  showSupplySub: boolean;
  snapshot: UseQueryResult<PriceRow[], Error>;
  trends: UseQueryResult<Record<number, Trend>, Error>;
  allRows: PriceRow[];
  itemReqs: Record<number, Record<string, number>>;
  totalCost: number;
  gridKey: string;
};

const SORTS: { key: SortKey; label: string }[] = [
  { key: "losers", label: "Losers" },
  { key: "gainers", label: "Gainers" },
  { key: "cheap", label: "Cheap" },
  { key: "expensive", label: "Expensive" },
];

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "1d", label: "24h" },
  { key: "1w", label: "1w" },
  { key: "1m", label: "1m" },
  { key: "3m", label: "3m" },
  { key: "6m", label: "6m" },
  { key: "1y", label: "1y" },
];

export function HomeMain({
  filter,
  handleFilterChange,
  gearCombat,
  gearSlot,
  gearType,
  skill,
  supplyType,
  query,
  sort,
  range,
  priceMin,
  priceMax,
  patchSearch,
  snapshot,
  trends,
  allRows,
  itemReqs,
  totalCost,
  gridKey,
  playerSkills,
  showGearSub,
  showSkillSub,
  showSupplySub,
}: HomeMainProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const priceValue: [number, number] = [
    priceMin ?? 0,
    priceMax ?? 100_000_000,
  ];

  const avgChange = useMemo(() => {
    if (!trends.data || allRows.length === 0) return null;
    const sum = allRows.reduce((s, r) => s + (trends.data?.[r.id]?.changeWindow ?? 0), 0);
    return sum / allRows.length;
  }, [allRows, trends.data]);

  return (
    <main className="mx-auto w-full max-w-7xl px-3 pb-6 pt-0 sm:px-4">
      <div className="sticky top-0 z-30 -mx-3 border-b border-border/40 bg-background/95 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-4 sm:px-4">
        {/* Compact controls first */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {showGearSub && (
            <div className="relative">
              <Layers className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <select
                value={gearCombat}
                onChange={(e) => patchSearch({ combat: e.target.value })}
                className="h-9 appearance-none rounded-lg border border-border/60 bg-secondary/40 pl-7 pr-6 text-xs"
              >
                <option value="all">All style</option>
                {GEAR_COMBAT_FILTERS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <TrendingDown className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => patchSearch({ sort: e.target.value as SortKey })}
              className="h-9 appearance-none rounded-lg border border-border/60 bg-secondary/40 pl-7 pr-6 text-xs"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Calendar className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={range}
              onChange={(e) => patchSearch({ range: e.target.value as RangeKey })}
              className="h-9 appearance-none rounded-lg border border-border/60 bg-secondary/40 pl-7 pr-6 text-xs"
            >
              {RANGES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {searchOpen ? (
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => patchSearch({ q: e.target.value })}
                  placeholder="Search..."
                  className="h-9 w-40 pl-8 text-sm"
                  autoFocus
                />
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => {
                    patchSearch({ q: "" });
                    setSearchOpen(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-secondary/40"
              >
                <Search className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Type chips + expand */}
        {showGearSub && (
          <div className="mb-2 flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => patchSearch({ gearType: "all" })}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                gearType === "all"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-secondary/40"
              }`}
            >
              All
            </button>
            {GEAR_TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => patchSearch({ gearType: gearType === f.key ? "all" : f.key })}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                  gearType === f.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 bg-secondary/40"
                }`}
              >
                <WikiImage icon={f.wikiIcon} alt="" width={14} height={14} className="size-3.5" />
                {f.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              className="ml-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-secondary/40"
            >
              <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}

        {/* Price range slider — 1m steps */}
        <div className="mt-1 px-1">
          <Slider
            min={0}
            max={100_000_000}
            step={1_000_000}
            value={priceValue}
            onValueChange={([min, max]) =>
              patchSearch({
                priceMin: min === 0 ? undefined : min,
                priceMax: max >= 100_000_000 ? undefined : max,
              })
            }
            className="w-full"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{formatCompact(priceValue[0])}</span>
            <span>{priceValue[1] >= 100_000_000 ? "100m+" : formatCompact(priceValue[1])}</span>
          </div>
        </div>

        {/* Expanded silhouette under the arrow */}
        {expanded && showGearSub && (
          <div className="mt-2 rounded-lg border border-border/60 bg-secondary/20 p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <WikiIconTab
                active={gearCombat === "all"}
                onClick={() => patchSearch({ combat: "all" })}
                label="All"
                wikiIcon="Strength_icon.png"
              />
              {GEAR_COMBAT_FILTERS.map((f) => (
                <WikiIconTab
                  key={f.key}
                  active={gearCombat === f.key}
                  onClick={() => patchSearch({ combat: gearCombat === f.key ? "all" : f.key })}
                  label={f.label}
                  wikiIcon={f.wikiIcon}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-start gap-3">
              <EquipmentPaperDoll
                active={gearSlot}
                onSelect={(slot) => {
                  patchSearch({ slot });
                }}
              />
              <div className="min-w-[8rem] flex-1 rounded-md border border-border/50 bg-secondary/30 p-2 text-xs">
                <div className="font-medium text-foreground">{allRows.length} item{allRows.length === 1 ? "" : "s"}</div>
                {totalCost > 0 && (
                  <div className="text-muted-foreground">
                    Total: <span className="font-semibold tabular-nums text-foreground">{formatCompact(totalCost)} gp</span>
                  </div>
                )}
                {avgChange != null && (
                  <div className={avgChange >= 0 ? "text-green-500" : "text-red-500"}>
                    Avg {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showSkillSub && (
        <div className="mt-3 text-sm text-muted-foreground">Skill filters (simplified)</div>
      )}
      {showSupplySub && (
        <div className="mt-3 text-sm text-muted-foreground">Supply filters (simplified)</div>
      )}

      {snapshot.isLoading && (
        <div className="mt-4 grid grid-cols-2 gap-1.5 sm:gap-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="panel h-28 animate-pulse opacity-60 sm:h-40" />
          ))}
        </div>
      )}

      {!snapshot.isLoading && allRows.length > 0 && (
        <div key={gridKey} className="mt-3 grid grid-cols-2 gap-1.5 sm:gap-2 lg:grid-cols-3 xl:grid-cols-4">
          {allRows.map((row) => {
            const reqs = itemReqs[row.id];
            const locked = playerSkills != null && !meetsRequirements(playerSkills, reqs);
            const lockReason = locked ? firstMissingRequirement(playerSkills, reqs) : null;
            return (
              <ItemCard
                key={row.id}
                row={row}
                trend={trends.data?.[row.id]}
                locked={locked}
                lockReason={lockReason}
              />
            );
          })}
        </div>
      )}

      {!snapshot.isLoading && allRows.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">Nothing matches that filter right now.</p>
      )}

      <footer className="mt-16 border-t border-border/60 pt-6 text-xs text-muted-foreground">
        Price data from the OSRS Wiki real-time Grand Exchange API. Not affiliated with Jagex.
      </footer>
    </main>
  );
}
