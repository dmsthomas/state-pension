import { CONSTANTS } from "../data/constants";
import { spaAt } from "./defaults";
import type { ModelParams, ModelResult, PopulationData, MigrationVariant, YearRow } from "./types";

const C = CONSTANTS;
const YEAR_FROM = 2025;
const YEAR_TO = 2075;

/** Persons (thousands) aged in [lo, hi) at `year`, with fractional bounds. */
function popBetween(pop: number[][], yearIdx: number, lo: number, hi: number): number {
  const maxAge = pop.length - 1;
  let total = 0;
  const loFloor = Math.floor(lo);
  const hiFloor = Math.floor(Math.min(hi, maxAge + 1));
  for (let age = loFloor; age <= Math.min(hiFloor, maxAge); age++) {
    const cohort = pop[age][yearIdx];
    // fraction of the single-year cohort inside [lo, hi), assuming uniform spread
    const from = Math.max(lo, age);
    const to = Math.min(hi, age === maxAge ? hi : age + 1);
    if (to <= from) continue;
    total += age === maxAge ? cohort : cohort * (to - from);
  }
  return total;
}

/** Persons (thousands) aged >= a at `year`. */
function popOver(pop: number[][], yearIdx: number, a: number): number {
  return popBetween(pop, yearIdx, a, 200);
}

function earningsGrowth(year: number): number {
  return C.economy.earningsNearTerm[year] ?? C.economy.earningsLongRun;
}
function cpiGrowth(year: number): number {
  return C.economy.cpiNearTerm[year] ?? C.economy.cpiLongRun;
}

/** Multiplier on NI receipts from adding `delta` pp to the main rates of all
 * three contributor classes, holding bases fixed. Receipts within each class
 * scale linearly with its rate; the employee/Class 4 additional-rate bands
 * (2% above the UEL/UPL) are unaffected, captured by the main-band shares. */
export function niRateMultiplier(deltaPP: number): number {
  const n = C.ni;
  const perPP =
    (n.employeeShare * n.employeeMainBandShare) / n.employeeMainRate +
    n.employerShare / n.employerRate +
    (n.selfEmployedShare * n.class4MainBandShare) / n.class4MainRate;
  return 1 + deltaPP * perPP;
}

export interface Calibration {
  /** GB state pension caseload / GB population over SPA, 2025. */
  caseloadRatio: number;
  /** Average payment per pensioner / full new SP rate, calibrated so that
   * model state pension spend in 2026-27 equals GAD's £153.2bn. */
  paymentFactor: number;
  /** £ contributions per worker in 2025-26, calibrated to GAD's £160.8bn. */
  contributionPerWorker: number;
  /** Workers (thousands) in 2025 at baseline employment rate. */
  baseWorkers: number;
}

export function calibrate(popData: PopulationData): Calibration {
  const pop = popData.variants.principal;
  const y2025 = 2025 - popData.meta.yearFrom;
  const y2026 = 2026 - popData.meta.yearFrom;

  const caseloadGb2025 = C.pension.caseloadUk2025m * 1000 * 0.97; // thousands
  const caseloadRatio = caseloadGb2025 / popOver(pop, y2025, 66);

  // GAD UR Jan 2026: state pension spend 2026-27 = £66.0bn new SP + £67.7bn
  // basic SP + £19.5bn additional/SERPS = £153.2bn. The additional pension is
  // modelled separately (CPI-uprated, decaying), so the factor is calibrated
  // on the £133.7bn flat-rate component. SPA mid-rise: 66.5.
  const pensioners2026 = popOver(pop, y2026, 66.5) * caseloadRatio;
  const flatRateSpend2026 = 153.2 - C.additionalPension.amount2026;
  const paymentFactor = (flatRateSpend2026 * 1e9) / (pensioners2026 * 1000 * C.pension.fullRateWeekly2026 * 52);

  // GAD's £160.8bn contribution income for 2025-26 subsumes the statutory
  // payments compensation (its published total receipts = 160.8 + 3.4
  // investment income), so no separate compensation line is modelled.
  const baseWorkers = popBetween(pop, y2025, 16, 66) * C.economy.employmentRate;
  const contributionPerWorker = 160.8e9 / (baseWorkers * 1000);

  return { caseloadRatio, paymentFactor, contributionPerWorker, baseWorkers };
}

let cachedCalibration: Calibration | null = null;

