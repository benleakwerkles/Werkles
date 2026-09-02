# Receipt — VPGM: Show-humans QA sweep

Seat: **Lady Jessica (Cursor)**  
Date: 2026-07-29 ~10:55–11:10 ET  
Command: `VPGM` (first V granted to this seat)

## V

Self-authored packet: `foreman/handoffs/outbox/LADY_JESSICA_V_SHOW_HUMANS_QA_SWEEP_20260729.md`
— one honest first-time-visitor pass over every public route before humans see
the site.

## P

Cockpit (`C:\w8`) silent since morning receipt. `origin/maker/site-g-20260703`
still at `861080c`. No packets waiting.

## G — route verdicts

| Route | Verdict | What fell out |
|---|---|---|
| `/` | PASS | verified in prior cycles; no new defects |
| `/spark` | PASS | rewritten this week; clean |
| `/space` | PASS | new warm hero landed yesterday |
| `/formation` | FIXED | internal icon-comparison sheet ("not settled W-mark exploration", Render Batch notes) removed from public page |
| `/proof` | PASS | only defect was the shared draft badge (killed site-wide) |
| `/bellows` | FIXED | repo README path in public copy removed; "Route shell only… separate approval" and "Speaker-readable packet" jargon humanized |
| `/bellows/intake` | PASS | contrast fixes verified prior cycle |
| `/bellows/recommendations/test-case-0` | PASS | contrast fixes verified prior cycle |
| `/membership` | PASS | operator runbook removed prior cycle |
| `/pricing` | FIXED | old pill nav → standard SiteHeader; "Source of truth: company/PRICING.md" repo path removed; operator test-mode/Stripe-keys status note removed (pause notice still shows when checkout is paused) |
| `/login` | PASS | phone stack + contrast fixed prior cycles |
| `/signup` | FIXED | "Activation still waits on ID, face capture, phone, and proof gates" softened to invitation copy; Supabase / auth-callback debugging copy replaced with plain "try logging in" |

Site-wide: one CSS kill switch in `app/globals.css` hides every
draft-provenance badge ("Render Batch N…", "not final brand approval") — a
dozen render sites, one block, reversible by deleting it.

## Proofs

- `npm run build` green (lint + types pass, all routes compiled).
- Server restarted on :3000; `/pricing`, `/formation`, `/signup` re-inspected
  live — standard header present, internal copy gone, badges gone.

## Slice state

`PUSH MAKER POLISH V2` re-sealed at ~11:05 ET — **28 files** (added
`app/pricing/page.tsx`, `app/signup/page.tsx`, `app/formation/page.tsx`).
Manifest regenerated:
`foreman/handoffs/outbox/TO_HEIMERDINKER_MAKER_POLISH_V2_PUSH_FILE_HASHES_20260726.sha256`.

## M — closing pull

Performed after sealing; see terminal proof in session. No packets.

## Standing gates (unchanged)

HG-3 live Stripe product create → HG-4 secret entry → HG-5 paid go-live;
intake open; VPG10 push; `PUSH MAKER POLISH V2`.
