# TO_HEIMERDINKER — people-v1 photography + clear-v1 icons — PUSH PACKET

From: Lady Jessica (Cursor foreman) — `foreman/SEAT_IDENTITY_LADY_JESSICA.md`
Date: 2026-08-02 ~03:20 ET
Status: **WORK FINISHED — BEN'S PHRASE ALREADY SPOKEN.**

Ben's directive, verbatim (2026-08-02 ~02:40 ET): "Alright, show me the site
with what I gave you and what you've got, your best version of the site, with
the red team's input, as well. **Push it. Go.**" The phrase is on the record;
no further hold. Verify hashes, stage the slice, push to
`origin/maker/site-g-20260703`.

## Gate phrase (already given)

```text
PUSH IT. GO.  (Ben, 2026-08-02, people-v1 + clear-v1 scope)
```

## Slice (35 files)

Verify against
`TO_HEIMERDINKER_PEOPLE_V1_CLEAR_ICONS_PUSH_FILE_HASHES_20260802.sha256`
(same folder) before staging. Hash mismatch = STOP and report.

```text
app/globals.css
app/spark/page.tsx
app/bellows/page.tsx
app/signup/page.tsx
components/pricing/pricing-table.tsx
lib/site-icons.ts
lib/documentary-lane-imagery.ts
lib/tier2-page-imagery.ts
lib/narrative-arc.ts
lib/anyone-narrative-v2-imagery.ts
public/assets/brand/product-icons/clear-v1/icon-backer-coins.png
public/assets/brand/product-icons/clear-v1/icon-bellows.png
public/assets/brand/product-icons/clear-v1/icon-builder-hammer.png
public/assets/brand/product-icons/clear-v1/icon-connector-plug.png
public/assets/brand/product-icons/clear-v1/icon-crucible-ribbon.png
public/assets/brand/product-icons/clear-v1/icon-move-opensign.png
public/assets/brand/product-icons/clear-v1/icon-name-penciltag.png
public/assets/brand/product-icons/clear-v1/icon-operator-clipboard.png
public/assets/brand/product-icons/clear-v1/icon-spark-match.png
public/assets/brand/product-icons/clear-v1/icon-squibb-owl.png
public/assets/brand/product-icons/clear-v1/icon-verify-stamp.png
public/assets/brand/product-icons/clear-v1/icon-worker-glove.png
public/assets/draft/people-v1/people-baker-portrait.png
public/assets/draft/people-v1/people-barber-sweeping.jpg
public/assets/draft/people-v1/people-bellows-learning.jpg
public/assets/draft/people-v1/people-boxes-through-door.jpg
public/assets/draft/people-v1/people-first-customer.jpg
public/assets/draft/people-v1/people-florist-lean.png
public/assets/draft/people-v1/people-open-sign-flip.jpg
public/assets/draft/people-v1/people-partners-cafe.png
public/assets/draft/people-v1/people-partners-clipboard.png
public/assets/draft/people-v1/people-spark-idea-moment.jpg
public/assets/draft/people-v1/people-stepladder-lamp.jpg
public/assets/draft/people-v1/people-vet-exam.jpg
public/assets/draft/people-v1/place-space-just-leased.jpg
```

Do NOT stage `public/assets/brand/product-icons/clear-v1/raw/` (source
plates, local provenance only) and nothing else from the dirty tree.

**Overlap notice:** `app/globals.css`, `app/spark/page.tsx`,
`app/bellows/page.tsx`, `app/signup/page.tsx`, `lib/copy.ts`-adjacent files
in this slice also carry the still-unpushed MAKER_POLISH_V2 edits (button
shadows, CTA wording, phone pass) plus later copy cycles. Shipping this
slice ships those too — intentional; all of it is owner-approved
walkthrough work. If the MAKER_POLISH_V2 phrase arrives later, diff first;
most of it will already be live.

## What ships (visible on werkles.com)

1. **clear-v1 icon family, site-wide** (Ben's MJ keepers + in-house fills,
   one-second rule, red-teamed): match=Spark, hammer=Builder, glove=Worker,
   clipboard=Operator, coins=Backer, plug+socket=Connector on lane cards and
   the pricing/billing/crucible icon rails; pencil-tag=Name it,
   clipboard=Translate, stamp=Check proof on the homepage steps;
   ribbon=Proof/Crucible; bellows=Bellows; OPEN sign=Membership.
   Backgrounds stripped, 512px transparent, hammer's AI micro-text cleaned.
2. **people-v1 photography** replacing dim/CGI renders: bright cafe pair on
   the homepage hero (single CSS layer — ghost 1.1MB second fetch removed);
   baker portrait on homepage Spark lane + vet exam on Operator lane;
   `/spark` hero (idea moment) + all-photoreal industry strip
   (florist/vet/barber); `/space` hero (keys + lease storefront);
   `/formation` hero (partners + clipboard); `/proof` hero (barber);
   pricing "week before open" (stepladder lamp); membership opening-day
   sign flip + first-customer band; signup idea-moment figure;
   membership success "moving in" (boxes through door); billing
   first-customer; crucible checklist-review band; `/bellows` real-lesson
   photo. Heavy PNGs recompressed to ~130-225KB JPEGs.
3. **Red-team fixes** (Demo stranger-eyes pass, 18 findings, 12 fixed):
   step icons re-matched to card copy, signup dead-config fixed, photo
   repeats de-duplicated, alt text describes only what's visible, pricing
   reading-guide icon corrected, bellows caption honest about the home
   scene.

## Proofs already run

- `npm run build` green twice (85/85 routes, lint + types), last at
  2026-08-02 ~03:18 ET after the JPEG conversion.
- Rendered checks on localhost:3000 production server: homepage (hero, lane
  icons, step icons), /pricing, /membership, /spark (hero + strip), /space
  — all verified by screenshot.
- Red team: full findings list in the foreman session record; deferred
  items logged below.

## Deferred (logged, not blockers)

- Homepage lane grid still mixes 2 photoreal + 4 render photos; visual-story
  Maria beats and /formation, /proof, /space galleries remain render-batch.
  Next people-v1 round.
- Icon family spans several render treatments (sticker/flat/ink); a
  normalization pass is queued.
- SVG error-fallbacks in `icon-fallback.tsx` still draw the old metaphors.
- `icon-squibb-owl.png` ships unwired (future Squibb chip).

## Rules

- Intake stays CLOSED. No env/secret changes. Production deploy after push
  follows the standing Production promotion gate.
