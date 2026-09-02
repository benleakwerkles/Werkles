# Pleasant University — Login/member-continuity repair receipt

Date: 2026-08-17
Foreman: Heimerdinker@Betsy
State: `ACTUAL_CBCC_REVIEWED__LOCAL_BUILDER_CANDIDATE_COMPLETE`

## Pleasant University lesson applied

A redirect is not success. A page must truthfully establish the same bounded
owner continuity that its next surface consumes, and it must distinguish a
browser-local walkthrough from a durable account.

Exact-source pre-code reviews:

- Swanson/Petra: `94008208-b12a-49e3-8b99-50156f89091e`
- Doozer/Orson: `d7293a41-e31d-4dc9-ae74-c99e0b93ad8e`
- Packet SHA-256:
  `bff783936bf52c186f05534a41acbc6f91a88f555c938900b3f53b61f2bb267f`

## Repairs

- Local Login and Signup no longer imitate account authentication with arbitrary
  credentials. They provide one truthful browser-walkthrough transition.
- The server transition sets both `werkles_dev_preview_session` and the HttpOnly
  `werkles_bellows_owner=member_dev-preview-user` pointer before redirect.
- The preview-session cookie now uses the same HttpOnly, same-site, path, and
  environment-secure policy as the owner cookie.
- Redirect targets are same-origin local paths only. Protocol-relative,
  backslash-host, absolute external, and non-path inputs fall back to Dashboard.
- That redirect rule now covers both the local-preview server POST and the real
  Supabase-login client transition before `router.replace`.
- The real non-preview Supabase login/signup paths remain separate and intact.
- Workshop, Crucible Checks, and Profile have route-specific document titles.
- Recommendation causal copy no longer cites goal-only text as proof of why a
  recommendation ranked.

## Local proof

- `node scripts/foreman/login-walkthrough-continuity-smoke.mjs` — PASS
- `npx.cmd tsx scripts/foreman/recommendation-member-facing-summary-smoke.ts`
  — PASS
- `npm.cmd run typecheck` — PASS
- Browser desktop: Login fits a 720px viewport; CTA is 44px.
- Browser phone: Login is 895px tall at 390x844; no horizontal overflow; CTA is
  44px.
- Browser transition: Login -> Dashboard -> Recommendations recovers the
  existing local Intake and ranked readout.
- Direct POST: HTTP 303 with both cookie names before redirect.
- Hostile redirect POSTs: `/dashboard` stays local; `//evil.example`,
  `/\\evil.example`, and `https://evil.example` all fall back to Dashboard.
- Browser query attacks: absolute, protocol-relative, backslash, and
  `javascript:` inputs normalize to Dashboard; a valid
  `/dashboard/profile?tab=work` path survives.

## CBCC post-mutation gate

The first exact-candidate relay was damaged by transport and Doozer correctly
returned `SOURCE_MISMATCH` without claiming review. Swanson personally verified
the compact candidate and returned `BLOCKER` on the unsanitized real-login
redirect. That blocker was assimilated and repaired.

Swanson then personally reviewed the corrected exact-source ZIP (13,881 bytes,
SHA-256
`f5039bb5ce0496b2721e876bf4f1cefd99234135e8e1200e3c9317729d1273a4`).
All twelve file lengths and hashes matched. His terminal ruling was `PASS`, with
no blocking defect found and no subagents used. The full receipt is recorded at
`foreman/handoffs/inbox/FROM_SWANSON_LOGIN_FINAL_CANDIDATE_PASS_20260817.md`.

## Deferred truth

- Local walkthrough data is not durable account custody and does not sync across
  browsers or devices.
- Supabase schema/RLS/account persistence remain separate work.
- The nine-page audit identified broad density debt, especially the mobile
  Crucible page; that work is not silently represented as repaired here.
- Nothing was staged, pushed, deployed, charged, or sent to a provider.
