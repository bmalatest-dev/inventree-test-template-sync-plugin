# InvenTree Production Planning v0.2.4

Production Planning forecasts when active Build Orders can be completed from finished stock, WIP test stages, child Build Orders, material availability, PO dates, incoming inspection, assembly lead time and final test.

## V2.4 material-planning rules

Existing child Build Orders are treated as the authoritative production work already in progress. Material already allocated or consumed against those child BOs is committed coverage and is not reported again as a shortage. Only the remaining uncovered requirement is checked against unallocated usable stock and then against open purchase orders.

BOM entries whose IPN or name ends with ` Assembly` are costing-only entries. They remain in the InvenTree BOM so product cost remains complete, but Production Planning ignores them as physical material requirements because assembly time is forecast separately.

Displayed part references are navigable links to the corresponding InvenTree Part page.

## Default planning assumptions

- 8 working hours per business day
- 10 business days assembly after all required material is received and inspected
- `-BARE` incoming VI: 1 hour per stock item
- `-MECH` incoming VI: 0.2 hours per stock item when VI is required
- assembled-board VI: 1.5 hours per board
- Press Fit: 0.5 hours per board
- Bring-Up: 1 hour per board
- EEPROM programming/test: 0.25 hours per board
- Software Test: 2 hours per board
- Pass SW means the board is ready
- final assembly: 4 hours per finished top-level unit

These values are plugin settings and can be tuned later.


## V2.4 allocation behavior

When an existing child Build Order is available, Production Planning now uses InvenTree's native BuildLine allocation state. `BuildLine.unallocated_quantity()` is authoritative. A fully allocated or consumed BuildLine is excluded from blocker analysis; only its remaining unallocated quantity can be tested against free stock and PO coverage.

## V0.2.5 stock-status planning
Allocation and readiness are separate concepts. For an existing child BO, native BuildLine allocation state remains authoritative for committed quantity, but the allocated StockItem status determines whether that material is actually usable. Pending material schedules incoming inspection. Failed VI material cannot satisfy the build and is replaced using the earlier of credible open-PO coverage or the configured replacement fabrication lead time (default 28 calendar days). Replacement material must still pass incoming inspection before assembly begins.
