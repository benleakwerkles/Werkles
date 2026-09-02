# Receipt — VPGM: Front-door details (404, error, share cards)

Seat: **Lady Jessica (Cursor)**  
Date: 2026-07-29 ~12:29–12:55 ET  
Command: `VPGM` (third self-authored packet)

## V

`foreman/handoffs/outbox/LADY_JESSICA_V_FRONT_DOOR_DETAILS_20260729.md` —
the surfaces strangers hit *around* the pages: broken links, crashes, and
the preview card when a werkles.com link lands in a text or a post.

## P

Cockpit silent; remote still `861080c`. No packets.

## G — what changed

### Share cards (`app/layout.tsx`)

- `metadataBase` → `https://werkles.com`; title template `%s | Werkles`.
- Default title now the hero promise ("Find the people and proof that move
  your business forward") instead of "Business partner matching".
- Full OpenGraph + Twitter `summary_large_image` cards with a new 1200×630
  card (`public/assets/og/werkles-og-card.jpg`, 88 KB, derived from the
  opening-day image — no new art).
- Favicon switched off the retired board-background icon to a 256 px
  transparent V0i W (`public/assets/og/werkles-favicon-256.png`, 55 KB).
- `robots: noindex` kept on purpose — opening search indexing is Ben's call
  at launch. **Flag: remove noindex when Werkles goes public.**

### Per-route titles

`/spark` "Start free", `/space` "The place your business happens",
`/formation` "The right people", `/proof` "Proof you can check",
`/bellows` "Learn the floor", `/pricing` "Pricing" — each with a one-line
description. Client pages inherit the layout default.

### 404 (`app/not-found.tsx`)

Was a bare unstyled fragment. Now a full branded page: standard header,
"That bench is empty." with warm explanation, three ways forward (home,
Discover what you need, sign in), disclaimer footer.

### Error page (`app/error.tsx`, new)

A runtime crash previously showed the raw Next.js default. Now a branded
recovery page ("That didn't work. It's on us.") with Try again (reset) and
a way home.

## Proofs

- Build failed once on a duplicate `metadata` export in `app/spark/page.tsx`
  (the rewrite already had one — merged, kept "Start free"); second build
  green (lint + types).
- Live checks on :3000: unknown route returns HTTP 404 with the branded page
  and standard header; home HTML carries og:image/twitter card/new favicon;
  `/pricing` title renders "Pricing | Werkles".

## Slice state

`PUSH MAKER POLISH V2` re-sealed ~12:50 ET — **38 files** (added layout,
not-found, error, space, proof, and the two og assets). Manifest regenerated;
packet file list updated.

## M — closing pull

No packets waiting.

## Standing gates (unchanged)

HG-3 → HG-4 → HG-5; intake open; VPG10 push; `PUSH MAKER POLISH V2`.
New launch-day flag: drop `robots: noindex` when Ben opens the doors.
