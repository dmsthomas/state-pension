import { runModel } from "./engine";
import { customSpaSchedule } from "./defaults";
import type { ModelParams, PopulationData } from "./types";

/** The scheme "balances" if the fund never falls below the statutory
 * minimum (16.7% of annual benefit spend) through 2075. */
function balances(params: ModelParams, popData: PopulationData): boolean {
  return runModel(params, popData).breachYear === null;
}

/** Smallest NI rate rise (pp on the main rates, all classes) that keeps the
 * scheme balanced through 2075 under the other current levers. Returns null
 * if it already balances, or NaN if even +20pp is not enough. */
export function requiredNiDelta(params: ModelParams, popData: PopulationData): number | null {
  const base = { ...params };
  if (balances(base, popData)) return null;
  let lo = base.niDeltaPP;
  let hi = base.niDeltaPP + 20;
  if (!balances({ ...base, niDeltaPP: hi }, popData)) return NaN;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (balances({ ...base, niDeltaPP: mid }, popData)) hi = mid;
    else lo = mid;
  }
  return Math.ceil((hi - params.niDeltaPP) * 10) / 10;
}

/** Smallest pension level (% of baseline) that balances the scheme. */
export function requiredPensionLevel(params: ModelParams, popData: PopulationData): number | null {
  const base = { ...params };
  if (balances(base, popData)) return null;
  let hi = base.pensionLevelPct;
  let lo = 0;
  if (!balances({ ...base, pensionLevelPct: lo }, popData)) return NaN;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (balances({ ...base, pensionLevelPct: mid }, popData)) lo = mid;
    else hi = mid;
  }
  return Math.floor(lo);
}

/** Smallest SPA target (reached by 2045 in half-year steps from 2028) that
 * balances the scheme. Returns the age, or null if already balanced, or NaN
 * if even SPA 75 is not enough. */
export function requiredSpa(params: ModelParams, popData: PopulationData): number | null {
  if (balances(params, popData)) return null;
  for (let age = 67.5; age <= 75; age += 0.5) {
    const schedule = customSpaSchedule(age, 2045);
    if (balances({ ...params, spaSchedule: schedule }, popData)) return age;
  }
  return NaN;
}
