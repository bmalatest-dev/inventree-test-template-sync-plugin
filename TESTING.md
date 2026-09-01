# v0.2.0 Local Test Checklist

Use:

```text
Source Part: Test-part = 1
Target Part: Test-part-conformal = 5
```

## Test 1 - Dry run after SW was renamed to BU

```bash
curl -X POST http://localhost:8000/api/action/ \
  -H "Content-Type: application/json" \
  -u admin:admin \
  -d '{
    "action": "sync_test_templates",
    "data": {
      "source_part": 1,
      "target_part": 5,
      "dry_run": true,
      "disable_stale": true
    }
  }'
```

Expected:

- `VI` should be unchanged
- `BU` should already exist if v0.1.0 created it, otherwise `would_create`
- `SW` should appear under `target_only`
- if `SW` is still enabled, it should also appear under `would_disable`

## Test 2 - Actual sync

Run the same request with:

```json
"dry_run": false
```

Expected:

- `SW` becomes disabled
- `SW` is not deleted
- `VI` remains enabled
- `BU` remains enabled

## Test 3 - Historical preservation

If any Stock Item has an existing result against `SW`, verify after the sync:

- the result is still present
- the old SW template still exists
- SW is disabled for future testing

## Test 4 - Same-key update

Modify a field which does not change the source template key, for example:

- Description
- Required
- Requires Value
- Requires Attachment
- Choices

Dry run again.

Expected:

- template appears under `would_update`

Perform actual sync.

Expected:

- template appears under `updated`
- no template is deleted

## Test 5 - Disable stale behavior off

Run:

```json
{
  "disable_stale": false
}
```

Expected:

- target-only templates are reported
- none are disabled
