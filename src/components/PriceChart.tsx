import { useState } from "react";
import { formatCompact, gp } from "@/lib/format";

type Point = { t: number; p: number; v?: number };

export function PriceChart({
  series,
  tone = "fair",
  intraday,
}: {
  series: Point[];
  tone?: "deal" | "fair" | "steep";
  intraday: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (series.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border/60 text-sm text-muted-foreground">
        Not enough price history for this range.
      </div>
    );
  }

  const volumes = series.map((s) => s.v ?? 0);
  const hasVolume = volumes.some((v) => v > 0);
  const maxVol = Math.max(0, ...volumes);

  const w = 800;
  const h = hasVolume ? 340 : 280;
  const padL = 8;
  const padR = 8;
  const padT = 28;
  const padB = 8;
  const volH = hasVolume ? 64 : 0;
  const gap = hasVolume ? 10 : 0;
  const priceBottom = h - padB - volH - gap;
  const prices = series.map((s) => s.p);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;

  const highIdx = prices.indexOf(max);
  const lowIdx = prices.indexOf(min);

  const x = (i: number) => padL + (i / (series.length - 1)) * (w - padL - padR);
  const y = (p: number) => padT + (1 - (p - min) / span) * (priceBottom - padT);
  const barW = Math.max(1.2, ((w - padL - padR) / series.length) * 0.72);

  // Percent positions for HTML overlays (match SVG viewBox)
  const pctX = (i: number) => `${(x(i) / w) * 100}%`;
  const pctY = (p: number) => `${(y(p) / h) * 100}%`;
  const pctOfH = (svgY: number) => `${(svgY / h) * 100}%`;

  const line = series.map((s, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(s.p).toFixed(1)}`).join(" ");
  const area = `${line} L${x(series.length - 1)},${priceBottom} L${padL},${priceBottom} Z`;
  const gid = `chart-${tone}`;

  const fmtTime = (t: number) =>
    new Date(t).toLocaleString(undefined, intraday ? { hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric" });

  const active = hover != null ? series[hover] : null;

  const priceTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const value = max - f * span;
    return { f, value, top: pctOfH(padT + f * (priceBottom - padT)) };
  });
  const volTicks =
    hasVolume && maxVol > 0
      ? [
          { value: maxVol, top: pctOfH(h - padB - volH) },
          { value: maxVol / 2, top: pctOfH(h - padB - volH / 2) },
          { value: 0, top: pctOfH(h - padB) },
        ]
      : [];

  return (
    <div className="relative">
      <div className={`flex ${hasVolume ? "h-[22rem]" : "h-72"}`}>
        <div className="relative w-11 shrink-0 pr-1">
          {priceTicks.map((tick) => (
            <div
              key={`p-${tick.f}`}
              className="absolute right-0 -translate-y-1/2 text-right text-[10px] tabular-nums leading-none text-muted-foreground"
              style={{ top: tick.top }}
            >
              {gp(tick.value)}
            </div>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="absolute inset-0 h-full w-full touch-none"
            preserveAspectRatio="none"
            onMouseLeave={() => setHover(null)}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const rel = ((e.clientX - r.left) / r.width) * w;
              const i = Math.round(((rel - padL) / (w - padL - padR)) * (series.length - 1));
              setHover(Math.min(series.length - 1, Math.max(0, i)));
            }}
            onTouchStart={(e) => {
              const t = e.touches[0];
              if (!t) return;
              const r = e.currentTarget.getBoundingClientRect();
              const rel = ((t.clientX - r.left) / r.width) * w;
              const i = Math.round(((rel - padL) / (w - padL - padR)) * (series.length - 1));
              setHover(Math.min(series.length - 1, Math.max(0, i)));
            }}
            onTouchMove={(e) => {
              const t = e.touches[0];
              if (!t) return;
              const r = e.currentTarget.getBoundingClientRect();
              const rel = ((t.clientX - r.left) / r.width) * w;
              const i = Math.round(((rel - padL) / (w - padL - padR)) * (series.length - 1));
              setHover(Math.min(series.length - 1, Math.max(0, i)));
            }}
          >
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`var(--${tone})`} stopOpacity="0.35" />
                <stop offset="100%" stopColor={`var(--${tone})`} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <line
                key={f}
                x1={padL}
                x2={w - padR}
                y1={padT + f * (priceBottom - padT)}
                y2={padT + f * (priceBottom - padT)}
                stroke="var(--border)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path d={area} fill={`url(#${gid})`} />
            <path d={line} fill="none" stroke={`var(--${tone})`} strokeWidth="2" vectorEffect="non-scaling-stroke" />

            {hasVolume &&
              series.map((s, i) => {
                const v = s.v ?? 0;
                const bh = maxVol > 0 ? (v / maxVol) * volH : 0;
                const bx = x(i) - barW / 2;
                const by = h - padB - bh;
                const activeBar = hover === i;
                return (
                  <rect
                    key={i}
                    x={bx}
                    y={by}
                    width={barW}
                    height={Math.max(0, bh)}
                    fill={activeBar ? `var(--${tone})` : "var(--muted-foreground)"}
                    opacity={activeBar ? 0.85 : 0.28}
                  />
                );
              })}

            {active && hover != null && (
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={padT - 6}
                y2={h - padB}
                stroke="var(--muted-foreground)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="4 3"
              />
            )}
          </svg>

          {/* HTML overlays — not stretched by preserveAspectRatio=none */}
          <Marker
            left={pctX(highIdx)}
            top={pctY(max)}
            kind="high"
            label={`High ${gp(max)}`}
            sub={fmtTime(series[highIdx]!.t)}
            preferRight={highIdx / (series.length - 1) < 0.55}
          />
          <Marker
            left={pctX(lowIdx)}
            top={pctY(min)}
            kind="low"
            label={`Low ${gp(min)}`}
            sub={fmtTime(series[lowIdx]!.t)}
            preferRight={lowIdx / (series.length - 1) < 0.55}
          />

          {active && hover != null && (
            <div
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background"
              style={{
                left: pctX(hover),
                top: pctY(active.p),
                background: `var(--${tone})`,
              }}
            />
          )}

          <div className="pointer-events-none absolute inset-x-0 top-1 flex justify-center px-1 text-xs text-muted-foreground tabular-nums">
            {active ? (
              <span className="rounded-md bg-background/90 px-2.5 py-1 font-medium shadow-sm backdrop-blur">
                {fmtTime(active.t)} · {gp(active.p)}
                {hasVolume ? ` · vol ${formatCompact(active.v ?? 0)}` : ""}
              </span>
            ) : null}
          </div>
        </div>

        {hasVolume && (
          <div className="relative w-9 shrink-0 pl-1">
            {volTicks.map((tick) => (
              <div
                key={`v-${tick.value}`}
                className="absolute left-0 -translate-y-1/2 text-[10px] tabular-nums leading-none text-muted-foreground"
                style={{ top: tick.top }}
              >
                {formatCompact(tick.value)}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`flex justify-between text-xs text-muted-foreground tabular-nums ${hasVolume ? "pl-11 pr-9" : "pl-11"}`}>
        <span>{fmtTime(series[0]!.t)}</span>
        <span>{fmtTime(series[series.length - 1]!.t)}</span>
      </div>
    </div>
  );
}

function Marker({
  left,
  top,
  kind,
  label,
  sub,
  preferRight,
}: {
  left: string;
  top: string;
  kind: "high" | "low";
  label: string;
  sub: string;
  preferRight: boolean;
}) {
  const color = kind === "high" ? "var(--steep)" : "var(--deal)";
  return (
    <div
      className="pointer-events-none absolute z-[1] -translate-x-1/2 -translate-y-1/2"
      style={{ left, top }}
    >
      <div
        className="size-3 rounded-full border-2 border-background shadow-sm"
        style={{ background: color }}
      />
      <div
        className={`absolute top-1/2 whitespace-nowrap ${preferRight ? "left-full ml-2" : "right-full mr-2"} -translate-y-1/2`}
      >
        <div className="text-xs font-semibold tabular-nums leading-tight" style={{ color }}>
          {label}
        </div>
        <div className="text-[11px] tabular-nums leading-tight text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}
