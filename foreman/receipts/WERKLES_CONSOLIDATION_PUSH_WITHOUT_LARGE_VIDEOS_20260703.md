# Werkles consolidation push without large browser-capture videos

RECEIPT_ID: RECEIPT_WERKLES_CONSOLIDATION_PUSH_WITHOUT_LARGE_VIDEOS_20260703
TIMESTAMP: 2026-07-03T02:25:00-04:00
MACHINE: BETSY
BRANCH: consolidation/werkles-unified-20260702-push

## Change

Squashed consolidation lane onto `origin/main` for push. Excluded `foreman/receipts/browser-capture/playwright-video/*.webm` (>100MB GitHub limit).

## Why

Initial push of `consolidation/werkles-unified-20260702` was rejected by GitHub pre-receive hook for 463MB and 542MB Playwright recordings.

## Backup

Local history preserved on `backup/consolidation-pre-push-20260703`.
