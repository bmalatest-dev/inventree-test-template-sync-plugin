# InvenTree Test Template Sync

Version **0.2.0**

A deliberately small InvenTree plugin for manually synchronizing effective Part Test Templates from one Part to another.

## Purpose

Use this when two Parts should share the same testing requirements but should **not** be connected through InvenTree's Template / Variant hierarchy.

Example:

```text
Generic Part for Test Templates
└── Test-part

Test-part-conformal
└── BOM
    ├── Test-part
    └── conformal coating service
```

`Test-part-conformal` remains an independent Part so that its BOM correctly models the physical conversion, while this plugin copies the effective tests from `Test-part`.

## Version 0.2.0 behavior

The plugin:

- reads effective source test templates, including inherited templates
- creates missing target templates
- updates existing same-key target templates
- leaves identical templates unchanged
- **never deletes test templates**
- disables stale target templates instead of deleting them
- preserves historical test-result relationships
- supports dry-run mode
- has no scheduler, background worker, custom database model, migration, or frontend bundle

## Important historical behavior

If a source test is renamed, its InvenTree key normally changes.

Example:

```text
Source:
SW -> BU
```

After synchronization:

```text
Target:
VI    enabled
SW    disabled
BU    enabled
```

The old `SW` test template is retained, so historical results linked to it remain available.

## Safety / ownership behavior

Version 0.2.0 intentionally uses a conservative rule:

- Any **target-only** test template is treated as stale and is eligible to be disabled.
- It is **never deleted**.
- If it is already disabled, it is left unchanged.

This is suitable when the target Part's test templates are intended to mirror the source Part.

If you expect legitimate target-specific test templates, do not use `disable_stale=true` until plugin-managed ownership tracking is added in a future version.

## API Action

Action:

```text
sync_test_templates
```

Endpoint:

```text
POST /api/action/
```

### Dry run

```json
{
  "action": "sync_test_templates",
  "data": {
    "source_part": 1,
    "target_part": 5,
    "dry_run": true,
    "disable_stale": true
  }
}
```

### Actual synchronization

```json
{
  "action": "sync_test_templates",
  "data": {
    "source_part": 1,
    "target_part": 5,
    "dry_run": false,
    "disable_stale": true
  }
}
```

## Result fields

The action reports:

- `would_create`
- `would_update`
- `would_disable`
- `created`
- `updated`
- `disabled`
- `unchanged`
- `target_only`

## Recommended workflow

1. Run with `dry_run=true`
2. Review `would_create`, `would_update`, and `would_disable`
3. If correct, rerun with `dry_run=false`
4. Verify the target Part in InvenTree

## Current scope

Version 0.2.0 intentionally has no Part-page button. It remains API-only until the synchronization behavior is fully validated.
