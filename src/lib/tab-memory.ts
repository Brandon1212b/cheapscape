/** Remember each tab's search params so switching pages does not reset filters. */

import type { RangeKey } from "./osrs.server";

const SEARCH_KEY = "ge-watch-tab-search";
export const LAST_SKILL_KEY = "ge-watch-last-skill";

export type TabPath = "/" | "/methods";

type Store = Record<TabPath, Record<string, unknown>>;

const RANGES: RangeKey[] = ["1d", "1w", "1m", "3m", "6m", "1y"];

function empty(): Store {
  return { "/": {}, "/methods": {} };
}

export function readTabSearch(): Store {
  if (typeof window === "undefined") return empty();
  try {
    const raw = sessionStorage.getItem(SEARCH_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Store;
    return {
      "/": parsed["/"] && typeof parsed["/"] === "object" ? parsed["/"] : {},
      "/methods":
        parsed["/methods"] && typeof parsed["/methods"] === "object" ? parsed["/methods"] : {},
    };
  } catch {
    return empty();
  }
}

export function writeTabSearch(path: TabPath, search: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const next = readTabSearch();
    next[path] = search;
    sessionStorage.setItem(SEARCH_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

export function lastTabSearch(path: TabPath): Record<string, unknown> {
  return readTabSearch()[path] ?? {};
}

export function lastHomeRange(): RangeKey {
  const raw = lastTabSearch("/").range;
  return typeof raw === "string" && (RANGES as string[]).includes(raw) ? (raw as RangeKey) : "1m";
}

export function tabPathFromPathname(pathname: string): TabPath | null {
  if (pathname.startsWith("/methods")) return "/methods";
  if (pathname.startsWith("/item") || pathname.startsWith("/watchlist") || pathname.startsWith("/auth")) {
    return null;
  }
  if (pathname === "/") return "/";
  return null;
}

export function readLastSkill(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(LAST_SKILL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeLastSkill(skill: string) {
  if (typeof window === "undefined") return;
  try {
    if (skill) localStorage.setItem(LAST_SKILL_KEY, skill);
  } catch {
    /* private mode */
  }
}
