# Tier 1 Gate — Matching Tier A Personal Delivery Preview

**Status:** `COMPLETED__PREVIEW_READY`

**Prepared:** `2026-07-17T20:38:27-04:00`

**Prepared by:** Heimerdinker / Dink@Betsy

**Branch:** `codex/matching-tier-a-owner-binding-gate-20260717`

**Starting commit:** `cb115fb8f16bc278097cd3958a90135e479f2034`

**Test subject:** Ben's existing authenticated Werkles account

**Confidence:** `HIGH` that Tier A is the smallest truthful personal-delivery proof; `MEDIUM` until the authenticated Preview proof runs against Ben's completed profile.

## Recommendation

Approve **Tier A tonight**. Keep Tier B closed.

Tier A can prove that a rules-based recommendation is requested by an authenticated member, built only from that member's own profile, and returned only to that member's browser. It does not need a new personal-results table, a schema migration, or a claim that durable personal custody is complete.

Tier B is a separate owner-custody project. The current `discovery_intakes` and `matching_shadow_runs` tables have no member-owner column and expose only operator-read policies. Opening durable personal delivery requires schema, RLS, migration/backfill rules, export/deletion/retention behavior, and two-account isolation proof.

## Approval phrase

```text
APPROVE MATCHING TIER A PERSONAL DELIVERY PREVIEW
```

No shorthand, earlier Matching approval, or public-mode approval authorizes this personal-delivery build.

**Approved:** `2026-07-17T20:47:54-04:00` with the exact phrase above. Recorded in `foreman/gates/APPROVAL_LOG.md`.

**Completed:** `2026-07-17T21:06:36-04:00`. Product commit `a5b0216f34a493b7c8691e9d0a109216862755fe`; protected Preview deployment `dpl_8m2YBfGQKWAh4gpMhwLnRp1234uB` is `READY` with `target: null`. Production was not deployed, promoted, or aliased.

## What Tier A authorizes

Environment: localhost plus protected Vercel Preview only.

1. Keep anonymous `/bellows/recommendations` example-only.
2. In an authenticated browser, obtain the current Supabase access token through the existing client session.
3. Call a new owner-bound recommendation endpoint with that bearer token.
4. The endpoint must validate the token with Supabase Auth, ignore any caller-supplied user ID, and query only `profiles.id = authenticated user.id` using the user-scoped client and existing profile RLS.
5. Adapt the member's saved profile fields into Matching signals, run the existing deterministic rules in memory, and return the recommendation only in that response.
6. Mark the result as private to the signed-in account, self-reported where appropriate, rules-based, not a probability or eligibility decision, and not sent to anyone.
7. Send `Cache-Control: private, no-store`; do not put a member ID, email, or profile content in URLs, application logs, Vercel logs, receipt filenames, or analytics events.
8. Keep recommendation saving, external introductions, applications, purchases, money movement, and LLM translation closed.

## Tier A acceptance proof

- No bearer token -> `401`.
- Invalid or expired token -> `401`.
- The endpoint accepts no owner/member ID from the caller.
- A valid signed-in member can receive a recommendation derived from only their own profile.
- Missing profile -> a truthful empty state with a Profile Builder link; no example is mislabeled as personal.
- Anonymous page remains the existing example with an empty ledger.
- Personal response and page are private/no-store and contain no service-role credential or internal filesystem path.
- Saving endpoint remains `403` before body parsing or storage.
- LLM remains OFF.
- Localhost and protected Preview pass at desktop and phone widths with no overflow or browser errors.
- Focused authorization regression, existing Matching regressions, typecheck, and build pass.

## Explicitly outside Tier A

- No SQL, schema, migration, RLS, policy, grant, or production-data change.
- No durable personal intake, run, recommendation, activity ledger, or saved-option row.
- No use of the existing global/latest or operator shadow readers for member delivery.
- No claim that member A/member B row isolation for future stored personal results is complete.
- No Production deployment, public launch, feature-flag flip, LLM enablement, or provider spend.
- No legal/compliance approval claim.

