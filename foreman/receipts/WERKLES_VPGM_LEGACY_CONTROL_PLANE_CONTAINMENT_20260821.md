# Werkles VPGM — Legacy control-plane containment

Date: 2026-08-21
Executor: Heimerdinker@Betsy / Codex Foreman
Execution context: `CODEX_LOCAL` on `LOCAL_SALLY_WINDOWS`

## Source pulled

- Operator-relayed Swanson + Dragon consensus recorded at `foreman/handoffs/inbox/FROM_SWANSON_DRAGON_LEGACY_CONTROL_PLANE_DISPOSITION_20260821.md`.
- Provenance boundary preserved: review content came through Ben; no direct mechanical custody from Swanson or Dragon is claimed.

## Containment performed

1. Replaced the prior internal-tool banner with the exact disposition label: `LEGACY DIAGNOSTICS__NOT_CURRENT_HARVEY_TRANSPORT`.
2. Removed TinkerDen Inbox packet composition and relay controls. The route now reads historical packets and answer records only.
3. Removed TinkerDen Receipts return-posting and copy-command controls, removed the posting script, and retired the stale `#receiver-handoff-ready-to-post` anchor.
4. Removed ThinkIt's Swanson polling/dispatch workbench and command dash. The route now reads historical relay evidence only.
5. Removed ThinkIt from ordinary Operator and Kind Sir navigation.
6. Removed Inbox, Receipts, and ThinkIt from the navigation of nonlegacy TinkerDen surfaces. Direct legacy pages retain a contained diagnostics switcher.
7. Preserved all historical files and read-only evidence. Nothing was deleted, migrated, pushed, deployed, or represented as current Harvey transport.

## Replacement boundary

Useful evidence remains available for later Harvey migration. The old UI is not deleted or fully retired until replacement proof exists.

## Verification

- `npm run typecheck` — PASS.
- `node scripts/foreman/test-werkles-route-audience-boundary.mjs` — PASS; internal routes remain denied in production and available on local development.
- `node scripts/foreman/sitewide-header-continuity-smoke.mjs` — PASS; 77 rendered routes, 74 shared-header routes, 3 explicit exceptions.
- `npm run build` — PASS; optimized production build compiled, typechecked, and generated 101/101 static pages.
- Rendered browser walk — PASS:
  - exact legacy label visible on Inbox, Receipts, and ThinkIt;
  - no `RELAY PACKET`, `RELAY QUESTION`, `POST RETURNED RECEIPT`, or `COPY POST COMMAND` control;
  - stale `#receiver-handoff-ready-to-post` target count is zero; replacement read-only archive target exists;
  - no legacy links on the Operator bench or nonlegacy TinkerDen bridge;
  - no browser error-level log entries.
- Local development server restored on port 3000 after the production build.
