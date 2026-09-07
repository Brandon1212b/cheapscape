import { useMemo, useState } from "react";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import type { PriceRow, Trend } from "@/lib/osrs.server";
import type { PlayerSkills } from "@/lib/player-stats";
import type { ActivityMethod } from "@/lib/activity-methods";
import { SKILLS_PANEL } from "@/lib/skills-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
} from "@/components/ui/popover";
import { MethodRow } from "@/components/MethodRow";
import { MethodsViewToggle, useMethodsGoal } from "@/components/MethodsGoalBar";
import { MoneyMakingSlider } from "@/components/MoneyMakingSlider";
import { usePlayerLookup } from "@/hooks/usePlayerLookup";
import { SkillsPanel } from "@/routes/home-ui";
import { WikiImage } from "@/components/WikiImage";
import { MethodsRsnBar } from "@/components/MethodsRsnBar";
import { useMethodSkillsNav } from "@/components/method-skills-nav";
export type { MethodPart, SkillingMethod, RankedMethod } from "@/components/skilling-types";
import type { SkillingMethod } from "@/components/skilling-types";
import {
  clampG,
  DEFAULT_SORT,
  rankSkillingMethods,
  readSkillLevel,
  type AmuletChoice,
  type CraftSort,
} from "@/lib/skilling-method-rank";

