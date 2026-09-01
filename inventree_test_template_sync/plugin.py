"""Lightweight manual synchronization of InvenTree Part test templates."""

from __future__ import annotations

from typing import Any

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction

from part.models import Part, PartTestTemplate
from plugin import InvenTreePlugin
from plugin.mixins import ActionMixin


class TestTemplateSyncPlugin(ActionMixin, InvenTreePlugin):
    """Synchronize effective test templates from a source Part to a target Part."""

    NAME = "Test Template Sync"
    SLUG = "test-template-sync"
    TITLE = "Test Template Sync"
    DESCRIPTION = (
        "Manually synchronize effective test templates between independent "
        "InvenTree Parts while preserving historical templates."
    )
    VERSION = "0.2.0"
    AUTHOR = "Per Vices Corporation"
    LICENSE = "MIT"

    ACTION_NAME = "sync_test_templates"

    COPY_FIELDS = (
        "test_name",
        "description",
        "enabled",
        "required",
        "requires_value",
        "requires_attachment",
        "choices",
    )

    def perform_action(self, user=None, data=None):
        data = data or {}
        self._last_result = self._sync(user=user, data=data)

    def get_info(self, user=None, data=None):
        return {
            "action": self.ACTION_NAME,
            "description": self.DESCRIPTION,
            "version": self.VERSION,
            "required_data": {
                "source_part": "Numeric primary key of the source Part",
                "target_part": "Numeric primary key of the target Part",
                "dry_run": "Boolean; defaults to true",
                "disable_stale": (
                    "Boolean; defaults to true. Disable target-only templates "
                    "instead of deleting them."
                ),
            },
        }

    def get_result(self, user=None, data=None):
        return getattr(
            self,
            "_last_result",
            {
                "status": "no_result",
                "message": "No synchronization result is available.",
            },
        )

    def _sync(self, user, data: dict[str, Any]) -> dict[str, Any]:
        source_pk = self._parse_part_pk(data.get("source_part"), "source_part")
        target_pk = self._parse_part_pk(data.get("target_part"), "target_part")
        dry_run = self._parse_bool(data.get("dry_run", True), "dry_run")
        disable_stale = self._parse_bool(
            data.get("disable_stale", True), "disable_stale"
        )

        if source_pk == target_pk:
            raise ValidationError(
                {"target_part": "Source Part and target Part must be different."}
            )

        source = self._get_part(source_pk, "source_part")
        target = self._get_part(target_pk, "target_part")

        if not target.testable:
            raise ValidationError(
                {
                    "target_part": (
                        f"Target Part {target.pk} ({target.name}) is not marked as testable."
                    )
                }
            )

        if not dry_run:
            self._check_permissions(user)

        source_templates = self._effective_templates(source)
        target_templates = {
            template.key: template
            for template in PartTestTemplate.objects.filter(part=target)
        }

        result: dict[str, Any] = {
            "source_part": self._part_summary(source),
            "target_part": self._part_summary(target),
            "dry_run": dry_run,
            "disable_stale": disable_stale,
            "effective_source_templates": len(source_templates),
            "created": [],
            "updated": [],
            "disabled": [],
            "unchanged": [],
            "would_create": [],
            "would_update": [],
            "would_disable": [],
            "target_only": [],
        }

        source_keys = set(source_templates)
        target_keys = set(target_templates)

        stale_keys = sorted(target_keys - source_keys)

        for key in stale_keys:
            stale_template = target_templates[key]
            result["target_only"].append(self._template_summary(stale_template))

            if disable_stale and stale_template.enabled:
                if dry_run:
                    result["would_disable"].append(
                        self._template_summary(stale_template)
                    )

        if dry_run:
            for key, source_template in source_templates.items():
                target_template = target_templates.get(key)

                if target_template is None:
                    result["would_create"].append(
                        self._template_summary(source_template)
                    )
                else:
                    changes = self._differences(source_template, target_template)
                    if changes:
                        result["would_update"].append(
                            {
                                "key": key,
                                "test_name": source_template.test_name,
                                "changes": changes,
                            }
                        )
                    else:
                        result["unchanged"].append(
                            self._template_summary(target_template)
                        )

            return result

        with transaction.atomic():
            for key, source_template in source_templates.items():
                target_template = target_templates.get(key)

                if target_template is None:
                    created = PartTestTemplate(
                        part=target,
                        **self._copy_values(source_template),
                    )
                    created.full_clean()
                    created.save()

                    result["created"].append(self._template_summary(created))
                    continue

                changes = self._differences(source_template, target_template)

                if not changes:
                    result["unchanged"].append(
                        self._template_summary(target_template)
                    )
                    continue

                for field, value in self._copy_values(source_template).items():
                    setattr(target_template, field, value)

                target_template.full_clean()
                target_template.save()

                result["updated"].append(
                    {
                        **self._template_summary(target_template),
                        "changes": changes,
                    }
                )

            if disable_stale:
                for key in stale_keys:
                    stale_template = target_templates[key]

                    if not stale_template.enabled:
                        result["unchanged"].append(
                            self._template_summary(stale_template)
                        )
                        continue

                    stale_template.enabled = False
                    stale_template.full_clean()
                    stale_template.save(update_fields=["enabled"])

                    result["disabled"].append(
                        self._template_summary(stale_template)
                    )

        return result

    @staticmethod
    def _get_part(pk: int, field_name: str) -> Part:
        try:
            return Part.objects.get(pk=pk)
        except Part.DoesNotExist as exc:
            raise ValidationError(
                {field_name: f"Part {pk} does not exist."}
            ) from exc

    @staticmethod
    def _parse_part_pk(value: Any, field_name: str) -> int:
        if value is None or value == "":
            raise ValidationError({field_name: "This field is required."})

        try:
            pk = int(value)
        except (TypeError, ValueError) as exc:
            raise ValidationError(
                {field_name: "Must be a numeric Part primary key."}
            ) from exc

        if pk <= 0:
            raise ValidationError(
                {field_name: "Must be a positive Part primary key."}
            )

        return pk

    @staticmethod
    def _parse_bool(value: Any, field_name: str) -> bool:
        if isinstance(value, bool):
            return value

        if value is None:
            return True

        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on"}:
                return True
            if normalized in {"0", "false", "no", "off"}:
                return False

        if isinstance(value, int):
            return bool(value)

        raise ValidationError({field_name: "Must be a boolean value."})

    @staticmethod
    def _check_permissions(user) -> None:
        if user is None or not getattr(user, "is_authenticated", False):
            raise PermissionDenied("Authentication is required.")

        required_permissions = (
            "part.add_parttesttemplate",
            "part.change_parttesttemplate",
        )

        missing = [perm for perm in required_permissions if not user.has_perm(perm)]

        if missing:
            raise PermissionDenied(
                "Missing required permission(s): " + ", ".join(missing)
            )

    @classmethod
    def _effective_templates(cls, source: Part) -> dict[str, PartTestTemplate]:
        parts = list(source.get_ancestors(include_self=True))

        templates = (
            PartTestTemplate.objects.filter(part__in=parts)
            .select_related("part")
            .order_by("part_id", "pk")
        )

        effective: dict[str, PartTestTemplate] = {}

        templates_by_part: dict[int, list[PartTestTemplate]] = {}
        for template in templates:
            templates_by_part.setdefault(template.part_id, []).append(template)

        for part in parts:
            for template in templates_by_part.get(part.pk, []):
                effective[template.key] = template

        return effective

    @classmethod
    def _copy_values(cls, template: PartTestTemplate) -> dict[str, Any]:
        return {field: getattr(template, field) for field in cls.COPY_FIELDS}

    @classmethod
    def _differences(
        cls,
        source: PartTestTemplate,
        target: PartTestTemplate,
    ) -> dict[str, dict[str, Any]]:
        changes: dict[str, dict[str, Any]] = {}

        for field in cls.COPY_FIELDS:
            source_value = getattr(source, field)
            target_value = getattr(target, field)

            if source_value != target_value:
                changes[field] = {
                    "from": target_value,
                    "to": source_value,
                }

        return changes

    @staticmethod
    def _part_summary(part: Part) -> dict[str, Any]:
        return {
            "pk": part.pk,
            "name": part.name,
            "ipn": getattr(part, "IPN", None),
        }

    @staticmethod
    def _template_summary(template: PartTestTemplate) -> dict[str, Any]:
        return {
            "pk": template.pk,
            "key": template.key,
            "test_name": template.test_name,
            "enabled": template.enabled,
            "part_pk": template.part_id,
            "part_name": template.part.name,
        }
