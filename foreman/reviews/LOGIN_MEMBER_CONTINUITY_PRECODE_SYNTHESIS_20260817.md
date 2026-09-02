# Pre-code synthesis — Login / member continuity

Date: 2026-08-17
Foreman: Heimerdinker@Betsy

## Reviewed evidence

- Local vision packet:
  `foreman/handoffs/outbox/V_HEIMERDINKER_PLEASANT_UNIVERSITY_LOGIN_MEMBER_CONTINUITY_20260817.md`
- Local file: 3,594 bytes, SHA-256
  `bff783936bf52c186f05534a41acbc6f91a88f555c938900b3f53b61f2bb267f`
- Swanson/Petra terminal substantive review:
  `ec1f781f-f3e6-46fa-a9ff-3c7a44f8f09e`
- Doozer/Orson terminal substantive review:
  `95ac5ef5-de34-498b-a6f5-3cb43a3fb7a6`
- Swanson/Petra exact-byte review:
  `94008208-b12a-49e3-8b99-50156f89091e`
- Doozer/Orson exact-byte review:
  `d7293a41-e31d-4dc9-ae74-c99e0b93ad8e`

## Transport qualification

The first Base64 relay was corrupted in transport. Swanson decoded 3,594 bytes
with SHA `5c8cb1a6e1d3dc13eb064976dc01e0e249254b11fae273acac43313e1b8160e4`
and correctly refused to bind that review to the local `bff783...` hash. Doozer
personally reviewed the complete plaintext packet but could not verify its byte
encoding.

The corrected relay was generated directly from the local file bytes. Both
reviewers independently reconstructed exactly 3,594 bytes with SHA-256
`bff783936bf52c186f05534a41acbc6f91a88f555c938900b3f53b61f2bb267f`.
Swanson returned `PASS_PRE_CODE_ONLY`; Doozer returned a pre-code `BLOCKER` on
the existing implementation and supplied the same continuity-truth correction.
The admitted repair below is therefore bound to exact-source CBCC review.

## Pleasant University lesson

A member entry surface is not successful because it redirects. It succeeds only
when it truthfully hands forward the same bounded identity and owner continuity
that the next surfaces consume.

For local walkthrough mode, one server-owned transition must establish:

1. the browser walkthrough session; and
2. the existing local owner pointer consumed by Intake, Recommendations,
   Workshop, and Intros.

The UI must call this browser-local walkthrough state, not an account, account
save, durable custody, synchronization, or cross-device continuity. Real account
sign-in remains separate.

## Admitted repair

One bounded local-preview seam:

- make local `/login` a truthful walkthrough entry rather than a fake account
  credential form;
- have the server transition set both the preview session and
  `werkles_bellows_owner=member_dev-preview-user`;
- preserve real Supabase login behavior outside runtime preview;
- keep existing local Intake data untouched;
- prove the redirect plus both cookie names, downstream Recommendations owner
  continuity, honest copy, and no account-saving claim.

## Deferred

- Supabase account custody, schema, RLS, and cross-device persistence;
- durable account login/signup redesign;
- broad page-height pruning;
- page-title cleanup beyond the audited dashboard children;
- provider work, push, merge, and deploy.

## Mutation state

`ONE_BOUNDED_LOCAL_PREVIEW_CONTINUITY_REPAIR_AUTHORIZED`
