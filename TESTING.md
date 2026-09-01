# Local Test Checklist

## Prerequisites

- Plugin support enabled
- Plugin installed and enabled
- A source Part which is testable
- An independent target Part which is testable
- User has permission to add and change Part Test Templates

## Suggested first test

Use a disposable target Part before testing against production-like data.

### Dry run

POST to:

```text
/api/action/
```

Payload:

```json
{
  "action": "sync_test_templates",
  "data": {
    "source_part": 1,
    "target_part": 2,
    "dry_run": true
  }
}
```

Expected:

- no database changes
- `would_create` contains templates missing on the target
- `would_update` contains templates which differ
- `unchanged` contains matching templates
- `target_only` contains templates only present on the target

### Actual sync

Run the same request with:

```json
"dry_run": false
```

Expected:

- missing templates are created
- changed templates are updated
- matching templates remain untouched
- target-only templates remain untouched

## Important inherited-template test

This is important for the conformal-coating use case.

Create:

```text
Generic Template
└── Standard PCBA
```

Put one or more test templates on `Generic Template`, not directly on `Standard PCBA`.

Use `Standard PCBA` as `source_part`.

The dry run should still show those inherited templates as templates to copy to the independent target Part.

## Regression checks

- Source = target should fail
- Missing source Part should fail
- Missing target Part should fail
- Non-testable target should fail
- Invalid `dry_run` value should fail
- Read-only user should be able to dry-run but should not be able to perform a write sync
