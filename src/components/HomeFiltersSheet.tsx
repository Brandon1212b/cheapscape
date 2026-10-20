import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Loader2, SlidersHorizontal, User, X, Landmark } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PopupDismissShield, PopupPortal, swallowBehindPopup } from "@/components/popup-dismiss-shield";
import {
  GEAR_COMBAT_FILTERS,
  SKILLING_FILTERS,
  SUPPLIES_FILTERS,
} from "@/lib/osrs-catalog";
import type { PlayerSkills } from "@/lib/player-stats";
import type { RangeKey } from "@/lib/osrs.server";
import { parseBankDump, writeBank, readBank } from "@/lib/bank";

type Filter = "all" | "gear" | "skilling" | "supplies" | "bank";
type SortKey = "gainers" | "losers" | "expensive" | "cheap" | "value";

const CATEGORIES: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "gear", label: "Gear" },
  { key: "skilling", label: "Skilling items" },
  { key: "supplies", label: "Supplies" },
  { key: "bank", label: "My bank" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "gainers", label: "Gainers" },
  { key: "losers", label: "Losers" },
  { key: "expensive", label: "Expensive" },
  { key: "cheap", label: "Cheap" },
  { key: "value", label: "Best value" },
];

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "1d", label: "24h" },
  { key: "1w", label: "1w" },
  { key: "1m", label: "1m" },
  { key: "3m", label: "3m" },
  { key: "6m", label: "6m" },
  { key: "1y", label: "1y" },
];

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export function HomeFiltersButton({
  onClick,
  activeRsn,
  marked,
  className = "",
}: {
  onClick?: () => void;
  activeRsn?: string | null;
  marked?: boolean;
  className?: string;
}) {
  const showDot = Boolean(marked ?? activeRsn);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={activeRsn ? `Open filters, player ${activeRsn}` : "Open filters"}
      title={activeRsn ? `Filters · ${activeRsn}` : "Filters"}
      className={`relative z-[90] inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-foreground hover:bg-secondary/60 ${className}`}
    >
      <SlidersHorizontal className="size-4" />
      {showDot ? (
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" aria-hidden />
      ) : null}
    </button>
  );
}

