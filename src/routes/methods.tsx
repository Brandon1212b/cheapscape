import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { useMarketData } from "@/hooks/useMarketData";
import { usePlayerLookup } from "@/hooks/usePlayerLookup";
import { CraftingMethodsPanel } from "@/components/CraftingMethods";
import { ConstructionMethodsPanel } from "@/components/ConstructionMethods";
import { PrayerMethodsPanel } from "@/components/PrayerMethods";
import { SmithingMethodsPanel } from "@/components/SmithingMethods";
import { MagicMethodsPanel } from "@/components/MagicMethods";
import { RunecraftMethodsPanel } from "@/components/RunecraftMethods";
import { FarmingMethodsPanel } from "@/components/FarmingMethods";
import { FletchingMethodsPanel } from "@/components/FletchingMethods";
import { CookingMethodsPanel } from "@/components/CookingMethods";
import { AgilityMethodsPanel } from "@/components/AgilityMethods";
import { HerbloreMethodsPanel } from "@/components/HerbloreMethods";
import { MiningMethodsPanel } from "@/components/MiningMethods";
import { FishingMethodsPanel } from "@/components/FishingMethods";
import { WoodcuttingMethodsPanel } from "@/components/WoodcuttingMethods";
import { FiremakingMethodsPanel } from "@/components/FiremakingMethods";
import { ThievingMethodsPanel } from "@/components/ThievingMethods";
import { HunterMethodsPanel } from "@/components/HunterMethods";
import { SailingMethodsPanel } from "@/components/SailingMethods";
import type { PriceRow, Trend } from "@/lib/osrs.server";
import type { PlayerSkills } from "@/lib/player-stats";
import { readLastSkill, writeLastSkill } from "@/lib/tab-memory";
import { FilterPopover, SkillsPanel } from "./home-ui";
import { MethodSkillsNavProvider } from "@/components/method-skills-nav";

const DEFAULT_G = 2_000_000;
const DEFAULT_SKILL = "crafting";

const methodsSearchSchema = z.object({
  skill: z.string().catch(DEFAULT_SKILL),
  g: z.coerce.number().catch(DEFAULT_G),
});

export type MethodsSearch = z.infer<typeof methodsSearchSchema>;

type MethodsPanelProps = {
  rowsByName: Map<string, PriceRow>;
  trendsById?: Record<number, Trend> | undefined;
  moneyPerHour: number;
  onMoneyPerHourChange: (n: number) => void;
  playerSkills?: PlayerSkills | null | undefined;
};

const METHOD_SKILLS: {
  key: string;
  label: string;
  wikiIcon: string;
  Panel: ComponentType<MethodsPanelProps>;
}[] = [
  { key: "herblore", label: "Herblore", wikiIcon: "Herblore_icon.png", Panel: HerbloreMethodsPanel },
  { key: "construction", label: "Construction", wikiIcon: "Construction_icon.png", Panel: ConstructionMethodsPanel },
  { key: "prayer", label: "Prayer", wikiIcon: "Prayer_icon.png", Panel: PrayerMethodsPanel },
  { key: "crafting", label: "Crafting", wikiIcon: "Crafting_icon.png", Panel: CraftingMethodsPanel },
  { key: "smithing", label: "Smithing", wikiIcon: "Smithing_icon.png", Panel: SmithingMethodsPanel },
  { key: "magic", label: "Magic", wikiIcon: "Magic_icon.png", Panel: MagicMethodsPanel },
  { key: "runecraft", label: "Runecraft", wikiIcon: "Runecraft_icon.png", Panel: RunecraftMethodsPanel },
  { key: "farming", label: "Farming", wikiIcon: "Farming_icon.png", Panel: FarmingMethodsPanel },
  { key: "fletching", label: "Fletching", wikiIcon: "Fletching_icon.png", Panel: FletchingMethodsPanel },
  { key: "cooking", label: "Cooking", wikiIcon: "Cooking_icon.png", Panel: CookingMethodsPanel },
  { key: "agility", label: "Agility", wikiIcon: "Agility_icon.png", Panel: AgilityMethodsPanel },
  { key: "mining", label: "Mining", wikiIcon: "Mining_icon.png", Panel: MiningMethodsPanel },
  { key: "fishing", label: "Fishing", wikiIcon: "Fishing_icon.png", Panel: FishingMethodsPanel },
  { key: "woodcutting", label: "Woodcutting", wikiIcon: "Woodcutting_icon.png", Panel: WoodcuttingMethodsPanel },
  { key: "firemaking", label: "Firemaking", wikiIcon: "Firemaking_icon.png", Panel: FiremakingMethodsPanel },
  { key: "thieving", label: "Thieving", wikiIcon: "Thieving_icon.png", Panel: ThievingMethodsPanel },
  { key: "hunter", label: "Hunter", wikiIcon: "Hunter_icon.png", Panel: HunterMethodsPanel },
  { key: "sailing", label: "Sailing", wikiIcon: "Sailing_icon.png", Panel: SailingMethodsPanel },
];

