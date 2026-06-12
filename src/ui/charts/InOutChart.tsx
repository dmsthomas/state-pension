import { area, line } from "d3-shape";
import type { YearRow } from "../../model/types";
import { Axes, H, M, W, xScale, yScale } from "./common";

export function InOutChart({ rows }: { rows: YearRow[] }) {
  const x = xScale(rows[0].year, rows[rows.length - 1].year);
  const maxV = Math.max(...rows.map((r) => Math.max(r.receipts, r.spending)));
  const y = yScale(0, maxV);

  const lineIn = line<YearRow>()
    .x((d) => x(d.year))
    .y((d) => y(d.receipts));
  const lineOut = line<YearRow>()
    .x((d) => x(d.year))
    .y((d) => y(d.spending));

  // Shade the gap: green where receipts exceed spending, red where spending exceeds receipts.
  const surplusArea = area<YearRow>()
    .x((d) => x(d.year))
    .y0((d) => y(Math.max(d.receipts, d.spending)))
    .y1((d) => y(d.spending));
  const deficitArea = area<YearRow>()
    .x((d) => x(d.year))
    .y0((d) => y(Math.min(d.receipts, d.spending)))
    .y1((d) => y(d.spending));

  const crossing = rows.find((r, i) => i > 0 && r.surplus < 0 && rows[i - 1].surplus >= 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="NI contributions in versus pension payments out, by year">
      <Axes x={x} y={y} />
      <path d={surplusArea(rows) ?? ""} fill="var(--in-soft)" />
      <path d={deficitArea(rows) ?? ""} fill="var(--out-soft)" />
      <path d={lineIn(rows) ?? ""} fill="none" stroke="var(--in)" strokeWidth={2.4} />
      <path d={lineOut(rows) ?? ""} fill="none" stroke="var(--out)" strokeWidth={2.4} />
      {crossing && (
        <g>
          <circle cx={x(crossing.year)} cy={y(crossing.spending)} r={4} fill="var(--out)" />
          <text
            x={x(crossing.year)}
            y={y(crossing.spending) - 10}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill="var(--out)"
          >
            payments exceed contributions {crossing.year}
          </text>
        </g>
      )}
      <text x={W - M.right} y={y(rows[rows.length - 1].receipts)} dx={-4} dy="-0.5em" textAnchor="end" fontSize={11} fill="var(--in)" fontWeight={600}>
        money in
      </text>
      <text x={W - M.right} y={y(rows[rows.length - 1].spending)} dx={-4} dy="1.1em" textAnchor="end" fontSize={11} fill="var(--out)" fontWeight={600}>
        money out
      </text>
    </svg>
  );
}
