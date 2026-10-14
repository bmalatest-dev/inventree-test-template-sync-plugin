# InvenTree Test Template Sync

Version **0.3.1**

A lightweight InvenTree plugin for synchronizing effective Part Test Templates from a source Part to an independent target Part.

## Purpose

This plugin is intended for cases where two Parts should share testing requirements without forcing them into the same InvenTree Template / Variant hierarchy.

Example:

```text
Generic Part for Test Templates
└── Test-part

Test-part-conformal
└── BOM
    ├── Test-part
    └── conformal coating service
```

The conformal-coated Part remains independent, preserving the correct manufacturing / BOM relationship, while its tests can be synchronized from `Test-part`.

## v0.3.0

v0.3.0 adds a **Part-page user interface**.

On a Part detail page, users can:

1. Search for a source Part
2. Select the source Part
3. Preview the synchronization
4. Review templates which will be created, updated, disabled, or left unchanged
5. Run the synchronization from the UI

No terminal access or API credentials are required for normal use.

## Historical test preservation

The synchronization engine keeps the v0.2.0 behavior:

- missing source tests are created on the target
- same-key tests are updated
- identical tests are left unchanged
- stale target tests are **disabled, not deleted**
- historical test results remain linked to old disabled templates

Example:

```text
Source changes:
SW -> BU

Target after synchronization:
VI    enabled
SW    disabled / historical
BU    enabled / current
```

## Lightweight design

The plugin still has:

- no custom database models
- no migrations
- no scheduler
- no background worker
- no polling
- no recurring tasks

The UI is a single static JavaScript file loaded only when InvenTree requests the plugin panel.

## Required InvenTree setting

InvenTree's global plugin UI setting must be enabled:

```text
ENABLE_PLUGINS_INTERFACE = enabled
```

If the backend plugin is active but the panel does not appear, check this setting first.

## UI workflow

Open the **target Part** (for example the conformal-coated board).

A panel named:

```text
Test Template Sync
```

should appear on the Part page.

Use the panel to search for and select the source Part, then click:

```text
Preview Sync
```

The panel shows:

- Create
- Update
- Disable (history preserved)
- Unchanged

After review, click:

```text
Synchronize Test Templates
```

The backend always performs the same permission checks as the API action.

## API remains available

The tested API action remains available:

```text
POST /api/action/
```

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

## Safety

The UI intentionally does not expose a "delete stale tests" option.

Stale templates are disabled so historical test records remain intact.


## v0.3.1 packaging correction

The UI JavaScript now ships inside the Python plugin package:

```text
inventree_test_template_sync/static/test_template_sync.js
```

This allows InvenTree's plugin static-file collector to copy it into the configured static root and serve it at:

```text
/static/plugins/test-template-sync/test_template_sync.js
```

The previous `data-files` rule which installed the file into `/usr/local/static/...` has been removed.
