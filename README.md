# The State Pension as a Pension Scheme

Interactive explorer treating the UK state pension as if it were a funded pension scheme, on the real
National Insurance Fund (GB) basis: NI contributions (net of the NHS allocation) pay in, the state
pension and other contributory benefits pay out. Projected 2025–2075 on ONS cohort population data.

**Does it balance?** Under current policy (triple lock, legislated pension ages): the fund peaks in the
mid-2030s, falls below its statutory minimum in 2046 and runs dry in 2049. Levers to play with: NI rates,
pension level, pension age, uprating rule, migration.

## Structure

- `src/model/` — pure TypeScript cohort model. Calibrated to the audited NI Fund Account 2024-25 and the
  GAD Uprating Report (January 2026); tested against both plus the OBR's long-run spend-share projection
  (`src/model/__tests__/anchors.test.ts`).
- `src/data/constants.ts` — every anchor and rate, with a source per line.
- `src/data/population.json` — ONS 2024-based national population projections (single year of age,
  principal + migration variants), GB-scaled. Rebuild with `npm run data:fetch && npm run data:build`
  (requires Python 3 + openpyxl).
- `src/ui/` — React + hand-rolled SVG charts (d3-scale/d3-shape only).

## Commands

```bash
npm install
npm run dev      # local dev server
npm test         # model anchor tests
npm run build    # static build to dist/
```

## Sources

GB National Insurance Fund Account 2024-25 · GAD Uprating Report Jan 2026 · ONS National Population
Projections 2024-based · OBR Fiscal Risks & Sustainability July 2025 · DWP benefit statistics · full
links in the in-app methodology section.

Not an actuarial valuation — an explainer.
