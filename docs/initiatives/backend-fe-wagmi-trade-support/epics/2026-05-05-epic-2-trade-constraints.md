# Epic 2 — Complete Trade Constraints for FE Forms

## Goal

Expand `GET /markets/:address/trade-constraints` so FE can build forms and approvals without hardcoding protocol rules.

## Files expected

- Modify: `backend/src/modules/market-state/market-state.service.ts`
- Modify: `backend/src/modules/market-state/market-state.service.spec.ts`
- Modify: `backend/src/modules/market-state/dto/market-swagger.dto.ts`

## Slice 1 — Expanded constraints response

### Scope

Add `tokens`, `approvals`, `methods`, `capabilities`, `limits`, and `warnings` fields while preserving existing fields unless tests/docs are updated.

### Steps

1. Read only current market-state service/spec/DTO files.
2. Add failing tests asserting exact shape:
   - `tokens.yt/base/senior/junior.address`
   - `approvals.depositYt/depositBaseInstant/withdrawSenior/withdrawJunior`
   - `methods.depositYt = depositYT`
   - `methods.depositBaseInstant = depositInstant`
   - `methods.withdrawYt = withdraw`
   - `capabilities.withdrawBaseAsync = false`
   - `limits.seniorDepositCapacityYt`, `juniorWithdrawalCapacityYt`, `maxStJtRatio`, `currentStJtRatio`
   - stale price warning propagation
3. Implement from existing live/indexed market assumptions.
4. Update Swagger DTO.
5. Run `pnpm test src/modules/market-state/market-state.service.spec.ts` from `backend/`.
6. Update tracker/session log; classify API impact as `API contract change`.

## Epic done criteria

- FE has all approval/method metadata needed for forms.
- Canonical API docs update queued for Epic 4.