## What Tier B would require

Tier B remains closed until a separate design and gate cover all of the following:

- immutable `owner_user_id` custody on every personal intake, run, recommendation delivery, and saved option;
- explicit grants plus RLS using `TO authenticated` and `(select auth.uid()) = owner_user_id`, with indexes on ownership columns;
- no assignment of legacy ownerless rows to a member without separate evidence and approval;
- member export, correction, deletion-request/status, retention, and anonymization behavior;
- service-role isolation and audit/log redaction;
- two real test accounts proving member A cannot read, mutate, enumerate, or infer member B's rows;
- privacy/compliance review before any Production opening.

## Blast radius

Tier A touches the authenticated client handoff, a new private recommendation API, the in-memory Matching adapter, and the public recommendation page's signed-in state. It reads the existing authenticated member profile. It does not change the database or write member data.

## Files changed by gate preparation

- `foreman/reviews/GATE-matching-tier-a-personal-delivery-20260717-2038.md`
- `foreman/reviews/GATE-matching-tier-a-personal-delivery-20260717-2038.html`
- `foreman/handoffs/outbox/TO_LADY_JESSICA_ENDER_MATCHING_TIER_A_PERSONAL_DELIVERY_OWNER_BINDING_20260717.md`
- `foreman/NEXT_ACTION.md`

## Systems affected after approval

- Werkles Next.js localhost and protected Preview
- existing Supabase Auth session
- existing `profiles` read path and RLS
- deterministic Matching engine in memory

Production, Supabase schema, service credentials, billing, and external delivery remain unaffected.

## Budget

No paid calls, packages, LLM use, image generation, or provider spend.

## Known risks and unknowns

- Ben's saved profile must contain enough signal for a useful recommendation; the live Preview proof will establish that.
- The app currently keeps Supabase Auth in the browser rather than an SSR cookie client, so Tier A should use the existing bearer-token API pattern instead of introducing a new auth subsystem tonight.
- Tier A proves ephemeral owner-bound delivery, not durable owner custody.
- Current deletion/retention implementation remains incomplete and is one reason Tier B stays closed.

## Stop condition

After approval: build, verify, push the isolated branch, deploy protected Preview, and hand Ben the direct test path. Stop before Production, SQL/schema/RLS, saving, LLM, external send, or any provider/account gate.

## Completion proof

- Lady Jessica + Ender completed the bounded product packet; Heimerdinker independently reviewed, tested, committed, pushed, deployed, and verified it.
- Missing bearer returned `401`; forged invalid bearer plus a caller-supplied `userId` returned `401`; both personal responses were `private, no-store`.
- The endpoint accepts no caller owner ID and fixes the read to `profiles.id = authenticated user.id` through the authenticated user-scoped Supabase client.
- Anonymous desktop and phone Preview remained the example; 390 px had no horizontal overflow; no framework overlay or page error appeared.
- Recommendation saving remained `403`, three save controls remained disabled, LLM stayed off, and no SQL/schema/RLS, service-role read, persistence, external delivery, or Production action occurred.
- Focused Tier A and Matching VPG6/VPG8/VPG10/VPG11/VPG12/VPG13/VPG14 regressions, TypeScript typecheck, and the 81-page Next.js production build passed.
- A real Ben-profile response was not observed headlessly because no valid Ben browser session was extracted or controlled. The protected direct path is ready for Ben to perform that one human test-subject observation.

## Responses

Approve:

```text
APPROVE MATCHING TIER A PERSONAL DELIVERY PREVIEW
```

Patch:

```text
PATCH MATCHING TIER A PERSONAL DELIVERY PREVIEW: <instructions>
```

Reject:

```text
REJECT MATCHING TIER A PERSONAL DELIVERY PREVIEW
```

Open Tier B design instead:

```text
OPEN MATCHING TIER B OWNER-CUSTODY DESIGN
```
