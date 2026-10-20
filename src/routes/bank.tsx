import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Landmark, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { WikiImage } from "@/components/WikiImage";
import { useMarketData } from "@/hooks/useMarketData";
import { gp } from "@/lib/format";
import { buildPriceRowsByName, lookupPriceRow } from "@/lib/price-lookup";
import { parseBankDump, readBank, writeBank, type BankEntry } from "@/lib/bank";
import { lastHomeRange } from "@/lib/tab-memory";
import type { PriceRow } from "@/lib/osrs.server";

export const Route = createFileRoute("/bank")({
  head: () => ({
    meta: [
      { title: "My bank — Cheapscape" },
      {
        name: "description",
        content:
          "Paste your OSRS bank to see which catalog items you own, their live prices, and total value.",
      },
    ],
  }),
  component: BankPage,
});

function BankPage() {
  const { snapshot } = useMarketData("6m", { trends: false });
  const queryClient = useQueryClient();
  const [dump, setDump] = useState("");
  const [entries, setEntries] = useState<BankEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setEntries(readBank());
    setLoaded(true);
  }, []);

  const rowsByName = useMemo(() => buildPriceRowsByName(snapshot.data ?? []), [snapshot.data]);

  const matched = useMemo(() => {
    const rows: { entry: BankEntry; row: PriceRow }[] = [];
    const unmatched: BankEntry[] = [];
    for (const entry of entries) {
      const row = lookupPriceRow(rowsByName, entry.name);
      if (row) rows.push({ entry, row });
      else unmatched.push(entry);
    }
    rows.sort((a, b) => {
      const pa = (a.row.high ?? a.row.low ?? 0) * a.entry.quantity;
      const pb = (b.row.high ?? b.row.low ?? 0) * b.entry.quantity;
      return pb - pa;
    });
    return { rows, unmatched };
  }, [entries, rowsByName]);

  const total = useMemo(() => {
    return matched.rows.reduce((sum, { entry, row }) => {
      const price = row.high ?? row.low ?? 0;
      return sum + price * entry.quantity;
    }, 0);
  }, [matched.rows]);

  const applyDump = () => {
    const parsed = parseBankDump(dump);
    if (parsed.length === 0) {
      toast.error("No items found. Paste lines like 'Dragon bones x 5000' or 'Abyssal whip\t1'.");
      return;
    }
    setEntries(parsed);
    writeBank(parsed);
    setDump("");
    toast.success(`Loaded ${parsed.length} unique items`);
    void queryClient.invalidateQueries({ queryKey: ["osrs-snapshot"] });
  };

  const clear = () => {
    setEntries([]);
    writeBank([]);
    toast("Bank cleared");
  };

  return (
    <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground sm:text-2xl">
            <Landmark className="size-5 text-primary" />
            My bank
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a bank dump to see which catalog items you own and their live GE value. Stored on this device only.
          </p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={clear}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Trash2 className="size-3.5" />
            Clear
          </button>
        )}
      </div>

      <section className="panel mt-4 p-3 sm:p-4">
        <label className="text-xs font-medium text-muted-foreground">
          Paste bank dump
          <textarea
            value={dump}
            onChange={(e) => setDump(e.target.value)}
            placeholder={'Dragon bones x 2500\nAbyssal whip\t1\nPrayer potion(4) 40\n...or quantity first: 1000 Shark'}
            rows={6}
            className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
          />
        </label>
        <button
          onClick={applyDump}
          disabled={!dump.trim()}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Upload className="size-4" />
          Load bank
        </button>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Works with tab-separated dumps, "name x qty", or "name qty". Unmatched items (not in the catalog) are listed separately.
        </p>
      </section>

      {!loaded ? (
        <div className="mt-6 h-32 animate-pulse rounded-md bg-secondary/40" />
      ) : entries.length === 0 ? (
        <div className="panel mt-6 flex flex-col items-center gap-3 p-8 text-center">
          <Landmark className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Paste a bank dump above to see your items.</p>
        </div>
      ) : (
        <>
          <section className="mt-5 flex items-end justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              {matched.rows.length} catalog item{matched.rows.length === 1 ? "" : "s"}
              {matched.unmatched.length > 0 && (
                <span className="ml-2 text-muted-foreground">
                  · {matched.unmatched.length} unmatched
                </span>
              )}
            </h2>
            <p className="text-lg font-bold tabular-nums gold-text">{gp(total)}</p>
          </section>

          <ul className="mt-3 flex flex-col gap-2">
            {matched.rows.map(({ entry, row }) => {
              const price = row.high ?? row.low ?? null;
              const value = price != null ? price * entry.quantity : null;
              return (
                <li key={row.id} className="panel flex items-center gap-3 p-3">
                  <Link
                    to="/item/$id"
                    params={{ id: String(row.id) }}
                    search={{ range: lastHomeRange() }}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <WikiImage icon={row.icon} alt="" width={28} height={28} className="size-7 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.quantity.toLocaleString()} × {gp(price)}
                      </p>
                    </div>
                  </Link>
                  <p className="shrink-0 text-sm font-bold tabular-nums gold-text">{gp(value)}</p>
                </li>
              );
            })}
          </ul>

          {matched.unmatched.length > 0 && (
            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Not in catalog ({matched.unmatched.length})
              </h3>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                {matched.unmatched.slice(0, 40).map((entry) => (
                  <li key={entry.name} className="flex justify-between gap-3">
                    <span className="truncate">{entry.name}</span>
                    <span className="shrink-0 tabular-nums">{entry.quantity.toLocaleString()}</span>
                  </li>
                ))}
                {matched.unmatched.length > 40 && (
                  <li className="text-xs">…and {matched.unmatched.length - 40} more</li>
                )}
              </ul>
            </section>
          )}
        </>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Only items already in the Cheapscape catalog are valued. Bank data stays in this browser.
      </p>
    </main>
  );
}
