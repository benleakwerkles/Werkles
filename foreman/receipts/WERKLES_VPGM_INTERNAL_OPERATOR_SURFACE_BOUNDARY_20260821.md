# WERKLES VPGM RECEIPT — Internal Operator Surface Boundary

Date: 2026-08-21
Foreman: Heimerdinker / Codex on BETSY
Execution context: `CODEX_LOCAL / LOCAL_SALLY_WINDOWS`

## Operator question

What purpose do `/tinkerden/receipts`, `/tinkerden/inbox`, and `/thinkit` serve, and do Swanson or the Dragon need notification?

## Finding

These are internal build/relay tools, not Werkles member features.

- **TinkerDen Inbox:** creates file-backed internal command packets and attempts a receiver relay.
- **TinkerDen Receipts:** shows returned ACK/BLOCKER/ARTIFACT evidence, synthetic receiver-handoff smoke records, and local receipt-posting controls.
- **ThinkIt:** a large internal control surface for the Swanson relay, Aeye questions, source-truth readback, returned work, and book packets.

The repo already enforces the technical audience boundary: `lib/route-audience.ts` classifies these paths and APIs as internal; middleware returns 404 outside localhost development or an explicitly protected preview. Customer/member navigation does not link to them. `/operator` and their own internal switcher do.

The practical confusion was visual and contextual: the normal Werkles public/member header sat directly above raw internal controls with no explanation.

## V

`foreman/handoffs/outbox/HEIMERDINKER_V_INTERNAL_OPERATOR_SURFACE_BOUNDARY_20260821.md`

## P / CBCC truth

- Fresh Ender and Computer/Thufir packets were authored.
- Both established desktop CDP routes timed out before accepted dispatch. No review or participation is claimed.
- A Swanson ownership packet was authored at `foreman/handoffs/outbox/TO_SWANSON_INTERNAL_OPERATOR_SURFACE_OWNERSHIP_20260821.md`.
- The local Swanson relay endpoint at `127.0.0.1:3339` actively refused connection. The historical Doss endpoint at `10.1.10.8:3339` timed out. The packet was not delivered; no Swanson receipt is claimed.
- The Dragon has no evidence-backed ownership in these routes. It was not alerted. The Swanson packet asks whether a Dragon source-truth/recovery dependency actually exists.

## G

1. Added one shared, persistent `Internal Operator tool · local build only` boundary to every TinkerDen and ThinkIt route. It remains visible when a deep-link hash jumps into the middle of Receipts.
2. TinkerDen now plainly says its rows are packet/receipt experiments and many are historical or synthetic; none are member activity. ThinkIt plainly says it controls Swanson relay work and that page status—not button count—determines availability.
3. Added clear exits to Member Home and Operator Bench while preserving the canonical shared header.

## M

1. Browser inspection caught an existing Receipts hydration failure caused by an inline provenance script mutating text before React hydration. The scripts now use Next `afterInteractive`; a fresh-tab test has zero browser errors.
2. Removed duplicate `| Werkles | Werkles` browser titles across the ThinkIt/TinkerDen family by leaving the root metadata template to add the brand once.

## Verification

- TypeScript: PASS
- internal/external route audience contract: PASS
- shared-header continuity: PASS — 77 rendered routes, 74 ordinary shared-header routes, 3 explicit exceptions
- production build: PASS, exit 0, 101 static pages
- browser:
  - one canonical shared header
  - persistent internal-only notice visible at the deep receipt anchor
  - Member Home and Operator Bench exits visible
  - Receipts fresh tab: no console error, no overlay
  - ThinkIt: notice visible, `READBACK BLOCKED` truth still visible, no overlay

## Hard edges preserved

No route deletion, packet posting, receipt mutation, relay dispatch, service start, production exposure, schema, secrets, push, deploy, or spend. Historical proof remains intact. Retirement/consolidation awaits Swanson ownership readback rather than a solo deletion decision.
