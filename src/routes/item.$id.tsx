import { useEffect, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ExternalLink, RefreshCw } from "lucide-react";
import { fetchItemDetail, fetchWikiRecommended } from "@/lib/osrs.functions";
import type { WikiRecUse } from "@/lib/wiki-recommended";
import type { EquipmentStats, RangeKey } from "@/lib/osrs.server";
import { CATALOG } from "@/lib/osrs-catalog";
import { PriceChart } from "@/components/PriceChart";
import { WikiImage } from "@/components/WikiImage";
import { gp, formatCompact, signalOf, timeAgo } from "@/lib/format";
import { lastTabSearch } from "@/lib/tab-memory";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "1d", label: "24h" },
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
];

/** Same icons as Template:Infobox Bonuses on the OSRS Wiki. */
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

export const Route = createFileRoute("/item/$id")({
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

function ItemPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [range, setRange] = useState<RangeKey>("6m");
  const getDetail = useServerFn(fetchItemDetail);
  const getWikiRec = useServerFn(fetchWikiRecommended);

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
          <header className="panel mt-2 flex flex-wrap items-start gap-4 p-5 sm:p-6">
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
              <p className="mt-1 text-sm text-muted-foreground">{row.examine}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className={`size-3.5 ${detail.isFetching ? "animate-spin" : ""}`} />
                  Updated {timeAgo(row.updated)}
                </span>
                <span>{row.limit ? `Buy limit ${formatCompact(row.limit)}` : "No buy limit"}</span>
                <span>{row.members ? "Members" : "Free to play"}</span>
                {eq?.slot && (
                  <span className="capitalize">Slot: {eq.slot.replace(/_/g, " ")}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold tabular-nums gold-text">{gp(price)}</div>
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
                  <div className="text-muted-foreground">High alch {gp(row.highalch)}</div>
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

          <WikiRecommendedPanel
            loading={wikiRec.isLoading}
            uses={wikiRec.data?.uses ?? []}
            wikiHref={`https://oldschool.runescape.wiki/w/${encodeURIComponent(row.name.replace(/ /g, "_"))}#Used_in_recommended_equipment`}
          />

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
                    onClick={() => setRange(r.key)}
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

            {d.trend && (
              <div className="mt-5 space-y-1.5">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${Math.max(2, d.trend.percentile)}%`, background: `var(--${signal.token})` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
                  <span>{gp(d.trend.low180)}</span>
                  <span>
                    Today sits at the {d.trend.percentile}th percentile of the last 180 days
                  </span>
                  <span>{gp(d.trend.high180)}</span>
                </div>
              </div>
            )}
          </section>

          <section className="panel mt-4 p-5 sm:p-6">
            <h2 className="text-lg font-semibold">
              {group?.kind === "skilling" ? "Wiki training method" : "Why players buy this"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {group ? (
                <>
                  <span className="font-medium text-foreground">{group.label}</span> — {group.note}
                </>
              ) : (
                "This item isn't part of a tracked training method."
              )}
            </p>
            <a
              href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(row.name.replace(/ /g, "_"))}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Open on the OSRS Wiki <ExternalLink className="size-3.5" />
            </a>
          </section>

          <footer className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
            Price data from the OSRS Wiki real-time Grand Exchange API. Not affiliated with Jagex.
          </footer>
        </>
      )}
    </main>
  );
}

function WikiRecommendedPanel({
  loading,
  uses,
  wikiHref,
}: {
  loading: boolean;
  uses: WikiRecUse[];
  wikiHref: string;
}) {
  if (loading) {
    return <div className="panel mt-4 h-28 animate-pulse opacity-60" />;
  }
  if (!uses.length) return null;

  const first = uses.filter((u) => u.rank === 1);
  const second = uses.filter((u) => u.rank === 2);

  return (
    <section className="panel mt-4 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Used in recommended equipment</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Rank 1 and 2 slots from the OSRS Wiki. Refreshes at most once a day.
      </p>
      <div className="mt-3 space-y-3">
        {first.length > 0 && <RankList rank={1} uses={first} />}
        {second.length > 0 && <RankList rank={2} uses={second} />}
      </div>
      <a
        href={wikiHref}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        Full list on the wiki <ExternalLink className="size-3.5" />
      </a>
    </section>
  );
}

function RankList({ rank, uses }: { rank: 1 | 2; uses: WikiRecUse[] }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Rank {rank}
        {uses.some((u) => u.table === "special") ? " · includes special attack" : ""}
      </div>
      <ul className="space-y-1">
        {uses.map((u) => (
          <li key={`${u.rank}-${u.href}-${u.style ?? ""}-${u.table}`}>
            <a
              href={u.href}
              target="_blank"
              rel="noreferrer"
              className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary/50"
            >
              <span className="font-medium text-foreground">{u.method}</span>
              {u.style && <span className="text-muted-foreground"> ({u.style})</span>}
              {u.table === "special" && (
                <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">spec</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EquipmentPanel({ eq }: { eq: EquipmentStats }) {
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
    <section className="panel mt-4 px-3 py-2.5 sm:px-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {eq.slot && <span className="capitalize">Slot: {eq.slot.replace(/_/g, " ")}</span>}
        {eq.weapon_type && <span className="capitalize">Type: {eq.weapon_type.replace(/_/g, " ")}</span>}
        {eq.attack_speed != null && <span>Speed: {eq.attack_speed}</span>}
        {reqs.length > 0 && (
          <span>
            Req{" "}
            {reqs.map(([skill, level], i) => (
              <span key={skill}>
                {i > 0 ? ", " : ""}
                <span className="font-medium capitalize text-foreground">{skill}</span> {level}
              </span>
            ))}
          </span>
        )}
      </div>

      <div className="mt-2 space-y-1.5">
        <BonusRow headerIcon={BONUS_ICONS.attack} headerLabel="Attack" cells={attack} />
        <BonusRow headerIcon={BONUS_ICONS.defence} headerLabel="Defence" cells={defence} />
        <BonusRow headerIcon={BONUS_ICONS.other} headerLabel="Other" cells={other} />
      </div>
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
