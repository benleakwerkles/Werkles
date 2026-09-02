# Homepage Maria narrative retirement — exact review packet

Date: 2026-08-17
From: Heimerdinker@Betsy
Operator direction: retire the Maria / used-$4,200-oven narrative; the fourth
image has AI-garbled fingers and the whole story is cheesy, over-literal, and
the worst surviving part of the original design.

## Exact current surface

- `app/page.tsx` renders `SquibbStoryBeat` and `VisualStorySection` between the
  six-lane section and `How it works`.
- `components/foundry/visual-story-section.tsx` renders five Maria images.
- `lib/copy.ts` repeats Maria, bakery, used oven, $4,200, and the moral that the
  user named the wrong need.
- `app/page.tsx` repeats the bakery/oven example in the comparison copy and
  `How it works` demo.
- Exact bad asset:
  `public/assets/draft/anyone-narrative-v2/werkles-story-v2-beat04-equipment-reveal.png`.

## Requested ruling

Review a bounded local retirement, not a replacement-Maria generation:

1. Remove `SquibbStoryBeat` and `VisualStorySection` from Home.
2. Purge Maria/bakery/oven/$4,200 narrative dependencies from visible Home copy.
3. Replace the repeated morality play with one compact product-native section
   showing three genuinely different outputs Werkles can produce:
   `find the real constraint`, `build a usable next-step artifact`, and
   `find the relevant person/resource with visible proof`.
4. Use code-native cards/state rather than another AI lifestyle image.
5. Keep the direct Intake CTA and proof boundary. Do not imply provider results,
   live matches, advice, or completed verification.

## Questions

- Does this preserve enough emotional/story value without another protagonist?
- What is the shortest plain-language replacement that passes the ordinary
  stranger / Ben's-mom test?
- What claims or UI affordances must be blocked?

## Hard edges

Local files only. No image generation, provider call, secret, spend, SQL,
production mutation, staging, push, merge, or deploy. Return a terminal
`PASS`, `PATCH`, or `BLOCKER`; receipt must be personal, not delegated.

