/**
 * Sailing training methods (P2P).
 * https://oldschool.runescape.wiki/w/Sailing_training
 *
 * Barracuda Trials, shipwreck salvaging, and bounty tasks (with wiki-backed
 * XP/hr + live-GE cannonball cost) live in sailing-activity-methods.ts.
 *
 * Courier / charting are pure XP — coin rewards vary too much by route to model
 * as stable GE outputs.
 */
export type MethodPart = { name: string; qty: number };

export type SailingMethod = {
  id: string;
  label: string;
  level: number;
  xp: number;
  actionsPerHour: number;
  inputs: MethodPart[];
  output: MethodPart | null;
};

export const SAILING_METHODS: SailingMethod[] = [
  {
    id: "courier-early",
    label: "Courier tasks (early ports)",
    level: 1,
    xp: 200,
    actionsPerHour: 50, // ~10k XP/hr mixed with charting
    inputs: [],
    output: null,
  },
  {
    id: "sea-charting",
    label: "Sea charting",
    level: 1,
    xp: 150,
    actionsPerHour: 80, // ~12k early; up to ~22k focused mid
    inputs: [],
    output: null,
  },
  {
    id: "courier-summer-shore",
    label: "Courier — Summer Shore loop",
    level: 45,
    xp: 4000,
    actionsPerHour: 8, // ~30–32k XP/hr
    inputs: [],
    output: null,
  },
  {
    id: "courier-rellekka",
    label: "Courier — Rellekka / Etceteria",
    level: 62,
    xp: 5500,
    actionsPerHour: 12, // ~60–90k XP/hr
    inputs: [],
    output: null,
  },
  {
    id: "courier-prifddinas",
    label: "Courier — Prifddinas / Tirannwn",
    level: 70,
    xp: 6000,
    actionsPerHour: 11, // ~65–70k XP/hr (Song of the Elves)
    inputs: [],
    output: null,
  },
];

export function sailingMethodItemNames(): string[] {
  const names = new Set<string>();
  for (const m of SAILING_METHODS) {
    for (const p of m.inputs) names.add(p.name);
    if (m.output) names.add(m.output.name);
  }
  return [...names];
}
