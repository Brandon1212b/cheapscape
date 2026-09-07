import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";

import {
  CATALOG,
  SKILLING_FILTERS,
  type CatalogItem,
} from "@/lib/osrs-catalog";
import "@/lib/catalog-pvm-additions";
import { gearSetsForTier, gearSetItemNames } from "@/lib/gear-sets";
import { geLookupName } from "@/lib/ge-name-aliases";
import { costPerBonus } from "@/lib/item-bonuses";
import { itemSearchText } from "@/lib/item-search-aliases";
import type { PriceRow, RangeKey, Trend } from "@/lib/osrs.server";
import { useMarketData } from "@/hooks/useMarketData";
import { usePlayerLookup } from "@/hooks/usePlayerLookup";
import type { HomeSearch } from "./index";
import { HomeMain } from "./home-main";

const routeApi = getRouteApi("/prices");

type Filter = "all" | "gear" | "skilling" | "supplies";
type SortKey = "gainers" | "losers" | "expensive" | "cheap" | "value";

const DEFAULT_RANGE: RangeKey = "1m";
const DEFAULT_SORT: SortKey = "losers";
const DEFAULT_TIER = "end";

const SCROLL_KEY = "ge-watch-home-scroll";

function priceOf(row: PriceRow): number {
  return row.high ?? row.low ?? 0;
}

function rangeChange(trend?: Trend): number {
  return trend?.change30 ?? 0;
}

function isSuppliesItem(tags: string[]) {
  return (
    tags.includes("supplies") ||
    tags.includes("food") ||
    tags.includes("potion") ||
    tags.includes("ammo")
  );
}

