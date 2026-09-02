# Heimerdinker receipt — VPGM funnel, weight, icon QA, HG-3 hands

Date: 2026-07-29  
Machine: **Betsy**  
Seat: **Heimerdinker / Dink**  
Branch base: `maker/site-g-20260703` at
`ab7db853793783427d14490b797f5ab4d7fbee04`  
Status: **COMPLETED — SEALED, NOT PUSHED**

## V / P

Pulled and serviced:

- `LADY_JESSICA_V_FUNNEL_AND_WEIGHT_20260729.md`
- `TO_HEIMERDINKER_MAKER_POLISH_V2_RESEALED_PUSH_PREP_20260729.md`
- `LADY_JESSICA_V_ICON_HARMONY_AND_HG3_RUNBOOK_20260729.md`
- current Flock state, gate log, and VPG shorthand

Lady Jessica recovered the exact six-file Polish V2 source from the stash,
merged it over the landed icon commit, and verified the repaired 38-file
base before Heimerdinker changed the active slice.

## G — two strongest ideas

### 1. Closed funnel stranger-eyes sweep

- removed redundant intake navigation
- rewrote the guide around discovering the real need
- replaced the closed production form with three preview questions and a
  worked-example path
- kept the standard Werkles header
- stacked navigation, preview cards, and actions cleanly on phones
- retained the server-side closed guard

### 2. Public-route page weight

Five actively selected PNGs were recompressed in place with dimensions
retained. Combined size:

```text
8,899,875 bytes -> 2,539,291 bytes
71.5% reduction
```

The five measured 40.08–43.10 dB PSNR at display size. Declaration-only
v0.2 alternates were not churned.

## Final seal

Lady Jessica caught that the client-only 45-file proposal omitted the
already-written API route guard. The final honest scope was expanded to 46
files:

- client closed state
- server `POST /api/bellows/intake` closed state
- repaired Polish V2
- five optimized images

Final packet:
`TO_HEIMERDINKER_MAKER_POLISH_V2_FUNNEL_WEIGHT_FINAL_46_PUSH_PREP_20260729.md`

Final manifest:
`TO_HEIMERDINKER_MAKER_POLISH_V2_FUNNEL_WEIGHT_FINAL_46_FILE_HASHES_20260729.sha256`

Independent Heimerdinker verification: **46/46 hashes match, zero
duplicates, zero failures.**

## M — Momentum repull

A new Lady Jessica Vision packet arrived and both ideas were serviced
without touching the sealed product files.

### 1. Icon harmony QA

Walked Bellows, Membership, Profile, and Proof at desktop and phone widths.
All product icons loaded, remained crisp and transparent, and caused no
overflow. Findings were consolidated into:

`LADY_JESSICA_ICON_HARMONY_QA_FINDINGS_20260729.md`

### 2. HG-3 operator runbook

Consolidated one names-only, ten-minute card for the two approved live
Foundry products:

`TO_OPERATOR_HG3_TEN_MINUTE_RUNBOOK_20260729.md`

It includes exact product names, prices, billing periods, vault/env field
names, Stripe click path, copy-to-live shortcut, and completion readback.
No Stripe action was taken.

## Checks

- `npm.cmd run typecheck`: **PASS**
- production `npm.cmd run build`: **PASS** — 83/83 routes
- ten public routes: **200**
- closed intake direct POST: **503**
- desktop 1440×1000: no overflow, no failed requests
- phone 390×844: no overflow, no failed requests
- visual contrast regression caught and repaired before final seal
- final 46-file SHA-256 manifest: **PASS**

## Hard stops preserved

- intake remains closed
- no push, deploy, merge, environment, secret, SQL, payment, Stripe, or
  production-data action
- final slice remains held for Ben's push authority