export function SkillingMethodsPanel({
  skillKey,
  skillLabel,
  methods,
  activities = [],
  rowsByName,
  trendsById,
  moneyPerHour,
  onMoneyPerHourChange,
  playerSkills,
}: {
  title: string;
  skillKey: string;
  skillLabel: string;
  methods: SkillingMethod[];
  activities?: ActivityMethod[];
  rowsByName: Map<string, PriceRow>;
  trendsById?: Record<number, Trend>;
  moneyPerHour: number;
  onMoneyPerHourChange: (n: number) => void;
  playerSkills?: PlayerSkills | null;
}) {
  const [sort, setSort] = useState<CraftSort>(DEFAULT_SORT);
  const [amulet, setAmulet] = useState<AmuletChoice>("none");
  const [goggles, setGoggles] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [localSheetOpen, setLocalSheetOpen] = useState(false);
  const [listFiltersOpen, setListFiltersOpen] = useState(false);
  const skillsNav = useMethodSkillsNav();
  const sheetOpen = skillsNav?.sheetOpen ?? localSheetOpen;
  const setSheetOpen = skillsNav?.setSheetOpen ?? setLocalSheetOpen;
  const skillLevel = readSkillLevel(playerSkills, skillKey);
  const magicLevel = readSkillLevel(playerSkills, "magic");
  const { playerXp } = usePlayerLookup();
  const hiscoreXp = playerXp?.[skillKey] ?? playerXp?.[skillKey.toLowerCase()];
  const goal = useMethodsGoal(skillLevel, hiscoreXp);
  const isHerblore = skillKey === "herblore";
  const skillMeta = SKILLS_PANEL.find((s) => s.key === skillKey);

  const ranked = useMemo(
    () =>
      rankSkillingMethods({
        methods,
        activities,
        rowsByName,
        trendsById,
        moneyPerHour,
        skillLevel,
        magicLevel,
        sort,
        amulet,
        isHerblore,
        skillKey,
        goalView: goal.view,
        xpRemaining: goal.xpRemaining,
      }),
    [
      methods,
      activities,
      rowsByName,
      trendsById,
      moneyPerHour,
      skillLevel,
      magicLevel,
      sort,
      amulet,
      isHerblore,
      skillKey,
      goal.view,
      goal.xpRemaining,
    ],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of ranked) set.add(r.category);
    return Array.from(set).sort();
  }, [ranked]);

  const filtered = useMemo(() => {
    if (selectedCategory === "all") return ranked;
    return ranked.filter((r) => r.category === selectedCategory);
  }, [ranked, selectedCategory]);

  const g = clampG(moneyPerHour);
  const filtersActive = sort !== DEFAULT_SORT || selectedCategory !== "all";

  return (
    <section className="space-y-3">
      <div className="space-y-2">
        <div className="sticky top-0 z-30 -mx-3 flex items-center gap-2 border-b border-border/40 bg-background/95 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-4 sm:px-4">
          <Popover open={sheetOpen} onOpenChange={setSheetOpen}>
            <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-border/60 bg-secondary/25 py-1.5 pl-2.5 pr-1">
              <PopoverAnchor asChild>
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  {skillMeta && (
                    <WikiImage
                      icon={skillMeta.wikiIcon}
                      alt=""
                      width={22}
                      height={22}
                      lazy={false}
                      className="size-[22px] shrink-0"
                    />
                  )}
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">
                    {skillLabel}
                    {skillLevel != null ? ` · ${skillLevel}` : ""}
                  </span>
                </button>
              </PopoverAnchor>
              <button
                type="button"
                onClick={() => setSheetOpen((open) => !open)}
                aria-label="Open skills"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              >
                <ChevronRight className={`size-4 transition-transform ${sheetOpen ? "rotate-90" : ""}`} />
              </button>
            </div>
            <PopoverContent
              align="start"
              side="bottom"
              sideOffset={8}
              collisionPadding={12}
              onOpenAutoFocus={(e) => e.preventDefault()}
              className="w-auto max-w-[calc(100vw-1.5rem)] p-3"
            >
              <PopoverArrow className="fill-popover" />
              {skillsNav && (
                <div className="flex justify-center">
                  <SkillsPanel
                    active={skillsNav.active}
                    onSelect={skillsNav.onSelect}
                    levels={skillsNav.levels}
                    enabledKeys={skillsNav.enabledKeys}
                  />
                </div>
              )}
            </PopoverContent>
          </Popover>

          <MethodsViewToggle
            view={goal.view}
            onViewChange={goal.setView}
            targetLevel={goal.targetLevel}
            onTargetChange={goal.setTargetLevel}
            minTarget={goal.currentLevel + 1}
          />

          <Popover open={listFiltersOpen} onOpenChange={setListFiltersOpen}>
            <PopoverAnchor asChild>
              <button
                type="button"
                onClick={() => setListFiltersOpen((open) => !open)}
                aria-label="Open filters"
                title="Filters"
                className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-foreground hover:bg-secondary/60"
              >
                <SlidersHorizontal className="size-4" />
                {filtersActive ? (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" aria-hidden />
                ) : null}
              </button>
            </PopoverAnchor>
            <PopoverContent align="end" side="bottom" sideOffset={8} collisionPadding={12} className="w-56 p-2">
              <div className="flex flex-col gap-2">
                <Select value={sort} onValueChange={(v) => setSort(v as CraftSort)}>
                  <SelectTrigger className="h-8 w-full min-w-0 text-xs">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cost_asc">Your cost ↑ (best)</SelectItem>
                    <SelectItem value="cost_desc">Your cost ↓</SelectItem>
                    <SelectItem value="gp_desc">{goal.view === "goal" ? "Total GP ↓" : "GP/h ↓"}</SelectItem>
                    <SelectItem value="gp_asc">{goal.view === "goal" ? "Total GP ↑" : "GP/h ↑"}</SelectItem>
                    <SelectItem value="xp_desc">{goal.view === "goal" ? "Hours ↑ (fastest)" : "XP/h ↓"}</SelectItem>
                    <SelectItem value="xp_asc">{goal.view === "goal" ? "Hours ↓" : "XP/h ↑"}</SelectItem>
                  </SelectContent>
                </Select>
                {categories.length > 1 && (
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-8 w-full min-w-0 text-xs">
                      <SelectValue placeholder="Activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {isHerblore && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">Amulet</span>
                      <Select value={amulet} onValueChange={(v) => setAmulet(v as AmuletChoice)}>
                        <SelectTrigger className="h-8 flex-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="chemistry">Chemistry</SelectItem>
                          <SelectItem value="alchemist">Alchemist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <label className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-3 text-[11px] font-medium text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={goggles}
                        onChange={(e) => setGoggles(e.target.checked)}
                        className="size-3.5 rounded border-border"
                      />
                      Amylase goggles
                    </label>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MethodsRsnBar />
        </div>

        <MoneyMakingSlider value={g} onChange={onMoneyPerHourChange} />
      </div>

      <div className="space-y-2">
        {filtered.map((r, i) => (
          <MethodRow
            key={r.id}
            rank={i + 1}
            rowsByName={rowsByName}
            skillLabel={skillLabel}
            metricView={goal.view}
            xpRemaining={goal.xpRemaining}
            {...r}
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No methods match the selected activity types.
          </p>
        )}
      </div>
    </section>
  );
}
