# Tier 1 Gate — Autonomous Matching VPG8 Production Deploy

**Status:** `AWAITING HUMAN GATE`
**Prepared:** `2026-07-16`
**Branch:** `maker/site-g-20260703`
**Vercel project / alias:** `werkles/werkles1` / `werkles.com`
**Exact target commit:** `6cf99ed7a8b63f4e759da4557ffefa24d5a3216d`
**Product commit inside target:** `58b8938877ae216fd308173a92e0a5da66971d0c`
**Confidence:** `HIGH` for bounded containment deploy; owner-scoped personal recommendations remain unopened.

## Decision

Deploy the already-pushed VPG8 recommendation-surface containment/readability slice to Production?

```text
APPROVE AUTONOMOUS MATCHING VPG8 CONTAINMENT DEPLOY TO WERKLES.COM
```

No equivalent shorthand or earlier approval authorizes this production mutation.

## Current mismatch

| Surface | State |
|---|---|
| Branch / remote | `6cf99ed` — contains VPG8 |
| Latest Preview | `dpl_GDz3JHVc1uT43E3mK9Hf5WggNwtU` — source `6cf99ed7a8b63f4e759da4557ffefa24d5a3216d` — `READY`; VPG8 rendered markers pass |
| Production | `dpl_9u8Gn4F7r8qS38ZGkpn3uevNFqRi` — `READY`; earlier `92a3081` public go-live surface |

Production public mode is ON. Its earlier helper reads the latest/global recommendation session and ledger without authenticated member ownership. VPG8 makes the public page example-only and empty-ledger until owner binding exists.

## Exact action after approval

1. Build/deploy exact commit `6cf99ed7a8b63f4e759da4557ffefa24d5a3216d` from a clean detached worktree using Production environment settings.
2. Do not promote the existing Preview artifact; create a Production-target build so Preview environment values are not carried into Production.
3. Wait for Vercel `READY` before touching the production alias.
4. Run the ordered live smoke below.
5. Hold. Do not enable LLM translation or open personal recommendations/saving.

## Intended changes

- `/bellows/recommendations` becomes an explicit Autonomous Matching example.
- Public recommendation loader no longer calls global/latest member intake, run, packet, or ledger readers.
- Public ledger is empty.
- Three save/action controls are disabled; no client save request exists.
- Direct save POST returns `403` as defense in depth.
- Recommendation score is labeled `Rules score`, not probability/confidence.
- Existing layout remains; contrast/readability is corrected.

## Invariants

- `MATCHING_AUTONOMOUS_PUBLIC`: remains `true`.
- `MATCHING_LLM_TRANSLATE_ENABLED`: remains `false`.
- `MATCHING_STORAGE_MODE`: unchanged.
- No SQL or schema change.
- No secret creation, printing, or rotation.
- No data migration, deletion, export, or owner-binding claim.
- Production operator routes remain denied.
- This gate is not legal or compliance approval. Authenticated ownership/isolation, export, correction, deletion, and retention automation remain open.

## Ordered live smoke

1. GET `https://werkles.com/bellows/recommendations` → `200`.
2. Require the example-only label and exact account-boundary sentence, Rules score and exact non-probability / eligibility / outcome limit, the exact save-closed explanation, and all three recommendation actions disabled.
3. Require old Confidence, latest-intake, and packet-id markers absent; require both empty-ledger messages present.
4. Only after exact target identity and the new-build markers pass, capture a body-free page hash, POST an inert empty body to `/api/bellows/recommendations/packet` → `403`, and require the page hash to remain unchanged. The source-bound focused test must already prove the target handler has no write path.
5. GET `/operator/matching/shadow` → `404`.
6. Reconfirm public `true`, LLM `false`, and storage unchanged.

## Blast radius

Member-facing recommendation presentation and its save endpoint only. No matcher algorithm, ranking data, intake write, Supabase schema, member auth, payment, or LLM path changes.

## Rollback

Current Ready Production deployment:

- id: `dpl_9u8Gn4F7r8qS38ZGkpn3uevNFqRi`
- URL: `https://werkles1-3z6a4fvfa-werkles.vercel.app`
- alias: `https://werkles.com`

Rollback if build readiness, marker checks, `403`, route denial, or flag invariants fail. This is an availability rollback only: it restores the pre-VPG8 global/latest read boundary and is not privacy-safe.

## Responses

Approve:

```text
APPROVE AUTONOMOUS MATCHING VPG8 CONTAINMENT DEPLOY TO WERKLES.COM
```

Patch:

```text
PATCH AUTONOMOUS MATCHING VPG8 CONTAINMENT DEPLOY TO WERKLES.COM: <instructions>
```

Reject:

```text
REJECT AUTONOMOUS MATCHING VPG8 CONTAINMENT DEPLOY TO WERKLES.COM
```
