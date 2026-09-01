# InvenTree Test Template Sync

A deliberately small InvenTree plugin for manually synchronizing test templates from one Part to another.

## Why this exists

Sometimes two Parts need the same test definitions but should **not** be linked through InvenTree's Template / Variant hierarchy.

A common example is a manufacturing conversion:

- Standard PCBA = source Part
- Conformal-coated PCBA = independent target Part
- Target BOM consumes the standard PCBA plus the conformal-coating service

The target should remain an independent Part so that the BOM reflects the physical conversion. This plugin lets the target copy the source Part's effective test templates as a separate, manual step.

## Design goals

Version 0.1.0 is intentionally minimal:

- No AppMixin
- No custom database tables
- No migrations
- No scheduler or background jobs
- No polling
- No frontend bundle
- No automatic deletion
- No automatic synchronization
- One ActionMixin endpoint only

The plugin does nothing unless a user explicitly calls the sync action.

## What gets synchronized

The plugin synchronizes the **effective** test templates of the source Part.

That means it includes:

1. Test templates defined directly on the source Part
2. Test templates inherited from its Template / Variant ancestors

The following fields are copied:

- Test Name
- Description
- Enabled
- Required
- Requires Value
- Requires Attachment
- Choices

Existing target templates are matched using the InvenTree test template `key`.

## Safety behavior

By default, use `dry_run: true` first.

Version 0.1.0:

- creates missing templates
- updates differing templates
- leaves matching templates unchanged
- reports target-only templates
- does **not** delete target-only templates
- refuses to sync a Part to itself
- requires the target Part to be testable
- checks add/change permissions before modifying data
- uses a database transaction for the write operation

## Installation from GitHub

After pushing this repository to GitHub, install it from your InvenTree plugin interface using a VCS package path, for example:

```text
git+https://github.com/YOUR-USER/YOUR-REPO.git
```

Alternatively, for local development:

```bash
pip install -e .
```

Restart InvenTree after installation if your environment does not automatically reload plugins.

## Enable the plugin

In InvenTree:

1. Go to **Admin / Plugin Settings**
2. Locate **Test Template Sync**
3. Enable it

The action name is:

```text
sync_test_templates
```

## API usage

The plugin uses InvenTree's standard ActionMixin endpoint:

```text
POST /api/action/
```

### 1. Dry run first

Replace `SOURCE_ID` and `TARGET_ID` with the numeric InvenTree Part primary keys.

```json
{
  "action": "sync_test_templates",
  "data": {
    "source_part": SOURCE_ID,
    "target_part": TARGET_ID,
    "dry_run": true
  }
}
```

### 2. Perform the sync

```json
{
  "action": "sync_test_templates",
  "data": {
    "source_part": SOURCE_ID,
    "target_part": TARGET_ID,
    "dry_run": false
  }
}
```

## Example for a conformal-coated board

Assume:

- TR8R = Part ID 12000
- TR8RC = Part ID 12603

Dry run:

```json
{
  "action": "sync_test_templates",
  "data": {
    "source_part": 12000,
    "target_part": 12603,
    "dry_run": true
  }
}
```

Then run the actual sync:

```json
{
  "action": "sync_test_templates",
  "data": {
    "source_part": 12000,
    "target_part": 12603,
    "dry_run": false
  }
}
```

## Expected result

The action result contains:

```json
{
  "source_part": {
    "pk": 12000,
    "name": "TR8R"
  },
  "target_part": {
    "pk": 12603,
    "name": "TR8RC"
  },
  "dry_run": true,
  "effective_source_templates": 5,
  "created": [],
  "updated": [],
  "unchanged": [],
  "would_create": [],
  "would_update": [],
  "target_only": []
}
```

The exact Part names and template counts will depend on your instance.

## Important limitation in v0.1.0

This version intentionally has **no button in the Part UI**. It is an API action only.

That keeps the plugin extremely small while we validate the synchronization logic on a local InvenTree instance. Once the backend behavior is confirmed, a very small UI action can be added in a later version without changing the sync engine.

## Recommended test sequence

1. Create or select a disposable independent target Part.
2. Ensure the target is marked **Testable**.
3. Add a known set of test templates to the source Part / source ancestors.
4. Run a dry run.
5. Confirm the reported `would_create` list.
6. Run the actual sync.
7. Verify the templates appear under the target Part.
8. Modify one source template.
9. Dry run again.
10. Confirm it appears under `would_update`.
11. Run the actual sync and verify the target changed.
12. Add a target-only test template.
13. Dry run again and verify it is listed under `target_only` and is not deleted.

## Versioning

Current version: **0.1.0**
