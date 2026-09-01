# v0.3.0 UI Test Checklist

## Test setup

Current local example:

```text
Source Part:
Test-part = Part 1

Target Part:
Test-part-conformal = Part 5
```

## 1. Confirm plugin version

Admin Center -> Plugin Settings should show:

```text
Test Template Sync 0.3.0
```

## 2. Confirm UI plugins are enabled

Ensure the global InvenTree setting:

```text
ENABLE_PLUGINS_INTERFACE
```

is enabled.

## 3. Open the target Part

Open:

```text
http://localhost:8000/web/part/5/details
```

Expected:

A panel named:

```text
Test Template Sync
```

appears.

If it does not appear:

1. Refresh the browser
2. Confirm the plugin is active
3. Confirm `ENABLE_PLUGINS_INTERFACE` is enabled
4. If necessary run InvenTree's plugin static collection / restart process

## 4. Search source Part

In the plugin panel search:

```text
Test-part
```

Expected:

Part 1 appears in the Source Part dropdown.

The current target Part should not be offered as a source.

## 5. Preview

Select `Test-part` and click:

```text
Preview Sync
```

Expected:

The panel shows:

- Create
- Update
- Disable
- Unchanged

No database changes should occur yet.

## 6. Synchronize

Click:

```text
Synchronize Test Templates
```

Expected:

A confirmation dialog appears.

After confirmation:

- missing templates are created
- same-key changed templates are updated
- stale enabled templates are disabled
- stale disabled templates remain disabled
- no templates are deleted

## 7. Historical preservation regression

Create a test result against a target test template.

Rename the corresponding source test so its key changes.

Preview and synchronize.

Expected:

- new test is created
- old test is disabled
- old template is not deleted
- historical result remains visible

## 8. Permission test

Log in as a normal employee account without permission to add/change Part Test Templates.

Expected:

- preview may be available
- applying synchronization must fail with the backend permission error

Then grant the appropriate Part Test Template permissions and confirm synchronization succeeds.
