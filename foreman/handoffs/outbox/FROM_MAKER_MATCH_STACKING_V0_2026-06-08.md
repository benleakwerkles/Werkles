# From Maker — Match Stacking & Need Translation V0

## Source
Operator drop: `WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0` (2026-06-08)

## Status
**Doctrine preserved + schema audit complete.** No engine built. No schema migrated.

## Files added/updated
- `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md` — canonical doctrine (DRAFT)
- `foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md` — codebase gap audit per “Next Safe Build”
- `company/WERKLES_MATCHING_RULES.md` — cross-links to architecture + audit
- `app/globals.css` — light-paper text contrast fixes (`.muted`, reveal rail, placeholders, cockpit nav)

## Audit headline
- **Layer 0** (need translation): copy/narrative only — not in schema or match RPC
- **Layer 1 + 3**: partial (blocks, eligibility, blueprint weighted score)
- **Layers 2, 4, 5**: not represented
- **Profile V0**: ~40% of doctrine fields in `profiles` table

## CSS fix (Operator-reported)
Light cream tokens (`--werkles-text-primary/secondary`) were leaking onto warm paper panels. Patched:
- `.muted` class (was undefined)
- Placeholder text on light fields
- Reveal rail / Squibb / crucible state cards
- Cockpit dashboard nav on paper backgrounds

## Explicitly not in this drop
- Ghost Forge Render run (Gate 05 PAUSE — needs Ender art direction for *missing-piece* arc vs three-partner imagery)
- Layer 0 engine or SQL migrations
- Second operator drop (pending)

## Human gates
- Petra GO before profile schema extensions (stated need, offer, trust gate, momentum)
- Ender art direction before new narrative imagery batch
- Gate 05 GO before Render spend

## Suggested next
1. Ben review audit: `foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md`
2. Ender packet: imagery arc for “what you didn’t know you needed”
3. Operator paste second drop when ready
