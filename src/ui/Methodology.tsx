import type { Calibration } from "../model/engine";

export function Methodology({ cal }: { cal: Calibration }) {
  return (
    <details className="methodology">
      <summary>How this model works — sources, calibration and caveats</summary>

      <h3>The premise</h3>
      <p>
        The UK state pension is unfunded: today's National Insurance contributions pay today's pensions. But the
        accounting fiction of a scheme really exists — the{" "}
        <a href="https://www.gov.uk/government/publications/national-insurance-fund-accounts">
          National Insurance Fund
        </a>{" "}
        receives NI contributions (after a deduction for the NHS) and pays out the state pension and a few smaller
        contributory benefits. This model takes that construct at face value and asks: if this were a pension scheme,
        would it balance? No Treasury Grant, no top-ups — just money in versus money out, projected to 2075.
      </p>

      <h3>How it works</h3>
      <ul>
        <li>
          <strong>People.</strong> ONS 2024-based national population projections by single year of age (principal,
          high, low and zero migration variants), scaled to Great Britain ({(100 * 0.9719).toFixed(1)}% of the UK) —
          the Fund covers GB only.
        </li>
        <li>
          <strong>Money out.</strong> Pensioners = population above state pension age × {cal.caseloadRatio.toFixed(2)}{" "}
          (the calibrated ratio of actual caseload to over-SPA population — it exceeds 1 mainly because pensions are
          paid to ~1.1m people overseas). Each receives the full new State Pension rate ×{" "}
          {(cal.paymentFactor * 100).toFixed(0)}% (the calibrated average across partial records and legacy cases),
          uprated by the chosen rule. Additional (SERPS/S2P) pension — £19.5bn in 2026-27 — is modelled separately:
          CPI-uprated and declining to zero by 2065 as pre-2016 pensioners die. Other contributory benefits
          (contributory ESA, new-style JSA, bereavement, Maternity Allowance, ~£6bn) grow with earnings.
        </li>
        <li>
          <strong>Money in.</strong> Workers = population aged 16 to pension age × employment rate (75% baseline).
          Each contributes £{Math.round(cal.contributionPerWorker).toLocaleString()} (2025-26, calibrated to GAD's
          £160.8bn), growing with earnings — amplified ×1.3 while NI thresholds stay frozen (to 2030-31), reflecting
          fiscal drag, and 1:1 thereafter. The NI slider scales receipts linearly within each class's main rate
          (employee 8%, employer 15%, self-employed 6%), using the 2024-25 receipts mix (employee ~40%, employer ~55%,
          self-employed ~5%).
        </li>
        <li>
          <strong>The fund.</strong> Starts at the audited £79.3bn (31 March 2025), earns 4% nominal, and must by law
          stay above 16.7% of annual benefit spend — below that, a Treasury Grant from general taxation becomes
          payable.
        </li>
        <li>
          <strong>Triple lock.</strong> Uprating is the highest of earnings growth, CPI and 2.5% (near term, using
          GAD's assumptions — the 2.5% floor binds 2028-30). Long-run, smooth assumptions would understate the lock's
          ratchet, so it is modelled as earnings +0.53pp/yr — the OBR's central estimate of its historical premium.
        </li>
      </ul>

      <h3>Does it match official projections?</h3>
      <p>
        Under current policy the model tracks the Government Actuary's January 2026 projection year by year within
        ~2% on receipts and spending, and lands on a 2030-31 fund balance of £164bn against GAD's £163.7bn. In the
        long run it puts state pension spending at ~7.5% of GDP by the early 2070s under the OBR's pension-age
        assumptions, against the OBR's central 7.7%. The automated test suite enforces both anchors.
      </p>

      <h3>Sources</h3>
      <ul>
        <li>
          <a href="https://www.gov.uk/government/publications/national-insurance-fund-accounts">
            GB National Insurance Fund Account 2024-25
          </a>{" "}
          (receipts £130.9bn net of NHS allocation, benefit spend £143.2bn, balance £79.3bn)
        </li>
        <li>
          <a href="https://www.gov.uk/government/publications/report-to-parliament-on-the-2026-re-rating-and-up-rating-orders/report-by-the-government-actuary-on-the-draft-social-security-benefits-up-rating-order-2026-and-the-draft-social-security-contributions-regulation">
            Government Actuary's Uprating Report, January 2026
          </a>{" "}
          (fund projections 2025-26 to 2030-31)
        </li>
        <li>
          <a href="https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationprojections/bulletins/nationalpopulationprojections/2024based">
            ONS National Population Projections, 2024-based
          </a>{" "}
          (April 2026)
        </li>
        <li>
          <a href="https://obr.uk/frs/fiscal-risks-and-sustainability-july-2025/">
            OBR Fiscal Risks and Sustainability, July 2025
          </a>{" "}
          (long-run assumptions; triple lock premium; spending share of GDP)
        </li>
        <li>
          <a href="https://www.gov.uk/government/statistics/dwp-benefit-statistics-february-2026/dwp-benefit-statistics-february-2026">
            DWP benefit statistics
          </a>{" "}
          (caseload 13.2m, average payment £210.73/week, August 2025) and{" "}
          <a href="https://www.gov.uk/government/publications/benefit-and-pension-rates-2026-to-2027/proposed-benefit-and-pension-rates-2026-to-2027">
            benefit and pension rates 2026-27
          </a>
        </li>
        <li>
          <a href="https://www.gov.uk/government/publications/state-pension-age-timetable/state-pension-age-timetable">
            State pension age timetable
          </a>{" "}
          and{" "}
          <a href="https://www.gov.uk/government/publications/state-pension-age-review-2023-government-report/state-pension-age-review-2023">
            2023 SPA review
          </a>
        </li>
      </ul>

      <h3>What this model simplifies</h3>
      <ul>
        <li>
          Contributions are modelled per worker, not across the earnings distribution — a flat elasticity stands in
          for the interaction of wage growth with thresholds. The NI slider's yield is consistent with HMRC's ready
          reckoner to within ~20%.
        </li>
        <li>
          The pensioner caseload and average payment are calibrated ratios, held fixed apart from the modelled death
          of the pre-2016 (SERPS) system — the gradual rise of average entitlements as full new-SP records mature is
          not separately modelled.
        </li>
        <li>
          Demography aside, the economy is on rails: no recessions, no inflation shocks, earnings and GDP grow at OBR
          long-run rates. The triple lock premium exists precisely because reality is bumpier than this.
        </li>
        <li>
          Northern Ireland has its own (proportionally similar) fund; this model covers Great Britain, scaling UK
          population projections by a constant.
        </li>
      </ul>

      <p>
        This is an explainer, not an actuarial valuation. For the real thing, see GAD's quinquennial reviews.
      </p>
    </details>
  );
}
