import { cacheGet, cacheSet } from "./durable-cache";

const WIKI_API = "https://oldschool.runescape.wiki/api.php";
const UA = "GEWatch/1.0 (recommended equipment; https://github.com/Brandon1212b/osrs-item-tracker)";
const TTL_MS = 24 * 60 * 60 * 1000;

export type WikiRecUse = {
  rank: 1 | 2;
  method: string;
  style: string | null;
  href: string;
  table: "gear" | "special";
};

export type WikiRecResult = {
  item: string;
  uses: WikiRecUse[];
  fetchedAt: number;
};

function decode(s: string): string {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTable(html: string, table: "gear" | "special"): WikiRecUse[] {
  const uses: WikiRecUse[] = [];
  const rowRe =
    /<tr>\s*<td[^>]*data-sort-value="([12])"[^>]*>\s*[12]\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(html))) {
    const rank = Number(m[1]) as 1 | 2;
    const cell = m[2];
    const link = cell.match(/<a\s+href="(\/w\/[^\"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!link) continue;
    const small = cell.match(/<small>([\s\S]*?)<\/small>/i);
    uses.push({
      rank,
      method: decode(link[2]),
      style: small ? decode(small[1]).replace(/^\(|\)$/g, "") : null,
      href: `https://oldschool.runescape.wiki${link[1].replace(/&/g, "&")}`,
      table,
    });
  }
  return uses;
}

function parseSection(html: string): WikiRecUse[] {
  const tables = [...html.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  const uses: WikiRecUse[] = [];
  tables.forEach((tableHtml, i) => {
    uses.push(...parseTable(tableHtml, i === 0 ? "gear" : "special"));
  });
  const seen = new Set<string>();
  return uses.filter((u) => {
    const k = `${u.rank}|${u.href}|${u.style ?? ""}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function wikiJson<T>(params: Record<string, string>): Promise<T> {
  const url = `${WIKI_API}?${new URLSearchParams({ format: "json", redirects: "1", ...params })}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`Wiki ${res.status}`);
  return (await res.json()) as T;
}

async function fetchFromWiki(itemName: string): Promise<WikiRecResult> {
  const page = itemName.replace(/ /g, "_");
  const sectionsJson = await wikiJson<{
    error?: { info?: string };
    parse?: { sections?: { index: string; line: string }[] };
  }>({
    action: "parse",
    page,
    prop: "sections",
  });
  if (sectionsJson.error?.info) throw new Error(sectionsJson.error.info);

  const section = sectionsJson.parse?.sections?.find((s) =>
    /used in recommended equipment/i.test(s.line),
  );
  if (!section) {
    return { item: itemName, uses: [], fetchedAt: Date.now() };
  }

  const textJson = await wikiJson<{
    error?: { info?: string };
    parse?: { text?: { "*"?: string } };
  }>({
    action: "parse",
    page,
    prop: "text",
    section: section.index,
  });
  if (textJson.error?.info) throw new Error(textJson.error.info);
  const html = textJson.parse?.text?.["*"] ?? "";
  return { item: itemName, uses: parseSection(html), fetchedAt: Date.now() };
}

export async function getWikiRecommended(itemName: string): Promise<WikiRecResult> {
  const key = `wiki-rec.${itemName}`;
  const cached = await cacheGet<WikiRecResult>(key, TTL_MS);
  if (cached) return cached;
  try {
    const fresh = await fetchFromWiki(itemName);
    await cacheSet(key, fresh, TTL_MS);
    return fresh;
  } catch {
    const stale = await cacheGet<WikiRecResult>(key, TTL_MS * 7);
    if (stale) return stale;
    return { item: itemName, uses: [], fetchedAt: Date.now() };
  }
}