export function HomeFiltersSheet({
  open,
  onOpenChange,
  filter,
  gearCombat,
  skill,
  supplyType,
  sort,
  range,
  rsnDraft,
  setRsnDraft,
  activeRsn,
  playerQuery,
  loadRsn,
  clearRsn,
  onFilterChange,
  onCombatChange,
  onSkillChange,
  onSupplyChange,
  onSortChange,
  onRangeChange,
  bankCount,
  onBankUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: Filter;
  gearCombat: string;
  skill: string;
  supplyType: string;
  sort: SortKey;
  range: RangeKey;
  rsnDraft: string;
  setRsnDraft: (v: string) => void;
  activeRsn: string | null;
  playerQuery: UseQueryResult<{ name?: string; skills?: PlayerSkills }, Error>;
  loadRsn: (rsn: string) => void;
  clearRsn: () => void;
  onFilterChange: (next: Filter) => void;
  onCombatChange: (next: string) => void;
  onSkillChange: (next: string) => void;
  onSupplyChange: (next: string) => void;
  onSortChange: (next: SortKey) => void;
  onRangeChange: (next: RangeKey) => void;
  bankCount?: number;
  onBankUpdated?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const [dump, setDump] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useLayoutEffect(() => {
    if (!open) {
      setAnchor(null);
      return;
    }
    const update = () => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setAnchor({ top: r.bottom + 8, right: Math.max(12, window.innerWidth - r.right) });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  const toggle = () => {
    if (open) swallowBehindPopup();
    onOpenChange(!open);
  };

  const loadDump = () => {
    const parsed = parseBankDump(dump);
    if (parsed.length === 0) {
      toast.error("No items found. Try 'Dragon bones x 5000' or tab-separated.");
      return;
    }
    writeBank(parsed);
    onBankUpdated?.();
    setDump("");
    toast.success(`Loaded ${parsed.length} items`);
  };

  const clearBank = () => {
    writeBank([]);
    onBankUpdated?.();
    toast("Bank cleared");
  };

  return (
    <div ref={rootRef} className={`relative shrink-0 ${open ? "z-[90]" : ""}`}>
      <HomeFiltersButton activeRsn={activeRsn} onClick={toggle} />
      {open ? (
        <>
          <PopupDismissShield onDismiss={() => onOpenChange(false)} />
          {anchor ? (
            <PopupPortal>
              <div
                className="fixed z-[90] w-[min(22rem,calc(100vw-1.5rem))] rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
                style={{ top: anchor.top, right: anchor.right }}
              >
                <div className="max-h-[min(70dvh,32rem)] space-y-4 overflow-y-auto pr-0.5">
                  <p className="text-sm font-semibold text-foreground">Filters</p>
                  <section className="space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Player
                    </p>
                    <form
                      className="flex items-center gap-1.5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        loadRsn(rsnDraft);
                      }}
                    >
                      <div className="relative min-w-0 flex-1">
                        <User className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={rsnDraft}
                          onChange={(e) => setRsnDraft(e.target.value)}
                          placeholder="RSN..."
                          className="h-10 pl-8 pr-8 text-base"
                          aria-label="Old School RuneScape username"
                          autoComplete="username"
                        />
                        {activeRsn && (
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="Clear player"
                            onClick={clearRsn}
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={!rsnDraft.trim() || playerQuery.isFetching}
                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary/60 px-3 text-xs font-semibold transition-colors hover:bg-secondary disabled:opacity-50"
                      >
                        {playerQuery.isFetching ? <Loader2 className="size-3.5 animate-spin" /> : "Load"}
                      </button>
                    </form>
                    {activeRsn && !playerQuery.isError && (
                      <p className="text-[11px] text-muted-foreground">
                        Locked items hide gear above {activeRsn}'s levels.
                      </p>
                    )}
                    {playerQuery.isError && (
                      <p className="text-[11px] text-destructive">
                        {(playerQuery.error as Error)?.message ?? "Lookup failed"}
                      </p>
                    )}
                  </section>

                  <section className="space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Category</p>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((c) => (
                        <Chip
                          key={c.key}
                          active={filter === c.key}
                          onClick={() => onFilterChange(c.key)}
                          label={c.label}
                        />
                      ))}
                    </div>
                    {filter === "gear" && (
                      <>
                        <p className="pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Gear style</p>
                        <div className="flex flex-wrap gap-1.5">
                          {GEAR_COMBAT_FILTERS.map((c) => (
                            <Chip
                              key={c.key}
                              active={gearCombat === c.key}
                              onClick={() => onCombatChange(gearCombat === c.key ? "all" : c.key)}
                              label={c.label}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    {filter === "skilling" && (
                      <>
                        <p className="pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Skill</p>
                        <div className="flex flex-wrap gap-1.5">
                          {SKILLING_FILTERS.map((c) => (
                            <Chip
                              key={c.key}
                              active={skill === c.key}
                              onClick={() => onSkillChange(skill === c.key ? "all" : c.key)}
                              label={c.label}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    {filter === "supplies" && (
                      <>
                        <p className="pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Supplies</p>
                        <div className="flex flex-wrap gap-1.5">
                          {SUPPLIES_FILTERS.map((c) => (
                            <Chip
                              key={c.key}
                              active={supplyType === c.key}
                              onClick={() => onSupplyChange(supplyType === c.key ? "all" : c.key)}
                              label={c.label}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    {filter === "bank" && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                          <Landmark className="size-3" />
                          My bank {bankCount != null && bankCount > 0 ? `(${bankCount})` : ""}
                        </p>
                        <textarea
                          value={dump}
                          onChange={(e) => setDump(e.target.value)}
                          placeholder="Paste bank dump...\nDragon bones x 2500\nAbyssal whip\t1"
                          rows={4}
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60"
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={loadDump}
                            disabled={!dump.trim()}
                            className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            Load
                          </button>
                          {bankCount != null && bankCount > 0 && (
                            <button
                              type="button"
                              onClick={clearBank}
                              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Supports tab-separated, "name x qty", or "name qty". Only catalog items are shown.
                        </p>
                      </div>
                    )}
                  </section>
                  <section className="space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sort</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SORTS.map((s) => (
                        <Chip key={s.key} active={sort === s.key} onClick={() => onSortChange(s.key)} label={s.label} />
                      ))}
                    </div>
                  </section>
                  <section className="space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Range</p>
                    <div className="flex flex-wrap gap-1.5">
                      {RANGES.map((r) => (
                        <Chip key={r.key} active={range === r.key} onClick={() => onRangeChange(r.key)} label={r.label} />
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </PopupPortal>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
