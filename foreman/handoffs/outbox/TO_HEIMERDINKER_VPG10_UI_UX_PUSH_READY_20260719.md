# TO HEIMERDINKER — VPG10 UI/UX cleanup push-ready (Preview scope)

Packet: `TO_HEIMERDINKER_VPG10_UI_UX_PUSH_READY_20260719`
From: LadyJessica@Betsy (P,G 2026-07-19)
To: Heimerdinker / Dink@Betsy
Branch: `maker/site-g-20260703`
Repo: `C:\Users\Ben Leak\github\Werkles`
Public: Autonomous Matching ON; LLM OFF
Push: **STOP until Operator push phrase** — this packet is readiness only

## Goal

Ship the Preview VPG10 recommendations declutter already landed locally, without absorbing unrelated dirty-tree files.

## Proof already in hand (Lady Jessica G this cycle)

| Check | Result |
|-------|--------|
| `node scripts/foreman/test-matching-vpg8-surface.mjs` | **PASS** (9/9) |
| localhost `/bellows/recommendations` | **200** — markers: hero_brand, headline, rules_score, save_closed |
| localhost `/bellows/intake` | **200** |
| localhost `/bellows` | **200** |
| Production nested routes | **404** as of 2026-07-21 (was 200 on 2026-07-19 — deploy lineage drift) |
| Nested pages on `origin/maker` @ `674f3db` | **Present** |
| Nested pages on `origin/main` | **Absent** — explains prod 404 if prod tracks main |
| `MATCHING_LLM_TRANSLATE_ENABLED` | **false** |

**Note for Dink:** This VPG10 packet is still **git push of UI declutter only**. It does **not** put nested routes on werkles.com; that needs a separate Operator-approved **production deploy from maker**. See `WERKLES_LADY_JESSICA_PG_20260721_LATE.md`.

## Exact push scope (include only these)

```text
components/squibb/recommendation-surface.tsx
components/squibb/reasoning-panel.tsx
components/squibb/evidence-section.tsx
components/squibb/source-document-panel.tsx   # new file; imported by surface
app/bellows/recommendations/squibb-recommendations.css
scripts/foreman/test-matching-vpg8-surface.mjs
foreman/handoffs/outbox/TO_LADY_JESSICA_AUTONOMOUS_MATCHING_UI_UX_CLEANUP_PREVIEW_VPG10_20260717.md
foreman/receipts/WERKLES_AUTONOMOUS_MATCHING_UI_UX_CLEANUP_PREVIEW_VPG10_LADY_JESSICA_20260717.md
foreman/receipts/WERKLES_LADY_JESSICA_PG_20260719_EVENING.md
foreman/handoffs/outbox/TO_HEIMERDINKER_VPG10_UI_UX_PUSH_READY_20260719.md
```

## Do not include (dirty but out of VPG10 product scope)

```text
app/bellows/intake/*
components/squibb/concierge-intake-form.tsx
components/squibb/confidence-meter.tsx
lib/matching/*
app/api/*
.gitignore
```

## Operator phrase needed before you push

Exact wording is Ben’s choice; substance must authorize **scoped push of VPG10 UI/UX only** on `maker/site-g-20260703`.  
`P, G.` alone does **not** authorize push.

## Forbidden still

- production deploy / alias
- LLM flip
- merge to main
- SQL / secrets

## Two G ideas for Heimerdinker (after phrase)

1. Commit + push **only** the exact scope list above.
2. Re-run `node scripts/foreman/test-matching-vpg8-surface.mjs` on the pushed tip; receipt pass/fail.

`READY FOR P` (Heimerdinker) — blocked on Operator push phrase
