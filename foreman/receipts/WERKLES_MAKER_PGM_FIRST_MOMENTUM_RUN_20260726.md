# Receipt — first P, G, M run (Automatica Momentium v1) + Ben's live asks

Date: 2026-07-26 (~16:40 ET)  
Agent: Maker (Cursor) @ Sally  
Execution context: LOCAL_SALLY_WINDOWS

## P (pull 1)

- Brand slice **already pushed** (`861080c` on `origin/maker/site-g-20260703`)
  and **already promoted** — werkles.com live CSS carries the V0i gradient.
  Ladder rungs 1–2 done; rung 3 (HG-3 Stripe hands) is current.
- Flock VPG55 completed (intake closed-surface hardening + CSP parity, no J).

## G

1. Reconciled cockpit to reality: brand packet marked EXECUTED; canonical
   waiting-phrases ladder updated (rungs 1–2 struck, HG-3 marked current).
2. Codified the `M` (Momentum) command in `foreman/VPG_SHORTHAND.md` with
   Ben's exact definition and hard edges (no gates, two ideas per beat,
   re-pull after).

## M beat (pull 2 → two ideas → Ben interrupted with live asks)

- Pull 2: VPG56 packets found (owner walkthrough prep, Betsy seats only —
  read for state, not executed here).
- Idea 1: footer brand seam (V0i gradient hairline, centered disclaimer).
- Idea 2: phone pass — found and fixed a real bug: at ≤520px "Sign in"
  overlapped the wordmark; hero h1 was 51px. Header now stacks; h1 ~39px;
  hero actions full-width. Also unified the hero primary CTA into the violet
  family (was teal, mismatched the identical header CTA).
- Ben's live asks folded into the same beat:
  - **Button shadows removed site-wide** (global kill switch + cleanup).
  - **Hero replaced**: new front-on Maria, calm/confident, generated from the
    current beats as face reference. Kneading shot kept as
    `werkles-story-v2-hero-wide-KNEADING-BACKUP.png`.

## Infrastructure finding

Port 3000 was serving `next start` (production build), not a dev server —
CSS edits were invisible until rebuild. Ran `npm run build` (green, 83/83,
lint + types pass), restarted `next start -p 3000` (old PID 44928 → new
29620). Localhost now matches the working tree.

## Sealed for push

`TO_HEIMERDINKER_MAKER_POLISH_V2_PUSH_20260726.md` — 2-file slice
(`app/globals.css`, hero PNG), hash manifest alongside. Phrase:
`PUSH MAKER POLISH V2`.

## Final pull (M close)

VPG56 completed 16:34 on Betsy — owner walkthrough run-of-show ready for
tonight, targeting live werkles.com. No Maker-addressed packet. Note: the
walkthrough will show the OLD shadows + kneading hero unless the polish v2
slice is pushed and promoted first.

## Gates

None cleared. Intake stays closed. No env, secret, deploy, or Production
action taken. Localhost restart only.
