# Werkles Matching Data Policy Decision V0

Status: `RECOMMENDATION - NOT APPROVED POLICY`
Applies to: `discovery_intakes`, `matching_shadow_runs`

## Recommended decisions

1. **Retention:** retain raw discovery intake payloads for 90 days; retain minimized matching-run metadata for 365 days. Do not automate deletion until the deletion job has its own reviewed gate and receipt.
2. **Export and deletion:** provide authenticated member export and deletion-request handling before public matching. Deletion must cover the intake and dependent shadow runs, while preserving a non-personal audit tombstone containing only request ID, completion time, and policy version.
3. **Write contract:** make `run_id` strictly append-only. A duplicate `run_id` must fail visibly; do not upsert or overwrite an existing run. Retries must reuse an idempotency key at intake custody and return the existing result or create a new explicitly linked attempt.
4. **Rollout order:** apply and validate in preview first. Production requires a separate decision after preview read/write, RLS, deletion, and rollback evidence exists.

## Why this is the safer default

- Intake text can contain identity, contact, employment, financial, and situational details.
- Ninety days supports debugging and early model-quality review without indefinite raw-text custody.
- Append-only runs preserve evidence and prevent a retry from silently rewriting the historical recommendation.
- Preview-first confines schema and configuration errors before production traffic is involved.

## Required schema/runbook patches before approval

- Replace `upsert` behavior for `matching_shadow_runs.run_id` with insert-and-reject semantics.
- Document the dependent deletion order or database cascade decision.
- Record `policy_version`, `retention_class`, and `delete_after` so custody is inspectable.
- Define who may read raw intake text; authenticated operator access alone is broader than necessary unless operator roles are explicitly constrained.
- Add a separate deletion automation gate; this document does not authorize a cron, function, or destructive SQL.

## Decision phrases

```text
APPROVE MATCHING DATA POLICY V0
```

```text
PATCH MATCHING DATA POLICY V0: <instructions>
```

```text
REJECT MATCHING DATA POLICY V0
```

Approval of this policy does not itself approve schema application, environment changes, preview deployment, or production deployment.
