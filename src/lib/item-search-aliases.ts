/**
 * Extra search terms for GE items whose official name is hard to type.
 * Keys are lowercase official / catalog names.
 */
export const ITEM_SEARCH_ALIASES: Record<string, string> = {
  "bow of faerdhinen (inactive)": "bowfa bofa bowfa inactive crystal bow",
  "scythe of vitur (uncharged)": "scythe sycth scythe of vitur",
  "blade of saeldor (inactive)": "blade saeldor enhanced crystal weapon",
  "tumeken's shadow (uncharged)": "shadow tumeken",
  "toxic blowpipe (empty)": "blowpipe bp",
  "twisted bow": "tbow",
  "osmumten's fang": "fang",
  "scorching bow": "scorching synapse demonbane bow",
  "crystal helm": "crystal armour armor",
  "crystal body": "crystal armour armor",
  "crystal legs": "crystal armour armor",
  "dexterous prayer scroll": "rigour rigor cox chambers of xeric",
  "arcane prayer scroll": "augury cox chambers of xeric",
  "torn prayer scroll": "preserve cox chambers of xeric",
};

export function itemSearchText(name: string): string {
  const key = name.toLowerCase();
  const extra = ITEM_SEARCH_ALIASES[key];
  return extra ? `${key} ${extra}` : key;
}
