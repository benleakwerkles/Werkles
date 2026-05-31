# Operator Dashboard

Cockpit sync: 2026-05-31 (refreshed by Maker/Cursor from repo facts + `TO_PETRA_COMPTROLLER_CREW_CHECKIN`). This file is a status readout. Source of truth for scope remains `foreman/NEXT_ACTION.md`, `foreman/LANES.md`, `foreman/BUDGET.md`, `foreman/HUMAN_GATES.md`.

- Current phase: Asset execution + functionality pivot (post werkles.com morale deploy)
- Current step: Gate 05 style variants partial (12/40) and awaiting Comptroller slice verdict
- Current risk level: LOW–MEDIUM
- Current status:
  - `main` is clean and synced with `origin/main` at `60f74c8` (2026-05-30 werkles.com deploy).
  - Local app verified healthy: `npm ci`, `npm run typecheck`, `npm run build` all pass; dev preview serves `200` on `/`, `/proof`, `/membership`, `/pricing`, `/dashboard`, `/dashboard/billing`, `/dashboard/crucible`, `/onboarding`, `/signup`, `/login`.
  - Live homepage renders current dark-copper "The Forge" v0.6 copy (not the rejected "Mythic Capitalism" draft).
- Last completed gate: Ben approved site style v0.6, canonical Squibb, and Ghost Forge batch v0.2 direction (2026-05-28); non-human-gate execution doctrine (2026-05-29). See `foreman/gates/APPROVAL_LOG.md`.

## Assets actually committed (verified via git ls-files)

- Tier 3 icons: 24 PNGs under `public/assets/draft/icons/` (lane/nav/step sets), SVG fallback for any missing slot.
- Gate 05 style variants: 12/40 landed and committed — 4 style logo-Ws under `public/assets/draft/ghost-forge/` + 8 style lane icons under `public/assets/draft/icons/`. 28 remaining; stopped at `[13/40] enamel/connector` on Render 429.
- Atmosphere plates: hero v0.1/v0.2, proof v0.1/v0.2, workshop interior, conservatory (committed).
- Crucible `check-*` icons: not generated yet (SVG fallback in use).
- Squibb mascot: NOT landed. `public/assets/mascot/` holds only README + `.gitkeep`. Awaiting Ben's manual cutout per `foreman/MASCOT_RULES.md`.

## Active threads

1. Ghost Forge Gate 05 — 28 style variants remaining after the 429 rate window. Approved batch lane + budget exist in `foreman/LANES.md` / `foreman/BUDGET.md`; do not run paid batches from a new/unsanctioned machine.
2. Functionality pivot — first APP_INFRA slice (A–E) is queued in `foreman/APP_INFRA_UX_START_PACKET.md`, pending a Comptroller (Petra) verdict.
3. Squibb cutout — manual, non-Ghost-Forge; land PNGs then signal `ASSETS_LANDED v0.2`.

## Next required action

- AI next, if any: none auto-running. Awaiting Comptroller (Petra) verdict on the first APP_INFRA slice and Gate 05 RESUME/PAUSE/STOP.
- Exact thing Ben must do next (pick one):
  - Paste `foreman/handoffs/outbox/PETRA_PASTE_BLOCK_v0.2.txt` into ChatGPT/Comptroller to get the slice + Gate 05 verdict, or
  - Say `RESUME GATE 05` to finish the remaining 28 style variants inside the approved batch budget (from the sanctioned environment, not BLDer), or
  - Land the Squibb cutout and say `ASSETS_LANDED v0.2`.

## Gate posture

- APPLY allowed: Yes, for local cockpit/doctrine edits and local checks only (Doctrine And Cockpit Maintenance lane).
- PUSH to `main` / merge / deploy: No — human gate. Feature-branch pushes + draft PRs for review are the review mechanism; merge to `main` remains Ben's gate.
- Human gates (per `foreman/NEXT_ACTION.md`, Ben 2026-05-29): login/OAuth, billing/credit card, secrets in chat, push to main/deploy/SQL/production-data mutation, creative final brand lock, spend above approved lane caps.

## Handoff warnings

- Do not run Ghost Forge / image batches from BLDer or any unsanctioned machine.
- Do not print or request secrets in chat.
- Spend sources of truth: `foreman/SPEND_LEDGER_INDEX.md`, the company ledgers, `foreman/COMMINGLING_UNTANGLING_PLAYBOOK.md`, `foreman/UNCLASSIFIED_SPEND_INBOX.md`, `foreman/REIMBURSEMENT_AND_INTERCOMPANY_LOG.md`.

## Plain English

The site is current, builds, and runs — `werkles.com` got a morale deploy on 2026-05-30 and the repo on `main` is the real, up-to-date Werkles. The private `benleakwerkles/Werkles` repo is empty; canonical history lives in public `benleakwerkles/Werkles1`. Draft assets through Gate 04 plus 12 of 40 Gate 05 style variants are committed. The machine is paused at a clean decision point: get the Comptroller's verdict on what to build next, decide whether to finish Gate 05's last 28 images, and land the Squibb cutout. Nothing is running on its own and nothing is blocked by an error.
