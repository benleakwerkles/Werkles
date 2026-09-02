# V — Member Intake append-only custody

Date: 2026-08-20  
Execution: CODEX_LOCAL on Betsy  
Human gate: Supabase migration apply remains closed

## Problem worth solving

The prepared authenticated Intake table uses an upsert keyed by member and
client submission ID. That makes a retry convenient, but it also lets a reused
submission ID replace the historical answers. The table additionally stores a
packet and answered count that are deterministic copies of the answers.

## Candidate build

1. Make authenticated Intake submissions append-only: INSERT only, no UPDATE
   grant or policy.
2. Treat an exact repeated submission as an idempotent retry by returning the
   original row; treat the same ID with different answers as a conflict.
3. Store only member binding, submission identity, Intake identity, answers,
   and timestamps. Rebuild packets and answer counts at read time.
4. Preserve member-owned DELETE and the existing SQL/RLS human gate.

## Acceptance

- no service-role key or privileged client;
- no mutation of a previously accepted submission;
- same ID + same answers is idempotent;
- same ID + different answers fails closed;
- no duplicated packet or answered-count custody;
- anon has no table access and authenticated RLS remains owner exact;
- no live schema, environment, account data, or provider mutation.

