# Production Planning v0.2.3 Test Plan

## Primary acceptance test — BO-0179 / TR8D

1. Open BO-0179 Production Plan.
2. Confirm TR8D is clickable and opens the TR8D Part page.
3. Confirm the TR8D child-build analysis credits material already allocated / consumed against BO-0128.
4. Confirm allocated components such as resistors, ICs, connectors, etc. are not rediscovered as shortages merely because little or no globally free stock remains.
5. Confirm `TR8D Assembly` is not displayed as a blocker and is not used for PO coverage.
6. If TR8D-BARE is the only remaining uncovered requirement, confirm TR8D-BARE is the only material blocker shown.
7. Confirm TR8D-BARE is clickable and opens its Part page.
8. Confirm any dated PO coverage, incoming VI, material-ready date, 10-business-day assembly and remaining board-test forecast are still shown correctly.

## Assembly costing-line test

Confirm each of the following patterns is excluded when present as a BOM item:
- TR8D Assembly
- TR8DP Assembly
- TR8R Assembly
- FR2TS Assembly

The rule is suffix-based (` Assembly`), not based on IPN length.

## Allocation test

For an existing child BO, allocate enough stock to fully cover a BOM component. Confirm that component is not a blocker even when there is no additional unallocated stock. Partially allocate another component and confirm only its uncovered remainder is evaluated against unallocated stock / PO coverage.

## Regression

Confirm optional quantities, Pass SW readiness, WIP stage forecasts, PO effective-date fallback, inspection durations, final assembly and unresolved critical-requirement behavior remain unchanged from V2.2.


## V2.4 allocation regression

1. Open BO-0179 Production Plan and inspect TR8D / child BO-0128.
2. Confirm components whose BO-0128 BuildLines are fully allocated do not appear as blockers.
3. Confirm a partially allocated BuildLine is evaluated only for `unallocated_quantity()`, not its full BOM quantity.
4. Confirm `TR8D Assembly` (and any IPN/name ending in ` Assembly`) remains excluded.
5. Confirm genuine uncovered material still shows free-stock and PO coverage.
6. Confirm part and Build Order links remain clickable.

## V0.2.5 status-aware tests
1. Set allocated `TR8D-BARE` StockItems to OK: they should be treated as assembly-ready material.
2. Set them to Pending: the plan should show TR8D-BARE as the current constraint and add configured `-BARE` incoming VI time before assembly.
3. Set them to Failed VI: the plan should not call them inspected or ready. It should show Failed VI and compare open PO coverage with the configured replacement-fabrication date.
4. With a future PO that covers the required replacement quantity sooner than 28 days, the PO should win.
5. Without a credible future PO, new fabrication should win at today + 28 calendar days, followed by incoming VI.
6. A past-due PO target may remain visible in details but must not beat the new-fabrication forecast.
7. Quarantined / damaged / otherwise unavailable allocated material must remain unresolved.
8. Confirm TR8D-BARE is recognized as `-BARE` from Part Name even though its IPN is blank.
9. Confirm a parent needing 3 boards forecasts only enough replacement / inspection capacity for 3, even if the child BO is for 13.
