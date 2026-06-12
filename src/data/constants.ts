/**
 * Calibration anchors and policy parameters for the NI Fund model.
 * Every figure is sourced; year labels are UK fiscal years (2024 = 2024-25).
 * All money in £bn nominal unless stated.
 */

export const CONSTANTS = {
  /** Base year of the model: fiscal year 2024-25 (the latest audited NI Fund account). */
  baseYear: 2024,

  // ---------------------------------------------------------------------------
  // GB National Insurance Fund account, 2024-25 actuals (audited).
  // Source: Great Britain National Insurance Fund Account 2024-25,
  // https://www.gov.uk/government/publications/national-insurance-fund-accounts
  // ---------------------------------------------------------------------------
  nif2024: {
    /** NI contributions received by the Fund, net of the NHS allocation (£130.9bn). */
    receiptsNetOfNhs: 130.9,
    /** NHS allocation deducted before receipts reach the Fund (£34.8bn). */
    nhsAllocation: 34.8,
    /** Compensation from the Consolidated Fund for statutory payments recovery. */
    compensation: 3.4,
    /** Investment income earned on the Fund balance. */
    investmentIncome: 3.4,
    /** State Pension expenditure (£136.9bn). */
    statePension: 136.924,
    /** Other contributory benefits: contributory ESA £5.16bn, JSA £0.22bn,
     * bereavement £0.36bn, Maternity Allowance £0.40bn, other £0.13bn. */
    otherBenefits: 6.273,
    /** Fund balance at 31 March 2025. */
    closingBalance: 79.349,
  },

  /** Statutory minimum working balance: 16.7% of annual benefit expenditure.
   * Below this, a Treasury Grant becomes payable (s.2 Social Security Act 1993). */
  minBalanceShare: 0.167,

  // ---------------------------------------------------------------------------
  // GAD Uprating Report, January 2026 — official 5-year projection of the Fund.
  // Used as the model's accuracy anchor, not as an input.
  // https://www.gov.uk/government/publications/report-to-parliament-on-the-2026-re-rating-and-up-rating-orders
  // ---------------------------------------------------------------------------
  gadProjection: {
    /** Fiscal years 2025-26 .. 2030-31. */
    years: [2025, 2026, 2027, 2028, 2029, 2030],
    /** Total receipts: contributions + investment income + compensation (£bn). */
    receipts: [164.2, 173.6, 179.8, 186.1, 195.0, 202.1],
    /** NI contribution income alone, where stated (2025-26, 2026-27). */
    contributions: [160.8, 170.2],
    /** Total benefit expenditure (£bn). */
    spend: [151.9, 159.4, 165.9, 170.6, 178.1, 186.1],
    /** Year-end fund balance (£bn). */
    balance: [89.6, 101.6, 115.5, 130.9, 147.8, 163.7],
    /** GAD's assumed April upratings: 2026 4.8%, 2027 3.4% (earnings),
     * 2028-30 the 2.5% floor binds. */
  },

  // ---------------------------------------------------------------------------
  // State pension parameters.
  // Rates: https://www.gov.uk/government/publications/benefit-and-pension-rates-2026-to-2027
  // Caseload/averages: DWP benefit statistics, February 2026 release (Aug 2025 data).
  // ---------------------------------------------------------------------------
  pension: {
    /** Full new State Pension, £/week, 2025-26 (base-year-adjacent rate used for display). */
    fullRateWeekly2025: 230.25,
    /** Full new State Pension, £/week, 2026-27. */
    fullRateWeekly2026: 241.3,
    /** Mean payment actually made across all 13.2m pensioners (Aug 2025): £210.73/wk,
     * i.e. ~91.5% of the full new SP rate — legacy basic-SP cases, partial records,
     * protected payments and deductions all net out here. */
    averagePaymentShareOfFull: 0.915,
    /** Long-run drift of that share towards ~0.97 as new-SP cohorts with full
     * records replace pre-2016 cases (transition complete ~2065). Per year. */
    averagePaymentShareDrift: 0.0014,
    averagePaymentShareMax: 0.97,
    /** UK state pension caseload, Aug 2025 (13.2m), of which GB ≈ 97%. */
    caseloadUk2025m: 13.2,
  },

  // ---------------------------------------------------------------------------
  // NI receipts composition (2024-25, HMRC Annual Report and NIF account):
  // employee Class 1 ≈ 40%, employer Class 1 ≈ 55%, self-employed Class 2/4 ≈ 5%.
  // Main rates 2025-26: employee 8% (PT→UEL) + 2% above; employer 15% above £5,000;
  // Class 4 6% + 2%. https://www.gov.uk/government/publications/rates-and-allowances-national-insurance-contributions
  // ---------------------------------------------------------------------------
  ni: {
    employeeShare: 0.4,
    employerShare: 0.55,
    selfEmployedShare: 0.05,
    employeeMainRate: 8,
    employerRate: 15,
    class4MainRate: 6,
    /** Fraction of class receipts attributable to the main (not additional) rate band.
     * Employee: UEL caps the 8% band; additional 2% above. Approx from HMRC ready
     * reckoner (+1pp employee main ≈ £5bn vs £52bn at 8% → ~0.77 of employee receipts
     * in the main band). Employer has no upper limit → 1.0. */
    employeeMainBandShare: 0.85,
    class4MainBandShare: 0.8,
    /** Receipts growth per 1% earnings growth while thresholds are frozen
     * (PT/UEL frozen to 2030-31): fiscal drag. Calibrated so contributions
     * track the GAD UR 2026 path (£160.8bn → £202.1bn). 1.0 thereafter
     * (long-run thresholds assumed earnings-indexed). */
    fiscalDragElasticity: 1.3,
    thresholdsFrozenUntil: 2030,
  },

  // ---------------------------------------------------------------------------
  // Additional State Pension (SERPS/S2P): paid only to pre-2016 pensioners,
  // CPI-uprated (not triple-locked), caseload dying off — modelled as a
  // separate block decaying linearly to zero by 2065 (last pre-2016
  // pensioners). GAD UR 2026: £19.5bn in 2026-27.
  // ---------------------------------------------------------------------------
  additionalPension: {
    amount2026: 19.5,
    endYear: 2065,
  },

  // ---------------------------------------------------------------------------
  // Economic assumptions.
  // Near-term: GAD Uprating Report Jan 2026. Long-run: OBR Fiscal Risks and
  // Sustainability July 2025 (CPI 2%, real earnings ~1.5-2%, triple lock premium
  // +0.53pp/yr over earnings). https://obr.uk/frs/fiscal-risks-and-sustainability-july-2025/
  // ---------------------------------------------------------------------------
  economy: {
    /** Nominal average earnings growth by fiscal year; long-run default after the list. */
    earningsNearTerm: { 2025: 4.4, 2026: 3.2, 2027: 2.1, 2028: 2.1, 2029: 2.2, 2030: 2.3 } as Record<
      number,
      number
    >,
    earningsLongRun: 3.8,
    cpiNearTerm: { 2025: 1.7, 2026: 3.8, 2027: 2.3, 2028: 2.0, 2029: 2.1, 2030: 2.0 } as Record<number, number>,
    cpiLongRun: 2.0,
    /** OBR central estimate of the triple lock's average premium over earnings growth. */
    tripleLockPremium: 0.53,
    /** Nominal GDP, 2024-25 ≈ £2,900bn (ONS). Grows at real GDP ~1.6% + deflator ~2.1%. */
    gdp2024: 2900,
    nominalGdpGrowth: 3.7,
    /** Nominal return earned on the Fund balance — GAD: "close to Bank Rate".
     * 2025-26 investment income £3.4bn on a ~£85bn average balance ≈ 4%. */
    fundReturn: 4.0,
    /** Employment rate among the 16-to-SPA population (ONS LFS 16-64 rate ≈ 75%). */
    employmentRate: 0.75,
  },

  // ---------------------------------------------------------------------------
  // OBR reference points for the long-run sanity check (FRS July 2025).
  // ---------------------------------------------------------------------------
  obr: {
    /** State pension spend as % of GDP: ~5.0% in 2024-25 → 7.7% by early 2070s
     * (central, includes SPA 68 late-2030s and 69 early-2070s). */
    spendPctGdp2024: 5.0,
    spendPctGdp2070s: 7.7,
  },
} as const;

