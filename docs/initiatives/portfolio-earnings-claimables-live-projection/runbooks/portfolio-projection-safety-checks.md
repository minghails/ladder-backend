# Runbook — Portfolio Projection Safety Checks

## Use when

Before marking event projection slices done, or when projected earnings look wrong.

## Checks

1. Confirm cashflow insert is idempotent by tx/log unique key.
2. Confirm duplicate cashflow does not reapply cost basis.
3. Confirm `DepositYT` owner is not guessed when receiver override may exist.
4. Confirm async settlement uses `DepositSettled.receiver`.
5. Confirm withdrawal uses `WithdrawYT.user`.
6. Confirm incomplete history sets `dataQuality = partial`.
7. Confirm docs/API impact report says whether FE sees contract shape change or only data-source/behavior change.

## Stop conditions

- Tranche owner correlation ambiguous.
- Index coverage start block cannot support `full` quality.
- Claimables include anything other than rejected/unrefunded async deposit refunds.
- `earning30d` is computed without approved snapshot/time-weighted model.
