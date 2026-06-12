import type { ModelResult } from "../model/types";
import { fy } from "./charts/common";

const NEAR_YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const MILESTONES = [2035, 2040, 2045, 2050, 2060, 2075];

function money(v: number): string {
  return `£${Math.round(v)}bn`;
}

export function FiguresTable({ result }: { result: ModelResult }) {
  const byYear = new Map(result.rows.map((r) => [r.year, r]));
  const render = (year: number) => {
    const r = byYear.get(year);
    if (!r) return null;
    const belowMin = r.fundShareOfSpend < 0.167;
    return (
      <tr key={year} className={year === 2026 ? "now" : ""}>
        <td>
          {fy(year)}
          {year === 2026 && <span className="now-tag">now</span>}
        </td>
        <td>{money(r.receipts)}</td>
        <td>{money(r.spending)}</td>
        <td className={r.surplus < 0 ? "neg" : "pos"}>
          {r.surplus < 0 ? "−" : "+"}
          {money(Math.abs(r.surplus)).slice(1)}
        </td>
        <td className={r.fundBalance < 0 ? "neg" : belowMin ? "warn" : ""}>
          {r.fundBalance < 0 ? "−" : ""}
          {money(Math.abs(r.fundBalance)).slice(1)}
        </td>
      </tr>
    );
  };

  return (
    <div className="chart-card">
      <h2>The figures, year by year</h2>
      <p className="chart-sub">
        £bn, nominal. The next five years follow the Government Actuary's projection closely; later years are this
        model. The scheme is in surplus today because the April 2025 employer NI rise (+1.2pp, and a much lower
        starting threshold) raised contributions by roughly £25bn a year.
      </p>
      <table className="fig-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Money in</th>
            <th>Money out</th>
            <th>Balance</th>
            <th>Fund</th>
          </tr>
        </thead>
        <tbody>
          {NEAR_YEARS.map(render)}
          <tr className="gap-row">
            <td colSpan={5}>⋯ then at five- and ten-year milestones ⋯</td>
          </tr>
          {MILESTONES.map(render)}
        </tbody>
      </table>
      <p className="chart-sub" style={{ marginTop: "0.5rem" }}>
        "Money in" is NI contributions plus interest earned on the fund. "Fund" is the year-end balance;{" "}
        <span className="warn-text">amber</span> means below the statutory minimum,{" "}
        <span className="neg-text">red</span> means the cumulative shortfall after the fund runs dry.
      </p>
    </div>
  );
}