// -----------------------------------------------------------------------------
// State pension age schedules. Piecewise: SPA applying from each calendar year.
// Source: https://www.gov.uk/government/publications/state-pension-age-timetable
// -----------------------------------------------------------------------------
export interface SpaStep {
  fromYear: number;
  age: number;
}

/** Currently legislated: 66→67 April 2026–March 2028; 67→68 in 2044-46. */
export const SPA_LEGISLATED: SpaStep[] = [
  { fromYear: 2025, age: 66 },
  { fromYear: 2026, age: 66.5 },
  { fromYear: 2027, age: 67 },
  { fromYear: 2044, age: 67.5 },
  { fromYear: 2045, age: 68 },
];

/** Cridland review (2017) recommendation: 68 by 2037-39. */
export const SPA_CRIDLAND: SpaStep[] = [
  { fromYear: 2025, age: 66 },
  { fromYear: 2026, age: 66.5 },
  { fromYear: 2027, age: 67 },
  { fromYear: 2037, age: 67.5 },
  { fromYear: 2038, age: 68 },
];

/** OBR long-term assumption: 68 late 2030s, 69 early 2070s. */
export const SPA_OBR: SpaStep[] = [
  { fromYear: 2025, age: 66 },
  { fromYear: 2026, age: 66.5 },
  { fromYear: 2027, age: 67 },
  { fromYear: 2038, age: 67.5 },
  { fromYear: 2039, age: 68 },
  { fromYear: 2070, age: 68.5 },
  { fromYear: 2071, age: 69 },
];
