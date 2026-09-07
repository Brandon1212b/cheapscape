import { SKILL_ICONS } from "@/lib/method-icons";
import { activitiesForSkill, type ActivityMethod } from "@/lib/activity-methods";
import { AGILITY_METHODS } from "@/lib/agility-methods";
import { CONSTRUCTION_METHODS } from "@/lib/construction-methods";
import { COOKING_METHODS } from "@/lib/cooking-methods";
import { CRAFTING_METHODS } from "@/lib/crafting-methods";
import { FARMING_METHODS } from "@/lib/farming-methods";
import { FIREMAKING_METHODS } from "@/lib/firemaking-methods";
import { FISHING_METHODS } from "@/lib/fishing-methods";
import { FISHING_RATE_TABLES } from "@/lib/fishing-activities";
import { FLETCHING_METHODS } from "@/lib/fletching-methods";
import { HERBLORE_METHODS } from "@/lib/herblore-methods";
import { HUNTER_METHODS } from "@/lib/hunter-methods";
import { HUNTER_RATE_TABLES } from "@/lib/hunter-activities";
import { MAGIC_METHODS } from "@/lib/magic-methods";
import { MINING_METHODS } from "@/lib/mining-methods";
import { MINING_RATE_TABLES } from "@/lib/mining-activities";
import { MIXOLOGY_METHODS } from "@/lib/mixology-methods";
import { PRAYER_METHODS } from "@/lib/prayer-methods";
import { RUNECRAFT_METHODS } from "@/lib/runecraft-methods";
import { SAILING_METHODS } from "@/lib/sailing-methods";
import { SAILING_ACTIVITY_METHODS } from "@/lib/sailing-activity-methods";
import { SEPULCHRE_FLOOR_4 } from "@/lib/sepulchre-floor4";
import { SEPULCHRE_FLOOR_5 } from "@/lib/sepulchre-floor5";
import { SMITHING_METHODS } from "@/lib/smithing-methods";
import { THIEVING_METHODS } from "@/lib/thieving-methods";
import { THIEVING_RATE_TABLES } from "@/lib/thieving-activities";
import { WOODCUTTING_METHODS } from "@/lib/woodcutting-methods";
import { WOODCUTTING_RATE_TABLES } from "@/lib/woodcutting-activities";
import {
  AGILITY_PYRAMID_ACTIVITY,
  BRIMHAVEN_AGILITY_ACTIVITY,
  DEEP_SEA_TRAWL_METHODS,
  FARMING_CONTRACT_METHODS,
  FORESTRY_METHODS,
  HESPORI_METHODS,
  HUNTER_RUMOUR_METHODS,
  IMPLING_METHODS,
  SEPULCHRE_ACTIVITY,
  TITHE_FARM_METHODS,
  WILDERNESS_AGILITY_ACTIVITY,
  ZALCANO_METHODS,
} from "@/lib/wiki-audit-activities";
import { DEFAULT_SORT, rankSkillingMethods } from "@/lib/skilling-method-rank";
import type { SkillingMethod } from "@/components/skilling-types";
import type { PriceRow } from "@/lib/osrs.server";

export type HomeMethodRate = {
  skill: string;
  label: string;
  skillIcon: string;
  method: string;
  methodId: string;
  xpPerHour: number | null;
  gpPerHour: number | null;
};

const DEFAULT_MONEY_PER_HOUR = 2_000_000;

const HOME_SKILLS: { skill: string; label: string }[] = [
  { skill: "agility", label: "Agility" },
  { skill: "construction", label: "Construction" },
  { skill: "cooking", label: "Cooking" },
  { skill: "crafting", label: "Crafting" },
  { skill: "farming", label: "Farming" },
  { skill: "firemaking", label: "Firemaking" },
  { skill: "fishing", label: "Fishing" },
  { skill: "fletching", label: "Fletching" },
  { skill: "herblore", label: "Herblore" },
  { skill: "hunter", label: "Hunter" },
  { skill: "magic", label: "Magic" },
  { skill: "mining", label: "Mining" },
  { skill: "prayer", label: "Prayer" },
  { skill: "runecraft", label: "Runecraft" },
  { skill: "sailing", label: "Sailing" },
  { skill: "smithing", label: "Smithing" },
  { skill: "thieving", label: "Thieving" },
  { skill: "woodcutting", label: "Woodcutting" },
];

