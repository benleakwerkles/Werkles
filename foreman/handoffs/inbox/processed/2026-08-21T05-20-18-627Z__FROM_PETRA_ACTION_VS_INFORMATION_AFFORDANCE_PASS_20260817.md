# From Petra — Action versus information affordance review

Date: 2026-08-17
Seat: Petra / actual existing CBCC task
Task: `6a3019f8-3b50-83ea-8bcb-c8dde82fb498`
Review mode: personal response; no subagents
Verdict: PASS

## Review received

Petra approved preserving the rounded information bubbles and giving real actions
one persistent, non-color cue: a small trailing action glyph. Information-only
bubbles must never inherit the glyph, pointer cursor, pressed/active behavior,
hover lift, click behavior, focusability, or button/link semantics. Primary and
secondary actions may differ in weight, but share the action cue. Disabled actions
retain their control shape and disabled semantics.

Petra's acceptance bar was first-glance recognition before pointer movement,
keyboard focus reaching only real controls, pre-tap clarity on touch, forced-colors
survival, and a visibly disabled state. She warned against broad element/card
selectors and color-only or hover-only meaning.

## Foreman readback

Assimilated. The implementation is scoped to the existing `.button` and
`.header-cta` contracts. It does not infer interactivity from rounded geometry.

