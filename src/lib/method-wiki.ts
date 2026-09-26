/**
 * Best OSRS Wiki page for each /methods row.
 * Preference: exact MMG, then activity/course page, then skill training guide.
 * Titles checked against oldschool.runescape.wiki (Sep 2026).
 */

export type WikiRef = {
  page: string;
  title: string;
};

const WIKI_ORIGIN = "https://oldschool.runescape.wiki/w/";

export function wikiHref(page: string): string {
  return WIKI_ORIGIN + page.replace(/ /g, "_");
}

function mmg(pageSuffix: string, title: string): WikiRef {
  return { page: `Money making guide/${pageSuffix}`, title: `${title} (MMG)` };
}

const SKILL_TRAINING: Record<string, WikiRef> = {
  agility: { page: "Agility training", title: "Agility training" },
  construction: { page: "Construction training", title: "Construction training" },
  cooking: { page: "Pay-to-play Cooking training", title: "Cooking training" },
  crafting: { page: "Pay-to-play Crafting training", title: "Crafting training" },
  farming: { page: "Farming training", title: "Farming training" },
  firemaking: { page: "Pay-to-play Firemaking training", title: "Firemaking training" },
  fishing: { page: "Pay-to-play Fishing training", title: "Fishing training" },
  fletching: { page: "Fletching training", title: "Fletching training" },
  herblore: { page: "Herblore training", title: "Herblore training" },
  hunter: { page: "Hunter training", title: "Hunter training" },
  magic: { page: "Pay-to-play Magic training", title: "Magic training" },
  mining: { page: "Pay-to-play Mining training", title: "Mining training" },
  prayer: { page: "Pay-to-play Prayer training", title: "Prayer training" },
  runecraft: { page: "Pay-to-play Runecraft training", title: "Runecraft training" },
  sailing: { page: "Sailing training", title: "Sailing training" },
  smithing: { page: "Pay-to-play Smithing training", title: "Smithing training" },
  thieving: { page: "Thieving training", title: "Thieving training" },
  woodcutting: { page: "Pay-to-play Woodcutting training", title: "Woodcutting training" },
};

const BY_SKILL_ID: Record<string, WikiRef> = {
  "cooking:karambwan": mmg("Cooking raw karambwan", "Cooking karambwan"),
  "cooking:shark": mmg("Cooking raw sharks", "Cooking sharks"),
  "cooking:dark-crab": mmg("Cooking raw dark crabs", "Cooking dark crabs"),
  "cooking:anglerfish": mmg("Cooking raw anglerfish", "Cooking anglerfish"),
  "cooking:moonlight-antelope": mmg("Cooking raw moonlight antelope", "Cooking moonlight antelope"),
  "fishing:shark": mmg("Catching sharks", "Catching sharks"),
  "fishing:dark-crab": mmg("Catching dark crabs", "Catching dark crabs"),
  "fishing:anglerfish": mmg("Catching anglerfish", "Catching anglerfish"),
  "fishing:minnows": mmg("Catching minnows", "Catching minnows"),
  "fishing:karambwan": mmg("Catching raw karambwan", "Catching raw karambwan"),
  "fishing:lobster": mmg("Catching lobsters", "Catching lobsters"),
  "fishing:sacred-eel": mmg("Catching sacred eels", "Catching sacred eels"),
  "fishing:infernal-eel": mmg("Catching infernal eels", "Catching infernal eels"),
  "woodcutting:magic-logs": mmg("Cutting magic logs", "Cutting magic logs"),
  "woodcutting:redwood-logs": mmg("Cutting redwood logs", "Cutting redwood logs"),
  "woodcutting:yew-logs": mmg("Cutting yew logs", "Cutting yew logs"),
  "woodcutting:camphor-logs": mmg("Cutting camphor logs", "Cutting camphor logs"),
  "woodcutting:oak-logs": mmg("Cutting oak logs", "Cutting oak logs"),
};

