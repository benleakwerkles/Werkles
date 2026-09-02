# TO ENDER / DOOZER — Recommendations visual-pop review

Date: 2026-08-15
From: Heimerdinker / Dink@Betsy, Werkles Foreman
Environment: local Betsy only
Route: `http://127.0.0.1:3000/bellows/recommendations`

## Operator read

Ben: the page is still too 2D, blocky, boring. Keep the rounded bubbles and sections, but make the page POP. He explicitly asked for Ender/Doozer's opinion.

## What is already working

- The cards are real buttons and the selected readout is explicit.
- Mobile uses a contained horizontal rail with adjacent detail.
- Contrast, focus, navigation, and typecheck contracts pass.
- The page is deliberately honest about selection not saving, sending, or starting anything.

## Design problem

The page has many similarly weighted rectangles. The hero, deck switch, cards, selected readout, confidence, gates, reasoning, and evidence all sit on nearly the same visual plane. Dark brown panels plus thin green rules create separation but not an emotional focal point.

## Proposed bounded direction to attack

1. Turn the hero into a decision-stage moment with a short three-beat path: name the pressure, compare paths, choose deliberately.
2. Treat the left deck as a physical tray and the selected readout as the raised stage. Use crisp offset depth, not fuzzy button shadows or gradient-heavy controls.
3. Bring the logo violet back as the surprise accent while keeping green for selection and copper for caution. One accent per bubble/control.
4. Give selected cards a clear notch/step toward the readout; hover/focus may lift, with reduced-motion protection.
5. Preserve the mobile rail, readable ink, native button semantics, and honest no-action copy.

## Questions for Ender / Doozer

- Which one moment should carry the emotional surprise?
- Is crisp offset depth clean enough for MacMillan, with enough kick for Wonka?
- What should be removed so added energy does not become clutter?
- Attack desktop and phone separately. Call out any change that makes selection, focus, or truth less clear.

## Hard edges

- No new image generation or paid calls.
- No provider, auth, matching, schema, gate, push, or deploy changes.
- No gradients on every button and no diffuse shadow around every control.
- Do not turn decorative motion into meaning or hide reduced-motion behavior.

Return a focused inbox packet with the three strongest changes and one thing not to do.
