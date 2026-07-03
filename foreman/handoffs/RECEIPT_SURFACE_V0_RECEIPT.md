# RECEIPT_SURFACE_V0 Receipt

Producer: Dink2@Sally
Consumer: TinkerDen Intake / Speaker

## SOURCE COUNT

24

## PATH

- `foreman/artifacts/receipt_sources.json`
- `scripts/inventory-receipt-sources.mjs`
- `foreman/handoffs/RECEIPT_SURFACE_V0_RECEIPT.md`

## PASS/FAIL

PASS

- `node scripts\inventory-receipt-sources.mjs` wrote 24 receipt sources to `foreman/artifacts/receipt_sources.json`.
- `node --check scripts\inventory-receipt-sources.mjs` passed.
- Shape check passed: every source has exactly `path`, `receipt_type`, `producer`, and `consumer`.
