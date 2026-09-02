# Werkles VPGM — Harvey legacy-evidence bridge

Date: 2026-08-21
Executor: Heimerdinker@Betsy / Codex Foreman
Execution context: `CODEX_LOCAL` on `LOCAL_SALLY_WINDOWS`

## Controlling evidence

- Vision: `foreman/handoffs/outbox/HEIMERDINKER_V_HARVEY_LEGACY_EVIDENCE_BRIDGE_20260821.md`.
- Review: Operator-relayed Swanson + Dragon disposition recorded at `foreman/handoffs/inbox/FROM_SWANSON_DRAGON_LEGACY_CONTROL_PLANE_DISPOSITION_20260821.md`.
- Provenance boundary: no direct mechanical custody from Swanson or Dragon is claimed.

## What was preserved

- Every historical TinkerDen and ThinkIt file remains untouched.
- Read-only counts and provenance from command packets, command receipts, receiver handoffs, and the latest archived ThinkIt return are now summarized inside `/nerdkle`.
- The summary separates synthetic records and states plainly that old receiver hashes are not current Harvey custody.
- Direct diagnostic pages remain available with the legacy label while replacement proof is incomplete.

## What was not restored

- No legacy dispatch, polling, posting, approval, copy-command, or command-composition capability.
- No ordinary-navigation link back into the legacy screens.
- No provider, credential, secret, SQL, schema, push, deploy, or production work.

## Verification

- `npm run typecheck` — PASS.
- Rendered `/nerdkle` browser walk — PASS: four evidence cards render with current archive counts, the preservation boundary is visible, no legacy diagnostic links appear, and no browser error-level logs were recorded.
- `npm run build` — PASS; optimized production build compiled and generated 100/100 static pages. `/nerdkle` is intentionally dynamic so the read-only archive counts do not freeze at build time.
- Local development server restored on port 3000 after build verification.
