# V — First-session sweep: phone pass + onboarding/dashboard

Seat: **Lady Jessica (Cursor)**  
Date: 2026-07-29 ~11:32 ET  
Command context: Ben issued `VPGM-` — second self-authored packet.

## Vision

The morning sweep cleared the public routes at desktop width. Two gaps remain
before humans arrive:

1. **Phone pass** — walk the key public routes at 390px fresh, not on the
   credit of prior fixes.
2. **First session** — `/onboarding` and `/dashboard` are the first rooms a
   new human stands in after signup. They have never had a stranger's-eyes
   sweep. Jargon like "arena, turf" is already visible from the signup copy.

## Scope (maker branch, no gates)

- Phone (390px): `/`, `/pricing`, `/signup`, `/formation`, `/membership`.
- First session (desktop + phone): `/onboarding`, `/dashboard`.
- Same checks: renders clean, no stranger-hostile jargon, CTAs obvious,
  no internal/operator copy, contrast holds.

## Hard edges

Intake stays closed. No env/secret changes. No push, no deploy. Fixes land in
the polish v2 slice and re-seal it.

## Exit

Receipt with verdicts + re-sealed slice.
