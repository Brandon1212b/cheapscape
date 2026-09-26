/**
 * Sailing activities: Barracuda Trials (XP) + shipwreck salvaging (XP + live GE)
 * + bounty port tasks (boat combat).
 *
 * Salvage rewards use wiki MMG expected quantities per hour so gp/hr tracks
 * the live GE snapshot (refetch ~2 min). Residual expectedLootGpPerHour covers
 * coins, rare uniques, and thin-volume items without reliable GE names.
 *
 * Bounty gp/hr uses wiki on-task average kill value × estimated kills/hr as
 * residual loot EV; cannonballs are itemized so live GE subtracts ammo cost.
 *
 * Sources:
 * https://oldschool.runescape.wiki/w/Shipwreck_salvaging
 * https://oldschool.runescape.wiki/w/Money_making_guide/Salvaging_*_shipwrecks
 * https://oldschool.runescape.wiki/w/Sailing_training
 * https://oldschool.runescape.wiki/w/Bounty_tasks
 */
import type { ActivityMethod } from "@/lib/activity-methods";

export const SAILING_ACTIVITY_METHODS: ActivityMethod[] = [
  // ── Barracuda Trials (fastest XP; negligible direct GE loot) ─────────────
  {
    id: "barracuda-tempor-tantrum",
    label: "Barracuda — The Tempor Tantrum",
    skillKey: "sailing",
    level: 30,
    rateBands: [
      { level: 30, xpPerHour: 19_000, expectedLootGpPerHour: 0 },
      { level: 40, xpPerHour: 22_000, expectedLootGpPerHour: 0 },
      { level: 50, xpPerHour: 24_500, expectedLootGpPerHour: 0 },
    ],
    consumables: [],
    rewards: [],
    intensity: "high",
    notes:
      "Unlocked at 30. Swordfish → Shark → Marlin ranks. Boat upgrades improve lap times. First completion of each rank gives bonus XP.",
  },
  {
    id: "barracuda-jubbly-jive",
    label: "Barracuda — The Jubbly Jive",
    skillKey: "sailing",
    level: 55,
    rateBands: [
      { level: 55, xpPerHour: 65_000, expectedLootGpPerHour: 0 },
      { level: 65, xpPerHour: 81_000, expectedLootGpPerHour: 0 },
      { level: 70, xpPerHour: 89_000, expectedLootGpPerHour: 0 },
    ],
    consumables: [],
    rewards: [],
    intensity: "high",
    notes: "Unlocked at 55. Shark/Marlin ranks ~80–90k XP/hr at target times.",
  },
  {
    id: "barracuda-gwenith-glide",
    label: "Barracuda — The Gwenith Glide",
    skillKey: "sailing",
    level: 72,
    rateBands: [
      { level: 72, xpPerHour: 114_000, expectedLootGpPerHour: 0 },
      { level: 85, xpPerHour: 145_000, expectedLootGpPerHour: 0 },
      { level: 93, xpPerHour: 184_000, expectedLootGpPerHour: 0 },
      { level: 99, xpPerHour: 198_000, expectedLootGpPerHour: 0 },
    ],
    consumables: [],
    rewards: [],
    intensity: "high",
    notes:
      "Unlocked at 72. Fastest method. Marlin ~184k XP/hr; rosewood hull + crystal extractor can exceed ~200k.",
  },

  // ── Shipwreck salvaging (itemized from wiki MMG qty/hr) ─────────────────
  {
    id: "salvage-small",
    label: "Salvaging — small shipwrecks",
    skillKey: "sailing",
    level: 15,
    rateBands: [{ level: 15, xpPerHour: 2_500, expectedLootGpPerHour: 5_500 }],
    consumables: [],
    rewards: [
      { name: "Plank", expectedQtyPerHour: 8.23 },
      { name: "Oak plank", expectedQtyPerHour: 4.13 },
      { name: "Bronze bar", expectedQtyPerHour: 16.32 },
      { name: "Iron bar", expectedQtyPerHour: 4.02 },
      { name: "Logs", expectedQtyPerHour: 16.22 },
      { name: "Oak logs", expectedQtyPerHour: 8.25 },
      { name: "Bronze nails", expectedQtyPerHour: 47.95 },
      { name: "Iron nails", expectedQtyPerHour: 24.1 },
      { name: "Water rune", expectedQtyPerHour: 44.15 },
      { name: "Air rune", expectedQtyPerHour: 44.08 },
      { name: "Bones", expectedQtyPerHour: 8.06 },
    ],
    intensity: "low",
    notes:
      "Live GE on common salvage. Residual ~5.5k for coins + boat bottle EV. Sort/bank at port.",
  },
  {
    id: "salvage-fisherman",
    label: "Salvaging — fisherman's shipwrecks",
    skillKey: "sailing",
    level: 26,
    rateBands: [{ level: 26, xpPerHour: 5_000, expectedLootGpPerHour: 5_000 }],
    consumables: [],
    rewards: [
      { name: "Fishing bait", expectedQtyPerHour: 835 },
      { name: "Feather", expectedQtyPerHour: 1_464 },
      { name: "Raw swordfish", expectedQtyPerHour: 13.64 },
      { name: "Raw lobster", expectedQtyPerHour: 13.64 },
      { name: "Oak plank", expectedQtyPerHour: 6.78 },
      { name: "Iron bar", expectedQtyPerHour: 6.75 },
      { name: "Oak logs", expectedQtyPerHour: 13.65 },
      { name: "Iron nails", expectedQtyPerHour: 20.38 },
      { name: "Steel nails", expectedQtyPerHour: 10.28 },
      { name: "Plank", expectedQtyPerHour: 3.42 },
    ],
    intensity: "low",
    notes: "Live GE. Residual ~5k for boat bottle / thin drops. 9 Fishing on wiki MMG setup.",
  },
  {
    id: "salvage-barracuda",
    label: "Salvaging — Barracuda shipwrecks",
    skillKey: "sailing",
    level: 35,
    rateBands: [
      { level: 35, xpPerHour: 10_000, expectedLootGpPerHour: 10_000 },
      { level: 45, xpPerHour: 12_000, expectedLootGpPerHour: 10_000 },
    ],
    consumables: [],
    rewards: [
      { name: "Steel cannonball", expectedQtyPerHour: 29.04 },
      { name: "Teak logs", expectedQtyPerHour: 28.95 },
      { name: "Oak logs", expectedQtyPerHour: 38.53 },
      { name: "Oak plank", expectedQtyPerHour: 9.64 },
      { name: "Teak plank", expectedQtyPerHour: 1.96 },
      { name: "Steel nails", expectedQtyPerHour: 58 },
      { name: "Swamp paste", expectedQtyPerHour: 212 },
      { name: "Rope", expectedQtyPerHour: 9.62 },
      { name: "Raw swordfish", expectedQtyPerHour: 3.87 },
      { name: "Raw shark", expectedQtyPerHour: 1.93 },
      { name: "Hemp seed", expectedQtyPerHour: 1.96 },
    ],
    intensity: "low",
    notes:
      "Live GE. Residual ~10k for boat bottle / repair kits / thin drops. Two mithril hooks raise XP.",
  },
  {
    id: "salvage-large",
    label: "Salvaging — large shipwrecks",
    skillKey: "sailing",
    level: 53,
    rateBands: [{ level: 53, xpPerHour: 18_000, expectedLootGpPerHour: 20_000 }],
    consumables: [{ name: "Nature rune", qty: 163 }],
    rewards: [
      { name: "Diamond ring", expectedQtyPerHour: 32.46 },
      { name: "Emerald ring", expectedQtyPerHour: 48.69 },
      { name: "Sapphire ring", expectedQtyPerHour: 48.69 },
      { name: "Oyster pearls", expectedQtyPerHour: 32.46 },
      { name: "Casket", expectedQtyPerHour: 16.23 },
      { name: "Steel nails", expectedQtyPerHour: 97.39 },
      { name: "Mithril cannonball", expectedQtyPerHour: 28.4 },
      { name: "Mithril nails", expectedQtyPerHour: 14.61 },
      { name: "Adamant cannonball", expectedQtyPerHour: 6.49 },
      { name: "Oak plank", expectedQtyPerHour: 8.12 },
      { name: "Hemp seed", expectedQtyPerHour: 4.87 },
      { name: "Cotton seed", expectedQtyPerHour: 2.43 },
    ],
    intensity: "low",
    notes:
      "Live GE on rings/caskets/seeds. Nature runes for HA. Residual ~20k for facility bottle EV + frags. ~10k Magic XP/hr from alchs.",
  },
  {
    id: "salvage-pirate",
    label: "Salvaging — pirate shipwrecks",
    skillKey: "sailing",
    level: 64,
    rateBands: [{ level: 64, xpPerHour: 27_000, expectedLootGpPerHour: 20_000 }],
    consumables: [{ name: "Nature rune", qty: 279 }],
    rewards: [
      { name: "Ruby bracelet", expectedQtyPerHour: 26.06 },
      { name: "Emerald bracelet", expectedQtyPerHour: 34.75 },
      { name: "Diamond bracelet", expectedQtyPerHour: 8.69 },
      { name: "Diamond ring", expectedQtyPerHour: 8.69 },
      { name: "Sapphire ring", expectedQtyPerHour: 34.75 },
      { name: "Emerald ring", expectedQtyPerHour: 17.37 },
      { name: "Gold ring", expectedQtyPerHour: 69.5 },
      { name: "Oyster pearls", expectedQtyPerHour: 34.75 },
      { name: "Mithril scimitar", expectedQtyPerHour: 34.75 },
      { name: "Casket", expectedQtyPerHour: 17.37 },
      { name: "Mithril cannonball", expectedQtyPerHour: 60.81 },
      { name: "Adamant cannonball", expectedQtyPerHour: 30.41 },
      { name: "Rune cannonball", expectedQtyPerHour: 10.42 },
      { name: "Rune scimitar", expectedQtyPerHour: 0.35 },
    ],
    intensity: "low",
    notes:
      "Live GE on jewellery + weapons. Nature runes for HA. Residual ~20k for facility bottle / repair kits.",
  },
  {
    id: "salvage-mercenary",
    label: "Salvaging — mercenary shipwrecks",
    skillKey: "sailing",
    level: 73,
    rateBands: [{ level: 73, xpPerHour: 49_000, expectedLootGpPerHour: 25_000 }],
    consumables: [{ name: "Nature rune", qty: 118 }],
    rewards: [
      { name: "Green d'hide body", expectedQtyPerHour: 12.91 },
      { name: "Amulet of power", expectedQtyPerHour: 25.82 },
      { name: "Adamant 2h sword", expectedQtyPerHour: 12.91 },
      { name: "Adamant longsword", expectedQtyPerHour: 25.82 },
      { name: "Mithril longsword", expectedQtyPerHour: 38.73 },
      { name: "Rune longsword", expectedQtyPerHour: 1.29 },
      { name: "Adamant dart tip", expectedQtyPerHour: 51.64 },
      { name: "Mithril dart tip", expectedQtyPerHour: 116 },
      { name: "Adamant arrowtips", expectedQtyPerHour: 116 },
      { name: "Adamant bolts (unf)", expectedQtyPerHour: 25.82 },
      { name: "Adamant cannonball", expectedQtyPerHour: 45.18 },
      { name: "Rune cannonball", expectedQtyPerHour: 19.36 },
      { name: "Rune arrow", expectedQtyPerHour: 25.82 },
      { name: "Adamantite nails", expectedQtyPerHour: 12.91 },
      { name: "Camphor seed", expectedQtyPerHour: 1.29 },
      { name: "Ironwood seed", expectedQtyPerHour: 0.13 },
    ],
    intensity: "low",
    notes:
      "Live GE on alchables + tips. Nature runes for HA. Residual ~25k for facility bottle / salvor's paint / frags. Often best salvage profit.",
  },
  {
    id: "salvage-fremennik",
    label: "Salvaging — Fremennik shipwrecks",
    skillKey: "sailing",
    level: 80,
    rateBands: [{ level: 80, xpPerHour: 52_000, expectedLootGpPerHour: 25_000 }],
    consumables: [{ name: "Nature rune", qty: 5 }],
    rewards: [
      { name: "Berserker helm", expectedQtyPerHour: 0.93 },
      { name: "Archer helm", expectedQtyPerHour: 0.93 },
      { name: "Farseer helm", expectedQtyPerHour: 0.93 },
      { name: "Warrior helm", expectedQtyPerHour: 0.93 },
      { name: "Fremennik helm", expectedQtyPerHour: 0.93 },
      { name: "Rune cannonball", expectedQtyPerHour: 20.32 },
      { name: "Mahogany plank", expectedQtyPerHour: 5.81 },
      { name: "Rune nails", expectedQtyPerHour: 11.61 },
      { name: "Adamantite nails", expectedQtyPerHour: 23.22 },
      { name: "Astral rune", expectedQtyPerHour: 46.44 },
      { name: "Cotton seed", expectedQtyPerHour: 2.32 },
      { name: "Ironwood seed", expectedQtyPerHour: 0.58 },
      { name: "Rosewood seed", expectedQtyPerHour: 0.12 },
    ],
    intensity: "low",
    notes:
      "Live GE on Fremennik helms + seeds. Residual ~25k for facility bottle / frags. Eternal brazier for icy seas.",
  },
  {
    id: "salvage-merchant",
    label: "Salvaging — merchant shipwrecks",
    skillKey: "sailing",
    level: 87,
    rateBands: [{ level: 87, xpPerHour: 60_000, expectedLootGpPerHour: 85_000 }],
    consumables: [{ name: "Nature rune", qty: 8 }],
    rewards: [
      { name: "Uncut red topaz", expectedQtyPerHour: 19.81 },
      { name: "Uncut jade", expectedQtyPerHour: 19.81 },
      { name: "Uncut opal", expectedQtyPerHour: 19.81 },
      { name: "Uncut sapphire", expectedQtyPerHour: 3.25 },
      { name: "Uncut emerald", expectedQtyPerHour: 1.63 },
      { name: "Uncut ruby", expectedQtyPerHour: 0.81 },
      { name: "Uncut diamond", expectedQtyPerHour: 0.2 },
      { name: "Grimy snapdragon", expectedQtyPerHour: 1.65 },
      { name: "Grimy ranarr weed", expectedQtyPerHour: 1.65 },
      { name: "Grimy avantoe", expectedQtyPerHour: 2.06 },
      { name: "Grimy kwuarm", expectedQtyPerHour: 2.06 },
      { name: "Grimy torstol", expectedQtyPerHour: 1.24 },
      { name: "Grimy cadantine", expectedQtyPerHour: 1.65 },
      { name: "Grimy dwarf weed", expectedQtyPerHour: 1.65 },
      { name: "Grimy lantadyme", expectedQtyPerHour: 1.24 },
      { name: "Snapdragon seed", expectedQtyPerHour: 0.28 },
      { name: "Snape grass seed", expectedQtyPerHour: 0.36 },
      { name: "Toadflax seed", expectedQtyPerHour: 1.31 },
      { name: "Kwuarm seed", expectedQtyPerHour: 0.42 },
      { name: "Cadantine seed", expectedQtyPerHour: 0.19 },
      { name: "Torstol seed", expectedQtyPerHour: 0.055 },
      { name: "Rune cannonball", expectedQtyPerHour: 6.93 },
      { name: "Dragon cannonball", expectedQtyPerHour: 2.31 },
      { name: "Dragon nails", expectedQtyPerHour: 0.28 },
      { name: "Platinum token", expectedQtyPerHour: 39.62 },
      { name: "Shield left half", expectedQtyPerHour: 0.027 },
      { name: "Dragon spear", expectedQtyPerHour: 0.02 },
      { name: "Rune spear", expectedQtyPerHour: 0.054 },
    ],
    intensity: "low",
    notes:
      "Live GE on gems/herbs/seeds/tokens. Residual ~85k for coins + facility bottle + ironwood repair kits + rare dragon cannon barrel EV.",
  },

  // ── Bounty tasks (port notice boards, boat combat) ──────────────────────
  // Wiki does not publish an official bounty XP/hr table (Sailing training
  // treats them as drop-farming, not max XP). Hourly XP = wiki task XP ×
  // estimated turn-ins/hr. Task XP from https://oldschool.runescape.wiki/w/Bounty_tasks
  // (3,465 / 8,800 / 11,825 / 14,575 / 19,910 / 30,965 / 40,370 / 47,080).
  // Coin bags are tiny (wiki ~0.8–9.6k); GP is on-task monster loot EV.
  {
    id: "bounty-early",
    label: "Bounty — birds & bull sharks",
    skillKey: "sailing",
    level: 30,
    rateBands: [
      // 3,465 XP/task × ~10 turn-ins/hr (tern, osprey, eagle ray, mogre, bull shark).
      { level: 30, xpPerHour: 35_000, expectedLootGpPerHour: 40_000 },
      { level: 45, xpPerHour: 42_000, expectedLootGpPerHour: 55_000 },
    ],
    consumables: [{ name: "Mithril cannonball", qty: 350 }],
    rewards: [],
    intensity: "medium",
    notes:
      "Wiki task XP 3,465 (tiny coin bag). Unlocks at 30. Fast birds (tern/osprey) and bull sharks. Residual loot EV; mithril cballs live-GE subtracted. Port tasks icon / Bounty tasks page.",
  },
  {
    id: "bounty-mid",
    label: "Bounty — rays, hammerheads & frigatebirds",
    skillKey: "sailing",
    level: 40,
    rateBands: [
      // 8,800 XP (hammerhead / butterfly ray) or 11,825 (frigatebird / stingray).
      { level: 40, xpPerHour: 55_000, expectedLootGpPerHour: 70_000 },
      { level: 50, xpPerHour: 70_000, expectedLootGpPerHour: 90_000 },
    ],
    consumables: [{ name: "Adamant cannonball", qty: 280 }],
    rewards: [],
    intensity: "medium",
    notes:
      "Wiki task XP 8,800 (small bag) or 11,825 (medium bag). Hammerhead, butterfly/stingray, frigatebird. Residual loot − live adamant cballs.",
  },
  {
    id: "bounty-albatross",
    label: "Bounty — albatross & pygmy kraken",
    skillKey: "sailing",
    level: 50,
    rateBands: [
      // 14,575 XP/task. ~5.5 tasks/hr at 50; ~8 at 67 with better boat/cannons.
      { level: 50, xpPerHour: 80_000, expectedLootGpPerHour: 110_000 },
      { level: 67, xpPerHour: 116_000, expectedLootGpPerHour: 150_000 },
    ],
    consumables: [{ name: "Rune cannonball", qty: 220 }],
    rewards: [],
    intensity: "medium",
    notes:
      "Wiki task XP 14,575 (medium bag). Albatross beak 5 @ 1/10 or feathers 20–30 @ 1/2; pygmy kraken ink/tentacle. Rates pick up ~67 (sloop + crew cannon). Residual loot − live rune cballs.",
  },
  {
    id: "bounty-tiger-narwhal",
    label: "Bounty — tiger sharks & narwhals",
    skillKey: "sailing",
    level: 55,
    rateBands: [
      // 19,910 XP/task × ~4–5.5 turn-ins/hr.
      { level: 55, xpPerHour: 80_000, expectedLootGpPerHour: 180_000 },
      { level: 67, xpPerHour: 110_000, expectedLootGpPerHour: 260_000 },
    ],
    consumables: [{ name: "Rune cannonball", qty: 240 }],
    rewards: [],
    intensity: "medium",
    notes:
      "Wiki task XP 19,910 (large bag). Tiger shark from 55; narwhal from 62 (Etceteria / Lunar). On-task unique rates apply until the bounty count is met. Residual loot − live rune cballs.",
  },
  {
    id: "bounty-spined",
    label: "Bounty — spined kraken",
    skillKey: "sailing",
    level: 65,
    rateBands: [
      // 30,965 XP/task × ~3.5–4.5 turn-ins/hr.
      { level: 65, xpPerHour: 108_000, expectedLootGpPerHour: 350_000 },
      { level: 75, xpPerHour: 140_000, expectedLootGpPerHour: 480_000 },
    ],
    consumables: [{ name: "Rune cannonball", qty: 260 }],
    rewards: [],
    intensity: "medium",
    notes:
      "Wiki task XP 30,965 (large bag). Guaranteed ink-sac task at Aldarin. Residual loot − live rune cballs. Ballistic attractor cuts ammo.",
  },
  {
    id: "bounty-armoured-gws",
    label: "Bounty — armoured kraken & great whites",
    skillKey: "sailing",
    level: 75,
    rateBands: [
      // 40,370 XP/task × ~3.2–4 turn-ins/hr.
      // Wiki on-task avg kill: armoured kraken 24,493 GE; great white 20,832 GE.
      { level: 75, xpPerHour: 130_000, expectedLootGpPerHour: 1_100_000 },
      { level: 90, xpPerHour: 160_000, expectedLootGpPerHour: 1_350_000 },
    ],
    consumables: [{ name: "Dragon cannonball", qty: 180 }],
    rewards: [],
    intensity: "high",
    notes:
      "Wiki task XP 40,370 (huge bag). On-task avg kill 20.8k (GWS) / 24.5k (armoured). Residual ≈ 50–60 kph × that EV; live dragon cballs subtracted. On-task uniques: bottled storm, broken dragon hook, keel parts.",
  },
  {
    id: "bounty-endgame",
    label: "Bounty — vampyre/veiled kraken & orca",
    skillKey: "sailing",
    level: 80,
    rateBands: [
      // 47,080 XP/task. ~3.4 tasks/hr at 80; ~4.25 at 99 → ~200k (community high-end with dragon cballs).
      // Wiki on-task avg kill: vampyre 32,462; veiled 27,307; orca 21,746.
      // Wiki veiled setup: 83 kph combat-only @ 99 Range + dragon cannon (195 cballs lost w/ attractor).
      { level: 80, xpPerHour: 160_000, expectedLootGpPerHour: 1_500_000 },
      { level: 99, xpPerHour: 200_000, expectedLootGpPerHour: 2_270_000 },
    ],
    consumables: [{ name: "Dragon cannonball", qty: 195 }],
    rewards: [],
    intensity: "high",
    notes:
      "Wiki task XP 47,080 (huge bag). All bounty tasks available at 80. 99 band uses wiki veiled 83 kph × 27,307 on-task GE as gross loot; 195 dragon cballs from that same setup. Lunar Isle = vampyre; Deepfin = veiled. Better profit than max XP — wiki training page.",
  },
];

/** GE item names used by sailing activities (for price snapshot). */
export function sailingActivityItemNames(): string[] {
  const names = new Set<string>();
  for (const m of SAILING_ACTIVITY_METHODS) {
    for (const p of m.consumables) names.add(p.name);
    for (const r of m.rewards) names.add(r.name);
  }
  return [...names];
}
