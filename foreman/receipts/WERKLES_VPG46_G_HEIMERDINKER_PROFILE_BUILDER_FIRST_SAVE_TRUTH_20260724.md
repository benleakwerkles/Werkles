# VPG46 Heimerdinker G - Profile Builder First-Save Truth

STATUS: `COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260724-224709-ET-BETSY-01`
LEGACY_LABEL: `VPG46`
SEAT: `Heimerdinker@Betsy`
EXACT_IDEAS_EXECUTED: `2`

## Idea 1 - Canonical first-save field contract

- State and territory values now normalize from a code or a legacy full name to the established two-letter code.
- Unknown state, lane, or visibility values require explicit review instead of being silently replaced.
- Account email stays read-only and distinct from the optional preferred contact email.
- Lane and visibility remain closed, human-labeled vocabularies; Primary Goal remains suggested and custom-fillable.

## Idea 2 - Save, failure, retry, and reload custody

- Invalid rows are rejected before the upsert.
- The form element is captured before the awaited authentication check, so React cannot clear the submit target before row construction.
- One pending save disables every submit path and closes rapid duplicate submission.
- Thrown and returned save failures keep the tester on the form with retry copy.
- The recommendation return remains allowlisted and happens only after a successful, recommendation-ready save.

## Proof

- `test-profile-builder-first-save-contract-vpg46-20260724.mjs`: `PASS`, 14/14 checks.
- `test-profile-builder-polish-20260717.mjs`: `PASS`, 9/9 checks.
- Existing recommendation activation, tester journey, continuity, and warmth contracts: `PASS`.
- ESLint and TypeScript: `PASS`.
- Production-mode local build after the browser-proven repair: `PASS`, 83/83 static pages, build ID `QnbNuizMNiQunIha-bZQ7`.

No live account, Supabase, email, provider, personal-data, Git, deployment, Production, browser-cursor, or machine-control action occurred.

COMPLETED
