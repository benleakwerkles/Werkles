#!/usr/bin/env python3
"""Validate the Feral/TinkerDen contract surface without touching live systems."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
CONTRACT_PATH = ROOT / "feral_tinkerden_contract.openapi.yaml"

REQUIRED_ENDPOINTS = [
    ("post", "/v1/action/dry_run"),
    ("post", "/v1/action/shadow_merge"),
    ("get", "/v1/receipt/{id}"),
]

REQUIRED_SCHEMAS = [
    "Intent",
    "Action",
    "Branch",
    "Receipt",
    "FrictionState",
    "DryRunResult",
    "ShadowMergeRequest",
    "ShadowMergeResult",
    "ErrorResult",
]

REQUIRED_EVENT_BLOCK_FIELDS = [
    "event_block_id",
    "event_block_kind",
    "event_block_label",
    "event_block_payload",
    "requested_action",
    "action_target",
    "destructive",
    "target_branch",
    "dry_run_receipt_id",
]

EXPECTED_INVARIANTS = {
    "dry_run_mutates_live_state": False,
    "shadow_merge_requires_prior_dry_run_receipt": True,
    "receipt_get_returns_immutable_data": True,
    "destructive_actions_remain_staged_unless_receipt_trail_exists": True,
    "silent_live_promotion_allowed": False,
    "operator_path_live_semantics_allowed": False,
    "autonomous_action_scoring_allowed": False,
    "live_execution_allowed": False,
}


class ContractValidationError(AssertionError):
    """Raised when the local contract artifact fails a required check."""


def load_contract(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise ContractValidationError(f"missing contract file: {path}")
    try:
        loaded = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ContractValidationError(
            f"{path.name} must remain JSON-compatible YAML for stdlib validation: {exc}"
        ) from exc
    if not isinstance(loaded, dict):
        raise ContractValidationError("contract root must be an object")
    return loaded


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ContractValidationError(message)


def schemas(contract: dict[str, Any]) -> dict[str, Any]:
    components = contract.get("components")
    require(isinstance(components, dict), "components object missing")
    found = components.get("schemas")
    require(isinstance(found, dict), "components.schemas object missing")
    return found


def schema_properties(contract: dict[str, Any], schema_name: str) -> dict[str, Any]:
    schema = schemas(contract).get(schema_name)
    require(isinstance(schema, dict), f"schema missing: {schema_name}")
    properties = schema.get("properties")
    require(isinstance(properties, dict), f"schema has no properties: {schema_name}")
    return properties


def operation(contract: dict[str, Any], method: str, path: str) -> dict[str, Any]:
    paths = contract.get("paths")
    require(isinstance(paths, dict), "paths object missing")
    path_item = paths.get(path)
    require(isinstance(path_item, dict), f"endpoint path missing: {path}")
    op = path_item.get(method)
    require(isinstance(op, dict), f"endpoint method missing: {method.upper()} {path}")
    return op


def ref_name(value: dict[str, Any]) -> str | None:
    ref = value.get("$ref")
    if not isinstance(ref, str):
        return None
    prefix = "#/components/schemas/"
    if not ref.startswith(prefix):
        return None
    return ref.removeprefix(prefix)


def collect_schema_property_names(schema: dict[str, Any]) -> set[str]:
    names: set[str] = set()
    properties = schema.get("properties")
    if isinstance(properties, dict):
        names.update(properties.keys())
    for keyword in ("allOf", "anyOf", "oneOf"):
        entries = schema.get(keyword)
        if isinstance(entries, list):
            for entry in entries:
                if isinstance(entry, dict):
                    names.update(collect_schema_property_names(entry))
    return names


def validate_required_endpoints(contract: dict[str, Any]) -> None:
    for method, path in REQUIRED_ENDPOINTS:
        operation(contract, method, path)


def validate_required_schemas(contract: dict[str, Any]) -> None:
    found = schemas(contract)
    for schema_name in REQUIRED_SCHEMAS:
        require(schema_name in found, f"required schema missing: {schema_name}")


def validate_event_block_mapping(contract: dict[str, Any]) -> None:
    mapping = contract.get("x-ui-event-block-field-mapping")
    require(isinstance(mapping, dict), "x-ui-event-block-field-mapping missing")

    for ui_field in REQUIRED_EVENT_BLOCK_FIELDS:
        entry = mapping.get(ui_field)
        require(isinstance(entry, dict), f"UI event-block field mapping missing: {ui_field}")
        api_schema = entry.get("api_schema")
        api_field = entry.get("api_field")
        require(isinstance(api_schema, str), f"mapping {ui_field} missing api_schema")
        require(isinstance(api_field, str), f"mapping {ui_field} missing api_field")
        properties = schema_properties(contract, api_schema)
        require(
            api_field in properties,
            f"mapping {ui_field} points to absent API field: {api_schema}.{api_field}",
        )


def validate_dry_run_mutation_fails(contract: dict[str, Any]) -> None:
    op = operation(contract, "post", "/v1/action/dry_run")
    require(op.get("x-live-mutation") is False, "dry_run operation may mutate live state")
    require(op.get("x-live-execution") is False, "dry_run operation may execute live")

    dry_run = schemas(contract)["DryRunResult"]
    properties = schema_properties(contract, "DryRunResult")
    require(
        properties.get("would_mutate_live_state", {}).get("const") is False,
        "DryRunResult does not force would_mutate_live_state=false",
    )
    require(
        properties.get("live_execution", {}).get("const") is False,
        "DryRunResult does not force live_execution=false",
    )
    require(
        "would_mutate_live_state" in dry_run.get("required", []),
        "DryRunResult does not require would_mutate_live_state",
    )


def validate_shadow_merge_without_receipt_fails(contract: dict[str, Any]) -> None:
    op = operation(contract, "post", "/v1/action/shadow_merge")
    require(
        op.get("x-requires-prior-dry-run-receipt") is True,
        "shadow_merge does not require prior dry-run receipt by operation contract",
    )

    request = schemas(contract)["ShadowMergeRequest"]
    required = request.get("required")
    require(isinstance(required, list), "ShadowMergeRequest.required missing")
    require(
        "dry_run_receipt_id" in required,
        "shadow_merge without receipt_id would pass: dry_run_receipt_id not required",
    )
    properties = schema_properties(contract, "ShadowMergeRequest")
    receipt_id = properties.get("dry_run_receipt_id")
    require(isinstance(receipt_id, dict), "dry_run_receipt_id property missing")
    require(receipt_id.get("minLength") == 1, "dry_run_receipt_id can be empty")
    require(
        properties.get("apply_live", {}).get("const") is False,
        "ShadowMergeRequest permits live apply",
    )


def validate_missing_receipt_lookup_fails(contract: dict[str, Any]) -> None:
    op = operation(contract, "get", "/v1/receipt/{id}")
    parameters = op.get("parameters")
    require(isinstance(parameters, list), "receipt lookup path parameter missing")
    id_params = [
        param for param in parameters
        if isinstance(param, dict) and param.get("name") == "id" and param.get("in") == "path"
    ]
    require(id_params, "receipt lookup id path parameter missing")
    require(id_params[0].get("required") is True, "receipt lookup id is not required")

    responses = op.get("responses")
    require(isinstance(responses, dict), "receipt lookup responses missing")
    not_found = responses.get("404")
    require(isinstance(not_found, dict), "missing receipt lookup does not define 404")
    schema = (
        not_found.get("content", {})
        .get("application/json", {})
        .get("schema", {})
    )
    require(ref_name(schema) == "ErrorResult", "missing receipt lookup 404 is not ErrorResult")


def validate_receipt_mutation_fails(contract: dict[str, Any]) -> None:
    paths = contract.get("paths", {})
    receipt_path = paths.get("/v1/receipt/{id}", {})
    require(set(receipt_path.keys()) == {"get"}, "receipt path exposes mutation methods")

    receipt = schemas(contract)["Receipt"]
    require(receipt.get("readOnly") is True, "Receipt schema is not readOnly")
    require(receipt.get("additionalProperties") is False, "Receipt permits extra mutable fields")
    properties = schema_properties(contract, "Receipt")
    require(properties.get("immutable", {}).get("const") is True, "Receipt.immutable is not const true")
    require(properties.get("live_mutation", {}).get("const") is False, "Receipt permits live mutation")


def validate_safety_invariants(contract: dict[str, Any]) -> None:
    invariants = contract.get("x-safety-invariants")
    require(isinstance(invariants, dict), "x-safety-invariants missing")
    for key, expected in EXPECTED_INVARIANTS.items():
        require(invariants.get(key) is expected, f"safety invariant mismatch: {key}")

    for method, path in REQUIRED_ENDPOINTS:
        op = operation(contract, method, path)
        require(op.get("x-live-mutation") is False, f"{method.upper()} {path} permits live mutation")
        require(op.get("x-live-execution") is False, f"{method.upper()} {path} permits live execution")
        require(
            op.get("x-autonomous-action-scoring") is False,
            f"{method.upper()} {path} permits autonomous action scoring",
        )

    forbidden_property_names = {
        "score",
        "action_score",
        "autonomous_score",
        "force_live",
        "operator_path_live",
    }
    for schema_name, schema in schemas(contract).items():
        property_names = collect_schema_property_names(schema)
        found = forbidden_property_names.intersection(property_names)
        require(not found, f"{schema_name} exposes forbidden live/scoring fields: {sorted(found)}")


def main() -> int:
    try:
        contract = load_contract(CONTRACT_PATH)
        validate_required_endpoints(contract)
        validate_required_schemas(contract)
        validate_event_block_mapping(contract)
        validate_dry_run_mutation_fails(contract)
        validate_shadow_merge_without_receipt_fails(contract)
        validate_missing_receipt_lookup_fails(contract)
        validate_receipt_mutation_fails(contract)
        validate_safety_invariants(contract)
    except ContractValidationError as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1

    print("PASS: Feral/TinkerDen contract surface validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