const AGILITY_MOVED = new Set(["hallowed-sepulchre", "wilderness-agility"]);
const SEPULCHRE_REPLACED = new Set(["sepulchre-floor-5-loot", "sepulchre-floor-4"]);
const MINING_MOVED = new Set(["iron-ore", "gem-rock", "granite-3tick", "amethyst"]);
const THIEVING_MOVED = new Set([
  "blackjacking",
  "ardougne-knights",
  "elves",
  "vyres",
  "master-farmers",
]);
const WOODCUTTING_MOVED = new Set([
  "teak-logs",
  "sulliusceps",
  "blisterwood",
  "ironwood-logs",
  "redwood-logs",
  "rosewood-logs",
  "bloodwood",
]);

function methodsForSkill(skill: string): SkillingMethod[] {
  switch (skill) {
    case "agility":
      return AGILITY_METHODS.filter((m) => !AGILITY_MOVED.has(m.id));
    case "construction":
      return CONSTRUCTION_METHODS;
    case "cooking":
      return COOKING_METHODS;
    case "crafting":
      return CRAFTING_METHODS;
    case "farming":
      return FARMING_METHODS;
    case "firemaking":
      return FIREMAKING_METHODS;
    case "fishing":
      return FISHING_METHODS.filter((m) => m.id !== "leechfin");
    case "fletching":
      return FLETCHING_METHODS;
    case "herblore":
      return HERBLORE_METHODS;
    case "hunter":
      return HUNTER_METHODS.filter((m) => !["red-chins", "black-chins"].includes(m.id));
    case "magic":
      return MAGIC_METHODS;
    case "mining":
      return MINING_METHODS.filter((m) => !MINING_MOVED.has(m.id));
    case "prayer":
      return PRAYER_METHODS as SkillingMethod[];
    case "runecraft":
      return RUNECRAFT_METHODS;
    case "sailing":
      return SAILING_METHODS;
    case "smithing":
      return SMITHING_METHODS;
    case "thieving":
      return THIEVING_METHODS.filter((m) => !THIEVING_MOVED.has(m.id));
    case "woodcutting":
      return WOODCUTTING_METHODS.filter((m) => !WOODCUTTING_MOVED.has(m.id));
    default:
      return [];
  }
}

function activitiesForHomeSkill(skill: string): ActivityMethod[] {
  switch (skill) {
    case "mining":
      return [...activitiesForSkill("mining"), ...MINING_RATE_TABLES, ...ZALCANO_METHODS];
    case "agility":
      return [
        SEPULCHRE_FLOOR_5,
        SEPULCHRE_FLOOR_4,
        ...SEPULCHRE_ACTIVITY.filter((a) => !SEPULCHRE_REPLACED.has(a.id)),
        ...WILDERNESS_AGILITY_ACTIVITY,
        ...BRIMHAVEN_AGILITY_ACTIVITY,
        ...AGILITY_PYRAMID_ACTIVITY,
      ];
    case "herblore":
      return MIXOLOGY_METHODS;
    case "hunter":
      return [...HUNTER_RATE_TABLES, ...HUNTER_RUMOUR_METHODS, ...IMPLING_METHODS];
    case "thieving":
      return [
        ...activitiesForSkill("thieving").filter((a) => a.id !== "pyramid-plunder"),
        ...THIEVING_RATE_TABLES,
      ];
    case "farming":
      return [
        ...activitiesForSkill("farming"),
        ...TITHE_FARM_METHODS,
        ...FARMING_CONTRACT_METHODS,
        ...HESPORI_METHODS,
      ];
    case "fishing":
      return [...activitiesForSkill("fishing"), ...FISHING_RATE_TABLES, ...DEEP_SEA_TRAWL_METHODS];
    case "woodcutting":
      return [...WOODCUTTING_RATE_TABLES, ...FORESTRY_METHODS];
    case "sailing":
      return SAILING_ACTIVITY_METHODS;
    default:
      return activitiesForSkill(skill);
  }
}

export function homeMethodRates(
  rowsByName: Map<string, PriceRow>,
  moneyPerHour = DEFAULT_MONEY_PER_HOUR,
): HomeMethodRate[] {
  return HOME_SKILLS.map(({ skill, label }) => {
    const ranked = rankSkillingMethods({
      methods: methodsForSkill(skill),
      activities: activitiesForHomeSkill(skill),
      rowsByName,
      moneyPerHour,
      skillLevel: 99,
      sort: DEFAULT_SORT,
      amulet: "none",
      isHerblore: skill === "herblore",
      skillKey: skill,
      goalView: "rate",
      xpRemaining: null,
    });
    const top = ranked.find((row) => !row.locked) ?? ranked[0];
    return {
      skill,
      label,
      skillIcon: SKILL_ICONS[skill],
      method: top?.label ?? label,
      methodId: top?.id ?? skill,
      xpPerHour: top?.xpPerHour ?? null,
      gpPerHour: top?.gpPerHour ?? null,
    };
  });
}
