import { useEffect, useMemo, useRef, useState } from "react";
import popJson from "../data/population.json";
import { calibrate, runModel } from "../model/engine";
import { DEFAULT_PARAMS, SPA_PRESETS, customSpaSchedule } from "../model/defaults";
import { requiredNiDelta, requiredPensionLevel, requiredSpa } from "../model/solve";
import type { ModelParams, PopulationData, UpratingRule } from "../model/types";
import { LeverPanel, type SpaChoice } from "./LeverPanel";
import { StatCards } from "./StatCards";
import { FiguresTable } from "./FiguresTable";
import { InOutChart } from "./charts/InOutChart";
import { FundBalanceChart } from "./charts/FundBalanceChart";
import { GdpChart } from "./charts/GdpChart";
import { Methodology } from "./Methodology";

const pop = popJson as unknown as PopulationData;
const DEFAULT_SPA: SpaChoice = { preset: "legislated", customAge: 68, customYear: 2045 };

function paramsToQuery(p: ModelParams, s: SpaChoice): string {
  const q = new URLSearchParams();
  if (p.niDeltaPP !== 0) q.set("ni", p.niDeltaPP.toFixed(1));
  if (p.pensionLevelPct !== 100) q.set("lvl", String(p.pensionLevelPct));
  if (p.uprating.kind !== "tripleLock") q.set("upr", p.uprating.kind === "fixed" ? `fix${p.uprating.pct}` : p.uprating.kind);
  if (s.preset !== "legislated") q.set("spa", s.preset === "custom" ? `${s.customAge}by${s.customYear}` : s.preset);
  if (p.migration !== "principal") q.set("mig", p.migration);
  if (p.employmentRate !== DEFAULT_PARAMS.employmentRate) q.set("emp", String(Math.round(p.employmentRate * 100)));
  if (p.fundReturnPct !== DEFAULT_PARAMS.fundReturnPct) q.set("ret", String(p.fundReturnPct));
  if (p.tripleLockPremiumPP !== DEFAULT_PARAMS.tripleLockPremiumPP) q.set("prem", String(p.tripleLockPremiumPP));
  const str = q.toString();
  return str ? `?${str}` : window.location.pathname;
}

function paramsFromQuery(): { params: ModelParams; spa: SpaChoice } {
  const q = new URLSearchParams(window.location.search);
  const params = { ...DEFAULT_PARAMS };
  const spa = { ...DEFAULT_SPA };
  if (q.get("ni")) params.niDeltaPP = Number(q.get("ni"));
  if (q.get("lvl")) params.pensionLevelPct = Number(q.get("lvl"));
  const upr = q.get("upr");
  if (upr === "earnings" || upr === "cpi") params.uprating = { kind: upr };
  else if (upr?.startsWith("fix")) params.uprating = { kind: "fixed", pct: Number(upr.slice(3)) || 2 };
  const spaQ = q.get("spa");
  if (spaQ && SPA_PRESETS[spaQ]) {
    spa.preset = spaQ;
    params.spaSchedule = SPA_PRESETS[spaQ].schedule;
  } else if (spaQ?.includes("by")) {
    const [age, year] = spaQ.split("by").map(Number);
    if (age && year) {
      spa.preset = "custom";
      spa.customAge = age;
      spa.customYear = year;
      params.spaSchedule = customSpaSchedule(age, year);
    }
  }
  const mig = q.get("mig");
  if (mig === "highMigration" || mig === "lowMigration" || mig === "zeroMigration") params.migration = mig;
  if (q.get("emp")) params.employmentRate = Number(q.get("emp")) / 100;
  if (q.get("ret")) params.fundReturnPct = Number(q.get("ret"));
  if (q.get("prem")) params.tripleLockPremiumPP = Number(q.get("prem"));
  return { params, spa };
}

