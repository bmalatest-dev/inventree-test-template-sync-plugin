# Changelog

## 0.2.5
- Make existing child-BO allocated material stock-status aware.
- `OK` / usable allocated stock remains assembly-ready.
- `Pending` allocated stock is treated as physically received but awaiting incoming inspection; `-BARE` inspection uses the configured VI minutes per item.
- `Failed VI` allocated stock is unusable and triggers replacement planning.
- Replacement planning compares credible dated open-PO coverage with a configurable new-fabrication lead time (default 28 calendar days) and uses the earlier path.
- Replacement material still receives required incoming VI before becoming assembly-ready.
- Unavailable / quarantined / damaged allocated material remains unresolved rather than being treated as ready.
- `-BARE` / `-MECH` inspection classification now checks Part Name as well as IPN, supporting parts such as TR8D-BARE with a blank IPN.
- Forecast only the quantity needed by the parent requirement when a larger child BO exists.
- Update Planning Assumptions heading to the actual plugin version.
- No database migration.
