import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ChevronLeft, ExternalLink, RefreshCw } from "lucide-react";
import { fetchItemDetail, fetchWikiRecommended } from "@/lib/osrs.functions";
import type { WikiRecUse } from "@/lib/wiki-recommended";
import type { EquipmentStats, RangeKey } from "@/lib/osrs.server";
import { CATALOG } from "@/lib/osrs-catalog";
import { PriceChart } from "@/components/PriceChart";
import { WikiImage } from "@/components/WikiImage";
import { gp, formatCompact, signalOf, timeAgo } from "@/lib/format";
import { lastHomeRange, lastTabSearch } from "@/lib/tab-memory";

const RANGE_KEYS: RangeKey[] = ["1d", "1w", "1m", "3m", "6m", "1y"];
const RANGES: { key: RangeKey; label: string }[] = [
  { key: "1d", label: "24h" },
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
];

const BONUS_ICONS = {
  stab: "White_dagger.png",
  slash: "White_scimitar.png",
  crush: "White_warhammer.png",
  magic: "Magic_icon.png",
  ranged: "Ranged_icon.png",
  strength: "Strength_icon.png",
  rangedStr: "Ranged_Strength_icon.png",
  magicDmg: "Magic_Damage_icon.png",
  prayer: "Prayer_icon.png",
  attack: "Attack_icon.png",
  defence: "Defence_icon.png",
  other: "Melee.png",
} as const;

type ItemSearch = { range?: RangeKey };

