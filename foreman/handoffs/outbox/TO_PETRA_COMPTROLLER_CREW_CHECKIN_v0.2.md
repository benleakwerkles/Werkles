# To Petra (ChatGPT Comptroller): Crew Check-In v0.2 — Post-Deploy, Functionality Pivot

Supersedes `TO_PETRA_COMPTROLLER_CREW_CHECKIN_v0.1.md`. Prepared by Maker/Cursor on 2026-05-31 from verified repo facts.

## Cast (do not confuse)

| Name | Role | Platform |
|------|------|----------|
| **Ben** | Operator — decisions, human gates, brand lock | now on **BLDer** (new laptop); previously Sally |
| **Petra** | Comptroller — scope, gates, GO/NO-GO, lane law | ChatGPT / Cockpit / Aeyes |
| **Codex** | Foreman — cockpit sync, infra packets, Ghost Forge execution | Render-connected, not local |
| **Maker** | Cursor — bounded UI/app implementation | repo / cloud agent |
| **Ghost Forge** | Image worker on Render (`werkles-ghost-forge1`) | Cloud |

Repo doctrine files use **ChatGPT / Comptroller** (`foreman/AI_COUSINS_PROTOCOL.md`).

## Status

**READY FOR COMPTROLLER REVIEW** — the home UI/atmosphere pass shipped and `werkles.com` got a morale deploy (2026-05-30). Operator wants to pivot toward functionality and needs a Comptroller verdict before opening APP_INFRA work or resuming asset lanes.

This packet does **not** authorize deploy, push to main, merge, SQL, secrets, live Stripe products, or new spend.

## Verified repo facts (2026-05-31)

- Canonical repo: public `benleakwerkles/Werkles`. Private `benleakwerkles/Werkles` is **empty** and not canonical.
- `main` clean, synced with `origin/main` at `60f74c8` (2026-05-30 werkles.com deploy).
- App health: `npm ci`, `typecheck`, `build` pass; dev preview `200` across public + dashboard routes; homepage shows current "The Forge" v0.6 copy (not "Mythic Capitalism").
- Committed assets: 24 Tier 3 icons; 12/40 Gate 05 style variants (4 style logo-Ws + 8 style lane icons); atmosphere plates (hero/proof v0.1+v0.2, workshop interior, conservatory).
- Gate 05: 28 variants remaining; stopped at `[13/40] enamel/connector` on Render 429.
- Squibb mascot: NOT landed (only README/.gitkeep) — pending Ben manual cutout.
- Cockpit sync done 2026-05-31: `OPERATOR_DASHBOARD.md` refreshed, `CURRENT_STATE.md` given a current top block.

## Read first (cockpit)

| File | Role |
|------|------|
| `foreman/HUMAN_GATES.md` | Hard stops |
| `foreman/LANES.md` | Approved automation lanes |
| `foreman/BUDGET.md` | Spend caps |
| `foreman/NEXT_ACTION.md` | Current active work |
| `foreman/OPERATOR_DASHBOARD.md` | Current status (synced 2026-05-31) |
| `foreman/SITE_STYLE_APPROVED_v0.6.md` | Locked UI direction |
| `foreman/APP_INFRA_UX_START_PACKET.md` | Queued functionality scope |
| `foreman/ghost-forge/DRAFT_SITE_ASSET_RESULTS_v0.2.md` | Asset run log |
| `foreman/gates/APPROVAL_LOG.md` | Ben approvals on record |

## APP_INFRA slice candidates (pick one)

| Slice | Summary | Typical gates |
|-------|---------|---------------|
| **A — Pricing + membership shells** | `/pricing`, `/membership`, checkout route audit, pricing manifest | Stripe env prep; no live products without approval |
| **B — Billing shell** | `/dashboard/billing`, portal route shell | Stripe Customer Portal setup |
| **C — Crucible verification UX** | `/dashboard/crucible`, verification cards, proof page Crucible copy | Bean audit; provider env gates |
| **D — Auth / beta flow** | Beta signup → auth shell wiring | Supabase/auth secrets; schema if needed |
| **E — Cockpit sync only** | Already partially done 2026-05-31; remaining: confirm `NEXT_ACTION` reframe | No app code — doctrine lane |

Forbidden across all slices unless explicitly opened: live Stripe product creation; deploy, push to main, merge, SQL/RLS apply; secrets in chat/repo; user-to-user payment logic; treating draft assets as final brand approval.

## Decisions requested from Petra

1. **First APP_INFRA slice** — A, B, C, D, E, or a narrower custom slice?
2. **Gate 05** — `RESUME` the remaining 28, `PAUSE` until a slice lands, or `STOP` until brand lock?
3. **UI commit timing** — `PUSH_NOW`, `HOLD_LOCAL`, or `COMMIT_LOCAL_NO_PUSH`?
4. **Codex activation** — `SYNC_COCKPIT_ONLY`, `SYNC_PLUS_HANDOFF`, or `DEFER`?
5. **Maker activation** — UI polish, chosen APP_INFRA slice, or `PAUSE`?

## Human gates (reminder)

login/OAuth · billing/credit card · secrets in chat · push to main/deploy/SQL/production-data mutation · creative final brand lock · spend above approved lane caps. Routine health checks, approved Ghost Forge batches inside budget, typecheck/build, and local preview are not stop points.

## Output format (Petra response)

```text
VERDICT: GO | NO-GO | GO_WITH_CONDITIONS

SLICE: <letter or custom name>
GATE_05: RESUME | PAUSE | STOP
UI_COMMIT: PUSH_NOW | HOLD_LOCAL | COMMIT_LOCAL_NO_PUSH
CODEX: SYNC_COCKPIT_ONLY | SYNC_PLUS_HANDOFF | DEFER
MAKER: UI_POLISH | APP_INFRA_SLICE | PAUSE

CONDITIONS:
- <bullet>

DOWNSTREAM_HANDOFFS:
- To Codex: <one sentence task>
- To Maker: <one sentence task>
- To Bean: <if any>

NEXT_HUMAN_GATE:
- <exact phrase or action Ben must take>
```

## Packet metadata

| Field | Value |
|-------|-------|
| Packet ID | `TO_PETRA_COMPTROLLER_CREW_CHECKIN_v0.2` |
| Prepared by | Maker (Cursor) |
| Prepared for | Petra (ChatGPT Comptroller) |
| Operator | Ben |
| Date | 2026-05-31 |
| Branch | `cursor/refresh-cockpit-dashboard-eeea` (cockpit sync; merge to main is Ben's gate) |
| Stop gate | `[AWAITING COMPTROLLER VERDICT: APP_INFRA_SLICE_AND_CREW_ROUTING]` |
