# Feral/TinkerDen Contract Surface

## Artifact Purpose

This directory contains the contract-only surface for BIRD #002. It defines the dry-run, shadow-merge, and immutable receipt lookup contracts assumed by the Feral/TinkerDen shell without building Feral UI, Nerdkle Body, or live TinkerDen behavior.

Safety invariants covered here:

- `dry_run` must not mutate live state.
- `shadow_merge` must require a prior dry-run receipt id.
- `GET /v1/receipt/{id}` must return immutable receipt data.
- Destructive actions must remain staged unless a receipt trail exists.
- No endpoint may silently promote staged work to live behavior.
- No endpoint may use live operator-path semantics.
- No autonomous action scoring is defined.
- No live execution is defined.

## File List

- `feral_tinkerden_contract.openapi.yaml` - OpenAPI 3.1 contract artifact. The file is JSON-compatible YAML so the validator can run with the Python standard library only.
- `validate_event_block_mapping.py` - Local validation script for endpoint presence, schema presence, UI event-block mapping, and safety invariant checks.
- `README.md` - This artifact note.

## How To Run Validation

From the repo root:

```powershell
python tinkarden\contracts\validate_event_block_mapping.py
```

Expected output:

```text
PASS: Feral/TinkerDen contract surface validation passed
```

## Known Limitations

- This is a contract surface only; it does not implement handlers, persistence, UI, routing trees, or live TinkerDen integration.
- Validation is structural and local. It proves the artifact shape and safety declarations, not runtime service behavior.
- Receipt immutability is expressed as an API/schema contract. A future implementation must preserve that behavior in storage.
- Shadow merge is constrained to staged/shadow semantics here. A future live path would require a separate human-approved contract and receipt trail.

## Next Valid Owner

Thufir@Doss for validation only.
