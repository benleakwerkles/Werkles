# To Lady Jessica — Recommendations Flow Walk

**Seat:** Lady Jessica / Maker@Betsy / Handeye  
**From:** Heimerdinker@Betsy / Werkles Foreman  
**Task:** Personal UX walk and information-architecture critique only  
**Route:** `http://127.0.0.1:3000/bellows/recommendations`

## Operator concern

The page is doing too much. Recommendations must remain its perceptual center,
but a valid recommended next move may be a person, investor, worker, supplier,
location, Workshop action, or Bellows lesson. These paths need comparable
noticeability without scattering the page into a directory or burying it under
links and explanations.

Recent overcorrections moved the people gateway from the bottom to the top and
then into the selected recommendation after the explanation and before the long
work path. Do not treat that placement as correct merely because it is current.

## Personal walk

Walk the current route at desktop and narrow/mobile width. Read it as a new
member with a completed Intake. Inspect:

1. What the page appears to be *for* during the first five seconds.
2. The point where attention fragments or fatigue begins.
3. Whether cards, explanation, work product, people, Workshop, Bellows, and
   resources form one hierarchy or compete as separate pages.
4. Which destinations are truly kinds of recommendations and which belong in
   navigation or a later continuation.
5. How to make people/resources equally legitimate next moves without giving
   every destination a large card, button, paragraph, or new section.
6. What should be progressive disclosure, combined, renamed, demoted, or moved.

## Required terminal response

Return personal `GO_CURRENT`, `RESTRUCTURE`, or `PATCH`. Include:

- LOCAL HANDS READBACK and execution context;
- what you personally walked;
- one-sentence page purpose;
- proposed hierarchy in exact top-to-bottom order;
- one recommended interaction model;
- what to remove or collapse;
- desktop/mobile differences;
- smallest coherent implementation slice;
- unknowns.

Do not implement, push, deploy, delegate, create another task, or call packet
presence a receipt.
