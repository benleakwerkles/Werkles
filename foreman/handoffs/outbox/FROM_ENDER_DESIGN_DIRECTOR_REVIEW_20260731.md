# FROM ENDER — Design Director Review of werkles.com (2026-07-31)

**Reviewer:** Ender (design-judgment seat) — full report in foreman archive;
this card is the working digest for the corrections draft.
**Scope:** all six production pages + shipped `globals.css` + production imagery.
**Overall:** system is sound (type, color, button law, photography world).
Remaining gap is editorial: "the site still talks to itself in front of
guests." No new design work required — one sweep with the test *does this
string/image speak to the visitor, or to the crew?*

## Per-page, highest-payoff change each

| Page | Verdict | One change with most payoff |
|---|---|---|
| Home | Confident opening, unedited ending | Collapse the bottom third: "Safe to act, not alone." + body copy duplicated verbatim (proof band vs Formation ops-card); dedupe, end the page once |
| Spark | Cleanest structure | Promote the "Three rooms, plain names" strip (Bellows/Foundry/Workshop) — it is the site-wide jargon decoder, currently the least prominent thing on the page. Kill "Continue → Act II — Space" act-language |
| Pricing | Best information design | Move the tier2 photo band below the plan grid — prices first. Also: plan-card grammar differs between pricing and membership (h2 = name vs h2 = price); pick one |
| Membership | Best headline on site | Put the violet primary on the featured card's CTA — button hierarchy is currently inverted vs card hierarchy. Remove the orphaned second icon-rail block under the hero |
| Bellows | Two Squibbs problem | Strip visible internal figcaptions ("draft exploration, not canonical cutout" etc. — unclassed figcaptions missed by the CSS kill switch); cut hero from four buttons (two both-primary) to one primary + one outline |
| Signup | Best form, no way home | Add site header / brand mark linking home. Rename journey-rail labels from internal codenames (spark/space/forge/foundry). "Act I — Spark" figcaption leak |

## Cross-site calls

1. **Squibb unification (big):** homepage uses a photoreal brass 3D owl;
   Bellows uses a flat-illustrated owl. Flat one is correct — same family as
   lady-jessica icons. One Wonka, not two.
2. **Extend caption kill switch** to unclassed figcaptions, or better,
   remove the strings at source.
3. **Translate act-language** (Act I–IV, beats, spark/space/forge/foundry
   codenames) into visitor language everywhere it renders publicly.

## Verdicts on queued corrections

- **(a) Jargon definitions — DO.** Define once at first appearance as an
  appositive, then use with confidence. "Foundry Dues — the $9.99/month
  membership —"; Crucible card heading becomes "Crucible — our verification
  desk"; Bellows first body use: "Bellows, the free learning floor."
  Repeated parentheticals = apologizing for your own vocabulary.
- **(b) Face capture — DO DIFFERENTLY.** Don't euphemize; specify.
  Homepage gate-list "ID, face, phone" becomes: "verify your ID and phone —
  a photo match to your ID comes only when you ask to be vouched for."
  Same fact, right frame. Signup soft copy is already right; leave it.
- **(c) Honest-answers prominence — DO GENTLY.** Keep placement and calm.
  Raise card surface from rgba(255,255,255,0.55) to the elevated paper
  token; set the four h3s in Fraunces one step larger; optional copper
  numerals 1–4 ("honest math shown as math").

## Status

Bean's attack pass still running. When it lands: foreman merges both into a
corrections draft, the draft goes back through the red team (per the
two-ended walkthrough loop, `foreman/LANES.md`), then lands.

— filed by Lady Jessica, foreman
