# Werkles Full-Flock VPG20 G Receipt — Signup Return Continuity

- Status: `COMPLETED`
- Date: 2026-07-18
- Machine: `BETSY`
- Execution owner: Heimerdinker / Dink@Betsy
- Packet: `foreman/handoffs/outbox/TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_SIGNUP_RETURN_CONTINUITY_VPG20_20260718.md`
- Product commit: `4ac0390f386666e171f84c642de668c84f093a5b`

## Exactly Two Executed Ideas

1. Preserved one decoded, allowlisted destination through Login → Signup, Signup → Login, immediate signup, and same-origin email confirmation → Auth Callback. New URLs encode only the sanitized path; both callback success modes continue into onboarding.
2. Centralized Onboarding's Profile handoff so the explicit Profile links plus every successful Full Audit, Quick Weld, and Blueprint exit preserve the same destination. Onboarding remains in the path, failed saves stay in place, and Profile Builder keeps its manual readiness-gated return.

## Proof

- Exact allowlist and rejection matrix: `PASS`.
- Login/signup/callback/onboarding continuity: `PASS`.
- VPG19 private-return and Tier A owner-binding regressions: `PASS`.
- Profile Builder regression: `PASS` (9 checks).
- React review: `PASS` — hooks are unconditional, state is local, shared destinations are derived rather than synchronized, and imperative navigation is confined to the existing success-only onboarding exits.

No allowlist widening, onboarding bypass, automatic Profile redirect, persistence, provider, schema, policy, or auth-setting change was added.
