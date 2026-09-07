import { METHOD_ICONS, SKILL_ICONS } from "@/lib/method-icons";
import {
  GIANTS_FOUNDRY_METHODS,
  GOTR_METHODS,
  PYRAMID_PLUNDER_METHODS,
  WINTERTODT_METHODS,
  resolveActivityBand,
  type ActivityMethod,
} from "@/lib/activity-methods";
import { HUNTER_RUMOUR_METHODS, SEPULCHRE_ACTIVITY, activityLiveGpPerHour } from "@/lib/wiki-audit-activities";
import { MIXOLOGY_METHODS } from "@/lib/mixology-methods";
import { MINING_METHODS } from "@/lib/mining-methods";
import type { PriceRow } from "@/lib/osrs.server";

export type HomeSkillHighlight = {
  skill: string;
  label: string;
  skillIcon: string;
  method: string;
  methodIcon: string;
  methodId: string;
};

export type HomeMethodRate = HomeSkillHighlight & {
  xpPerHour: number | null;
  gpPerHour: number | null;
};

/** Representative high-end method per skill for the landing page. */
export const HOME_SKILL_HIGHLIGHTS: HomeSkillHighlight[] = [
  {
    skill: "mining",
    label: "Mining",
    skillIcon: SKILL_ICONS.mining,
    method: "Infernal shale",
    methodIcon: METHOD_ICONS["infernal-shale"],
    methodId: "infernal-shale",
  },
  {
    skill: "agility",
    label: "Agility",
    skillIcon: SKILL_ICONS.agility,
    method: "Hallowed Sepulchre",
    methodIcon: METHOD_ICONS["hallowed-sepulchre"],
    methodId: "sepulchre-floor-5-loot",
  },
  {
    skill: "herblore",
    label: "Herblore",
    skillIcon: SKILL_ICONS.herblore,
    method: "Mastering Mixology",
    methodIcon: METHOD_ICONS["mastering-mixology"],
    methodId: "mastering-mixology",
  },
  {
    skill: "smithing",
    label: "Smithing",
    skillIcon: SKILL_ICONS.smithing,
    method: "Giants' Foundry",
    methodIcon: METHOD_ICONS["giants-foundry"],
    methodId: "giants-foundry",
  },
  {
    skill: "runecraft",
    label: "Runecraft",
    skillIcon: SKILL_ICONS.runecraft,
    method: "Guardians of the Rift",
    methodIcon: METHOD_ICONS["gotr-mass"],
    methodId: "gotr-mass",
  },
  {
    skill: "hunter",
    label: "Hunter",
    skillIcon: SKILL_ICONS.hunter,
    method: "Hunter rumours",
    methodIcon: METHOD_ICONS["hunter-rumours"],
    methodId: "hunter-rumours",
  },
  {
    skill: "firemaking",
    label: "Firemaking",
    skillIcon: SKILL_ICONS.firemaking,
    method: "Wintertodt",
    methodIcon: METHOD_ICONS["wintertodt-mass"],
    methodId: "wintertodt-mass",
  },
  {
    skill: "thieving",
    label: "Thieving",
    skillIcon: SKILL_ICONS.thieving,
    method: "Pyramid Plunder",
    methodIcon: METHOD_ICONS["pyramid-plunder"],
    methodId: "pyramid-plunder",
  },
];

const HOME_ACTIVITIES: ActivityMethod[] = [
  ...SEPULCHRE_ACTIVITY,
  ...MIXOLOGY_METHODS,
  ...GIANTS_FOUNDRY_METHODS,
  ...GOTR_METHODS,
  ...HUNTER_RUMOUR_METHODS,
  ...WINTERTODT_METHODS,
  ...PYRAMID_PLUNDER_METHODS,
];

function buyPrice(row: PriceRow | undefined): number | null {
  if (!row) return null;
  return row.high ?? row.low ?? null;
}

function sellPrice(row: PriceRow | undefined): number | null {
  if (!row) return null;
  return row.low ?? row.high ?? null;
}

function afterTaxSell(unitPrice: number): number {
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) return unitPrice;
  const tax = Math.min(Math.floor(unitPrice * 0.02), 5_000_000);
  return unitPrice - tax;
}

function craftRates(
  id: string,
  rowsByName: Map<string, PriceRow>,
): { xpPerHour: number; gpPerHour: number | null } | null {
  const method = MINING_METHODS.find((m) => m.id === id);
  if (!method) return null;
  const xpPerHour = method.xp * method.actionsPerHour;
  let inputCost = 0;
  let outputValue = 0;
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
  if (outs.length === 0) return { xpPerHour, gpPerHour: 0 };
  if (missing) return { xpPerHour, gpPerHour: null };
  return {
    xpPerHour,
    gpPerHour: Math.round((outputValue - inputCost) * method.actionsPerHour),
  };
}

export function homeMethodRates(rowsByName: Map<string, PriceRow>): HomeMethodRate[] {
  const prices = {
    buy: (name: string) => buyPrice(rowsByName.get(name)),
    sell: (name: string) => sellPrice(rowsByName.get(name)),
  };

  return HOME_SKILL_HIGHLIGHTS.map((row) => {
    const activity = HOME_ACTIVITIES.find((a) => a.id === row.methodId);
    if (activity) {
      const band = resolveActivityBand(activity, null);
      const { gpPerHour } = activityLiveGpPerHour(activity, band, prices);
      return { ...row, xpPerHour: band.xpPerHour, gpPerHour };
    }
    const craft = craftRates(row.methodId, rowsByName);
    return {
      ...row,
      xpPerHour: craft?.xpPerHour ?? null,
      gpPerHour: craft?.gpPerHour ?? null,
    };
  });
}
