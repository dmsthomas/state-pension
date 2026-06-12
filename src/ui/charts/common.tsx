import { scaleLinear, type ScaleLinear } from "d3-scale";
import type { ReactNode } from "react";

export const W = 720;
export const H = 320;
export const M = { top: 14, right: 16, bottom: 28, left: 52 };

export type Scale = ScaleLinear<number, number>;

export function xScale(yearFrom: number, yearTo: number): Scale {
  return scaleLinear().domain([yearFrom, yearTo]).range([M.left, W - M.right]);
}

export function yScale(lo: number, hi: number): Scale {
  return scaleLinear().domain([lo, hi]).nice().range([H - M.bottom, M.top]);
}

export function Axes({
  x,
  y,
  yFormat = (v) => `£${v}bn`,
}: {
  x: Scale;
  y: Scale;
  yFormat?: (v: number) => string;
}): ReactNode {
  const yearTicks = x.ticks(6).filter((t) => Number.isInteger(t));
  const yTicks = y.ticks(5);
  return (
    <g>
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="#eef1f6" />
          <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="#8a94a6">
            {yFormat(t)}
          </text>
        </g>
      ))}
      {yearTicks.map((t) => (
        <text key={t} x={x(t)} y={H - M.bottom + 18} textAnchor="middle" fontSize={11} fill="#8a94a6">
          {t}
        </text>
      ))}
    </g>
  );
}

/** Vertical annotation marker with a small label. */
export function YearMarker({
  x,
  year,
  label,
  color,
  row = 0,
}: {
  x: Scale;
  year: number;
  label: string;
  color: string;
  /** Stagger labels vertically when markers sit close together. */
  row?: number;
}): ReactNode {
  const px = x(year);
  return (
    <g>
      <line x1={px} x2={px} y1={M.top} y2={H - M.bottom} stroke={color} strokeDasharray="4 3" strokeWidth={1.2} />
      <text
        x={px}
        y={M.top + 2 + row * 15}
        dy="0.7em"
        dx={year > 2062 ? -5 : 5}
        textAnchor={year > 2062 ? "end" : "start"}
        fontSize={11}
        fontWeight={600}
        fill={color}
      >
        {label}
      </text>
    </g>
  );
}

export const fmtBn = (v: number): string =>
  `£${Math.abs(v) >= 1000 ? (v / 1000).toFixed(2) + "tn" : Math.round(v) + "bn"}`;

/** Fiscal year label: 2046 -> "2046-47". */
export const fy = (year: number): string => `${year}–${String((year + 1) % 100).padStart(2, "0")}`;
