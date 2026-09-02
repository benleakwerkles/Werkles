# TO_HEIMERDINKER — Maker polish v2 slice — PUSH PREP PACKET

From: Lady Jessica (Cursor) — formerly mis-signed "Maker @ Sally"; see
`foreman/SEAT_IDENTITY_LADY_JESSICA.md`  
Date: 2026-07-26 (re-sealed 2026-07-29 ~12:50 ET after the front-door
details cycle; **reconciled + re-sealed again 2026-07-29 ~19:15 ET** —
answers `TO_LADY_JESSICA_POLISH_V2_SEAL_DRIFT_BLOCKER_20260729.md`)  
Status: **WORK FINISHED — HOLD FOR BEN'S PHRASE.**

Base is now **`ab7db85`** (`Add Lady Jessica product icons`) on
`origin/maker/site-g-20260703`. The six files your preflight flagged as
MISMATCH now carry the polish edits merged **on top of** the live icon
slice (icon imports, `SiteIcon` wiring, and Dues→Membership rename all
preserved — verified by grep and a green `npm run build`, 2026-07-29
~19:10 ET). Two more hashes moved since the 07-26 manifest for honest
reasons: `app/bellows/intake/page.tsx` picked up the later de-jargon copy
cycle, and `werkles-story-v2-hero-wide.png` is the approved front-on Maria
(visually re-verified before this seal).

## Gate phrase (Ben says it, nobody else)

```text
PUSH MAKER POLISH V2
```

## Slice (38 files only)

Front-door additions (2026-07-29 midday): `app/layout.tsx` (og/twitter share
cards, metadataBase, title template, favicon → transparent W; robots noindex
kept for pre-launch), `app/not-found.tsx` (branded 404 with header + CTAs),
`app/error.tsx` (new branded recovery page), per-route titles on
`app/{spark,space,formation,proof,bellows,pricing}/page.tsx`, plus two light
assets `public/assets/og/werkles-og-card.jpg` (88 KB) and
`public/assets/og/werkles-favicon-256.png` (55 KB).

QA-sweep additions (2026-07-29 morning): `app/pricing/page.tsx` (standard
header, repo-path + operator test-mode copy removed), `app/signup/page.tsx`
(Supabase/auth-callback copy humanized), `app/formation/page.tsx` (internal
icon comparison sheet removed). `app/globals.css` also gained a kill switch
hiding all draft-provenance badges; `lib/copy.ts` gained softened signup +
bellows shell copy.

First-session sweep additions (2026-07-29 midday): `app/onboarding/page.tsx`
(Arena/Turf/"Set the First Weld"/"the machine" dialect → plain words),
`app/login/page.tsx` (Supabase/auth-callback debug copy removed),
`app/dashboard/member-dashboard-client.tsx` (operator gate-status line off
the member floor), `app/membership/page.tsx` status line humanized.

```text
app/globals.css
app/error.tsx
app/layout.tsx
app/not-found.tsx
app/bellows/page.tsx
app/bellows/intake/page.tsx
app/bellows/recommendations/page.tsx
app/bellows/recommendations/test-case-0/page.tsx
app/dashboard/member-dashboard-client.tsx
app/dashboard/profile/page.tsx
app/formation/page.tsx
app/login/page.tsx
app/membership/page.tsx
app/onboarding/page.tsx
app/pricing/page.tsx
app/proof/page.tsx
app/signup/page.tsx
app/space/page.tsx
app/spark/page.tsx
components/foundry/hero-copy-block.tsx
components/foundry/hero-static.tsx
components/foundry/site-header.tsx
components/narrative/narrative-act-page-layout.tsx
lib/copy.ts
lib/documentary-lane-imagery.ts
lib/narrative-arc.ts
lib/tier2-page-imagery.ts
public/assets/og/werkles-og-card.jpg
public/assets/og/werkles-favicon-256.png
public/assets/draft/anyone-narrative-v2/werkles-story-v2-hero-wide.png
public/assets/draft/industry-breadth/werkles-collab-coffee-plans.png
public/assets/draft/industry-breadth/werkles-industry-florist.png
public/assets/draft/industry-breadth/werkles-industry-veterinarian.png
public/assets/draft/industry-breadth/werkles-industry-dj.png
public/assets/draft/industry-breadth/werkles-opening-day-sign.png
public/assets/draft/industry-breadth/werkles-industry-accountant.png
public/assets/draft/industry-breadth/werkles-industry-dogwalker.png
public/assets/draft/industry-breadth/werkles-space-just-leased.png
```

