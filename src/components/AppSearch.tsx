import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";

import { WikiImage } from "@/components/WikiImage";
import { PopupDismissShield, swallowBehindPopup } from "@/components/popup-dismiss-shield";
import { useMarketData } from "@/hooks/useMarketData";
import { CATALOG } from "@/lib/osrs-catalog";
import { itemSearchText } from "@/lib/item-search-aliases";
import { METHOD_SKILL_SEARCH, skillSearchText } from "@/lib/method-skill-search";
import { lastHomeRange, lastTabSearch } from "@/lib/tab-memory";
import { Input } from "@/components/ui/input";

type Hit =
  | { kind: "skill"; key: string; label: string; wikiIcon: string }
  | { kind: "item"; id: number; name: string; icon: string };

export function AppSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { snapshot } = useMarketData("6m");

  const rowsByName = useMemo(() => {
    const map = new Map<string, { id: number; name: string; icon: string }>();
    for (const r of snapshot.data ?? []) {
      map.set(r.name.toLowerCase(), { id: r.id, name: r.name, icon: r.icon });
    }
    return map;
  }, [snapshot.data]);

  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [] as Hit[];

    const skills: Hit[] = METHOD_SKILL_SEARCH.filter((s) => skillSearchText(s).includes(needle)).map(
      (s) => ({ kind: "skill", key: s.key, label: s.label, wikiIcon: s.wikiIcon }),
    );

    const items: Hit[] = [];
    const seen = new Set<number>();
    for (const group of CATALOG) {
      for (const item of group.items) {
        if (!itemSearchText(item.name).includes(needle)) continue;
        const row =
          rowsByName.get(item.name.toLowerCase()) ??
          rowsByName.get(item.name.toLowerCase().replace(/ \(.*?\)$/, ""));
        if (!row || seen.has(row.id)) continue;
        seen.add(row.id);
        items.push({ kind: "item", id: row.id, name: row.name, icon: row.icon });
        if (items.length >= 8) break;
      }
      if (items.length >= 8) break;
    }

    return [...skills.slice(0, 6), ...items];
  }, [q, rowsByName]);

  const close = () => {
    swallowBehindPopup();
    setOpen(false);
    setQ("");
  };

  return (
    <>
      {open && <PopupDismissShield onDismiss={close} />}
      {open && (
        <div className="pointer-events-auto absolute bottom-full right-0 z-[90] mb-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-[22px] border border-white/10 bg-card/90 shadow-[0_10px_40px_-12px_oklch(0_0_0/0.7)] backdrop-blur-2xl">
          <div className="flex items-center gap-2 px-3 pt-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Items, skills, campfire…"
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              aria-label="Search items and methods"
            />
            <button
              type="button"
              onClick={close}
              className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              aria-label="Close search"
            >
              <X className="size-4" />
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto px-2 pb-2">
            {q.trim().length < 2 && (
              <li className="px-2 py-3 text-xs text-muted-foreground">
                Type to jump to a skill or item.
              </li>
            )}
            {q.trim().length >= 2 && hits.length === 0 && (
              <li className="px-2 py-3 text-xs text-muted-foreground">Nothing matches.</li>
            )}
            {hits.map((hit) => {
              const title = hit.kind === "skill" ? hit.label : hit.name;
              const icon = hit.kind === "skill" ? hit.wikiIcon : hit.icon;
              return (
                <li key={hit.kind === "skill" ? `s-${hit.key}` : `i-${hit.id}`}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-secondary/50"
                    onClick={() => {
                      if (hit.kind === "skill") {
                        const prev = lastTabSearch("/methods");
                        void navigate({
                          to: "/methods",
                          search: { ...prev, skill: hit.key } as never,
                        });
                      } else {
                        void navigate({
                          to: "/item/$id",
                          params: { id: String(hit.id) },
                          search: { range: lastHomeRange() },
                        });
                      }
                      close();
                    }}
                  >
                    <WikiImage
                      icon={icon}
                      alt=""
                      width={22}
                      height={22}
                      lazy={false}
                      className="size-5 shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {title}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {hit.kind === "skill" ? "Skill" : "Item"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          if (open) {
            close();
            return;
          }
          setOpen(true);
        }}
        aria-label={open ? "Close search" : "Search items and methods"}
        aria-expanded={open}
        className={`pointer-events-auto relative z-[90] inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-white/10 shadow-[0_10px_40px_-12px_oklch(0_0_0/0.7)] backdrop-blur-2xl transition-colors ${
          open
            ? "bg-primary/20 text-primary"
            : "bg-card/75 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        }`}
      >
        <Search className="size-5" strokeWidth={2} />
      </button>
    </>
  );
}
