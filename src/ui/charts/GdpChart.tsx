import { line } from "d3-shape";
import type { YearRow } from "../../model/types";
import { Axes, W, H, M, xScale, yScale } from "./common";

export function GdpChart({ rows }: { rows: YearRow[] }) {
  const x = xScale(rows[0].year, rows[rows.length - 1].year);
  const spendPct = (r: YearRow) => (r.statePension / r.gdp) * 100;
  const hi = Math.max(8.2, ...rows.map(spendPct));
  const y = yScale(0, hi);

  const spendLine = line<YearRow>()
    .x((d) => x(d.year))
    .y((d) => y(spendPct(d)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="State pension spending as a percentage of GDP">
      <Axes x={x} y={y} yFormat={(v) => `${v}%`} />
      <path d={spendLine(rows) ?? ""} fill="none" stroke="var(--out)" strokeWidth={2.4} />
      {/* OBR central projection reference: 7.7% of GDP by the early 2070s */}
      <circle cx={x(2072)} cy={y(7.7)} r={4.5} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
      <text x={x(2072) - 8} y={y(7.7)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--ink)">
        OBR central: 7.7% by early 2070s
      </text>
      <text x={M.left + 6} y={H - M.bottom - 8} fontSize={11} fill="var(--out)" fontWeight={600}>
        state pension spend, % of GDP
      </text>
    </svg>
  );
}