export function runModel(params: ModelParams, popData: PopulationData): ModelResult {
  if (!cachedCalibration) cachedCalibration = calibrate(popData);
  const cal = cachedCalibration;
  const pop = popData.variants[params.migration as MigrationVariant];

  const rows: YearRow[] = [];
  let fundBalance = C.nif2024.closingBalance; // £bn, at 31 March 2025
  let earningsIndex = 1; // = 1 in 2025
  let contributionIndex = 1; // earnings index with fiscal drag while thresholds frozen
  let cpiIndex = 1; // = 1 in 2025
  let fullRate: number = C.pension.fullRateWeekly2025;
  let otherBenefits = C.nif2024.otherBenefits; // earnings-indexed from 2024-25
  let gdp = C.economy.gdp2024;
  let exhaustionYear: number | null = null;
  let breachYear: number | null = null;

  for (let year = YEAR_FROM; year <= YEAR_TO; year++) {
    const yearIdx = year - popData.meta.yearFrom;
    const eg = earningsGrowth(year);
    if (year > YEAR_FROM) {
      earningsIndex *= 1 + eg / 100;
      const elasticity = year <= C.ni.thresholdsFrozenUntil ? C.ni.fiscalDragElasticity : 1;
      contributionIndex *= 1 + (eg * elasticity) / 100;
      if (year > 2026) cpiIndex *= 1 + cpiGrowth(year) / 100; // = 1 in 2026 (additional pension anchor year)
      // Full rate: 2026-27 is already set in law; the rule applies from the
      // April 2027 uprating. April-year-t upratings reference the previous
      // year's measures (AWE May-Jul, CPI September), hence the t-1 lag.
      if (year === 2026) {
        fullRate = C.pension.fullRateWeekly2026;
      } else {
        const lagEarnings = earningsGrowth(year - 1);
        const lagCpi = cpiGrowth(year - 1);
        const u = params.uprating;
        let upliftPct: number;
        if (u.kind === "tripleLock") {
          // Near term the explicit max() is computable from GAD's assumptions
          // (the 2.5% floor binds 2028-30). In the smooth long run the lock's
          // value comes from year-to-year volatility, proxied by the OBR's
          // average premium over earnings growth.
          upliftPct =
            year <= 2030
              ? Math.max(lagEarnings, lagCpi, 2.5)
              : Math.max(lagEarnings + params.tripleLockPremiumPP, lagCpi, 2.5);
        } else if (u.kind === "earnings") {
          upliftPct = lagEarnings;
        } else if (u.kind === "cpi") {
          upliftPct = lagCpi;
        } else {
          upliftPct = u.pct;
        }
        fullRate *= 1 + upliftPct / 100;
      }
    }
    otherBenefits *= 1 + earningsGrowth(year) / 100;
    gdp *= 1 + C.economy.nominalGdpGrowth / 100;

    const spa = spaAt(params.spaSchedule, year);
    const pensioners = popOver(pop, yearIdx, spa) * cal.caseloadRatio; // thousands
    const workers =
      popBetween(pop, yearIdx, 16, spa) * C.economy.employmentRate * (params.employmentRate / C.economy.employmentRate);

    // Additional (SERPS/S2P) pension: pre-2016 cases only, CPI-uprated,
    // caseload declining linearly to zero by the end year.
    const ap = C.additionalPension;
    const decay = Math.max(0, (ap.endYear - year) / (ap.endYear - 2026));
    const additionalPension = ap.amount2026 * cpiIndex * decay * (params.pensionLevelPct / 100);

    const flatRatePension =
      (pensioners * 1000 * fullRate * 52 * cal.paymentFactor * (params.pensionLevelPct / 100)) / 1e9;
    const statePension = flatRatePension + additionalPension;
    const spending = statePension + otherBenefits;

    const contributions =
      ((workers * 1000 * cal.contributionPerWorker * contributionIndex) / 1e9) * niRateMultiplier(params.niDeltaPP);
    const investmentIncome = Math.max(fundBalance, 0) * (params.fundReturnPct / 100);
    const receipts = contributions + investmentIncome;

    const surplus = receipts - spending;
    fundBalance += surplus;
    const fundShareOfSpend = fundBalance / spending;

    if (exhaustionYear === null && fundBalance < 0) exhaustionYear = year;
    if (breachYear === null && fundShareOfSpend < C.minBalanceShare) breachYear = year;

    rows.push({
      year,
      spa,
      pensioners: pensioners / 1000,
      workers: workers / 1000,
      contributions,
      investmentIncome,
      receipts,
      statePension,
      otherBenefits,
      spending,
      surplus,
      fundBalance,
      fundShareOfSpend,
      gdp,
      spendingPctGdp: (spending / gdp) * 100,
      receiptsPctGdp: (receipts / gdp) * 100,
      fullRateWeekly: fullRate * (params.pensionLevelPct / 100),
    });
  }

  const r2050 = rows.find((r) => r.year === 2050)!;
  return {
    rows,
    exhaustionYear,
    breachYear,
    balance2050: r2050.surplus,
    finalFundBalance: rows[rows.length - 1].fundBalance,
  };
}
