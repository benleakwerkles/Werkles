# Werkles Full-Flock VPG28 G - Cycle Truth and Release Proof

STATUS: `COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260720-000255-ET-BETSY-01`
LEGACY_LABEL: `VPG28`
ORDINAL_CLAIM: `NONE`
OWNER: `Heimerdinker@Betsy`
PRODUCT_COMMIT: `ce058f1c4510dcb3bf1b00191155531aa2fce25e`
CANDIDATE: `dpl_DCcXKBAL8zVHuzXSHz38n8oc4Lys`

## Exactly two executed ideas

1. Added the append-only `WERKLES_VPG_CYCLE_EVIDENCE_LEDGER.jsonl` row for this cycle. It separates immutable cycle identity from the non-ordinal legacy label and records the honest historical lower bound, packets, receipts, approval, source, exact Preview, and unchanged Production.
2. Added `flock-cycle-identity-guard.mjs` plus 11 smoke fixtures. Closure now fails on reused IDs or post-protocol labels, missing packet/receipt identity, unsupported ordinal claims, continuation without a parent, or candidate/Production mismatch.

## Numbering truth

- Earliest numbered evidence: VPG2 at `1499d4b4936342d7e75b7ec4630bb5dc199add53`; VPG1 is absent.
- VPG6, VPG8, and VPG9 have proven fresh-scope reuse.
- Two additional scopes used the unnumbered `VPG` form.
- Therefore at least 31 pre-VPG28 scopes were documented or opened. Exact completed-cycle count remains unknown.

COMPLETED
