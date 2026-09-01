# Changelog

## 0.2.0 - 2026-09-01

- Preserve historical test templates by disabling stale templates instead of deleting them
- Add `disable_stale` option, defaulting to true
- Add `would_disable` and `disabled` result fields
- Leave already-disabled stale templates unchanged
- Preserve all historical test-result relationships
- Continue to create missing templates and update same-key templates
- Keep plugin lightweight: no database models, migrations, scheduler, background tasks, or frontend

## 0.1.0 - 2026-09-01

- Initial release
- Manual ActionMixin endpoint
- Effective inherited-template discovery
- Dry-run support
- Create / update / unchanged / target-only reporting