export const Route = createFileRoute("/item/$id")({
  validateSearch: (search: Record<string, unknown>): ItemSearch => {
    const raw = search.range;
    return {
      range: typeof raw === "string" && RANGE_KEYS.includes(raw as RangeKey) ? (raw as RangeKey) : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Item price & history — GE Watch OSRS" },
      {
        name: "description",
        content:
          "Live Grand Exchange price, historical range chart and wiki training-method notes for an Old School RuneScape item.",
      },
      { property: "og:title", content: "Item price & history — GE Watch OSRS" },
      {
        property: "og:description",
        content: "Live OSRS Grand Exchange price with 24h to 1 year range charts and buy signals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ItemPage,
});

function groupFor(name: string) {
  return CATALOG.find((g) => g.items.some((i) => i.name === name));
}

function fmtBonus(n: number, suffix = "") {
  const s = n > 0 ? `+${n}` : String(n);
  return s + suffix;
}

function activityGroup(method: string): string {
  const m = method.toLowerCase();
  if (m.includes("slayer")) return "Slayer";
  if (m.includes("theatre of blood") || m.includes("entry mode")) return "ToB";
  if (m.includes("chambers of xeric")) return "CoX";
  if (m.includes("tombs of amascut")) return "ToA";
  if (
    m.includes("wilderness") ||
    m.includes("revenant") ||
    m.includes("callisto") ||
    m.includes("vet'ion") ||
    m.includes("venenatis") ||
    m.includes("spindel") ||
    m.includes("artio") ||
    m.includes("calvar'ion")
  ) {
    return "Wilderness";
  }
  if (m.includes("nightmare zone")) return "NMZ";
  if (m.includes("fight cave") || m.includes("inferno") || m.includes("colosseum")) return "TzHaar";
  if (m.includes("ultimate ironman")) return "UIM";
  if (m.includes("barbarian assault") || m.includes("pest control") || m.includes("tempoross") || m.includes("wintertodt")) {
    return "Minigames";
  }
  return method.split("/")[0]?.replace(/_/g, " ").trim() || "Other";
}

function ItemPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const router = useRouter();
  const [range, setRange] = useState<RangeKey>(search.range ?? lastHomeRange());
  const getDetail = useServerFn(fetchItemDetail);
  const getWikiRec = useServerFn(fetchWikiRecommended);

  useEffect(() => {
    if (search.range && search.range !== range) setRange(search.range);
  }, [search.range]);

  const setChartRange = (next: RangeKey) => {
    setRange(next);
    void router.navigate({
      to: "/item/$id",
      params: { id },
      search: { range: next },
      replace: true,
    });
  };

  const detail = useQuery({
    queryKey: ["item", id, range],
    queryFn: () => getDetail({ data: { id: Number(id), range } }),
    refetchInterval: 120_000,
  });

  const d = detail.data;
  const row = d?.row;
  const signal = signalOf(d?.trend ?? undefined);
  const group = row ? groupFor(row.name) : undefined;
  const price = row ? (row.high ?? row.low) : null;
  const eq = d?.equipment ?? null;
  const cheapPct = d?.trend != null ? Math.max(0, 100 - d.trend.percentile) : null;
  const alchVsBuy =
    row?.highalch != null && price != null ? row.highalch - price : null;

  const wikiRec = useQuery({
    queryKey: ["wiki-rec", row?.name],
    queryFn: () => getWikiRec({ data: { name: row!.name } }),
    enabled: Boolean(row?.name),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
      return;
    }
    void router.navigate({ to: "/", search: lastTabSearch("/") as never });
  };

  useEffect(() => {
    let startX = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0]?.clientX ?? 0;
    };
    const onEnd = (e: TouchEvent) => {
      const x = e.changedTouches[0]?.clientX ?? 0;
      if (startX <= 28 && x - startX >= 72) goBack();
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [router]);

  const wikiItemHref = row
    ? `https://oldschool.runescape.wiki/w/${encodeURIComponent(row.name.replace(/ /g, "_"))}`
    : "";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6">
      <button
        type="button"
        onClick={goBack}
        aria-label="Back"
        className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-foreground hover:bg-secondary/60"
      >
        <ChevronLeft className="size-6" />
      </button>

      {detail.isLoading && <div className="panel mt-4 h-[520px] animate-pulse opacity-60" />}

      {detail.isError && (
        <p className="mt-8 text-sm text-destructive">Couldn't load this item's price history.</p>
      )}

      {row && d && (
        <>
          <header className="panel mt-2 flex flex-wrap items-start gap-4 p-4 sm:p-5">
            <WikiImage
              icon={row.icon}
              alt={row.name}
              width={48}
              height={48}
              lazy={false}
              className="size-12 drop-shadow"
            />
            <div className="min-w-0 flex-1">
              <h1 className="font-sans text-2xl font-bold leading-tight sm:text-3xl">{row.name}</h1>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {row.examine}
                {" · "}
                {row.members ? "Members" : "F2P"}
                {" · "}
                {row.limit ? `Limit ${formatCompact(row.limit)}` : "No limit"}
                {" · "}
                {timeAgo(row.updated)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold tabular-nums gold-text">{gp(price)}</div>
              {cheapPct != null && (
                <div className="text-[11px] text-muted-foreground">
                  {d.trend!.percentile <= 50
                    ? `Cheaper than ${cheapPct}% of 180 days`
                    : `Richer than ${d.trend!.percentile}% of 180 days`}
                </div>
              )}
              <div className="mt-1.5 space-y-0.5 text-xs tabular-nums">
                <div className="flex items-baseline justify-end gap-2">
                  <span className="text-muted-foreground">Buy</span>
                  <span className="font-semibold text-foreground">{gp(row.high)}</span>
                </div>
                <div className="flex items-baseline justify-end gap-2">
                  <span className="text-muted-foreground">Sell</span>
                  <span className="font-semibold text-foreground">{gp(row.low)}</span>
                </div>
                {row.high != null && row.low != null && row.high !== row.low && (
                  <div className="text-[11px] text-muted-foreground">Spread {gp(row.high - row.low)}</div>
                )}
                {row.highalch != null && (
                  <div
                    className="text-[11px] tabular-nums"
                    style={{
                      color:
                        alchVsBuy == null
                          ? "var(--muted-foreground)"
                          : alchVsBuy > 0
                            ? "var(--deal)"
                            : alchVsBuy < 0
                              ? "var(--steep)"
                              : "var(--muted-foreground)",
                    }}
                  >
                    High alch {gp(row.highalch)}
                    {alchVsBuy != null && alchVsBuy !== 0
                      ? ` (${alchVsBuy > 0 ? "+" : ""}${gp(alchVsBuy)} vs buy)`
                      : ""}
                  </div>
                )}
                {row.volume != null && (
                  <div className="text-muted-foreground">24h vol {formatCompact(row.volume)}</div>
                )}
              </div>
              <span
                className="mt-1.5 inline-block rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
                style={{ background: `var(--${signal.token})`, color: `var(--${signal.token}-foreground)` }}
              >
                {signal.label}
              </span>
            </div>
          </header>

          {eq && <EquipmentPanel eq={eq} />}

          <section className="panel relative mt-4 p-5 sm:p-6">
            <div
              className="absolute right-4 top-4 z-10 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums sm:right-5 sm:top-5"
              style={{
                background:
                  d.change > 0
                    ? "color-mix(in oklab, var(--steep) 20%, transparent)"
                    : d.change < 0
                      ? "color-mix(in oklab, var(--deal) 20%, transparent)"
                      : "var(--secondary)",
                color: d.change > 0 ? "var(--steep)" : d.change < 0 ? "var(--deal)" : "var(--muted-foreground)",
              }}
            >
              {d.change > 0 ? "+" : ""}
              {d.change}%
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pr-16">
              <h2 className="text-lg font-semibold">
                Price over {d.rangeLabel}
                {d.volumeTotal > 0 && (
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    · vol {formatCompact(d.volumeTotal)}
                  </span>
                )}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {RANGES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setChartRange(r.key)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      range === r.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <PriceChart series={d.series} tone={signal.token} intraday={range === "1d" || range === "1w"} />
            </div>
          </section>

          <WhyBuyPanel
            title={group?.kind === "skilling" ? "Wiki training method" : "Why players buy this"}
            note={group ? `${group.label} — ${group.note}` : null}
            loading={wikiRec.isLoading}
            uses={wikiRec.data?.uses ?? []}
            wikiHref={wikiItemHref}
          />

          <footer className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
            Price data from the OSRS Wiki real-time Grand Exchange API. Not affiliated with Jagex.
          </footer>
        </>
      )}
    </main>
  );
}

function WhyBuyPanel({
  title,
  note,
  loading,
  uses,
  wikiHref,
}: {
  title: string;
  note: string | null;
  loading: boolean;
  uses: WikiRecUse[];
  wikiHref: string;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, WikiRecUse[]>();
    const rows = [...uses].sort((a, b) => a.rank - b.rank || a.method.localeCompare(b.method));
    for (const u of rows) {
      const key = activityGroup(u.method);
      const list = map.get(key) ?? [];
      list.push(u);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [uses]);

  return (
    <section className="panel mt-4 p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <a
          href={wikiHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-[11px] text-primary hover:underline"
        >
          Open on wiki <ExternalLink className="size-3" />
        </a>
      </div>
      {note && <p className="mb-1.5 text-[11px] leading-snug text-muted-foreground">{note}</p>}
      {loading ? (
        <div className="h-16 animate-pulse rounded-md bg-secondary/40" />
      ) : groups.length > 0 ? (
        <div className="max-h-40 overflow-y-auto overscroll-contain pr-1">
          {groups.map(([label, rows]) => (
            <div key={label} className="mb-1.5 last:mb-0">
              <div className="sticky top-0 bg-background/90 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </div>
              <ul className="divide-y divide-border/40">
                {rows.map((u) => (
                  <li key={`${u.rank}-${u.href}-${u.style ?? ""}-${u.table}`}>
                    <a
                      href={u.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-baseline gap-2 py-1 text-xs hover:bg-secondary/40"
                    >
                      <span className="w-3 shrink-0 text-[10px] font-bold tabular-nums text-muted-foreground">
                        {u.rank}
                      </span>
                      <span className="min-w-0 truncate">
                        <span className="font-medium text-foreground">{u.method}</span>
                        {u.style && <span className="text-muted-foreground"> ({u.style})</span>}
                        {u.table === "special" && <span className="text-muted-foreground"> spec</span>}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">No rank 1 or 2 wiki uses listed.</p>
      )}
    </section>
  );
}

function EquipmentPanel({ eq }: { eq: EquipmentStats }) {
  const [open, setOpen] = useState(false);
  const reqs = eq.requirements
    ? Object.entries(eq.requirements).sort(([a], [b]) => a.localeCompare(b))
    : [];

  const attack = [
    { icon: BONUS_ICONS.stab, alt: "Stab", value: eq.attack_stab },
    { icon: BONUS_ICONS.slash, alt: "Slash", value: eq.attack_slash },
    { icon: BONUS_ICONS.crush, alt: "Crush", value: eq.attack_crush },
    { icon: BONUS_ICONS.magic, alt: "Magic", value: eq.attack_magic },
    { icon: BONUS_ICONS.ranged, alt: "Ranged", value: eq.attack_ranged },
  ];
  const defence = [
    { icon: BONUS_ICONS.stab, alt: "Stab", value: eq.defence_stab },
    { icon: BONUS_ICONS.slash, alt: "Slash", value: eq.defence_slash },
    { icon: BONUS_ICONS.crush, alt: "Crush", value: eq.defence_crush },
    { icon: BONUS_ICONS.magic, alt: "Magic", value: eq.defence_magic },
    { icon: BONUS_ICONS.ranged, alt: "Ranged", value: eq.defence_ranged },
  ];
  const other = [
    { icon: BONUS_ICONS.strength, alt: "Strength", value: eq.melee_strength },
    { icon: BONUS_ICONS.rangedStr, alt: "Ranged strength", value: eq.ranged_strength },
    { icon: BONUS_ICONS.magicDmg, alt: "Magic damage", value: eq.magic_damage, suffix: "%" },
    { icon: BONUS_ICONS.prayer, alt: "Prayer", value: eq.prayer },
  ];

  return (
    <section className="panel mt-4 px-3 py-2 sm:px-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left text-[11px] text-muted-foreground"
      >
        <span className="min-w-0 flex-1 truncate">
          {eq.slot && <span className="capitalize">{eq.slot.replace(/_/g, " ")}</span>}
          {eq.weapon_type && <span className="capitalize"> · {eq.weapon_type.replace(/_/g, " ")}</span>}
          {eq.attack_speed != null && <span> · spd {eq.attack_speed}</span>}
          {reqs.length > 0 && (
            <span>
              {" · req "}
              {reqs.map(([skill, level], i) => (
                <span key={skill}>
                  {i > 0 ? ", " : ""}
                  <span className="font-medium capitalize text-foreground">{skill}</span> {level}
                </span>
              ))}
            </span>
          )}
        </span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-1.5 pb-1">
          <BonusRow headerIcon={BONUS_ICONS.attack} headerLabel="Attack" cells={attack} />
          <BonusRow headerIcon={BONUS_ICONS.defence} headerLabel="Defence" cells={defence} />
          <BonusRow headerIcon={BONUS_ICONS.other} headerLabel="Other" cells={other} />
        </div>
      )}
    </section>
  );
}

function BonusRow({
  headerIcon,
  headerLabel,
  cells,
}: {
  headerIcon: string;
  headerLabel: string;
  cells: { icon: string; alt: string; value: number; suffix?: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      <div className="flex w-16 shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <WikiImage
          icon={headerIcon}
          alt=""
          width={14}
          height={14}
          lazy={false}
          className="size-3.5"
          draggable={false}
        />
        {headerLabel}
      </div>
      <div className="flex min-w-0 flex-1 items-stretch divide-x divide-border/40 rounded-md border border-border/50 bg-secondary/20">
        {cells.map((c) => (
          <div
            key={c.alt}
            title={c.alt}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5"
          >
            <WikiImage
              icon={c.icon}
              alt={c.alt}
              width={16}
              height={16}
              lazy={false}
              className="size-4"
              draggable={false}
            />
            <span
              className={`text-xs font-semibold tabular-nums leading-none ${
                c.value > 0
                  ? "text-foreground"
                  : c.value < 0
                    ? "text-destructive"
                    : "text-muted-foreground"
              }`}
            >
              {fmtBonus(c.value, c.suffix)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
