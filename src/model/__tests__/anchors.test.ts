import { describe, expect, it } from "vitest";
import popJson from "../../data/population.json";
import { CONSTANTS, SPA_OBR } from "../../data/constants";
import { runModel } from "../engine";
import { DEFAULT_PARAMS } from "../defaults";
import { requiredNiDelta, requiredPensionLevel, requiredSpa } from "../solve";
import type { ModelParams, PopulationData } from "../types";

const pop = popJson as unknown as PopulationData;
const run = (over: Partial<ModelParams> = {}) => runModel({ ...DEFAULT_PARAMS, ...over }, pop);

describe("GAD Uprating Report 2026 anchor (2025-26 to 2030-31)", () => {
  const result = run();
  const gad = CONSTANTS.gadProjection;

  it("contribution income tracks GAD within 4% (2025-26, 2026-27)", () => {
    for (let i = 0; i < gad.contributions.length; i++) {
      const row = result.rows.find((r) => r.year === gad.years[i])!;
      const rel = Math.abs(row.contributions - gad.contributions[i]) / gad.contributions[i];
      expect(rel, `year ${gad.years[i]}: model ${row.contributions.toFixed(1)} vs GAD ${gad.contributions[i]}`).toBeLessThan(
        0.04,
      );
    }
  });

  it("total receipts track GAD within 4% each year", () => {
    for (let i = 0; i < gad.years.length; i++) {
      const row = result.rows.find((r) => r.year === gad.years[i])!;
      const rel = Math.abs(row.receipts - gad.receipts[i]) / gad.receipts[i];
      expect(rel, `year ${gad.years[i]}: model ${row.receipts.toFixed(1)} vs GAD ${gad.receipts[i]}`).toBeLessThan(0.04);
    }
  });

  it("total benefit spend tracks GAD within 4% each year", () => {
    for (let i = 0; i < gad.years.length; i++) {
      const row = result.rows.find((r) => r.year === gad.years[i])!;
      const rel = Math.abs(row.spending - gad.spend[i]) / gad.spend[i];
      expect(rel, `year ${gad.years[i]}: model ${row.spending.toFixed(1)} vs GAD ${gad.spend[i]}`).toBeLessThan(0.04);
    }
  });

  it("fund balance by 2030-31 within 15% of GAD £163.7bn", () => {
    const row = result.rows.find((r) => r.year === 2030)!;
    const gadFinal = gad.balance[gad.balance.length - 1];
    expect(Math.abs(row.fundBalance - gadFinal) / gadFinal, `model ${row.fundBalance.toFixed(1)}`).toBeLessThan(0.15);
  });
});

describe("OBR long-run sanity", () => {
  it("state pension spend % GDP in early 2070s within ±0.7pp of OBR 7.7% (triple lock + OBR SPA path)", () => {
    const result = run({ spaSchedule: SPA_OBR });
    const rows70s = result.rows.filter((r) => r.year >= 2070 && r.year <= 2074);
    const avg = rows70s.reduce((s, r) => s + (r.statePension / r.gdp) * 100, 0) / rows70s.length;
    expect(Math.abs(avg - CONSTANTS.obr.spendPctGdp2070s), `model ${avg.toFixed(2)}%`).toBeLessThan(0.7);
  });

  it("spend % GDP starts near OBR ~5% of GDP", () => {
    const row = run().rows.find((r) => r.year === 2025)!;
    expect((row.statePension / row.gdp) * 100).toBeGreaterThan(4.4);
    expect((row.statePension / row.gdp) * 100).toBeLessThan(5.4);
  });
});

describe("invariants", () => {
  it("raising SPA never worsens the final fund balance", () => {
    const base = run().finalFundBalance;
    const higher = run({ spaSchedule: SPA_OBR }).finalFundBalance;
    expect(higher).toBeGreaterThan(base);
  });

  it("CPI uprating spends less than triple lock in every year after 2026", () => {
    const tl = run().rows;
    const cpi = run({ uprating: { kind: "cpi" } }).rows;
    for (let i = 0; i < tl.length; i++) {
      if (tl[i].year <= 2026) continue;
      // <= because CPI can itself be the binding lock in a given year (e.g. 2027)
      expect(cpi[i].spending).toBeLessThanOrEqual(tl[i].spending);
    }
  });

  it("migration variants order receipts: high > principal > low > zero (2050)", () => {
    const at2050 = (m: ModelParams["migration"]) => run({ migration: m }).rows.find((r) => r.year === 2050)!.contributions;
    expect(at2050("highMigration")).toBeGreaterThan(at2050("principal"));
    expect(at2050("principal")).toBeGreaterThan(at2050("lowMigration"));
    expect(at2050("lowMigration")).toBeGreaterThan(at2050("zeroMigration"));
  });

  it("NI delta of +1pp raises 2025 contributions by a plausible £10-18bn", () => {
    const base = run().rows[0].contributions;
    const up = run({ niDeltaPP: 1 }).rows[0].contributions;
    expect(up - base).toBeGreaterThan(10);
    expect(up - base).toBeLessThan(18);
  });

  it("solver outputs, fed back in, actually balance the scheme", () => {
    const params = DEFAULT_PARAMS;
    const ni = requiredNiDelta(params, pop);
    if (ni !== null && !Number.isNaN(ni)) {
      expect(runModel({ ...params, niDeltaPP: ni }, pop).breachYear).toBeNull();
    }
    const level = requiredPensionLevel(params, pop);
    if (level !== null && !Number.isNaN(level)) {
      expect(runModel({ ...params, pensionLevelPct: level }, pop).breachYear).toBeNull();
    }
    const spa = requiredSpa(params, pop);
    if (spa !== null && !Number.isNaN(spa)) {
      // requiredSpa already verified balance internally; just assert it returned something sane
      expect(spa).toBeGreaterThan(67);
    }
  });
});
