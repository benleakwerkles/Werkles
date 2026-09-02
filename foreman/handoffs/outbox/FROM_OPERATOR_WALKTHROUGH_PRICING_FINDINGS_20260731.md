# WALKTHROUGH FINDINGS — Pricing page (Ben, 2026-07-31 ~3:09 PM)

Per the two-ended loop: these are Ben's live impressions, filed as attack
leads for the red team. Foreman drafts corrections AFTER the red-team pass.

## Ben's impressions, generalized into leads

1. **Cost-table palette:** the green/brown table treatment ("weird
   Green/brown costs graph color") doesn't fit the site. Mechanism:
   `WorkshopPanel` facets (`register`, `chem`) wrapping `.pricing-table`.
   Lead: audit ALL WorkshopPanel facet palettes site-wide against the V0i
   violet/teal identity — pricing may not be the only page wearing them.
2. **Table title legibility:** "the font on the Titles is difficult to
   read" — the card-heading h2s and/or `.pricing-table` header spans inside
   those panels. Lead: check contrast + font of headings on ALL facet
   panel surfaces.
3. **Crucible icon is the worst icon.** Ben wants to see the shield
   inverted: **green shield, purple check**. Draft generated
   (`werkles-proof-shield-inverted-draft.png`, awaiting his verdict).
   Note: the crucible cost card currently wears `check-funds`, the shield
   is `nav-proof` used twice on the page. Lead: which icon slot did Ben
   mean — likely both need a look.
4. **Featured image ("Act III · nearly open"):** too construction-heavy,
   "doesn't read as partners getting ready to open."
5. **Forge-band image:** reads as "partners inventing a thing — which is a
   separate lane, which I would like to keep." Interpretation: the image
   is good but belongs to an invention/builder lane context, not the
   pricing page. Confirm with Ben if re-slotting.
6. **NARRATIVE DRIFT (the big one):** "Act III — Nearly Open" labels
   survive but the copy no longer carries the staged company-building
   narrative across pages (People, Story, Proof, Bellows, Membership as
   chapters/beats; Acts One–Five). Ben: "Maybe a little drift there over
   time, or never was included as we built, just mood that is supposed to
   be infused through the photos and copy somehow **without beating the
   user over the head with it**."

## Direction tension the crew must resolve

The queued correction "translate act-language into visitor language"
(Ender/Bean/Locke, all three) reads act-labels as internal leakage. Ben's
new signal: the narrative should SURVIVE as infused mood — subtle, not
deleted, not literal. These are compatible (kill bare "Act III" labels,
keep the arc through imagery + copy tone) but the synthesis is a design
decision. Ender leads; proposal comes back to Ben before landing.

— filed by Lady Jessica, foreman
