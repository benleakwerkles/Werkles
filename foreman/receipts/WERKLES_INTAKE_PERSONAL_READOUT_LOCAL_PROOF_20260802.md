# RECEIPT — Intake → personal matching readout (local proof)

Date: 2026-08-03 ~01:35 UTC / 2026-08-02 evening ET  
Context: `LOCAL_SALLY_WINDOWS` · `http://127.0.0.1:3001`  
Foreman: Lady Jessica

## Proof

POST `/api/bellows/intake` → **200**

- `intakeId`: `squibb_intake_20260803013453_54c27608`
- `shadow_run_id`: `shadow_20260803013453_d98582d4`
- `matching_mode`: `autonomous_matching`
- `shadow_top_eligible_path`: `find_better_job`
- meaning: Intake processed by Autonomous Matching

GET `/bellows/recommendations` shows **the submitted need**, not bakery demo:

> Need: I need a co-signer for a commercial kitchen lease in Norfolk so I can leave my corporate kitchen job.

Source label: Autonomous Matching / Your intake (scored text).  
Ledger: recent intakes listed (5 of 5 fields answered).

## Code that made it real

- `lib/squibb/public-recommendation-session-server.ts` — personal path on local/dev; hard-closed when `VERCEL_ENV=production`
- `components/squibb/concierge-intake-form.tsx` — redirect to recommendations after submit; no test-case-0 primary CTA

## Ranking repair (same session)

`lib/matching/signals.ts` — lease/co-signer/guarantor → capital; leaving a job for a
venture no longer forces `find_better_job`. Re-submit proof:

- top path: `verify_proof` (was `find_better_job`)
- #2: Find credit union
- inferred: “Funding or liquidity appears named…”
- need line still shows Norfolk co-signer lease (not bakery)

## Residual

- Production werkles.com still example-only + intake submit closed (gates unchanged)
- Browser form fill vs React controlled state still flaky for automation; API path proven

## Next

Ender + Bean packets already out. After their reply: seal sha256 → Heimerdinker push Preview-only.
