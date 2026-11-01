import { Link } from "@tanstack/react-router";
import { Sparkline } from "@/components/Sparkline";
import { WikiImage } from "@/components/WikiImage";
import type { PriceRow, Trend } from "@/lib/osrs.server";
import { gp } from "@/lib/format";
import { lastHomeRange } from "@/lib/tab-memory";

const SCROLL_KEY = "ge-watch-home-scroll";

function pctFromHigh(price: number | null | undefined, trend?: Trend): number | null {
  if (price == null || !trend?.high180 || trend.high180 <= 0) return null;
  return Math.round(((price - trend.high180) / trend.high180) * 1000) / 10;
}

export function ItemCard({
  row,
  trend,
  locked,
  lockReason,
}: {
  row: PriceRow;
  trend?: Trend | undefined;
  locked?: boolean;
  lockReason?: string | null;
}) {
  const price = row.high ?? row.low;
  const pct = pctFromHigh(price, trend);

  return (
    <article
      className={`panel group relative flex flex-col gap-1 p-1.5 sm:gap-1.5 sm:p-2 transition-transform duration-200 hover:-translate-y-0.5 ${
        locked ? "opacity-45" : ""
      }`}
      title={locked && lockReason ? `Requires ${lockReason}` : undefined}
    >
      <Link
        to="/item/$id"
        params={{ id: String(row.id) }}
        search={{ range: lastHomeRange() }}
        className="absolute inset-0 z-10 rounded-[inherit]"
        aria-label={`View ${row.name} price history`}
        onClick={() => {
          try {
            sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
          } catch {
            /* private mode */
          }
        }}
      />
      {locked && lockReason && (
        <div className="absolute bottom-1 left-1 z-20 rounded bg-background/90 px-1 py-0.5 text-[8px] font-semibold text-muted-foreground ring-1 ring-border/50">
          {lockReason}
        </div>
      )}
      {trend ? (
        <div className="absolute top-1 right-1 z-20 flex flex-col gap-0.5 text-[8px] tabular-nums leading-none text-right">
          <span className="text-muted-foreground">H <span className="font-medium text-foreground">{gp(trend.high180)}</span></span>
          <span className="text-muted-foreground">L <span className="font-medium text-foreground">{gp(trend.low180)}</span></span>
        </div>
      ) : null}
      <div className="flex items-start gap-1.5">
        <WikiImage
          icon={row.icon}
          alt={row.name}
          width={22}
          height={22}
          className={`mt-0.5 size-5.5 shrink-0 drop-shadow ${locked ? "grayscale" : ""}`}
        />
        <div className="min-w-0 flex-1 pr-6">
          <h3 className="truncate font-sans text-[11px] font-semibold text-foreground leading-tight" title={row.name}>
            {row.name}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            <p className="text-xs font-bold tabular-nums gold-text">{gp(price)}</p>
            {pct != null && (
              <span
                className="inline-flex shrink-0 rounded-full px-1 py-0.5 text-[9px] font-bold tabular-nums leading-none"
                style={{
                  background:
                    pct < 0
                      ? "color-mix(in oklab, var(--deal) 22%, transparent)"
                      : pct > 0
                        ? "color-mix(in oklab, var(--steep) 22%, transparent)"
                        : "var(--secondary)",
                  color: pct < 0 ? "var(--deal)" : pct > 0 ? "var(--steep)" : "var(--muted-foreground)",
                }}
                title="vs range high"
              >
                {pct > 0 ? "+" : ""}
                {pct}%
              </span>
            )}
          </div>
        </div>
      </div>

      {trend ? (
        <Sparkline series={trend.series} tone={pct != null && pct < 0 ? "deal" : "steep"} className="h-8" />
      ) : (
        <div className="h-8 rounded-md border border-dashed border-border/60 bg-muted/30" />
      )}
    </article>
  );
}
