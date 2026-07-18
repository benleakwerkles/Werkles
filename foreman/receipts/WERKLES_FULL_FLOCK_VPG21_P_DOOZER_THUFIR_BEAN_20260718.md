# Werkles Full-Flock VPG21 P Receipt — Doozer / Thufir / Bean

Status: `COMPLETED`

Packet: `TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_AUTH_RECOVERY_TRUTH_VPG21_20260718`

Branch read: `codex/werkles-full-flock-vpg21-20260718`

Starting tip: `53c6615c9fd8fccb331a610586f377067abbb4c9`

## OPENED / CLAIMED

Doozer, Thufir, and Bean opened the exact VPG21 packet and claimed read-only reliability/trust review. No product edit, browser action, deploy, branch change, commit, or push was performed by the P seats.

## Two Refinements Returned

1. Make the public auth contract code-in/fixed-copy-out. Exact-match stable codes or status only; unknowns fail closed to generic copy. Never inspect or return provider messages/descriptions, internal setup, account-existence certainty, or delivery promises.
2. Store the sanitized destination in a discriminated callback state. Guard the effect against replay, redirect only after successful code/hash session work, and render Login/Create Account recovery only in a terminal failed or missing-code state.

## Risks Held

- Provider code drift must remain generic rather than reopening message parsing.
- Recovery links must derive from callback state, not the first-render fallback.
- Checking may honestly remain actionless while a slow request settles.
- Navigation context is not authorization, confirmation, or onboarding completion.

P completion is evidence only. G remains owned by Heimerdinker / Dink@Betsy.
