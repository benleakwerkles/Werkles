# Flock Packet — Werkles Auth Doorway Calm VPG21

Packet ID: `TO_HEIMERDINKER_LADY_JESSICA_ENDER_WERKLES_AUTH_DOORWAY_CALM_VPG21_20260718`

Status: `OPEN`

Addressed seats: Heimerdinker / Dink@Betsy; Lady Jessica / Cursor@Betsy; Ender@Betsy

Execution, verification, commit, and isolated branch-push owner: Heimerdinker / Dink@Betsy

Repository: `benleakwerkles/Werkles`

Branch: `codex/werkles-full-flock-vpg21-20260718`

Starting source: `53c6615c9fd8fccb331a610586f377067abbb4c9`

Operator authorization: `v, P, G`

## Current Truth

- VPG20 safely preserves the exact allowlisted destination through Login, Signup, Auth Callback, Onboarding, and Profile Builder.
- Login still presents the same create-account destination three times across two full doorway cards.
- Signup presents Login twice, two full doorway cards, proof/pricing detours, and a callback-status detour.
- Neither form is single-flight. Repeated submission can start duplicate auth work, and Signup does not catch a thrown client/network failure.
- VPG16 improved shared warmth and density but explicitly did not perform this route-specific cleanup.

## Mission — Exactly Two Ideas

1. Make Login and Signup single-flight and exception-safe. Add a local busy guard, disable the relevant fields and submit button while an attempt is pending, start at most one auth call, restore controls only after a recoverable failure, and keep success locked through navigation.
2. Compress each doorway to the core form, one safe alternate-auth link, and at most one short native `Need help?` disclosure. Remove the duplicate action-card stacks and repeated sales/explainer copy without changing auth calls, validation, images, blocked states, callback construction, or the VPG20 destination.

## Expected Files

- `app/login/page.tsx`
- `app/signup/page.tsx`
- a focused VPG21 regression
- update only the VPG20 link-count assertions that this deliberate compression invalidates

## Acceptance

- Two rapid submissions cannot start two auth calls.
- Validation failures start no auth work; thrown/rejected attempts remain on-page and restore controls.
- A successful attempt stays locked until navigation.
- Login has exactly one Create Account path; Signup has exactly one Login path; both preserve the sanitized destination.
- Each page retains its form, warm image, status line, blocked-state truth, required/minLength/autocomplete behavior, and one short recovery disclosure.
- No provider, API, storage, persistence, auth-setting, or return-allowlist change.

## Boundaries

- No PR, merge, browser/cursor control, manual deploy, Production action, promotion, alias, flag change, SQL/schema/RLS, Supabase settings/policy mutation, Tier B custody, LLM/provider call, new persistence, member-data expansion, or external delivery.
- Do not redesign the shared shell, replace the existing auth stack, add password reset, add OAuth, or add a new route.
- Do not touch Matching ranking, recommendation delivery, Profile Builder, dashboard, custody, or VPG20 safe-return policy.

## P Readback

Lady Jessica and Ender must pull this exact packet and current branch state, then return exactly two strongest bounded refinements with exact files, tests, and risks. They make no product edits. Heimerdinker executes only the two ideas named above.

## Completion

Return a P receipt, a G receipt naming the two executed ideas, focused proof, and final branch/tip. `SENT`, `OPENED`, and `CLAIMED` are not completion.
