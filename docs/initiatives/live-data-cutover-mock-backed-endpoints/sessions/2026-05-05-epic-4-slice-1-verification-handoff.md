# Session — Epic 4 Slice 1 Verification Handoff

Date: 2026-05-05

## Scope

Epic 4 Slice 1 — Full verification, docs sync, and FE API impact summary.

## Changes

- Verified targeted and full backend test suites.
- Verified lint and build/typecheck.
- Checked canonical API docs include portfolio, chart, and withdraw quote behavior changes.
- Checked architecture docs; no update needed.
- Updated tracker/kickoff for initiative completion.

## TDD record

No production behavior change in this slice; verification/docs handoff only.

## API impact for FE

API impact for FE: API data-source/behavior change.

- `/portfolio/:address/earnings`: default live mode now returns empty/unavailable instead of mock earnings/history.
- `/portfolio/:address/claimables`: default live mode now returns empty list instead of mock claim rows.
- `/portfolio/:address`: money-like aggregates now use source `unavailable` unless `includeMock=true`; no default mock claimable preview.
- `/markets/:address/charts?metric=yield|utilization`: now empty/unavailable instead of mock series.
- `/quotes/withdraw-yt`: output source no longer `placeholder`; uses derived labels.
- FE action needed: review empty states and source-label copy.

## Architecture docs sync

- Updated: none.
- Checked; no update needed: implementation changed existing endpoint data-source labels/behavior only; no backend module boundaries, dependency graph, runtime flow, infrastructure, data ownership, schema, or event assumptions changed.
- Architecture docs checked; no update needed.

## Verification

- `pnpm test src/modules/portfolio/portfolio.service.spec.ts src/modules/market-state/market-state.service.spec.ts src/modules/quotes/quotes.service.spec.ts` — PASS, 3 files / 46 tests passed.
- `pnpm test` — PASS, 23 files / 121 tests passed.
- `pnpm lint` — PASS.
- `pnpm build` — PASS, TSC found 0 issues and SWC compiled 97 files.

## Remaining risks

- Empty/unavailable data is intentionally not full live projection; future work still needed for cost-basis/yield, claim/refund ledger, utilization projection, and tranche `previewRedeem` simulation.
- Full test run printed existing DepositRequestProjector warning fixture logs; tests passed.
- Vitest printed existing Vite/Oxc config warnings; tests passed.

## Next step

Review diff and prepare PR/merge when ready.