**VPG10 overlap notice:** the four bellows page files also carry the earlier
de-jargon copy edits that were already sitting uncommitted in this tree
(friendlier intake guide, "Your recommendations", "See an example"). Shipping
this slice therefore subsumes that part of the held
`PUSH VPG10 UI UX SCOPE ONLY` slice. Intentional — the copy answers the same
owner-walkthrough direction. If Ben later says the VPG10 phrase, diff first;
some of it will already be live.

Verify against
`TO_HEIMERDINKER_MAKER_POLISH_V2_PUSH_FILE_HASHES_20260729_RESEAL.sha256`
(same folder) before staging. The 20260726 manifest is retired — superseded
by the reseal after the icon-slice reconciliation. Hash mismatch against
the RESEAL manifest = STOP and report.

Do NOT push `werkles-story-v2-hero-wide-KNEADING-BACKUP.png` or anything else
in the dirty tree.

## What ships (visible on werkles.com)

1. **No button shadows, site-wide** (Ben: shadows read as dirty). Global
   flat-button kill switch plus shadow removal from the V0i CTA blocks.
2. **New front-on hero** — same Maria, facing camera, calm and quietly
   confident, replacing the sad side-view kneading shot.
3. **Hover/press motion** — CTAs lift on hover, settle on press; ghost
   buttons answer in brand violet; brand-tinted text selection;
   `prefers-reduced-motion` respected.
4. **Footer brand seam** — thin solid-violet line replaces the copper
   hairline; centered disclaimer.
5. **Hero CTA color unify** — hero "Tell us what you need" joins the violet
   primary family (was teal, mismatched the identical header CTA).
5a. **Solid-color buttons** (owner walkthrough 2026-07-27): primary CTAs are
   solid #4520c9 violet, secondary CTAs solid #027665 teal. The V0i
   wave/gradient now lives only in the wordmark, per Ben's direction that
   the wave belongs to the logo, not every control.
5b. **Membership page wears the standard Werkles header** (owner walkthrough:
   reduced header is for focused tasks like login, not the public sales
   page). The pill nav and act rail on `/membership` are gone; the operator
   "Before you click Pay" runbook panel is removed from the public page
   (still lives at `/operator/gate-knockout/test-checkout-smoke`).
5c. **Owner CTA direction, verbatim** — hero primary now reads "Let us help
   you discover what you need"; the header pill carries the compact
   "Discover what you need". One obvious primary action in the hero cluster.
5d. **Mobile image consolidation** (owner walkthrough: reduce repeated image
   libraries on mobile) — under 520px each page keeps its one featured
   image; decorative icon rails and secondary forge bands are hidden.
5e. **Nav de-stack on public Bellows pages** (owner walkthrough: primary nav
   stacked above Act nav is repetitive and clunky) — `/bellows`,
   `/bellows/intake`, `/bellows/recommendations`, and the test-case
   walkthrough no longer render the act journey rail under the site header;
   their contextual sub-nav (Back to Bellows / Your recommendations / See an
   example) remains. Login/signup/onboarding keep the rail — it is their
   only nav.
5f. **Membership contradiction fix** — the "Payments are paused" panel
   rendered unconditionally, directly under a status line saying checkout is
   open. It now renders only when checkout is actually paused.
