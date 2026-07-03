# ARTIFACT_DELIVERY_PIPELINE_REPORT.md

Date: 2026-06-17
Project: Artifact Delivery Pipeline
Owner: Dink @ Betsy

## Mission

Every completed relay task must return a tangible artifact.

Allowed artifacts:

- screenshot
- screen recording
- URL
- commit hash
- receipt file
- diff
- generated report

Not allowed as completion proof:

- architecture description
- implementation plan
- future-state explanation
- recommendation without artifact
- packet/outbox transport files by themselves

## Build

Added `ARTIFACT_REQUIRED` to relay cards.

Current relay cards have `ARTIFACT_REQUIRED: true`.

Relay receipts now carry:

- `ARTIFACT_REQUIRED`
- `artifact_gate`
- `artifacts`

The relay card view now computes an artifact gate for old and new receipts.

## Enforcement

A task cannot appear as `RECEIPT RETURNED` unless at least one allowed completion artifact exists.

If a receipt claims `RECEIPT RETURNED` without an allowed artifact, SoleDash surfaces the card as `BLOCKED` with:

`ARTIFACT_REQUIRED: task cannot move to RECEIPT RETURNED without screenshot, screen recording, URL, commit hash, receipt file, diff, or generated report.`

## Acceptance

Ender can audit actual builds from visible artifacts instead of proposed builds from packet text alone.

Verification artifact for this task: this generated report.
