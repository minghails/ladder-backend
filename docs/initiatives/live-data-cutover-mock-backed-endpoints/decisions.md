# Decisions — Live Data Cutover For Mock-Backed Endpoints

## Accepted decisions

1. Default FE-visible endpoint behavior must not return fake money-like user data.
2. Empty/unavailable is correct live behavior when no source-of-truth projection exists.
3. `includeMock=true` can remain explicit FE sandbox mode; env fallback must not silently populate money-like defaults.
4. `yield` and `utilization` charts return unavailable until dedicated projections/formulas exist.
5. Withdraw quote `mode='assets'` can use `derived`; `mode='shares'` uses `derived_identity` unless live preview is added.

## Proposed decisions

None.

## Rejected decisions

1. Do not derive utilization from `navSt/navJt` without canonical product formula.
2. Do not add DB migrations for claimables, rewards, cost-basis, or chart projections in this initiative.
3. Do not change contract ABIs.
