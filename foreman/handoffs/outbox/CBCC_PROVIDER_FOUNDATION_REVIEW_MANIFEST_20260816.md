# CBCC provider-foundation review manifest

Date: 2026-08-16
Branch: `maker/site-g-20260703`
Baseline commit: `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`
Working state: local dirty tree; review only; nothing staged

## Review lineage

Vision packet: `HEIMERDINKER_V_ACTUAL_CBCC_PROVIDER_REVIEW_FIRST_20260816.md`

Prior local receipt is evidence of tests, not a CBCC seal:
`foreman/receipts/WERKLES_VPGM_PROVIDER_BEGIN_REVOKE_FACTORY_SLOTS_20260816.md`

## Exact source hashes

```text
487105f94ae7aa1163ddd24c540af8b32866cb5c2417b28a95ff49b3dd803263  lib/verification/provider-adapter-port.ts
8537bff051766ba9016d9e8c0700e0fdb11b119b8963032d629db84cea8fa03d  lib/verification/provider-adapter-conformance.ts
3b4496c5811158b92922c4201bf286bf1f5b9c90ec53dfcfcbac19c076755f36  lib/verification/provider-composition-root.ts
955278d86e0fe981e995dbd1952911125895b83c1f4fa1645601dc018e997744  lib/verification/provider-composition-root-internal.ts
d98c169417a124cd9d17c01ab6b17e4429f15571efd68a023784d0ad7b0b8d10  lib/verification/provider-composition-root.testing.ts
afa6172eb9364e140ad34907ee7f2ac827783a8f4c5a96789b810d212dfecc42  lib/verification/provider-adapter-factory-slots.ts
5d9cd3676a179f010ba8e27869b6009a8600bbc347c02ad29db97da289c76acd  lib/integrations/operator-tech-stack-diagnostics.ts
e39bfc0b5e450615ddefb6ee8fd8159e5546770acc02a70749fb6014e755414c  lib/crucible-provider-readiness.ts
41043a40442044fdd6b488519b167ca8fa0b580221a962bc4669513397ee4954  scripts/foreman/provider-composition-root-smoke.ts
7c749249a8c1f4758c41f1b63fd9ff1ca4b547c4907a729dd0a5eae17bcbcb5a  scripts/foreman/provider-adapter-factory-slots-smoke.ts
```

If any reviewed source hash differs, return `STALE_DO_NOT_APPLY` rather than reviewing a moving target.

## Current outward contract, in plain language

- Production verification runtime is unconfigured and accepts no adapter injection.
- Test composition supports begin, consume, and revoke only through trusted server resolvers.
- Begin requires an authenticated actor, owner-bound operation, action-specific authorization, provider/trust/capability agreement, verified delivery target where applicable, internal return origin, an acquired action lease, and durable outcome finalization.
- Consume maps provider progress to an internal operation ID. A provider event becomes a claim only after exact provider/kind/status conformance and authoritative evidence resolution.
- Revoke reports only a provider-operation acknowledgement. It explicitly does not claim evidence deletion, claim revocation, provider-data deletion, redaction, or legal/compliance completion.
- An adapter side effect whose outcome cannot be durably finalized returns `action_outcome_unrecorded`; it must not invite a blind retry.

## Response acceptance

A review counts only when a `FROM_<COUSIN>_*.md` response lands in `foreman/handoffs/inbox`, names this manifest and its source packet, carries the manifest/source hash, and gives a verdict with concrete findings. Outgoing packets and local Codex tests do not count as cousin review.

## Hard stops

No provider calls, secrets, credentials, SQL, RLS, schema apply, push, deploy, or member-facing activation. Production stays OFF.
