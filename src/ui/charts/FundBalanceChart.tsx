import { area, line } from "d3-shape";
import type { ModelResult } from "../../model/types";
import { Axes, H, M, W, YearMarker, xScale, yScale } from "./common";

export function FundBalanceChart({ result }: { result: ModelResult }) {
  const rows = result.rows;
  const x = xScale(rows[0].year, rows[rows.length - 1].year);
  const trueLo = Math.min(0, ...rows.map((r) => r.fundBalance));
  const hi = Math.max(...rows.map((r) => r.fundBalance));
  // Once exhausted the balance compounds ever more negative; clamp the view so
  // the years that matter stay readable and let the line exit the chart.
  const lo = Math.max(trueLo, -0.6 * hi, -150);
  const clamped = trueLo < lo;
  const y = yScale(lo, hi);

  const balLine = line<(typeof rows)[number]>()
    .x((d) => x(d.year))
    .y((d) => y(d.fundBalance));
  const minArea = area<(typeof rows)[number]>()
    .x((d) => x(d.year))
    .y0(() => y(Math.max(0, lo)))
    .y1((d) => y(d.spending * 0.167));
  const minLine = line<(typeof rows)[number]>()
    .x((d) => x(d.year))
    .y((d) => y(d.spending * 0.167));

  const final = rows[rows.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="National Insurance Fund balance by year">
      <defs>
        <clipPath id="fund-plot">
          <rect x={M.left} y={M.top} width={W - M.left - M.right} height={H - M.top - M.bottom} />
        </clipPath>
      </defs>
      <Axes x={x} y={y} />
      <path d={minArea(rows) ?? ""} fill="rgba(183,121,31,0.08)" clipPath="url(#fund-plot)" />
      <path d={minLine(rows) ?? ""} fill="none" stroke="var(--warn)" strokeWidth={1.2} strokeDasharray="5 4" />
      {lo < 0 && <line x1={M.left} x2={W - M.right} y1={y(0)} y2={y(0)} stroke="#9aa3b2" strokeWidth={1} />}
      <path d={balLine(rows) ?? ""} fill="none" stroke="var(--fund)" strokeWidth={2.6} clipPath="url(#fund-plot)" />
      {result.breachYear && result.breachYear !== result.exhaustionYear && (
        <YearMarker x={x} year={result.breachYear} label={`below statutory minimum ${result.breachYear}`} color="var(--warn)" />
      )}
      {result.exhaustionYear && (
        <YearMarker x={x} year={result.exhaustionYear} label={`fund runs dry ${result.exhaustionYear}`} color="var(--out)" row={result.breachYear && result.breachYear !== result.exhaustionYear ? 1 : 0} />
      )}
      {clamped && (
        <text x={W - M.right - 4} y={H - M.bottom - 8} textAnchor="end" fontSize={11} fill="var(--out)">
          shortfall keeps compounding: −£{Math.abs(final.fundBalance / 1000).toFixed(1)}tn cumulative by {final.year}
        </text>
      )}
      <text x={M.left + 6} y={y(rows[0].spending * 0.167)} dy="1.3em" fontSize={10.5} fill="var(--warn)">
        statutory minimum (16.7% of annual spend)
      </text>
    </svg>
  );
}
