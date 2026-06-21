# FROM_MAKER — Ender Imagery & UX Direction (Drop 1)
## `FROM_ENDER_IMAGERY_AND_UX_FOR_MAKER_1`

TO: Ender · Petra · Ben  
FROM: Maker  
DATE: 2026-06-08  
STATUS: **Implemented (UX feel + legibility)** — Render batch still **PAUSE** (Gate 05)

---

## Summary

Implemented Ender's "Anyone can be anything" imagery/UX direction as homepage structure and CSS feel. Final public copy remains Dink/Ben; this pass wires beats, discovery mechanism, trust marks, Scout Squibb tone, hero artifact pivot, and **blocking legibility fixes**.

---

## Delivered

### Packet preserved
- `foreman/handoffs/inbox/FROM_ENDER_IMAGERY_AND_UX_FOR_MAKER_1.md`

### Doctrine updated
- `foreman/IMAGERY_DIRECTION.md` — arc shift section, five UX beats, discovery categories, Render hold note

### Data + components
- `lib/ender-imagery-ux.ts` — arc beats, reveal categories, discovery steps, trust marks, cast examples
- `components/foundry/imagery-arc-journey.tsx` — five-beat journey + reveal category grid
- `components/foundry/discovery-mechanism.tsx` — five-step discovery feel
- `components/foundry/trust-signal-strip.tsx` — itemized marks (people / lenders / sellers)

### Homepage wiring
- `app/page.tsx` — sections after `WorkshopTrustRail`: arc → discovery → trust strip

### Copy / hero pivot (structure only, not final Dink copy)
- `lib/copy.ts` — Squibb Scout pointing line; hero artifact → equipment/lender reveal (not profile/lane fit)
- `components/foundry/hero-static.tsx` — `meansLine` field

### §8 Legibility (blocking)
- `app/globals.css` — darker paper ink tokens (`#1f1814` / `#44362c`); ink-on-dark tokens; removed cream leak on cockpit paper panels; Ender UX section styles; paper-surface color contract
- `app/visual-system.css` — dark profile cards use ink-on-dark tokens (muted no longer sinks into panel)

---

## Not done (explicit holds)

| Item | Reason |
|------|--------|
| Ghost Forge / Render batch | Gate 05 **PAUSE** — needs shot list + Ben approval per new arc |
| Live trust mark states | Preview placeholders until counsel/providers clear |
| Full conversational discovery UI | Feel scaffold only; not interactive flow yet |
| Dink final copy pass | Per packet — imagery/UX feel only |

---

## Checks

- `npm run typecheck` — pass
- `npm run build` — pass

---

## Suggested next

1. Ben/Ender: shot list for Money + Equipment reveals (credit-union desk, used oven) under five-beat arc
2. Dink: replace scaffold strings in new sections with canonical voice
3. Maker (when Gate 05 GO): Render run — missing-piece arc, not three-partner join-up
4. Spot-check legibility on membership/pricing hero overlays in browser (light paper + draft hero wash)
