import type { ModelResult } from "../model/types";
import { fy } from "./charts/common";

interface Solved {
  niDelta: number | null;
  pensionLevel: number | null;
  spa: number | null;
}

export function StatCards({ result, solved, currentLevel }: { result: ModelResult; solved: Solved; currentLevel: number }) {
  const { breachYear, exhaustionYear, balance2050 } = result;
  const balanced = breachYear === null;

  const fixes: string[] = [];
  if (!balanced) {
    if (solved.niDelta !== null && !Number.isNaN(solved.niDelta)) fixes.push(`NI +${solved.niDelta.toFixed(1)}pp`);
    if (solved.pensionLevel !== null && !Number.isNaN(solved.pensionLevel))
      fixes.push(`pension at ${Math.round((solved.pensionLevel / currentLevel) * 100)}% of its current path`);
    if (solved.spa !== null && !Number.isNaN(solved.spa))
      fixes.push(`pension age ${solved.spa.toFixed(1).replace(".0", "")} by 2045`);
  }

  return (
    <>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="label">Fund runs dry</div>
          <div className={`value ${exhaustionYear ? "bad" : "ok"}`}>{exhaustionYear ? fy(exhaustionYear) : "Never (to 2075)"}</div>
          <div className="sub">
            {breachYear
              ? `Falls below the statutory minimum in ${fy(breachYear)}`
              : "Stays above the statutory minimum throughout"}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Annual balance in 2050</div>
          <div className={`value ${balance2050 < 0 ? "bad" : "ok"}`}>
            {balance2050 < 0 ? "−" : "+"}£{Math.abs(balance2050).toFixed(0)}bn
          </div>
          <div className="sub">Contributions minus payments in 2050-51</div>
        </div>
        <div className="stat-card">
          <div className="label">{balanced ? "Verdict" : "To balance, one of:"}</div>
          {balanced ? (
            <div className="value ok">Scheme balances</div>
          ) : (
            <div className="sub" style={{ fontSize: "0.95rem", marginTop: "0.2rem", color: "var(--ink)" }}>
              {fixes.map((f, i) => (
                <div key={f}>
                  <strong>{f}</strong>
                  {i < fixes.length - 1 ? <span style={{ color: "var(--ink-faint)" }}> or</span> : ""}
                </div>
              ))}
            </div>
          )}
          <div className="sub">Keeps the fund above its statutory minimum through 2075</div>
        </div>
      </div>
      {exhaustionYear && (
        <p className="framing-note">
          "Runs dry" does not mean pensions stop. It is the year the scheme stops paying for itself: from then on,
          payments must be topped up from general taxation (a "Treasury Grant"), as the law already provides.
        </p>
      )}
    </>
  );
}
