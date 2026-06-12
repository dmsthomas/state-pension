import { SPA_LEGISLATED, SPA_CRIDLAND, SPA_OBR, CONSTANTS, type SpaStep } from "../data/constants";
import type { ModelParams } from "./types";

export const DEFAULT_PARAMS: ModelParams = {
  niDeltaPP: 0,
  pensionLevelPct: 100,
  uprating: { kind: "tripleLock" },
  spaSchedule: SPA_LEGISLATED,
  migration: "principal",
  employmentRate: CONSTANTS.economy.employmentRate,
  fundReturnPct: CONSTANTS.economy.fundReturn,
  tripleLockPremiumPP: CONSTANTS.economy.tripleLockPremium,
};

export const SPA_PRESETS: Record<string, { label: string; schedule: SpaStep[] }> = {
  legislated: { label: "Legislated (68 by 2046)", schedule: SPA_LEGISLATED },
  cridland: { label: "Cridland (68 by 2039)", schedule: SPA_CRIDLAND },
  obr: { label: "OBR (68 by 2039, 69 by 2071)", schedule: SPA_OBR },
};

/** Build a custom schedule: current legislated path, then rise in half-year
 * steps to `targetAge`, completing in `targetYear`. */
export function customSpaSchedule(targetAge: number, targetYear: number): SpaStep[] {
  const base: SpaStep[] = [
    { fromYear: 2025, age: 66 },
    { fromYear: 2026, age: 66.5 },
    { fromYear: 2027, age: 67 },
  ];
  if (targetAge <= 67) return targetAge === 67 ? base : base.slice(0, 1);
  const steps = Math.round((targetAge - 67) * 2); // half-year increments
  const firstYear = Math.max(2028, targetYear - steps + 1);
  const schedule = [...base];
  for (let i = 1; i <= steps; i++) {
    schedule.push({ fromYear: firstYear + i - 1, age: 67 + i * 0.5 });
  }
  return schedule;
}

export function spaAt(schedule: SpaStep[], year: number): number {
  let spa = schedule[0].age;
  for (const step of schedule) {
    if (year >= step.fromYear) spa = step.age;
  }
  return spa;
}