const BY_ID: Record<string, WikiRef> = {
  herbiboar: mmg("Hunting herbiboars", "Hunting herbiboars"),
  "hunter-rumours": { page: "Hunters' Rumours", title: "Hunters' Rumours" },
  "hunter-implings": mmg("Hunting implings", "Hunting implings"),
  "snowy-knights": mmg("Catching snowy knights", "Catching snowy knights"),
  "pyre-foxes": mmg("Hunting pyre foxes", "Hunting pyre foxes"),
  "rainbow-crabs": mmg("Catching rainbow crabs", "Catching rainbow crabs"),
  "rainbow-crabs-4trap": mmg("Catching rainbow crabs", "Catching rainbow crabs"),
  "spotted-kebbit": { page: "Falconry", title: "Falconry" },
  "dark-kebbit": { page: "Falconry", title: "Falconry" },
  "dashing-kebbit": { page: "Falconry", title: "Falconry" },
  "grey-chins": mmg("Hunting chinchompas", "Hunting chinchompas"),
  "red-chins": mmg("Hunting carnivorous chinchompas", "Hunting red chinchompas"),
  "black-chins": mmg("Hunting black chinchompas", "Hunting black chinchompas"),
  "sunlight-antelope": mmg("Hunting sunlight antelopes", "Hunting sunlight antelopes"),
  "moonlight-antelope": mmg("Hunting moonlight antelopes", "Hunting moonlight antelopes"),
  "infernal-shale-afk": mmg(
    "Mining and crushing infernal shale (Infernal shale deposit)",
    "Infernal shale deposit",
  ),
  "infernal-shale-rocks": mmg(
    "Mining and crushing infernal shale (Infernal shale rocks)",
    "Infernal shale rocks",
  ),
  "infernal-shale": mmg(
    "Mining and crushing infernal shale (Tick manipulation)",
    "Infernal shale tick manip",
  ),
  amethyst: mmg("Mining amethyst", "Mining amethyst"),
  "zeah-salts": mmg("Mining salts", "Mining salts"),
  "volcanic-ash": mmg("Mining volcanic ash", "Mining volcanic ash"),
  "lead-ore-deepfin": mmg("Mining lead ore (Deepfin mine)", "Mining lead ore Deepfin"),
  basalt: mmg("Mining basalt", "Mining basalt"),
  "runite-ore": mmg("Mining runite ore", "Mining runite ore"),
  "iron-ore": mmg("Mining iron ore", "Mining iron ore"),
  "gem-rock": mmg("Mining gemstones", "Mining gemstones"),
  "rubium-splinters": mmg("Mining rubium splinters", "Mining rubium splinters"),
  "rubium-splinters-afk": mmg("Mining rubium splinters", "Mining rubium splinters"),
  "motherlode-mine": mmg("Motherlode Mine", "Motherlode Mine"),
  "blast-mine": mmg("Blast mining", "Blast mining"),
  "dark-crab": mmg("Catching dark crabs", "Catching dark crabs"),
  minnows: mmg("Catching minnows", "Catching minnows"),
  "sacred-eel": mmg("Catching sacred eels", "Catching sacred eels"),
  "infernal-eel": mmg("Catching infernal eels", "Catching infernal eels"),
  "drift-net": mmg("Drift net fishing", "Drift net fishing"),
  shark: mmg("Catching sharks", "Catching sharks"),
  lobster: mmg("Catching lobsters", "Catching lobsters"),
  anglerfish: mmg("Catching anglerfish", "Catching anglerfish"),
  "magic-logs": mmg("Cutting magic logs", "Cutting magic logs"),
  "redwood-logs": mmg("Cutting redwood logs", "Cutting redwood logs"),
  "yew-logs": mmg("Cutting yew logs", "Cutting yew logs"),
  "camphor-logs": mmg("Cutting camphor logs", "Cutting camphor logs"),
  "oak-logs": mmg("Cutting oak logs", "Cutting oak logs"),
  "engorged-bloodwood": mmg("Chopping the engorged bloodwood tree", "Engorged bloodwood"),
  "bf-iron": mmg("Smelting iron bars at Blast Furnace", "BF iron bars"),
  "bf-steel": mmg("Smelting steel bars at Blast Furnace", "BF steel bars"),
  "bf-mithril": mmg("Smelting mithril bars at Blast Furnace", "BF mithril bars"),
  "bf-adamant": mmg("Smelting adamantite bars at Blast Furnace", "BF adamant bars"),
  "bf-rune": mmg("Smelting runite bars at Blast Furnace", "BF rune bars"),
  cannonballs: mmg("Smithing steel cannonballs", "Smithing cannonballs"),
  "cannonballs-double": mmg("Smithing steel cannonballs", "Smithing cannonballs"),
  "rune-2h": mmg("Smithing rune items", "Smithing rune items"),
  "astral-runes": mmg("Crafting astral runes", "Crafting astral runes"),
  "mud-runes": mmg("Crafting mud runes", "Crafting mud runes"),
  "steam-runes-abyss": mmg("Crafting steam runes", "Crafting steam runes"),
  "aether-runes": mmg("Crafting aether runes using scarred extract", "Crafting aether runes"),
  "sunfire-runes": mmg("Crafting sunfire runes", "Crafting sunfire runes"),
  "nature-runes-double-diary": mmg(
    "Crafting double nature runes (Achievement Diary Cape teleport)",
    "Double nature runes",
  ),
  "blood-runes-true": mmg("Crafting blood runes", "Crafting blood runes"),
  "blood-runes-abyss": mmg("Crafting blood runes through the Abyss", "Blood runes (Abyss)"),
  "death-runes-abyss": mmg("Crafting death runes through the Abyss", "Death runes (Abyss)"),
  "wrath-runes": mmg("Crafting wrath runes", "Crafting wrath runes"),
  "soul-runes-true": mmg("Crafting soul runes", "Crafting soul runes"),
  "cosmic-runes": mmg("Crafting cosmic runes", "Crafting cosmic runes"),
  "cosmic-runes-abyss": mmg("Crafting cosmic runes through the Abyss", "Cosmic runes (Abyss)"),
  "nature-runes-abyss": mmg("Crafting nature runes through the Abyss", "Nature runes (Abyss)"),
  "chaos-runes-abyss": mmg("Crafting chaos runes through the Abyss", "Chaos runes (Abyss)"),
  "law-runes-abyss-double": mmg(
    "Crafting double law runes through the Abyss",
    "Double law runes (Abyss)",
  ),
  "air-runes": mmg("Crafting air runes (high level)", "Crafting air runes"),
  elves: mmg("Pickpocketing elves", "Pickpocketing elves"),
  vyres: mmg("Pickpocketing vyres", "Pickpocketing vyres"),
  "master-farmers": mmg("Pickpocketing master farmers", "Pickpocketing master farmers"),
  "ardougne-knights": mmg("Pickpocketing Knights of Ardougne", "Pickpocketing knights"),
  "rogues-castle-medium": mmg("Stealing from Rogues' Castle chests", "Rogues' Castle chests"),
  "rogues-castle-hard": mmg("Stealing from Rogues' Castle chests", "Rogues' Castle chests"),
  "yew-longbow": mmg("Fletching yew longbows", "Fletching yew longbows"),
  "magic-longbow": mmg("Fletching magic longbows", "Fletching magic longbows"),
  "redwood-pyre": mmg("Making redwood pyre logs", "Making redwood pyre logs"),
  "guthix-rest": mmg("Making Guthix rests", "Making Guthix rests"),
  "super-combat": mmg(
    "Making super combat potions (with prescription goggles)",
    "Making super combat potions",
  ),
  "mastering-mixology": mmg("Mastering Mixology", "Mastering Mixology"),
  "gotr-mass": mmg("Guardians of the Rift", "Guardians of the Rift"),
  zalcano: mmg("Killing Zalcano", "Killing Zalcano"),
  "zalcano-xp": mmg("Killing Zalcano (Experience)", "Killing Zalcano (Experience)"),
  "trawl-halibut": mmg("Deep sea trawling for halibut", "Trawling halibut"),
  "trawl-bluefin": mmg("Deep sea trawling for bluefin", "Trawling bluefin"),
  "trawl-marlin": mmg("Deep sea trawling for marlin", "Trawling marlin"),
  "trawl-yellowfin": mmg("Deep sea trawling for yellowfin", "Trawling yellowfin"),
  "agility-pyramid": mmg("Climbing the Agility Pyramid", "Agility Pyramid"),
  "sepulchre-floor-5-loot": mmg("Hallowed Sepulchre (Floor 5)", "Hallowed Sepulchre Floor 5"),
  "sepulchre-floor-4": mmg("Hallowed Sepulchre (Floor 4)", "Hallowed Sepulchre Floor 4"),
  "sepulchre-floor-3": mmg("Hallowed Sepulchre (Floor 3)", "Hallowed Sepulchre Floor 3"),
  "hallowed-sepulchre": mmg("Hallowed Sepulchre (Floor 5)", "Hallowed Sepulchre Floor 5"),
  "wilderness-agility-tickets": mmg("Wilderness Agility Course", "Wilderness Agility Course"),
  "wilderness-agility": mmg("Wilderness Agility Course", "Wilderness Agility Course"),
  "bounty-early": { page: "Bounty tasks", title: "Bounty tasks" },
  "bounty-mid": { page: "Bounty tasks", title: "Bounty tasks" },
  "bounty-albatross": { page: "Bounty tasks", title: "Bounty tasks" },
  "bounty-tiger-narwhal": { page: "Bounty tasks", title: "Bounty tasks" },
  "bounty-spined": { page: "Bounty tasks", title: "Bounty tasks" },
  "bounty-armoured-gws": { page: "Bounty tasks", title: "Bounty tasks" },
  "bounty-endgame": { page: "Bounty tasks", title: "Bounty tasks" },
};