export function App() {
  const initial = useMemo(paramsFromQuery, []);
  const [params, setParams] = useState<ModelParams>(initial.params);
  const [spaChoice, setSpaChoice] = useState<SpaChoice>(initial.spa);
  const [horizon, setHorizon] = useState<number>(2050);

  const result = useMemo(() => runModel(params, pop), [params]);
  const solved = useMemo(
    () => ({
      niDelta: requiredNiDelta(params, pop),
      pensionLevel: requiredPensionLevel(params, pop),
      spa: requiredSpa(params, pop),
    }),
    [params],
  );
  const cal = useMemo(() => calibrate(pop), []);

  // Shareable scenario URLs, debounced.
  const urlTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      window.history.replaceState(null, "", paramsToQuery(params, spaChoice));
    }, 300);
  }, [params, spaChoice]);

  const upratingLabel: Record<UpratingRule["kind"], string> = {
    tripleLock: "triple lock",
    earnings: "earnings",
    cpi: "CPI",
    fixed: "fixed",
  };

  return (
    <div className="wrap">
      <header className="hero">
        <h1>The State Pension as a Pension Scheme</h1>
        <p>
          National Insurance contributions pay in; state pensions pay out. The National Insurance Fund really exists —
          this is it, on its own terms, with no help from general taxation.
        </p>
        <p>
          Right now the scheme more than pays for itself: the April 2025 employer NI rise put it roughly £14bn a year
          in surplus, and the fund is growing. The question is what happens as the triple lock compounds and the
          1960s-born cohort retires — and what it would take to keep the scheme in balance.
        </p>
      </header>

      <div className="layout">
        <div className="main-col">
          <StatCards result={result} solved={solved} currentLevel={params.pensionLevelPct} />

          <div className="chart-card">
            <div className="chart-head">
              <h2>Money in vs money out</h2>
              <div className="seg" role="group" aria-label="Chart horizon">
                {[2035, 2050, 2075].map((h) => (
                  <button key={h} className={horizon === h ? "active" : ""} onClick={() => setHorizon(h)}>
                    to {h}
                  </button>
                ))}
              </div>
            </div>
            <p className="chart-sub">
              NI contributions (plus interest on the fund) vs pension and benefit payments, £bn per year, nominal —
              uprating: {upratingLabel[params.uprating.kind]}
            </p>
            <InOutChart rows={result.rows.filter((r) => r.year <= horizon)} />
            <div className="legend">
              <span className="key">
                <span className="swatch" style={{ background: "var(--in)" }} /> money in
              </span>
              <span className="key">
                <span className="swatch" style={{ background: "var(--out)" }} /> money out
              </span>
              <span className="key">
                <span className="swatch" style={{ background: "var(--in-soft)", height: 10 }} /> surplus
              </span>
              <span className="key">
                <span className="swatch" style={{ background: "var(--out-soft)", height: 10 }} /> deficit
              </span>
            </div>
          </div>

          <FiguresTable result={result} />

          <div className="chart-card">
            <h2>The fund</h2>
            <p className="chart-sub">
              National Insurance Fund balance, £bn — starts from the audited £79bn at March 2025
            </p>
            <FundBalanceChart result={result} />
          </div>

          <div className="chart-card">
            <h2>The burden on the economy</h2>
            <p className="chart-sub">State pension spending as a share of GDP</p>
            <GdpChart rows={result.rows} />
          </div>

          <Methodology cal={cal} />

          <footer>
            Model and site by David Thomas. Calibrated to the GB National Insurance Fund Account 2024-25, GAD Uprating
            Report January 2026, ONS 2024-based population projections and OBR Fiscal Risks and Sustainability July
            2025. Not an actuarial valuation.
          </footer>
        </div>

        <LeverPanel
          params={params}
          spaChoice={spaChoice}
          onChange={(p, s) => {
            setParams(p);
            setSpaChoice(s);
          }}
          onReset={() => {
            setParams(DEFAULT_PARAMS);
            setSpaChoice(DEFAULT_SPA);
          }}
        />
      </div>
    </div>
  );
}
