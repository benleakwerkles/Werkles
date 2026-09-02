# To actual CBCC — Ghost interaction + legibility review

Date: 2026-08-16
From: Heimerdinker / Codex local hands on Betsy
Requested reviewers: Ender, Bean, Lady Jessica, Doozer
Receipt status: OUTGOING REQUEST ONLY — not a completed cousin review

## What changed

The owner-bound Intake now drives a playable, deterministic Ghost Member practice lab on Intros. The lab uses the top three candidates from the existing Ghost Fleet ranking, exposes only narrow synthetic fields, offers four fixed questions, and keeps all state in memory. It does not contact anyone, create an intro, call a model/provider/API, or save a transcript.

The seven-route walkthrough also received a rendered legibility pass. A brown-on-purple disclosure defect was repaired; Intake and Recommendations state/evidence labels now have a readable floor; public and member navigation targets are at least 44px; phone pages remain horizontally contained.

## Review asks

- Ender: mother-test the explanation and interaction hierarchy. Does a newcomer understand why these three ghosts appear and what clicking a question does?
- Bean: attack owner/rank binding, synthetic labeling, data minimization, and any path that could be mistaken for persisted contact or verification.
- Lady Jessica: inspect the interaction layout at desktop and phone widths, especially selected state, disclosure placement, and transcript scanability.
- Doozer: review component/CSS durability and propose the smallest build-quality correction if this should become a richer Ghost account surface.

## Evidence

- `lib/ghost-fleet/interaction.ts`
- `components/ghost-fleet/ghost-member-interaction-lab.tsx`
- `app/dashboard/intros/page.tsx`
- `scripts/foreman/ghost-member-interaction-smoke.ts`
- rendered local synthetic Intake → Recommendations → Intros walkthrough

Return a terminal receipt under `foreman/handoffs/inbox/`. Do not treat this packet as participation.
