import { useState } from "react";
import { formatCompact, gp } from "@/lib/format";

type Point = { t: number; p: number; v?: number };

function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const exp = Math.floor(Math.log10(raw));
  const f = raw / 10 ** exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * 10 ** exp;
}

function niceTicks(min: number, max: number, target = 5): number[] {
  if (!(max > min)) return [min];
  const step = niceStep((max - min) / Math.max(1, target - 1));
  const start = Math.ceil(min / step) * step;
  const end = Math.floor(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step * 0.25; v += step) {
    const n = Number(v.toPrecision(12));
    if (n >= min - step * 1e-6 && n <= max + step * 1e-6) ticks.push(n);
  }
  if (!ticks.length) ticks.push(min, max);
  return ticks;
}

function niceDomain(min: number, max: number, target = 5): { lo: number; hi: number } {
  if (!(max > min)) {
    const pad = Math.max(1, Math.abs(min) * 0.05);
    return { lo: min - pad, hi: max + pad };
  }
  const step = niceStep((max - min) / Math.max(1, target - 1));
  return {
    lo: Math.floor(min / step) * step,
    hi: Math.ceil(max / step) * step,
  };
}

function axisGp(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) {
    const v = n / 1_000_000_000;
    return `${Number.isInteger(v) ? v : +v.toFixed(1)}b`;
  }
  if (abs >= 1_000_000) {
    const v = n / 1_000_000;
    return `${Number.isInteger(v) ? v : +v.toFixed(1)}m`;
  }
  if (abs >= 1_000) {
    const v = n / 1_000;
    return `${Number.isInteger(v) ? v : +v.toFixed(1)}k`;
  }
  return `${Math.round(n)}`;
}

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
  const dataMin = Math.min(...prices);
  const dataMax = Math.max(...prices);
  const { lo: axisMin, hi: axisMax } = niceDomain(dataMin, dataMax, 5);
  const span = axisMax - axisMin || 1;

  const highIdx = prices.indexOf(dataMax);
  const lowIdx = prices.indexOf(dataMin);

  const x = (i: number) => padL + (i / (series.length - 1)) * (w - padL - padR);
  const y = (p: number) => padT + (1 - (p - axisMin) / span) * (priceBottom - padT);
  const barW = Math.max(1.2, ((w - padL - padR) / series.length) * 0.72);

  const pctX = (i: number) => `${(x(i) / w) * 100}%`;
  const pctY = (p: number) => `${(y(p) / h) * 100}%`;
  const pctOfH = (svgY: number) => `${(svgY / h) * 100}%`;

  const line = series.map((s, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(s.p).toFixed(1)}`).join(" ");
  const area = `${line} L${x(series.length - 1)},${priceBottom} L${padL},${priceBottom} Z`;
  const gid = `chart-${tone}`;

  const fmtTime = (t: number) =>
    new Date(t).toLocaleString(undefined, intraday ? { hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric" });

  const volIdx = hover ?? series.length - 1;
  const volNow = series[volIdx]?.v ?? 0;
  const volBarH = maxVol > 0 ? (volNow / maxVol) * volH : 0;
  const active = hover != null ? series[hover] : null;

  const priceTicks = niceTicks(axisMin, axisMax, 5).map((value) => ({
    value,
    top: pctOfH(y(value)),
  }));

  return (
    <div className="relative">
      <div className={`relative w-full overflow-visible ${hasVolume ? "h-[22rem]" : "h-72"}`}>
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
          {priceTicks.map((tick) => (
            <line
              key={tick.value}
              x1={padL}
              x2={w - padR}
              y1={y(tick.value)}
              y2={y(tick.value)}
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
              const activeBar = volIdx === i;
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

        {priceTicks.map((tick) => (
          <div
            key={`p-${tick.value}`}
            className="pointer-events-none absolute left-0 z-[2] -translate-y-1/2 rounded bg-background/80 px-1 py-0.5 text-[11px] font-semibold tabular-nums leading-none text-foreground"
            style={{ top: tick.top }}
          >
            {axisGp(tick.value)}
          </div>
        ))}

        {hasVolume && maxVol > 0 && (
          <div
            className="pointer-events-none absolute z-[2] -translate-x-1/2 -translate-y-full rounded bg-background/90 px-1 py-0.5 text-[11px] font-semibold tabular-nums leading-none text-foreground"
            style={{
              left: pctX(volIdx),
              top: pctOfH(h - padB - volBarH),
            }}
          >
            {axisGp(volNow)} vol
          </div>
        )}

        <Marker
          left={pctX(highIdx)}
          top={pctY(dataMax)}
          kind="high"
          label={`High ${gp(dataMax)}`}
          sub={fmtTime(series[highIdx]!.t)}
          preferRight={highIdx / (series.length - 1) < 0.55}
        />
        <Marker
          left={pctX(lowIdx)}
          top={pctY(dataMin)}
          kind="low"
          label={`Low ${gp(dataMin)}`}
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

        <div className="pointer-events-none absolute inset-x-0 top-1 z-[3] flex justify-center px-1 text-xs text-muted-foreground tabular-nums">
          {active ? (
            <span className="rounded-md bg-background/90 px-2.5 py-1 font-medium shadow-sm backdrop-blur">
              {fmtTime(active.t)} · {gp(active.p)}
              {hasVolume ? ` · vol ${formatCompact(active.v ?? 0)}` : ""}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
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
