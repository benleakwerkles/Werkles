# TO HEIMERDINKER — Maker Polish V2 + Funnel/Weight final push prep

From: **Lady Jessica / Werkles.com Foreman**  
Date: 2026-07-29  
Base: `maker/site-g-20260703` at `ab7db853793783427d14490b797f5ab4d7fbee04`  
Status: **COMPLETE AND SEALED — HOLD FOR BEN'S PUSH AUTHORITY**

This packet supersedes the temporary 45-file blocker. Foreman authorized the
honest 46-file scope by adding the server-side intake route guard.

## Final scope — exactly 46 files

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
app/bellows/intake/concierge-intake.css
components/squibb/concierge-intake-form.tsx
lib/squibb/concierge-intake-availability.ts
public/assets/draft/render-batch-1/werkles-render-batch-1-spark-kitchen-table.png
public/assets/draft/ghost-forge/werkles-draft-proof-trust-v0.1.png
public/assets/draft/ghost-forge/werkles-draft-hero-foundry-v0.1.png
public/assets/draft/homepage-narrative-v1/werkles-homepage-narrative-spark-c01-kitchen-table.png
app/api/bellows/intake/route.ts
```

Verify every path against:

`TO_HEIMERDINKER_MAKER_POLISH_V2_FUNNEL_WEIGHT_FINAL_46_FILE_HASHES_20260729.sha256`

Hash mismatch is a hard stop.

## What the final additions do

### Funnel room

- de-jargons `/bellows/intake`
- removes redundant journey navigation
- replaces the unavailable form with a useful question preview and worked
  example while production intake is closed
- keeps member-facing output free of packet paths and raw structured JSON
- stacks preview cards and buttons cleanly on phones

### Intake safety boundary

- production defaults closed when no open flag is set
- the client does not render or submit the form while closed
- `POST /api/bellows/intake` returns `503` while closed
- no intake-open environment flag was set

### Public page weight

Five live-referenced PNGs were recompressed in place without changing their
dimensions. Combined size fell from 8,899,875 bytes to 2,539,291 bytes,
reducing this group by 71.5%.

## Verification

- exact scope: **46 paths, zero duplicates**
- fresh SHA-256 manifest: **46/46 match**
- `npm.cmd run typecheck`: **PASS**
- existing build receipt / runnable production build: **PASS**
- production-default closed runtime smoke:
  `POST /api/bellows/intake` → **503**
- targeted `git diff --check`: **PASS**
- five PNGs: valid, original dimensions retained, live references confirmed

The older untracked source-smoke script is not part of this 46-file seal and
contains a stale comment-string assertion. The runtime `503` smoke above is
the authoritative closure check.

## Push hands

Heimerdinker owns integration and push. Stage exactly the 46 paths above,
verify the fresh manifest, and inspect staged scope before committing.
Do not stage this dirty tree broadly.

The later Icon Harmony / HG-3 V packet has been pulled but remains queued
until this active Funnel/Weight cycle is sealed and handed off.

No push, deploy, merge, env, secret, SQL, payment, gate, or production-data
action was taken.
