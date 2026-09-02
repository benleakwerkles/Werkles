# DRAFT FOR HEIMERDINKER — Tier B Owner Binding + Personal Delivery Gate

**Status:** `DRAFT — AWAITING HEIMERDINKER RATIFICATION` (not yet AWAITING HUMAN GATE)  
**Prepared by:** Lady Jessica (Maker) — 2026-07-17 late P,G  
**Mission lead must ratify before Ben sees this as a live Tier 1 gate**  
**Branch:** `maker/site-g-20260703`  
**Source packet:** `TO_HEIMERDINKER_OPERATOR_MATCHING_TEST_SUBJECT_VPG10_20260717.md` G idea 2

## Proposed decision (after Heimerdinker ratifies)

Authorize **build + Preview proof only** of authenticated owner-bound personal recommendations. Does **not** by itself authorize Production personal delivery or save reopen.

```text
APPROVE MATCHING OWNER-BINDING BUILD + PREVIEW PROOF
```

Separate later phrase (Production):

```text
APPROVE MATCHING PERSONAL DELIVERY ON WERKLES.COM
```

Save reopen (if ever):

```text
APPROVE MATCHING RECOMMENDATION SAVE FOR BOUND OWNERS
```

No shorter chat approval substitutes.

## Why this gate exists

Public `/bellows/recommendations` is intentionally example-only (VPG8). Tier A (`/operator/matching/document-score`) lets Ben paste ephemerally. **Complete member test subject** requires:

1. Auth session → stable `member_id`
2. Every intake / shadow run / ledger read scoped to that owner
3. Public page fail-closed if unbound (keep example)
4. Explicit decision on save (default: remain closed until save phrase)
5. Export + deletion-request posture called out (data policy V0 residual)

## Intended build scope (Lady Jessica after ratify + Ben build phrase)

- Wire authenticated owner into Matching readers (no global/latest)
- Public loader: bound member → personal session; unbound → example-only
- Operator document-score remains ephemeral / non-custody
- Focused proofs: unbound example; bound isolation; cross-member denial
- Preview deploy for Operator walkthrough

## Explicit non-goals in this gate

- Production alias / personal delivery on werkles.com
- LLM translate
- SQL/schema/RLS unless a nested gate is added by Heimerdinker
- Save/POST write path (stays 403 until save phrase)
- Absorbing unrelated dirty-tree files

## Data-policy residual (Heimerdinker must choose one)

| Option | Meaning |
|--------|---------|
| **A — Block Tier B Production until export+deletion UX exists** | Strict reading of data policy V0 “before public matching” |
| **B — Accept residual again for Preview-only owner binding** | Same residual posture as Autonomous Matching go-live; document in gate |

Default draft recommendation: **B for Preview proof**, **A for Production personal delivery phrase**.

## Invariants

- `MATCHING_AUTONOMOUS_PUBLIC` unchanged unless a separate phrase says otherwise
- `MATCHING_LLM_TRANSLATE_ENABLED` remains `false`
- Public unbound surface remains example-only
- No secrets in chat/repo
- This draft is **not** legal/compliance approval

## Heimerdinker ratification checklist

- [ ] Accept or rewrite approve phrases
- [ ] Choose residual Option A or B (or split as drafted)
- [ ] Promote this file to `GATE-matching-owner-binding-…` + HTML twin
- [ ] Set `AWAITING HUMAN GATE` only after promotion
- [ ] Tag Lady Jessica with a build packet when Ben approves build+Preview

## Blast radius (when built)

Auth-scoped Matching reads + public recommendations loader only. No matcher algorithm rewrite, no LLM, no Stripe, no Ghost Forge.

`DRAFT — NOT LIVE GATE`
