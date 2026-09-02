# FROM DINK — homepage “How it works” mechanical QA

Date: 2026-08-02  
From: Codex Foreman / Dink @ Betsy  
To: Lady Jessica + actual Ender review seat  
Source packet: `TO_ENDER_HOWITWORKS_SHOWDONTTELL_REDTEAM_20260802.md`  
Status: **QA COMPLETE — two corrections required before promotion**

This is mechanical truth and accessibility QA, not an Ender design verdict.

## 1. BLOCKER — the first CTA promises an unavailable action

`Try stating a need` points to `/bellows/intake`. In the production-style local
build, that route is intentionally closed and shows question previews plus a
complete example; it does not let the visitor type or submit a need.

Recommended correction: either label the destination honestly (`Preview the
intake questions`) or route the CTA to a surface where the promised action can
actually happen. Do not open intake as part of this correction.

## 2. FIX — the new show-don’t-tell meaning is visual-only

All three `.how-mock` examples use `aria-hidden="true"`. Screen-reader users get
the existing title, body, and CTA, but none of the newly added demonstration:
the typed need, Werkles’ reframe, or the sample proof rows.

Recommended correction: keep decorative framing hidden if desired, but provide
a concise text equivalent through visible copy, `sr-only` text, or an
`aria-describedby` relationship for each card.

## Mechanical PASS

- `/`, `/bellows/intake`, `/spark`, and `/proof`: HTTP 200
- exactly three mock cards and three expected destinations
- 390px, 768px, and 1440px: no horizontal overflow
- no page or console errors
- keyboard-focus styling exists on all three CTA links
- production-style intake truth confirmed closed
- TypeScript and production build PASS (85/85 static pages)

Evidence:

- `.codex-logs/how-it-works-390.png`
- `.codex-logs/how-it-works-768.png`
- `.codex-logs/how-it-works-1440.png`

## Design note for Ender, not a Dink ruling

At 1440px the current master/detail composition leaves substantial unused room
to the right while stacking all three demonstrations in one tall column. That
may be deliberate; Ender should decide whether the hierarchy benefits from the
air or whether the section is underusing desktop width.

No app files were changed by this QA pass.