const METHOD_SKILL_KEYS = new Set(METHOD_SKILLS.map((s) => s.key));

export const Route = createFileRoute("/methods")({
  validateSearch: (search: Record<string, unknown>): MethodsSearch =>
    methodsSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Skilling Methods — Cheapscape" },
      {
        name: "description",
        content:
          "OSRS skilling training method guides with live Grand Exchange prices, XP/hr, GP/hr, and personalised cost scores.",
      },
      { property: "og:title", content: "Skilling Methods — Cheapscape" },
      {
        property: "og:description",
        content:
          "Compare OSRS training methods for Crafting, Construction, Prayer, Smithing, Sailing, and more — scored against live GE prices.",
      },
    ],
  }),
  component: MethodsPage,
});

function MethodsPage() {
  const navigate = useNavigate({ from: "/methods" });
  const search = Route.useSearch();
  const { skill, g } = search;
  const moneyPerHour = Number.isFinite(g) && g > 0 ? g : DEFAULT_G;
  const [sheetOpen, setSheetOpen] = useState(false);

  const { snapshot, trends } = useMarketData("6m");
  const { playerSkills } = usePlayerLookup();

  const rowsByName = useMemo(
    () => new Map((snapshot.data ?? []).map((r) => [r.name, r])),
    [snapshot.data],
  );

  const selected = METHOD_SKILLS.find((s) => s.key === skill) ?? null;
  const SelectedPanel = selected?.Panel;

  const patchSearch = (patch: Partial<MethodsSearch>) => {
    void navigate({
      search: (prev: MethodsSearch) => {
        const next = { ...prev, ...patch };
        const cleaned: Partial<MethodsSearch> = {};
        if (next.skill) cleaned.skill = next.skill;
        if (next.g && next.g !== DEFAULT_G) cleaned.g = next.g;
        return cleaned as MethodsSearch;
      },
      replace: true,
    });
  };

  useEffect(() => {
    if (skill && METHOD_SKILL_KEYS.has(skill)) {
      writeLastSkill(skill);
      return;
    }
    if (playerSkills) {
      let bestKey = "";
      let bestLevel = -1;
      for (const s of METHOD_SKILLS) {
        const level = playerSkills[s.key];
        if (level != null && level > bestLevel) {
          bestLevel = level;
          bestKey = s.key;
        }
      }
      if (bestKey) {
        patchSearch({ skill: bestKey });
        return;
      }
    }
    const last = readLastSkill();
    if (last && METHOD_SKILL_KEYS.has(last)) {
      patchSearch({ skill: last });
      return;
    }
    patchSearch({ skill: DEFAULT_SKILL });
  }, [skill, playerSkills]);

  const skillsNav = {
    active: skill,
    onSelect: (key: string) => {
      if (METHOD_SKILL_KEYS.has(key)) {
        patchSearch({ skill: key });
      }
      setSheetOpen(false);
    },
    levels: playerSkills,
    enabledKeys: METHOD_SKILL_KEYS,
    sheetOpen,
    setSheetOpen,
  };

  return (
    <MethodSkillsNavProvider value={skillsNav}>
      <main className="mx-auto max-w-6xl px-3 pb-16 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4">
        {!SelectedPanel && (
          <>
            <FilterPopover
              open={sheetOpen}
              onOpenChange={setSheetOpen}
              label="Choose a skill"
              ariaLabel="Open skills"
            >
              <div className="flex justify-center">
                <SkillsPanel
                  active={skill}
                  onSelect={skillsNav.onSelect}
                  levels={playerSkills}
                  enabledKeys={METHOD_SKILL_KEYS}
                />
              </div>
            </FilterPopover>
            <div className="mt-10 rounded-lg border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center">
              <p className="text-sm font-medium text-foreground">Pick a skill</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Open the skills popup to view training methods ranked by cost and XP.
              </p>
            </div>
          </>
        )}

        {snapshot.isLoading && (
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading prices…
          </div>
        )}

        {snapshot.isError && (
          <p className="mt-8 text-center text-sm text-destructive">
            Couldn't reach the live price feed. Try refreshing in a moment.
          </p>
        )}

        {!snapshot.isLoading && SelectedPanel && (
          <SelectedPanel
            rowsByName={rowsByName}
            trendsById={trends.data}
            moneyPerHour={moneyPerHour}
            onMoneyPerHourChange={(n) => patchSearch({ g: n })}
            playerSkills={playerSkills}
          />
        )}
      </main>
    </MethodSkillsNavProvider>
  );
}