function uniqueById(rows: PriceRow[]): PriceRow[] {
  const seen = new Set<number>();
  const out: PriceRow[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

export function Home() {
  const navigate = useNavigate({ from: "/prices" });
  const search = routeApi.useSearch();
  const {
    filter,
    sort,
    range,
    q: query,
    combat: gearCombat,
    slot: gearSlot,
    tier: gearTier,
    set: gearSet,
    skill,
    supply: supplyType,
  } = search;

  const { snapshot, trends } = useMarketData(range);
  const {
    rsnDraft,
    setRsnDraft,
    activeRsn,
    playerQuery,
    playerSkills,
    itemReqs,
    loadRsn,
    clearRsn,
  } = usePlayerLookup();

  const patchSearch = (patch: Partial<HomeSearch>) => {
    void navigate({
      search: (prev: HomeSearch) => {
        const next = { ...prev, ...patch };
        const cleaned: Partial<HomeSearch> = {};
        if (next.filter && next.filter !== "gear") cleaned.filter = next.filter;
        if (next.sort && next.sort !== DEFAULT_SORT) cleaned.sort = next.sort;
        if (next.range && next.range !== DEFAULT_RANGE) cleaned.range = next.range;
        if (next.q) cleaned.q = next.q;
        if (next.combat && next.combat !== "all") cleaned.combat = next.combat;
        if (next.slot && next.slot !== "all") cleaned.slot = next.slot;
        if (next.tier && next.tier !== DEFAULT_TIER) cleaned.tier = next.tier;
        if (next.set && next.set !== "all") cleaned.set = next.set;
        if (next.skill && next.skill !== "all") cleaned.skill = next.skill;
        if (next.supply && next.supply !== "all") cleaned.supply = next.supply;
        return cleaned as HomeSearch;
      },
      replace: true,
    });
  };

  const rowsByName = useMemo(() => {
    const map = new Map<string, PriceRow>();
    for (const r of snapshot.data ?? []) {
      map.set(r.name, r);
      map.set(r.name.toLowerCase(), r);
    }
    return map;
  }, [snapshot.data]);

  const itemByName = useMemo(() => {
    const map = new Map<string, CatalogItem>();
    const setItem = (key: string, item: CatalogItem) => {
      const existing = map.get(key);
      if (existing) {
        map.set(key, {
          name: item.name,
          tags: [...new Set([...existing.tags, ...item.tags])],
        });
      } else {
        map.set(key, item);
      }
    };
    for (const g of CATALOG) {
      for (const i of g.items) {
        setItem(i.name.toLowerCase(), i);
        setItem(geLookupName(i.name).toLowerCase(), i);
      }
    }
    return map;
  }, []);

  const setItemNames = useMemo(() => gearSetItemNames(gearSet), [gearSet]);

  const availableSets = useMemo(
    () => gearSetsForTier(gearTier, gearCombat),
    [gearTier, gearCombat],
  );

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((g) => {
      if (filter === "all") return true;
      if (filter === "skilling") return g.kind === "skilling";
      if (filter === "gear") return g.kind === "gear" && g.id !== "utility";
      if (filter === "supplies") return g.id === "utility";
      return true;
    })
      .map((g) => ({
        ...g,
        rows: g.items
          .map((item) => {
            const geName = geLookupName(item.name);
            return (
              rowsByName.get(item.name) ??
              rowsByName.get(item.name.toLowerCase()) ??
              rowsByName.get(geName) ??
              rowsByName.get(geName.toLowerCase())
            );
          })
          .filter((r): r is NonNullable<typeof r> => !!r)
          .filter((r) => (q ? itemSearchText(r.name).includes(q) : true))
          .filter((r) => {
            const tags = itemByName.get(r.name.toLowerCase())?.tags ?? [];
            if (filter === "gear") {
              if (isSuppliesItem(tags)) return false;
              if (gearCombat !== "all" && !tags.includes(gearCombat)) return false;
              if (gearSlot !== "all" && !tags.includes(gearSlot)) return false;
              if (gearTier !== "all" && !tags.includes(gearTier)) return false;
              if (setItemNames && !setItemNames.has(r.name.toLowerCase())) return false;
            }
            if (filter === "skilling") {
              if (skill !== "all" && !tags.includes(skill)) return false;
            }
            if (filter === "supplies") {
              if (!(isSuppliesItem(tags) || tags.includes("neck"))) return false;
              if (supplyType !== "all" && !tags.includes(supplyType)) return false;
            }
            return true;
          }),
      }))
      .filter((g) => g.rows.length > 0);
  }, [
    filter,
    query,
    rowsByName,
    gearCombat,
    gearSlot,
    gearTier,
    setItemNames,
    skill,
    supplyType,
    itemByName,
  ]);

  const allRows = useMemo(() => {
    const rows = uniqueById(groups.flatMap((g) => g.rows));
    const trendMap = trends.data ?? {};

    return [...rows].sort((a, b) => {
      if (sort === "cheap") {
        return priceOf(a) - priceOf(b) || a.name.localeCompare(b.name);
      }
      if (sort === "expensive") {
        return priceOf(b) - priceOf(a) || a.name.localeCompare(b.name);
      }
      if (sort === "gainers") {
        const ca = rangeChange(trendMap[a.id]);
        const cb = rangeChange(trendMap[b.id]);
        return cb - ca || a.name.localeCompare(b.name);
      }
      if (sort === "value") {
        const tagsA = itemByName.get(a.name.toLowerCase())?.tags ?? [];
        const tagsB = itemByName.get(b.name.toLowerCase())?.tags ?? [];
        const va = costPerBonus(priceOf(a), a.name, tagsA, gearCombat);
        const vb = costPerBonus(priceOf(b), b.name, tagsB, gearCombat);
        return va - vb || a.name.localeCompare(b.name);
      }
      const ca = rangeChange(trendMap[a.id]);
      const cb = rangeChange(trendMap[b.id]);
      return ca - cb || a.name.localeCompare(b.name);
    });
  }, [groups, trends.data, sort, itemByName, gearCombat]);

  const totalCost = useMemo(() => {
    if (filter !== "gear") return 0;
    return allRows.reduce((sum, r) => sum + priceOf(r), 0);
  }, [filter, allRows]);

  const restoredScroll = useRef(false);
  useEffect(() => {
    if (restoredScroll.current || snapshot.isLoading) return;
    try {
      const raw = sessionStorage.getItem(SCROLL_KEY);
      if (raw == null) return;
      const y = Number(raw);
      sessionStorage.removeItem(SCROLL_KEY);
      if (!Number.isFinite(y) || y <= 0) return;
      restoredScroll.current = true;
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
      });
    } catch {
      /* private mode */
    }
  }, [snapshot.isLoading, allRows.length]);

  const handleFilterChange = (next: Filter) => {
    patchSearch({
      filter: next,
      combat: "all",
      slot: "all",
      tier: next === "gear" ? DEFAULT_TIER : "all",
      set: "all",
      skill: "all",
      supply: "all",
    });
  };

  const showGearSub = filter === "gear";
  const showSkillSub = filter === "skilling";
  const showSupplySub = filter === "supplies";
  const gridKey = `${filter}:${gearCombat}:${gearSlot}:${gearTier}:${gearSet}:${skill}:${supplyType}:${sort}:${range}:${query}`;

  const skillBarEntries = useMemo(() => {
    if (!playerSkills) return [];
    const combat: { key: string; icon: string; label: string; level: number }[] = [
      { key: "attack", icon: "Attack_icon.png", label: "Attack" },
      { key: "strength", icon: "Strength_icon.png", label: "Strength" },
      { key: "defence", icon: "Defence_icon.png", label: "Defence" },
      { key: "ranged", icon: "Ranged_icon.png", label: "Ranged" },
      { key: "magic", icon: "Magic_icon.png", label: "Magic" },
      { key: "prayer", icon: "Prayer_icon.png", label: "Prayer" },
      { key: "hitpoints", icon: "Hitpoints_icon.png", label: "Hitpoints" },
    ]
      .map((s) => {
        const level = playerSkills[s.key];
        if (level == null) return null;
        return { ...s, level };
      })
      .filter((s): s is NonNullable<typeof s> => s != null);

    if (filter === "skilling" && skill !== "all") {
      const already = combat.some((s) => s.key === skill);
      if (!already) {
        const fromFilters = SKILLING_FILTERS.find((f) => f.key === skill);
        const level = playerSkills[skill];
        if (level != null) {
          combat.push({
            key: skill,
            icon:
              fromFilters?.wikiIcon ?? `${skill.charAt(0).toUpperCase()}${skill.slice(1)}_icon.png`,
            label: fromFilters?.label ?? skill.charAt(0).toUpperCase() + skill.slice(1),
            level,
          });
        }
      }
    }
    return combat;
  }, [playerSkills, filter, skill]);

  return (
    <HomeMain
      filter={filter}
      handleFilterChange={handleFilterChange}
      gearCombat={gearCombat}
      gearSlot={gearSlot}
      gearTier={gearTier}
      gearSet={gearSet}
      skill={skill}
      supplyType={supplyType}
      query={query}
      sort={sort}
      range={range}
      patchSearch={patchSearch}
      rsnDraft={rsnDraft}
      setRsnDraft={setRsnDraft}
      activeRsn={activeRsn}
      playerQuery={playerQuery}
      playerSkills={playerSkills}
      loadRsn={loadRsn}
      clearRsn={clearRsn}
      skillBarEntries={skillBarEntries}
      showGearSub={showGearSub}
      showSkillSub={showSkillSub}
      showSupplySub={showSupplySub}
      availableSets={availableSets}
      snapshot={snapshot}
      trends={trends}
      allRows={allRows}
      itemReqs={itemReqs}
      totalCost={totalCost}
      gridKey={gridKey}
    />
  );
}