5g. **Story page rebuild** (owner walkthrough: the Story/Spark page must
   clearly explain what Werkles is and what signing up provides) —
   `/spark` now answers plainly: what Werkles is, what a free account gets
   you, what Dues add, the Bellows/Foundry/Workshop taxonomy in three
   chips, and who it is for. Hero swaps the abstract kitchen-table shot for
   a coffee-table collaboration scene (Ben's keep list). Act rail dropped
   from `NarrativeActPageLayout` (de-stacks /spark, /space, /proof,
   /formation — all mount SiteHeader).
5h. **Industry-breadth image library, seven images** (owner walkthrough:
   broaden beyond construction-heavy imagery) — coffee collaboration,
   florist, veterinarian, DJ, opening-day sign, accountant, dog walker;
   warm documentary style, compressed for web (~0.6–0.85 MB each), in
   `public/assets/draft/industry-breadth/`. Three portraits ship on the
   Story page; the rest are buffer for the site.
5i. **Homepage hero de-worded** (owner walkthrough: too wordy, keep the
   strongest thought) — the hero drops the stacked positioning /
   before-state / signup-preview paragraphs; headline + subhead + CTAs +
   one trust line remain.
5j. **Membership sells the leap** (owner walkthrough: first customer, first
   sale, opening day; work-van image bleak) — headline "Dues buy the runway
   to your first customer," concrete unlock bullets stating exactly what
   payment opens, de-jargoned monthly plan body, and the bleak van-at-dawn
   featured image replaced with a warm opening-day sign-hanging scene.
5k. **Act pages speak plainly** — /space, /formation, /proof headlines and
   ledes rewritten from art-direction poetry ("The room waits — paused,
   not empty") to human explanation, matching the Story page rebuild.
5l. **Six lanes, six trades** (owner walkthrough: broaden beyond
   construction-heavy imagery) — the homepage lane cards now carry the
   industry-breadth photos: DJ (Spark), florist (Builder), dog walker
   (Worker), vet (Operator), accountant (Backer), coffee collaboration
   (Connector). Signup's featured image is the coffee collaboration scene.
   Maria's story beats 2–5 drop their photos on phones (words stay).
5m. **Profile Builder staged flow** (owner walkthrough: split autofill facts
   from narrative discovery; guided choices for Timeline and Primary Goal;
   less intimidating) — same fields, same save handler, regrouped into
   three numbered stages (The facts / Your work / Your story) with
   autocomplete attributes on identity fields and datalist guided-plus-
   custom entry on Timeline and Primary Goal.
5n. **Home value fold de-worded** — one strong thought per card. /space act
   hero swapped to a warm just-leased storefront scene (keys on counter).
6. **Phone pass (≤520px)** — header stacks (brand / actions / nav) instead of
   "Sign in" overlapping the wordmark; hero headline scales down from 51px to
   ~39px; hero actions go full-width.
7. **Login auth panel stacks on phones** — the split layout's doubled
   selector was beating its own 900px collapse; restated at matching
   specificity so the form gets full width under 900px.
8. **Squibb walkthrough dark-card rescue** — `/bellows/recommendations/
   test-case-0` had invisible ink (1.0–1.8:1) on its five dark surfaces
   (flow rail, symptom quote, confidence card, alt chips, experiment cards);
   they now carry cream ink. Dark-cockpit eyebrows (intake, squibb pages)
   get light violet instead of the paper violet.

## Proofs already run by Maker

- `npm run build` green (83/83 routes, lint + types pass, 2026-07-27 ~14:33 ET)
- Rendered check on localhost:3000 (`next start` on the new build): desktop
  and phone emulation both verified by screenshot, including `/membership`
  with the standard header and no operator runbook.

## Red-team before the phrase (Operator directive, 2026-07-29)

Ben: the cousins red-team the foreman's work. Before Ben's push phrase is
serviced, the red-team pass should run — hash-verify, build, and click the
public routes. Assigned 2026-07-30: **Locke** (merge-logic pass on the six
reconciled files — `TO_LOCKE_LEGAL_DRAFTS_AND_SEAL_REDTEAM_20260730.md`)
and **Demo** (stranger-eyes walk of the public funnel —
`TO_DEMO_STRANGER_EYES_REDTEAM_20260730.md`). Ender and Bean remain
welcome on top. Findings land as blocker cards in the outbox, same
protocol as the seal-drift card. No findings after a pass = note it in
your receipt and proceed on Ben's phrase.

## Rules

- Intake stays CLOSED. No env/secret changes. Production deploy after push
  follows the standing Production promotion gate.
