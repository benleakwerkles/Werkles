# Flock Packet — Werkles Auth Recovery Truth VPG21

Packet ID: `TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_AUTH_RECOVERY_TRUTH_VPG21_20260718`

Status: `OPEN`

Addressed seats: Heimerdinker / Dink@Betsy; Doozer@Betsy; Thufir@Betsy; Bean@Betsy

Execution, verification, commit, and isolated branch-push owner: Heimerdinker / Dink@Betsy

Repository: `benleakwerkles/Werkles`

Branch: `codex/werkles-full-flock-vpg21-20260718`

Starting source: `53c6615c9fd8fccb331a610586f377067abbb4c9`

Operator authorization: `v, P, G`

## Current Truth

- Login, Signup, and Auth Callback render provider-authored `error.message` or URL error descriptions directly in public UI.
- The member pages name Supabase, mention operator setup/email templates, and can reveal unstable technical text instead of one actionable Werkles message.
- Auth Callback always shows `Continue to onboarding` and Member Home while it is checking, when no confirmation code exists, and after confirmation fails.
- Successful code and hash-token exchanges already preserve the VPG20 safe destination and must stay unchanged.

## Mission — Exactly Two Ideas

1. Add one small pure public-auth message contract used by Login, Signup, and Auth Callback. Map only stable actionable categories to short Werkles language, use one generic fallback, and never render provider names, raw error messages/descriptions, operator setup, account-existence certainty, or email-delivery promises.
2. Make Auth Callback session-gated and state-specific. While checking, show status only. On a terminal failure or missing code, show concise Login/Create Account recovery carrying the sanitized destination. Successful code or hash-token session establishment must redirect once to the existing safe onboarding destination; no onboarding or member-home action appears before success.

## Expected Files

- a small pure helper under `lib/`
- `app/login/page.tsx`
- `app/signup/page.tsx`
- `app/auth/callback/page.tsx`
- a focused VPG21 regression

## Acceptance

- Attacker/provider-authored strings never reach rendered public status copy.
- Invalid credentials, expired confirmation, rate limiting/service trouble, missing code, and generic failure each produce bounded actionable copy without confirming account existence.
- Callback checking state contains no recovery or forward action.
- Failed/missing callback states contain only safe Login/Create Account recovery; they cannot expose Onboarding or Member Home.
- Code exchange and hash-token session establishment still occur once and redirect only after success with the VPG20 destination intact.
- No token, code, error description, provider name, or internal setup instruction is logged or rendered.

## Boundaries

- No PR, merge, browser/cursor control, manual deploy, Production action, promotion, alias, flag change, SQL/schema/RLS, Supabase settings/policy mutation, Tier B custody, LLM/provider call, new persistence, member-data expansion, or external delivery.
- Do not change credentials, email templates, callback configuration, auth provider, safe-return allowlist, session storage, or server authorization.
- Do not add password reset, resend email, OAuth, account enumeration, telemetry, or a new recovery route.

## P Readback

Doozer, Thufir, and Bean must pull this exact packet and current branch state, then return exactly two strongest bounded refinements with exact files, tests, and risks. They make no product edits. Heimerdinker executes only the two ideas named above.

## Completion

Return a P receipt, a G receipt naming the two executed ideas, focused proof, and final branch/tip. `SENT`, `OPENED`, and `CLAIMED` are not completion.
