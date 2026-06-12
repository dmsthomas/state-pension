import type { SpaStep } from "../data/constants";

export type { SpaStep };

export type MigrationVariant = "principal" | "highMigration" | "lowMigration" | "zeroMigration";

export type UpratingRule =
  | { kind: "tripleLock" }
  | { kind: "earnings" }
  | { kind: "cpi" }
  | { kind: "fixed"; pct: number };

export interface ModelParams {
  /** Percentage points added to the employee/employer/Class 4 main NI rates. */
  niDeltaPP: number;
  /** Pension level as % of the baseline full rate path (100 = current policy). */
  pensionLevelPct: number;
  uprating: UpratingRule;
  spaSchedule: SpaStep[];
  migration: MigrationVariant;
  /** Employment rate among 16-to-SPA population. Baseline 0.75. */
  employmentRate: number;
  /** Nominal return on the fund balance, % per year. */
  fundReturnPct: number;
  /** Triple lock premium over earnings growth, pp per year (OBR central 0.53). */
  tripleLockPremiumPP: number;
}

export interface PopulationData {
  meta: {
    yearFrom: number;
    yearTo: number;
    maxAge: number;
    gbScale: number;
    source: string;
    url: string;
    unit: string;
    note: string;
  };
  /** variants[name][age][yearIndex], thousands, both sexes, GB. */
  variants: Record<MigrationVariant, number[][]>;
}

export interface YearRow {
  /** Fiscal year: 2025 means 2025-26. */
  year: number;
  spa: number;
  /** Millions. */
  pensioners: number;
  /** Millions. */
  workers: number;
  /** All money £bn nominal. */
  contributions: number;
  investmentIncome: number;
  receipts: number;
  statePension: number;
  otherBenefits: number;
  spending: number;
  surplus: number;
  fundBalance: number;
  /** Fund balance as a share of that year's benefit spend (statutory min 0.167). */
  fundShareOfSpend: number;
  gdp: number;
  spendingPctGdp: number;
  receiptsPctGdp: number;
  /** Full new State Pension £/week under the chosen uprating + level. */
  fullRateWeekly: number;
}

export interface ModelResult {
  rows: YearRow[];
  /** First year the fund balance goes negative, if any. */
  exhaustionYear: number | null;
  /** First year the fund falls below the 16.7% statutory minimum, if any. */
  breachYear: number | null;
  balance2050: number;
  finalFundBalance: number;
}
