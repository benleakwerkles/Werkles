# Flock Packet — Matching Tier A Personal Delivery + Owner Binding

Status: `READY_AFTER_HUMAN_GATE`

Addressed build seats: Lady Jessica / Cursor@Betsy and Ender@Betsy

Hands, verification, commit, push, and Preview owner: Heimerdinker / Dink@Betsy

Operator / test subject: Ben

Repository: `benleakwerkles/Werkles`

Working branch: `codex/matching-tier-a-owner-binding-gate-20260717`

Starting source: `cb115fb8f16bc278097cd3958a90135e479f2034`

Gate: `foreman/reviews/GATE-matching-tier-a-personal-delivery-20260717-2038.md`

## Claim condition

Do not edit product code until Ben says exactly:

```text
APPROVE MATCHING TIER A PERSONAL DELIVERY PREVIEW
```

After approval, Lady Jessica + Ender may claim only this packet. Heimerdinker retains branch review, verification, commit/push, localhost, and Vercel Preview hands.

## Mission

Make Ben the first truthful personal Matching test subject without opening durable personal custody.

An anonymous visitor must keep seeing the current example. A signed-in member with a saved profile may request a deterministic recommendation that is authenticated, bound to that member's own profile, generated in memory, delivered only to that browser, and never persisted.

## Strongest bounded design

1. Reuse the existing browser Supabase session and bearer-token API pattern. Do not introduce a new SSR auth/cookie subsystem tonight.
2. Add a private recommendation endpoint that calls the existing `requireUser(request)` authentication helper.
3. Accept no `userId`, `ownerId`, profile ID, email, or intake ID from the caller. The authenticated user ID is the only owner key.
4. Query the existing `profiles` table through the authenticated/user-scoped Supabase client, fixed to `profiles.id = user.id`. Do not use the service role for the personal read.
5. Convert only the authenticated member's profile fields into a new in-memory Matching signal adapter. Reuse the existing deterministic scoring/readout/session conversion. Do not call global/latest intake, run, packet, or ledger readers.
6. Return the personal result with `Cache-Control: private, no-store`. Do not log profile content, email, access token, user ID, or result payload.
7. In the public recommendation route, preserve the anonymous example and add a clear signed-in loading/empty/personal state:
   - signed out: existing example plus a normal sign-in path;
   - signed in, no usable profile: truthful Profile Builder prompt;
   - signed in, usable profile: `Private to this signed-in account` plus the personal rules-based recommendation;
   - request failure: keep the example visibly labeled as example; never relabel it personal.
8. Keep all three recommendation actions disabled and the packet POST hard-closed at `403`.

## Profile signal boundary

Use the existing profile as the Tier A source. Suitable fields include:

- `primary_goal`
- `blueprint_narrative`
- `skills_offered`
- `skills_sought`
- `industry_tags`
- `lane`
- `work_preference`
- `location_city` / `location_state`
- `timeline_to_launch`

Treat these as self-reported. Do not infer verified identity, funds, eligibility, success probability, employment status, legal status, protected traits, or willingness of another member.

## UI law

- Keep one `h1` and the accepted VPG14 decision compression.
- Do not add a wizard, account-management system, new component library, or large activity panel.
- Make custody obvious in one compact line near the source label.
- Preserve visible rationale, Rules score limitation, evidence strength, proof gaps, human review, and nothing-saved/nothing-sent truth.
- On phone, the selected recommendation must still begin materially above the old pre-VPG14 position.
- No raw IDs, internal names, packet paths, workflow states, or crew jargon.

## Forbidden

- SQL, migrations, schema, grants, RLS/policy changes, or Supabase dashboard work
- writes to `discovery_intakes`, `matching_shadow_runs`, recommendation packets, filesystem ledgers, or profile rows
- service-role client in the personal endpoint
- caller-selected owner ID
- saving, introductions, applications, purchases, money movement, LLM translation, or external send
- Production deployment, public launch, feature-flag flip, package install, or paid call
- claims that Tier B, deletion/export/retention, legal readiness, or multi-user durable isolation is complete

## Required tests

1. No bearer token returns `401`.
2. Invalid token returns `401`.
3. Request schema contains no owner/member ID input.
4. The profile query is fixed to the authenticated user ID and uses the user-scoped client.
5. A mocked user A request cannot select user B's profile even when a forged ID appears in query/body material.
6. Missing/insufficient profile returns a safe empty state and no recommendation payload.
7. Valid profile returns a deterministic personal session with private/no-store headers and no raw identifiers.
8. Anonymous page remains example-only with empty ledger.
9. Direct packet POST remains `403` before body parsing or storage.
10. Existing Matching regressions, typecheck, and build pass.
11. Localhost and protected Preview browser proof pass at 390 and 1440 widths with no overflow, browser errors, or unintended POSTs.

## Dink hands after build

Heimerdinker will:

1. inspect the scoped diff and reject any Tier B or unrelated changes;
2. run focused auth/ownership tests plus the existing Matching regression set;
3. run typecheck and build;
4. verify localhost on the already-running `C:\w8` hand without commandeering another server;
5. commit and push only the approved slice;
6. deploy protected Preview only;
7. hand Ben a direct Profile Builder -> Personal Matching test path and return receipts;
8. stop before Production or any new gate.

## Completion receipt

Return:

```text
RECEIVED
PACKET: TO_LADY_JESSICA_ENDER_MATCHING_TIER_A_PERSONAL_DELIVERY_OWNER_BINDING_20260717
CLAIMED_AFTER_GATE: YES
FILES_CHANGED: <paths>
AUTH_BOUNDARY: PASS|FAIL
ANONYMOUS_EXAMPLE: PASS|FAIL
SAVING_CLOSED: PASS|FAIL
TYPECHECK: PASS|FAIL
BUILD: PASS|FAIL
BLOCKERS: <NONE or exact blocker>
COMPLETED
```
