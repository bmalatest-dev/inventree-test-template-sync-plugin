# Changelog

## 0.1.0 - 2026-09-01

Initial test version.

- Adds one manual `ActionMixin` action: `sync_test_templates`
- Supports dry-run mode
- Copies effective source test templates, including inherited ancestor templates
- Creates missing target templates
- Updates changed target templates
- Leaves matching templates unchanged
- Reports target-only templates without deleting them
- Adds permission checks
- Uses a transaction for writes
- Adds no database models, migrations, scheduler, background process, or frontend
