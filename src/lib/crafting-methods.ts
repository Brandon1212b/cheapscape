/**
 * Crafting training methods (P2P guide rates).
 * https://oldschool.runescape.wiki/w/Pay-to-play_Crafting_training
 * Gem cutting assumes 2,780 gems/h (Jeweller's chisel is +9–10%, not used).
 */
export type MethodPart = {
  name: string;
  qty: number;
};

export type CraftingMethod = {
  id: string;
  label: string;
  level: number;
  xp: number;
  actionsPerHour: number;
  inputs: MethodPart[];
  output: MethodPart | null;
};

const GEM_CUT_APH = 2780;

export const CRAFTING_METHODS: CraftingMethod[] = [
  {
    id: "molten-glass",
    label: "Molten glass",
    level: 1,
    xp: 20,
    actionsPerHour: 2500,
    inputs: [
      { name: "Bucket of sand", qty: 1 },
      { name: "Soda ash", qty: 1 },
    ],
    output: { name: "Molten glass", qty: 1 },
  },
  {
    id: "unpowered-orb",
    label: "Unpowered orb",
    level: 46,
    xp: 52.5,
    actionsPerHour: 1800,
    inputs: [{ name: "Molten glass", qty: 1 }],
    output: { name: "Unpowered orb", qty: 1 },
  },
  {
    id: "light-orb",
    label: "Empty light orb",
    level: 87,
    xp: 70,
    actionsPerHour: 1800,
    inputs: [{ name: "Molten glass", qty: 1 }],
    output: { name: "Empty light orb", qty: 1 },
  },
  {
    id: "vial",
    label: "Vial (glassblowing)",
    level: 33,
    xp: 35,
    actionsPerHour: 1800,
    inputs: [{ name: "Molten glass", qty: 1 }],
    output: { name: "Vial", qty: 1 },
  },
  {
    id: "cut-sapphire",
    label: "Cut sapphire",
    level: 20,
    xp: 50,
    actionsPerHour: GEM_CUT_APH,
    inputs: [{ name: "Uncut sapphire", qty: 1 }],
    output: { name: "Sapphire", qty: 1 },
  },
  {
    id: "cut-emerald",
    label: "Cut emerald",
    level: 27,
    xp: 67.5,
    actionsPerHour: GEM_CUT_APH,
    inputs: [{ name: "Uncut emerald", qty: 1 }],
    output: { name: "Emerald", qty: 1 },
  },
  {
    id: "cut-ruby",
    label: "Cut ruby",
    level: 34,
    xp: 85,
    actionsPerHour: GEM_CUT_APH,
    inputs: [{ name: "Uncut ruby", qty: 1 }],
    output: { name: "Ruby", qty: 1 },
  },
  {
    id: "cut-diamond",
    label: "Cut diamond",
    level: 43,
    xp: 107.5,
    actionsPerHour: GEM_CUT_APH,
    inputs: [{ name: "Uncut diamond", qty: 1 }],
    output: { name: "Diamond", qty: 1 },
  },
  {
    id: "cut-dragonstone",
    label: "Cut dragonstone",
    level: 55,
    xp: 137.5,
    actionsPerHour: GEM_CUT_APH,
    inputs: [{ name: "Uncut dragonstone", qty: 1 }],
    output: { name: "Dragonstone", qty: 1 },
  },
  {
    id: "sapphire-ring",
    label: "Sapphire ring",
    level: 20,
    xp: 40,
    actionsPerHour: 650,
    inputs: [
      { name: "Gold bar", qty: 1 },
      { name: "Sapphire", qty: 1 },
    ],
    output: { name: "Sapphire ring", qty: 1 },
  },
  {
    id: "sapphire-amulet-u",
    label: "Sapphire amulet (u)",
    level: 24,
    xp: 65,
    actionsPerHour: 650,
    inputs: [
      { name: "Gold bar", qty: 1 },
      { name: "Sapphire", qty: 1 },
    ],
    output: { name: "Sapphire amulet (u)", qty: 1 },
  },
  {
    id: "emerald-ring",
    label: "Emerald ring",
    level: 27,
    xp: 55,
    actionsPerHour: 650,
    inputs: [
      { name: "Gold bar", qty: 1 },
      { name: "Emerald", qty: 1 },
    ],
    output: { name: "Emerald ring", qty: 1 },
  },
  {
    id: "ruby-amulet-u",
    label: "Ruby amulet (u)",
    level: 50,
    xp: 85,
    actionsPerHour: 650,
    inputs: [
      { name: "Gold bar", qty: 1 },
      { name: "Ruby", qty: 1 },
    ],
    output: { name: "Ruby amulet (u)", qty: 1 },
  },
  {
    id: "diamond-amulet-u",
    label: "Diamond amulet (u)",
    level: 70,
    xp: 100,
    actionsPerHour: 650,
    inputs: [
      { name: "Gold bar", qty: 1 },
      { name: "Diamond", qty: 1 },
    ],
    output: { name: "Diamond amulet (u)", qty: 1 },
  },
  {
    id: "dragonstone-amulet-u",
    label: "Dragonstone amulet (u)",
    level: 80,
    xp: 150,
    actionsPerHour: 650,
    inputs: [
      { name: "Gold bar", qty: 1 },
      { name: "Dragonstone", qty: 1 },
    ],
    output: { name: "Dragonstone amulet (u)", qty: 1 },
  },
  {
    id: "water-battlestaff",
    label: "Water battlestaff",
    level: 54,
    xp: 100,
    actionsPerHour: 2450,
    inputs: [
      { name: "Battlestaff", qty: 1 },
      { name: "Water orb", qty: 1 },
    ],
    output: { name: "Water battlestaff", qty: 1 },
  },
  {
    id: "earth-battlestaff",
    label: "Earth battlestaff",
    level: 58,
    xp: 112.5,
    actionsPerHour: 2450,
    inputs: [
      { name: "Battlestaff", qty: 1 },
      { name: "Earth orb", qty: 1 },
    ],
    output: { name: "Earth battlestaff", qty: 1 },
  },
  {
    id: "fire-battlestaff",
    label: "Fire battlestaff",
    level: 62,
    xp: 125,
    actionsPerHour: 2450,
    inputs: [
      { name: "Battlestaff", qty: 1 },
      { name: "Fire orb", qty: 1 },
    ],
    output: { name: "Fire battlestaff", qty: 1 },
  },
  {
    id: "air-battlestaff",
    label: "Air battlestaff",
    level: 66,
    xp: 137.5,
    actionsPerHour: 2450,
    inputs: [
      { name: "Battlestaff", qty: 1 },
      { name: "Air orb", qty: 1 },
    ],
    output: { name: "Air battlestaff", qty: 1 },
  },
  {
    id: "green-dhide-body",
    label: "Green d'hide body",
    level: 63,
    xp: 186,
    actionsPerHour: 1705,
    inputs: [{ name: "Green dragon leather", qty: 3 }],
    output: { name: "Green d'hide body", qty: 1 },
  },
  {
    id: "blue-dhide-body",
    label: "Blue d'hide body",
    level: 71,
    xp: 210,
    actionsPerHour: 1705,
    inputs: [{ name: "Blue dragon leather", qty: 3 }],
    output: { name: "Blue d'hide body", qty: 1 },
  },
  {
    id: "red-dhide-body",
    label: "Red d'hide body",
    level: 77,
    xp: 234,
    actionsPerHour: 1705,
    inputs: [{ name: "Red dragon leather", qty: 3 }],
    output: { name: "Red d'hide body", qty: 1 },
  },
  {
    id: "black-dhide-body",
    label: "Black d'hide body",
    level: 84,
    xp: 258,
    actionsPerHour: 1705,
    inputs: [{ name: "Black dragon leather", qty: 3 }],
    output: { name: "Black d'hide body", qty: 1 },
  },
  {
    id: "amethyst-bolt-tips",
    label: "Amethyst bolt tips",
    level: 83,
    xp: 60,
    actionsPerHour: 2750,
    inputs: [{ name: "Amethyst", qty: 1 }],
    output: { name: "Amethyst bolt tips", qty: 15 },
  },
  {
    id: "amethyst-arrowtips",
    label: "Amethyst arrowtips",
    level: 85,
    xp: 60,
    actionsPerHour: 2750,
    inputs: [{ name: "Amethyst", qty: 1 }],
    output: { name: "Amethyst arrowtips", qty: 15 },
  },
  {
    id: "amethyst-javelin-tips",
    label: "Amethyst javelin tips",
    level: 87,
    xp: 60,
    actionsPerHour: 2750,
    inputs: [{ name: "Amethyst", qty: 1 }],
    output: { name: "Amethyst javelin tips", qty: 5 },
  },
  {
    id: "amethyst-dart-tip",
    label: "Amethyst dart tips",
    level: 89,
    xp: 60,
    actionsPerHour: 2750,
    inputs: [{ name: "Amethyst", qty: 1 }],
    output: { name: "Amethyst dart tip", qty: 8 },
  },
  {
    id: "golem-dark-kebbit",
    label: "Golem crafting (dark kebbit fur)",
    level: 60,
    xp: 2700,
    actionsPerHour: 55,
    inputs: [{ name: "Dark kebbit fur", qty: 1 }],
    output: null,
  },
  {
    id: "golem-fox",
    label: "Golem crafting (fox fur)",
    level: 60,
    xp: 2680,
    actionsPerHour: 55,
    inputs: [{ name: "Fox fur", qty: 1 }],
    output: null,
  },
  {
    id: "golem-graahk",
    label: "Golem crafting (graahk fur)",
    level: 60,
    xp: 2640,
    actionsPerHour: 55,
    inputs: [{ name: "Graahk fur", qty: 1 }],
    output: null,
  },
  {
    id: "golem-moonlight-antelope",
    label: "Golem crafting (moonlight antelope)",
    level: 60,
    xp: 2760,
    actionsPerHour: 55,
    inputs: [{ name: "Moonlight antelope fur", qty: 1 }],
    output: null,
  },
];

export function craftingMethodItemNames(): string[] {
  const names = new Set<string>();
  for (const m of CRAFTING_METHODS) {
    for (const p of m.inputs) names.add(p.name);
    if (m.output) names.add(m.output.name);
  }
  return [...names];
}
