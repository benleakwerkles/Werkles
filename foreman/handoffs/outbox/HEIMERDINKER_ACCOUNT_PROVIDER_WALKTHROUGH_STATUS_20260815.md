# Heimerdinker — Account + Provider Walkthrough Status

Date: 2026-08-15
Machine: Betsy
Execution context: CODEX_LOCAL
Owner: Heimerdinker
Push custody: Lady Jessica only after Ben + Heimerdinker + Lady Jessica signoff

## Immediate Intake Verdict

Do not represent the current Concierge Intake as saved to a Werkles account.

- Local sign-in is a shared dev-preview identity, not a distinct `gimptest` Supabase account.
- Raw Intake answers are written to Betsy's local repo-backed files.
- Matching shadows may persist to `discovery_intakes` and `matching_shadow_runs`, but the applied tables have no member owner column and are operator custody only.
- Real bearer authentication derives `member_<user id>` during POST, while Recommendations, Workshop, Intros, and Crucible read a separate Bellows owner cookie. Cross-page account continuity is therefore not established.
- Production Recommendations is not a verified account-personal readout.

## Current Betsy Walkthrough Matrix

| Capability | Current localhost verdict | Useful page | What it proves |
| --- | --- | --- | --- |
| Concierge Intake | LOCAL WALKTHROUGH ONLY | `/bellows/intake` | Local answer capture and shadow matching; not account persistence |
| Ghost recommendations | READY LOCALLY | `/bellows/recommendations` | Ranked synthetic option readout after the same browser submits Intake |
| Workshop | PARTIAL | `/dashboard/blueprints` | Intake readback and working hypotheses; documents/whiteboard/collaboration are scaffold |
| Ghost Intros | READOUT ONLY | `/dashboard/intros` | Up to three synthetic doors; no contact, send, or introduction |
| Crucible / ghost proof gaps | READ-ONLY LOCALLY | `/dashboard/crucible` | Proof boundaries and synthetic gaps; provider actions disabled in Ghost walkthrough |
| Supabase Auth + Profile | NOT REAL ON CURRENT LOCALHOST | `/login`, `/dashboard/profile` | Mock preview sign-in/form rendering; current browser lacks connected Supabase account persistence |
| Stripe Checkout | MOCK ONLY LOCALLY | `/membership` | Preview success path; no charge, customer, subscription, or webhook |
| Stripe Identity | CONDITIONAL TEST SCAFFOLD | `/dashboard/crucible` | Test redirect/webhook path exists; requires real auth, active membership, test keys, Identity enablement; no durable receipt ledger |
| Plaid | SANDBOX LINK SCAFFOLD | `/dashboard/crucible` | Custom Link lifecycle only when configured; exchange/custody disabled, nothing saved, no funds proof |
| Twilio Verify | NOT BUILT | `/dashboard/crucible` | Copy/card only; no SDK, route, callback, consent, or persistence |
| Checkr | NOT BUILT / COMPLIANCE BLOCKED | `/dashboard/crucible` | Policy/card only; no candidate/report adapter, webhook, or result storage |
| Supabase Storage | ABSENT | none | No buckets, routes, or Storage calls |

## Recommended Member Walkthrough

1. `/bellows/intake`
2. `/dashboard/blueprints`
3. `/bellows/recommendations`
4. `/dashboard/intros`
5. `/dashboard/crucible`
6. `/dashboard/profile`
7. `/membership`

Current mismatch: Intake redirects directly to Recommendations and skips Workshop.

## Real Account Custody Gate

Before Ben retests honest account persistence:

1. Add owner-bound member Intake persistence with `user_id` and reviewed RLS.
2. Use server-readable, verified Supabase auth for all four readback surfaces.
3. Stop treating the unsigned Bellows owner cookie as member authorization.
4. Persist Intake before matching and keep retry/idempotency behavior explicit.
5. Prove same account/new browser continuity, cross-user denial, forged-cookie denial, and cold-start durability.

No SQL, provider call, secret, charge, SMS, report, push, or deployment was performed.
