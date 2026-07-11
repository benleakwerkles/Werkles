# Werkles Matching Durable Storage Options V0

Status: `DECISION_REQUIRED`  
Scope: discovery intake records and matching shadow runs  
Branch evidence: `maker/site-g-20260703` at `1499d4b`

## Verified current architecture

- Local discovery records are file-backed under `data/discovery`.
- Local matching runs are append-only JSONL under `data/matching/shadow-runs.jsonl`.
- Commit `22e455c` routes Vercel/Lambda file writes through the OS temporary directory instead of read-only `/var/task`.
- Commit `1499d4b` tunes ranking and adds semantic smoke assertions.
- The repo has a server-side Supabase service client in `lib/supabase/server.ts`.
- Existing migrations define profiles, membership, verification, intros, and Goop tables.
- No migration defines a discovery-intake or matching-shadow-run table.

## Option A — Temporary shadow deploy

Use the current Vercel `/tmp/werkles-data` behavior for a bounded shadow-only production test.

| Property | Assessment |
|---|---|
| Write crash | Prevented |
| Durable across cold starts | No |
| Visible across instances | No guarantee |
| Schema/RLS needed | No |
| Deploy complexity | Low |
| Data-loss risk | High by design |
| Honest UI state | Must say ephemeral / instance-local |

Failure behavior: POST may return a valid run ID, then the operator page may show no run if it lands on a different instance or after a restart. That is `PARTIAL_EPHEMERAL`, not durable success.

Use only if the goal is to prove production code execution and route presence—not custody, persistence, or operator review continuity.

## Option B — Supabase before deploy

Create durable shared tables for discovery intake records and matching shadow runs, then use the existing service-role client server-side.

Minimum shape:

- `discovery_intakes`: stable intake ID, received timestamp, normalized payload, state, source metadata.
- `matching_shadow_runs`: run ID, intake ID, created timestamp, source, mode, Layer 0 JSON, not-match JSON, Speaker/card JSON, ranked paths JSON, engine version.
- indexes on `created_at`, `intake_id`, and `run_id`.
- explicit RLS: service-role writes; operator-only reads; no public anonymous enumeration.

| Property | Assessment |
|---|---|
| Durable across cold starts | Yes |
| Visible across instances | Yes |
| Schema/RLS needed | Yes — Tier 1 gate |
| Migration complexity | Medium |
| Blast radius | API writes, operator reads, retention/security posture |
| Live-smoke value | Proves actual shared custody |

Failure behavior should be fail-closed for shadow custody: if the durable write fails, return a truthful `shadow_persistence_error` or partial status. Do not return a durable-looking run ID while silently dropping the record.

## Option C — Hybrid adapter

Introduce one storage interface with:

- local file adapter for development and offline QA;
- Supabase adapter for production;
- explicit storage mode in every response and receipt;
- no silent production fallback from Supabase to `/tmp`.

This is the recommended architecture because it preserves fast local evidence while making production custody shared and testable. A temporary `/tmp` adapter can remain available only behind an explicit diagnostic mode.

## Recommendation

Choose **Option C with Supabase as the required production adapter**.

If speed requires Option A first, authorize it only as a bounded shadow diagnostic with these stop rules:

1. public matching remains OFF;
2. no claim of durable receipt custody;
3. live smoke records POST and operator visibility separately;
4. any missing cross-instance readback is expected `PARTIAL_EPHEMERAL`, not algorithm failure;
5. durable schema returns as the next Tier 1 gate.

## Human gates

- Any new Supabase migration, RLS policy, production SQL apply, push, or deploy requires explicit Ben approval and approval-log entry.
- No secrets need to enter chat or repo artifacts.

