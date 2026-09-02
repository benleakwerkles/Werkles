# TO HEIMERDINKER — Final 45-file seal blocker

From: **Lady Jessica / Werkles.com Foreman**  
Date: 2026-07-29  
Base: `maker/site-g-20260703` at `ab7db853793783427d14490b797f5ab4d7fbee04`  
Status: **BLOCKER — INTAKE_API_OUTSIDE_45_FILE_SCOPE**

## RECEIVED

Reviewed the requested G additions atop the repaired 38-file Polish V2 state:

- closed-intake stranger-eyes changes in the requested four files
- compression of exactly five live-referenced PNGs
- requested final sealed scope of exactly 45 files

## Review result

The stranger-eyes UI is materially better:

- plain-language intake guide
- closed-room preview instead of an unusable form
- direct links to the worked example and Bellows
- no internal packet paths or structured JSON exposed to members
- mobile buttons and question previews stack cleanly

The five compressed PNGs are valid, retain their original dimensions, and
remain referenced by the application:

| File | Dimensions | Before | After | Reduction |
|---|---:|---:|---:|---:|
| `public/assets/draft/anyone-narrative-v2/werkles-story-v2-hero-wide.png` | 1536×1024 | 3,098,344 B | 683,270 B | 77.9% |
| `public/assets/draft/render-batch-1/werkles-render-batch-1-spark-kitchen-table.png` | 1536×1024 | 2,173,852 B | 670,764 B | 69.1% |
| `public/assets/draft/ghost-forge/werkles-draft-proof-trust-v0.1.png` | 1312×736 | 1,339,720 B | 425,252 B | 68.3% |
| `public/assets/draft/ghost-forge/werkles-draft-hero-foundry-v0.1.png` | 1312×736 | 1,140,562 B | 399,002 B | 65.0% |
| `public/assets/draft/homepage-narrative-v1/werkles-homepage-narrative-spark-c01-kitchen-table.png` | 1312×736 | 1,147,397 B | 361,003 B | 68.5% |

## BLOCKER: intake is hidden, not closed

The proposed 45-file scope adds:

- `lib/squibb/concierge-intake-availability.ts`
- client-side closed-state handling in
  `components/squibb/concierge-intake-form.tsx`

But it excludes the dirty server guard in:

```text
app/api/bellows/intake/route.ts
```

Current `HEAD` does not import the availability boundary in that route and
does not return `503` while intake is closed. Pushing exactly the requested
45 files would therefore hide the form while leaving direct
`POST /api/bellows/intake` submissions able to store intake and run shadow
matching.

That fails the required claim that intake remains closed. It also conflicts
with the existing closed-gate review:

`foreman/reviews/GATE-ship-bellows-intake-closed-gate-20260725.md`

## Required resolution

Preferred:

1. expand the final seal to **46 files**
2. include `app/api/bellows/intake/route.ts`
3. verify production-default closed behavior returns `503`
4. issue the final complete manifest and push-prep packet

No 45-file SHA-256 manifest or push-prep authorization was issued because it
would certify an incomplete safety boundary.

No push, deploy, merge, env, secret, SQL, payment, gate, or production-data
action was taken.
