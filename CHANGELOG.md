# Changelog

## 0.3.1 - 2026-09-01

- Fix plugin UI static-file packaging
- Move `test_template_sync.js` into `inventree_test_template_sync/static/`
- Package the UI asset as Python package data
- Remove the incorrect setuptools `data-files` install into `/usr/local/static`
- No synchronization logic changes from v0.3.0
- No UI behavior changes from the manually validated v0.3.0 JavaScript

## 0.3.0 - 2026-09-01

- Add `UserInterfaceMixin`
- Add a Part-page "Test Template Sync" panel
- Add source Part search and selection
- Add preview workflow before synchronization
- Show Create / Update / Disable / Unchanged results
- Add confirmation before applying synchronization
- Use the authenticated InvenTree frontend API session
- Keep v0.2.0 historical-safe behavior unchanged
- Keep plugin lightweight with no models, migrations, scheduler, or background worker

## 0.2.0 - 2026-09-01

- Preserve historical test templates by disabling stale templates instead of deleting them
- Add `disable_stale` option
- Add `would_disable` and `disabled` result fields
- Preserve historical test-result relationships

## 0.1.0 - 2026-09-01

- Initial ActionMixin synchronization backend
- Effective inherited-template discovery
- Dry-run support
