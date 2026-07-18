# Werkles Full-Flock VPG21 G Receipt — Auth Recovery Truth

- Status: `COMPLETED`
- Date: 2026-07-18
- Machine: `BETSY`
- Execution owner: Heimerdinker / Dink@Betsy
- Packet: `foreman/handoffs/outbox/TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_AUTH_RECOVERY_TRUTH_VPG21_20260718.md`
- Product commit: `1e4b6b397f6a03d102510e7dcd3412ee16edfada`

## Exactly Two Executed Ideas

1. Added one pure code-in/fixed-copy-out public auth message contract used by Login, Signup, and Auth Callback. Stable codes receive bounded Werkles copy; unknown or malicious values fail closed to a generic message and raw provider text is never rendered.
2. Replaced Auth Callback's always-open forward controls with a guarded `checking | redirecting | failed` state. Code/hash session work redirects only after success; failure or missing-code recovery exposes only Login and Create Account with the stored safe destination.

## Proof

- VPG21 public-auth truth and callback-state regression: `PASS` (8 checks).
- Malicious provider-message sentinel cases: `PASS`.
- VPG20 safe callback/onboarding continuity: `PASS`.
- React review: `PASS` — callback state is discriminated, its effect is replay-guarded, checking/redirecting are text-only, and failed recovery uses a named nav associated with the alert.

No token, code, provider-authored message, provider name, internal setup instruction, account-existence certainty, or email-delivery promise is logged or rendered.
