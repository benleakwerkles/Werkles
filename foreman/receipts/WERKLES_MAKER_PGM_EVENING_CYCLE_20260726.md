# Receipt — P G, M evening cycle (Automatica Momentium run 2)

Date: 2026-07-26 (~17:30 ET)  
Agent: Maker (Cursor) @ Sally  
Execution context: LOCAL_SALLY_WINDOWS

## P (pull 1)

Nothing new since 16:35: no Maker-addressed packets, `PUSH MAKER POLISH V2`
and the w8 `PUSH BRAND V0I PUBLIC` candidate both still holding on Ben's
phrases.

## M beat — two ideas in the polish lane

### Idea 1 — phone audit of the human-facing routes

Walked `/login`, `/bellows/intake`, `/membership` at 390px emulation.

- **Login (bug, fixed):** the auth panel stayed two-column on phones — the
  split layout's doubled selector (`.auth-panel.auth-panel--split`, added to
  beat a legacy width cap) also beat its own 900px collapse rule. Restated
  the collapse at matching specificity; the form now stacks full-width.
- **Intake (regression, fixed):** V0i paper-violet eyebrows were near
  invisible on the dark intake panels. Dark-cockpit surfaces now get light
  violet (`#b9a4ff`).
- **Membership:** renders fine at phone width. FLAG for Ben/crew (product,
  not design): the public page shows an operator test-checkout runbook
  ("Before you click Pay" with test card 4242…) — worth hiding before
  showing humans.

### Idea 2 — contrast crawl of the dark-cockpit routes

- Intake: clean (0 elements under 4.5:1 after the eyebrow fix).
- `/bellows/recommendations/test-case-0` ("See an example" from the
  homepage): **severely broken** — warm-paper ink on near-black cards at
  1.0–1.8:1. The five dark surfaces (`concierge-flow-rail`,
  `concierge-symptom__quote`, `concierge-speaker-confidence`,
  `concierge-alt-chip`, `concierge-experiment-card`) now carry cream ink
  (`#f3e9d7 !important` — required because the page-level walkthrough CSS
  loads after globals and paints via re-pointed theme variables).
  Verified by screenshot: Confidence card and all chips readable.
- Remaining crawler flags on that page are artifacts (the crawler reads
  background-color and misses the page's warm gradient background-image);
  screenshots confirm those sections render dark-on-warm and read fine.

## Builds

Three production builds this cycle, all green (83/83 routes, lint + types).
`next start` on port 3000 restarted onto the final build.

## Push slice state

`TO_HEIMERDINKER_MAKER_POLISH_V2_PUSH_20260726.md` re-sealed ~17:30 ET;
hash manifest updated (`globals.css` → `67d091af…`). Still a 2-file slice.
Phrase: `PUSH MAKER POLISH V2`.

## Final pull (M close)

VPG57 started on Betsy at 17:13 (walkthrough target parity + privacy route
release custody) — addressed to Betsy seats, read for state only. No
Maker-addressed packet. No pushes fired.

## Gates

None cleared. Intake stays closed. No env, secret, deploy, or Production
action. Localhost rebuild/restart only.
