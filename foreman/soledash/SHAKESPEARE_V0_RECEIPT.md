# SHAKESPEARE_V0_RECEIPT

Status: COMPLETE

Built:
- Single local executable policy path.
- Hardcoded rules only.
- No AI.
- No LLM.
- No UI.

Path:
`Intent -> Classifier -> Policy -> Verdict`

Executable:
`scripts/foreman/shakespeare-v0.mjs`

Commands:
- `npm.cmd run shakespeare -- "<intent>"`
- `npm.cmd run shakespeare:raw -- "<intent>"`
- `npm.cmd run shakespeare:self-test`

Verdicts:
- `SWAT`
- `RECEIPT`
- `STOP`
- `HUMAN_GATE`

Rule classes:
- `LOCAL_MECHANICAL_SAFE` -> `green_local_silent_swat` -> `SWAT`
- `LOCAL_EXECUTE_WITH_RECEIPT` -> `blue_local_action_receipt_required` -> `RECEIPT`
- `STOP_DESTRUCTIVE_ADMIN` -> `deny_unknown_or_destructive_local_change` -> `STOP`
- `HUMAN_GATE_SECURITY` -> `operator_required_sensitive_access` -> `HUMAN_GATE`
- `HUMAN_GATE_MONEY_ACCOUNT` -> `operator_required_money_or_account` -> `HUMAN_GATE`
- `HUMAN_GATE_PUBLIC_PROD` -> `operator_required_public_or_production` -> `HUMAN_GATE`
- `UNKNOWN_INTENT` -> `deny_unclassified_default_stop` -> `STOP`

Verification:
- `npm.cmd run shakespeare:self-test` passed.
- `npm.cmd run shakespeare:raw -- "local read workstation note"` returned `SWAT`.
- `npm.cmd run shakespeare:raw -- "MWB local restart recovery"` returned `RECEIPT`.
- `npm.cmd run shakespeare:raw -- "production deploy"` returned `HUMAN_GATE`.
- `npm.cmd run shakespeare:raw -- "delete all files recursive"` returned `STOP`.
- `npm.cmd run typecheck` passed.

Blocker:
- None.
