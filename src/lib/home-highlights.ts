import { METHOD_ICONS, SKILL_ICONS, methodFallbackIcon } from "@/lib/method-icons";
import { activitiesForSkill, type ActivityMethod } from "@/lib/activity-methods";
import { AGILITY_METHODS } from "@/lib/agility-methods";
import { FIREMAKING_METHODS } from "@/lib/firemaking-methods";
import { HERBLORE_METHODS } from "@/lib/herblore-methods";
import { HUNTER_METHODS } from "@/lib/hunter-methods";
import { HUNTER_RATE_TABLES } from "@/lib/hunter-activities";
import { MINING_METHODS } from "@/lib/mining-methods";
import { MINING_RATE_TABLES } from "@/lib/mining-activities";
import { MIXOLOGY_METHODS } from "@/lib/mixology-methods";
import { RUNECRAFT_METHODS } from "@/lib/runecraft-methods";
import { SEPULCHRE_FLOOR_4 } from "@/lib/sepulchre-floor4";
import { SEPULCHRE_FLOOR_5 } from "@/lib/sepulchre-floor5";
import { SMITHING_METHODS } from "@/lib/smithing-methods";
import { THIEVING_METHODS } from "@/lib/thieving-methods";
import { THIEVING_RATE_TABLES } from "@/lib/thieving-activities";
import {
  AGILITY_PYRAMID_ACTIVITY,
  BRIMHAVEN_AGILITY_ACTIVITY,
  HUNTER_RUMOUR_METHODS,
  IMPLING_METHODS,
  SEPULCHRE_ACTIVITY,
  WILDERNESS_AGILITY_ACTIVITY,
  ZALCANO_METHODS,
} from "@/lib/wiki-audit-activities";
import {
  DEFAULT_SORT,
  rankSkillingMethods,
} from "@/lib/skilling-method-rank";
import type { SkillingMethod } from "@/components/skilling-types";
import type { PriceRow } from "@/lib/osrs.server";

export type HomeMethodRate = {
  skill: string;
  label: string;
  skillIcon: string;
  method: string;
  methodIcon: string;
  methodId: string;
  xpPerHour: number | null;
  gpPerHour: number | null;
};

const DEFAULT_MONEY_PER_HOUR = 2_000_000;

const HOME_SKILLS: { skill: string; label: string }[] = [
  { skill: "mining", label: "Mining" },
  { skill: "agility", label: "Agility" },
  { skill: "herblore", label: "Herblore" },
  { skill: "smithing", label: "Smithing" },
  { skill: "runecraft", label: "Runecraft" },
  { skill: "hunter", label: "Hunter" },
  { skill: "firemaking", label: "Firemaking" },
  { skill: "thieving", label: "Thieving" },
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

function methodsForSkill(skill: string): SkillingMethod[] {
  switch (skill) {
    case "mining":
      return MINING_METHODS.filter((m) => !MINING_MOVED.has(m.id));
    case "agility":
      return AGILITY_METHODS.filter((m) => !AGILITY_MOVED.has(m.id));
    case "herblore":
      return HERBLORE_METHODS;
    case "smithing":
      return SMITHING_METHODS;
    case "runecraft":
      return RUNECRAFT_METHODS;
    case "hunter":
      return HUNTER_METHODS.filter((m) => !["red-chins", "black-chins"].includes(m.id));
    case "firemaking":
      return FIREMAKING_METHODS;
    case "thieving":
      return THIEVING_METHODS.filter((m) => !THIEVING_MOVED.has(m.id));
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
    default:
      return activitiesForSkill(skill);
  }
}

function iconForRanked(
  skill: string,
  id: string,
  method?: SkillingMethod,
  activity?: ActivityMethod,
): string {
  const fromMap = methodFallbackIcon(id, skill);
  if (fromMap) return fromMap;
  const outputName =
    method?.output?.name ??
    method?.outputs?.[0]?.name ??
    activity?.rewards[0]?.name;
  if (outputName && outputName !== "Coins") return `${outputName.replace(/ /g, "_")}.png`;
  return SKILL_ICONS[skill] ?? "Smithing_icon.png";
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
    if (!top) {
      return {
        skill,
        label,
        skillIcon: SKILL_ICONS[skill],
        method: label,
        methodIcon: SKILL_ICONS[skill],
        methodId: skill,
        xpPerHour: null,
        gpPerHour: null,
      };
    }
    return {
      skill,
      label,
      skillIcon: SKILL_ICONS[skill],
      method: top.label,
      methodIcon: iconForRanked(skill, top.id, top.method, top.activity),
      methodId: top.id,
      xpPerHour: top.xpPerHour,
      gpPerHour: top.gpPerHour,
    };
  });
}

export const HOME_SKILL_HIGHLIGHTS = HOME_SKILLS.map(({ skill, label }) => ({
  skill,
  label,
  skillIcon: SKILL_ICONS[skill],
  method: label,
  methodIcon: METHOD_ICONS[skill] ?? SKILL_ICONS[skill],
  methodId: skill,
}));
