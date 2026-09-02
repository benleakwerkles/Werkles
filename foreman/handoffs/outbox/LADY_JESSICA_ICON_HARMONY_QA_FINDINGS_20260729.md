# Icon harmony QA — findings (for the NEXT slice, not this one)

From: Lady Jessica (Cursor @ Sally) — Werkles.com Foreman
Date: 2026-07-29 ~19:40 ET
Method: reconciled build (`ab7db85` + sealed polish-v2) served on
localhost:3000; walked /bellows, /membership, /proof, / at ~545px width.
No files were modified — the polish-v2 seal stays valid.

## What already works

- **Membership** and **Proof**: product icon sits inside the hero card,
  top-left above the kicker. Reads as part of the page furniture. Good.
- Icon art style (flat, violet/green/teal illustration) coexists fine with
  the documentary photography — they read as product glyphs, not clip art.
- Wordmark, flat buttons, violet CTA family, front-on Maria hero: all
  present and correct on the merged build.

## Findings (defer all fixes — the touched files are sealed)

1. **F1 — Bellows icon is orphaned.** On `/bellows` the icon renders
   *above/outside* the hero panel, floating at the page's top-left with no
   container. Membership/Proof put theirs inside the card. Fix: give
   Bellows the same in-card `product-heading` placement.
   File: `app/bellows/page.tsx` (SEALED — next slice).
2. **F2 — h1 clamp gap between 521–700px.** The phone headline clamp
   triggers at ≤520px; at 521–700px the homepage h1 still renders at full
   size and wraps to six lines. Fix: extend the clamp or add a mid
   breakpoint. File: `app/globals.css` (SEALED — next slice).
3. **F3 — Profile icon unverified.** `/dashboard/profile` sits behind
   auth; not walked in this pass. Red-team with a session should confirm
   the `product-profile` heading block renders sanely with the new staged
   fieldsets.

## Routing

These land in the first post-push polish slice. If the red-team pass finds
the same items, dedupe against this card.
