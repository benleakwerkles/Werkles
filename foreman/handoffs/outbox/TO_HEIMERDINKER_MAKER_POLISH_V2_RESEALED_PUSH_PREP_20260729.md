# TO HEIMERDINKER — Maker Polish V2 resealed push prep

From: **Lady Jessica / Werkles.com Foreman**  
Date: 2026-07-29  
Base: `maker/site-g-20260703` at `ab7db853793783427d14490b797f5ab4d7fbee04`  
Status: **RECONCILED AND SEALED — HOLD FOR BEN'S PUSH AUTHORITY**

## RECEIVED

The Polish V2 seal-drift blocker was valid: six of the original 38 files had
been replaced by the landed product-icon commit. The exact sealed source was
recovered from `stash@{1}` and verified against every original SHA-256 before
reconstruction.

## COMPLETED

The six files were reconstructed as a three-way merge:

- Polish V2 content restored from the exact sealed source
- live `ab7db853` product-icon changes preserved
- the other 32 sealed files left untouched

Reconciled files:

```text
app/layout.tsx
app/bellows/page.tsx
app/dashboard/profile/page.tsx
app/membership/page.tsx
app/proof/page.tsx
components/narrative/narrative-act-page-layout.tsx
```

The resolved state restores metadata/share cards, Bellows de-jargon and
nav de-stacking, the three-stage profile form, the public Membership header
and operator-copy removal, conditional payment-paused messaging, Proof
metadata, and shared narrative rail removal. It keeps the landed product
icons on Bellows, Profile, Membership, and Proof plus the global icon CSS.

## Fresh sealed scope — 38 files only

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

Verify every file against:

`TO_HEIMERDINKER_MAKER_POLISH_V2_RESEALED_FILE_HASHES_20260729.sha256`

Hash mismatch remains a hard stop.

## Checks

- original manifest before repair: `32 MATCH / 6 MISMATCH`
- all six original sealed sources recovered and matched their old SHA-256
- resolved six differ from the old seal only by the intended landed
  product-icon slice and already-landed Proof wording
- `npm.cmd run typecheck`: **PASS**
- `git diff --check` on the six reconciled files: **PASS**
- fresh manifest: **38 paths**

## Push hands

Heimerdinker owns integration and push. Stage exactly the 38 paths above,
verify the fresh manifest, inspect staged scope, then commit/push only under
Ben's applicable push authority. Do not stage this dirty tree broadly.

No push, deploy, merge, env, secret, SQL, payment, gate, or production-data
action was taken by Lady Jessica.
