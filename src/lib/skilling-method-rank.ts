import type { PriceRow, Trend } from "@/lib/osrs.server";
import type { PlayerSkills } from "@/lib/player-stats";
import type { ActivityMethod } from "@/lib/activity-methods";
import { resolveActivityBand } from "@/lib/activity-methods";
import { deriveIntensity } from "@/components/methods-ux";
import { getActivityType } from "@/components/activity-type";
import { hoursToXp } from "@/lib/osrs-xp";
import type { RankedMethod, SkillingMethod } from "@/components/skilling-types";

export type AmuletChoice = "none" | "chemistry" | "alchemist";
export type CraftSort = "gp_desc" | "gp_asc" | "xp_desc" | "xp_asc" | "cost_desc" | "cost_asc";
export const DEFAULT_SORT: CraftSort = "cost_asc";
export const G_MIN = 250_000;
export const G_MAX = 10_000_000;
export const G_STEP = 250_000;

export function buyPrice(row: PriceRow | undefined): number | null {
  if (!row) return null;
  return row.high ?? row.low ?? null;
}
export function sellPrice(row: PriceRow | undefined): number | null {
  if (!row) return null;
  return row.low ?? row.high ?? null;
}
function afterTaxSell(unitPrice: number): number {
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) return unitPrice;
  const tax = Math.min(Math.floor(unitPrice * 0.02), 5_000_000);
  return unitPrice - tax;
}
export function clampG(n: number) {
  if (!Number.isFinite(n) || n <= 0) return G_MIN;
  return Math.min(G_MAX, Math.max(G_MIN, Math.round(n / G_STEP) * G_STEP));
}
function effectiveGpPerXp(xpPerHour: number, gpPerHour: number, moneyPerHour: number): number | null {
  if (xpPerHour <= 0 || moneyPerHour <= 0) return null;
  return Math.round(((moneyPerHour - gpPerHour) / xpPerHour) * 10) / 10;
}
function avg30Price(row: PriceRow | undefined, trendsById: Record<number, Trend> | undefined): number | null {
  if (!row) return null;
  const t = trendsById?.[row.id];
  if (t?.avg30 && t.avg30 > 0) return t.avg30;
  return null;
}
function netPctChange(current: number, baseline: number): number | null {
  const denom = Math.abs(baseline);
  if (denom < 1) return null;
  return Math.round(((current - baseline) / denom) * 1000) / 10;
}
function nullsLast(a: number | null, b: number | null, dir: 1 | -1): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return (a - b) * dir;
}
function amuletChargeCost(amulet: AmuletChoice, chemistryPrice: number | null): number {
  if (amulet === "none" || chemistryPrice == null) return 0;
  return amulet === "chemistry" ? chemistryPrice / 5 : chemistryPrice / 10;
}
export function readSkillLevel(
  skills: PlayerSkills | null | undefined,
  skillKey: string,
): number | undefined {
  if (!skills) return undefined;
  const direct = skills[skillKey];
  if (typeof direct === "number" && Number.isFinite(direct)) return direct;
  const lower = skillKey.toLowerCase();
  for (const [k, v] of Object.entries(skills)) {
    if (k.toLowerCase() === lower && typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

export function rankSkillingMethods(opts: {
  methods: SkillingMethod[];
  activities: ActivityMethod[];
  rowsByName: Map<string, PriceRow>;
  trendsById?: Record<number, Trend>;
  moneyPerHour: number;
  skillLevel?: number;
  magicLevel?: number;
  sort: CraftSort;
  amulet: AmuletChoice;
  isHerblore: boolean;
  skillKey: string;
  goalView: "rate" | "goal";
  xpRemaining: number | null;
}): RankedMethod[] {
  const {
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
    goalView,
    xpRemaining,
  } = opts;

  const chemistryPrice = isHerblore ? buyPrice(rowsByName.get("Amulet of chemistry")) : null;
  const list: RankedMethod[] = methods.map((method) => {
    let inputCost = 0;
    let missing = false;
    for (const p of method.inputs) {
      if (p.name === "Coins") {
        inputCost += p.qty;
        continue;
      }
      const unit = buyPrice(rowsByName.get(p.name));
      if (unit == null) {
        missing = true;
        continue;
      }
      inputCost += unit * p.qty;
    }
    if (isHerblore) inputCost += amuletChargeCost(amulet, chemistryPrice);

    let outputValue = 0;
    const outs =
      method.outputs && method.outputs.length > 0
        ? method.outputs
        : method.output
          ? [method.output]
          : [];
    for (const p of outs) {
      if (p.name === "Coins") {
        outputValue += p.qty;
        continue;
      }
      const unit = sellPrice(rowsByName.get(p.name));
      if (unit == null) {
        missing = true;
        continue;
      }
      outputValue += afterTaxSell(unit) * p.qty;
    }

    const profitPerCraft = missing ? null : outputValue - inputCost;
    const xpPerHour = method.xp * method.actionsPerHour;
    const gpPerHour =
      profitPerCraft == null ? null : Math.round(profitPerCraft * method.actionsPerHour);

    let baselineIn = 0;
    let baselineOut = 0;
    let hasBaseline = true;
    for (const p of method.inputs) {
      if (p.name === "Coins") {
        baselineIn += p.qty;
        continue;
      }
      const avg = avg30Price(rowsByName.get(p.name), trendsById);
      if (avg == null) {
        hasBaseline = false;
        break;
      }
      baselineIn += avg * p.qty;
    }
    if (hasBaseline) {
      for (const p of outs) {
        if (p.name === "Coins") {
          baselineOut += p.qty;
          continue;
        }
        const avg = avg30Price(rowsByName.get(p.name), trendsById);
        if (avg == null) {
          hasBaseline = false;
          break;
        }
        baselineOut += afterTaxSell(avg) * p.qty;
      }
    }
    const baselineProfit = hasBaseline ? baselineOut - baselineIn : null;
    const netChangePct =
      profitPerCraft != null && baselineProfit != null
        ? netPctChange(profitPerCraft, baselineProfit)
        : null;
    const costPerXp =
      gpPerHour == null ? null : effectiveGpPerXp(xpPerHour, gpPerHour, moneyPerHour);
    let locked = skillLevel != null && skillLevel < method.level;
    if (!locked && method.magicLevel != null && magicLevel != null && magicLevel < method.magicLevel) {
      locked = true;
    }
    const hoursToTarget = hoursToXp(xpRemaining ?? 0, xpPerHour);
    const totalGp =
      gpPerHour == null || hoursToTarget == null ? null : Math.round(gpPerHour * hoursToTarget);

    return {
      id: method.id,
      label: method.label,
      level: method.level,
      xpPerHour,
      gpPerHour,
      hoursToTarget,
      totalGp,
      profitPerCraft,
      netChangePct,
      costPerXp,
      netValuePerHour: null,
      missing,
      locked,
      method,
      secondaryLine: method.magicLevel != null ? `Magic ${method.magicLevel}` : null,
      intensity: deriveIntensity(method),
      category: getActivityType(skillKey, method),
    };
  });

  for (const activity of activities) {
    const band = resolveActivityBand(activity, skillLevel ?? 1);
    const xpPerHour = band.xpPerHour;
    let rewardValue = 0;
    let consumableCost = 0;
    let missing = false;
    for (const r of activity.rewards) {
      if (r.name === "Coins") {
        rewardValue += r.expectedQtyPerHour;
        continue;
      }
      const unit = sellPrice(rowsByName.get(r.name));
      if (unit == null) {
        missing = true;
        continue;
      }
      rewardValue += afterTaxSell(unit) * r.expectedQtyPerHour;
    }
    for (const c of activity.consumables) {
      if (c.name === "Coins") {
        consumableCost += c.qty;
        continue;
      }
      const unit = buyPrice(rowsByName.get(c.name));
      if (unit == null) {
        missing = true;
        continue;
      }
      consumableCost += unit * c.qty;
    }
    const residual = band.expectedLootGpPerHour ?? 0;
    const hasAnyValue =
      activity.rewards.length > 0 || activity.consumables.length > 0 || residual !== 0;
    const gpPerHour = !hasAnyValue ? null : Math.round(rewardValue + residual - consumableCost);
    const costPerXp =
      gpPerHour == null ? null : effectiveGpPerXp(xpPerHour, gpPerHour, moneyPerHour);
    const secondaryParts: string[] = [];
    if (activity.secondarySkill) {
      const secXp = band.secondaryXpPerHour;
      secondaryParts.push(
        secXp != null
          ? `${activity.secondarySkill} ${Math.round(secXp).toLocaleString()} xp/h`
          : activity.secondarySkill,
      );
    }
    const hoursToTarget = hoursToXp(xpRemaining ?? 0, xpPerHour);
    const totalGp =
      gpPerHour == null || hoursToTarget == null ? null : Math.round(gpPerHour * hoursToTarget);
    list.push({
      id: activity.id,
      label: activity.label,
      level: activity.level,
      xpPerHour,
      gpPerHour,
      hoursToTarget,
      totalGp,
      profitPerCraft: null,
      netChangePct: null,
      costPerXp,
      netValuePerHour: gpPerHour,
      missing,
      locked: skillLevel != null && skillLevel < activity.level,
      activity,
      secondaryLine: secondaryParts.length > 0 ? secondaryParts.join(" \u00b7 ") : null,
      notes: activity.notes ?? null,
      intensity: deriveIntensity(activity, true),
      rateBandLevel: band.level,
      category: getActivityType(skillKey, activity, true),
    });
  }

  list.sort((a, b) => {
    if (skillLevel != null && a.locked !== b.locked) return a.locked ? 1 : -1;
    switch (sort) {
      case "gp_desc":
        return goalView === "goal"
          ? nullsLast(b.totalGp ?? null, a.totalGp ?? null, 1)
          : nullsLast(b.gpPerHour, a.gpPerHour, 1);
      case "gp_asc":
        return goalView === "goal"
          ? nullsLast(a.totalGp ?? null, b.totalGp ?? null, 1)
          : nullsLast(a.gpPerHour, b.gpPerHour, 1);
      case "xp_desc":
        return goalView === "goal"
          ? nullsLast(a.hoursToTarget ?? null, b.hoursToTarget ?? null, 1)
          : b.xpPerHour - a.xpPerHour;
      case "xp_asc":
        return goalView === "goal"
          ? nullsLast(b.hoursToTarget ?? null, a.hoursToTarget ?? null, 1)
          : a.xpPerHour - b.xpPerHour;
      case "cost_desc":
        return nullsLast(b.costPerXp, a.costPerXp, 1);
      case "cost_asc":
      default:
        return nullsLast(a.costPerXp, b.costPerXp, 1);
    }
  });

  return list;
}