type PrefixRule = { match: (id: string) => boolean; ref: WikiRef };

const PREFIX_RULES: PrefixRule[] = [
  { match: (id) => id.startsWith("rainbow-crabs"), ref: BY_ID["rainbow-crabs"] },
  { match: (id) => id.endsWith("-kebbit"), ref: { page: "Falconry", title: "Falconry" } },
  { match: (id) => id.startsWith("birdhouse-"), ref: { page: "Bird house trapping", title: "Bird house trapping" } },
  { match: (id) => id.startsWith("infernal-shale"), ref: BY_ID["infernal-shale"] },
  { match: (id) => id.startsWith("rubium-splinters"), ref: BY_ID["rubium-splinters"] },
  { match: (id) => id.startsWith("trawl-"), ref: mmg("Deep sea trawling for yellowfin", "Deep sea trawling") },
  { match: (id) => id.startsWith("bounty-"), ref: { page: "Bounty tasks", title: "Bounty tasks" } },
];

export function resolveMethodWiki(id: string, skillKey?: string | null): WikiRef {
  if (skillKey) {
    const keyed = BY_SKILL_ID[`${skillKey}:${id}`];
    if (keyed) return keyed;
  }
  const exact = BY_ID[id];
  if (exact) return exact;
  if (id.startsWith("degrime-")) {
    const herb = id.slice("degrime-".length).replace(/-/g, " ");
    return mmg(`Degriming grimy ${herb}`, `Degriming grimy ${herb}`);
  }
  for (const rule of PREFIX_RULES) {
    if (rule.match(id)) return rule.ref;
  }
  const skill = skillKey ? SKILL_TRAINING[skillKey] : undefined;
  if (skill) return skill;
  return { page: "Money making guide/Skilling", title: "Skilling money-making guide" };
}

export function methodWikiLink(id: string, skillKey?: string | null): { href: string; title: string } {
  const ref = resolveMethodWiki(id, skillKey);
  return { href: wikiHref(ref.page), title: ref.title };
}
