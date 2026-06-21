# GD_INTENT_ROUTER_V1

Status: **DRAFT / PARALLEL LAYER**  
Goal: Ben thinks in **outcomes**, not cousins.

## Problem

Operator currently picks Ender vs Skybro vs Computer vs Petra per mission. That is routing labor disguised as strategy.

## Solution

Ben issues a **mission class** (intent). GD (this router) resolves cousins, generates packets, collects receipts, and emits a synthesis packet.

## What this does NOT do

- No production actions
- No changes to `foreman/crew-dispatch/dispatch-policy.json`
- No changes to autonomous dispatch proofs
- No changes to `relay-courier.mjs` routing
- No auto-send — all packets `AUTO_LOAD_HUMAN_SEND` / stops before Send

## Artifacts

| File | Role |
|------|------|
| `mission-classes.json` | Registry — labels, lenses, read-first, HG level |
| `cousin-assignment.json` | Mission class → cousin list |
| `gd-intent-router.mjs` | CLI |
| `gd-intent-router-lib.mjs` | Router logic |
| `runs/<RUN_ID>/` | Per-run packets, receipts, synthesis |

## Mission classes (v1)

| Class | Recipients |
|-------|------------|
| `HOMEPAGE_VISUAL_NARRATIVE` | ENDER, SKYBRO, COMPUTER |
| `CAPITAL_ALLOCATION` | PETRA, COMPUTER |
| `UX_REVIEW` | ENDER |
| `TRUST_COMPLIANCE_AUDIT` | BEAN, PETRA |
| `INFRA_OPS_PREP` | SKYBRO, COMPUTER |
| `COMPTROLLER_VERDICT` | PETRA |
| `DOCTRINE_SYNTHESIS` | COMPUTER, PETRA |
| `BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK` | PETRA, SKYBRO, COMPUTER, ENDER |
| `THREAD_REFRESH_PACKET` | _(cockpit direct — no cousins)_ |

## HG approval levels (future-ready)

| Level | Meaning |
|-------|---------|
| `HG_NONE` | Discovery only |
| `HG_RECORD` | Log in APPROVAL_LOG when accepted |
| `HG_OPERATOR` | Ben approves before implementation |
| `HG_BLOCKING` | Synthesis cannot authorize spend/deploy/merge |

## Operator workflow

```bash
# 1. See who GD would route (no files)
node foreman/gd-intent-router/gd-intent-router.mjs route HOMEPAGE_VISUAL_NARRATIVE

# 2. Generate packets → outbox + run folder
node foreman/gd-intent-router/gd-intent-router.mjs generate HOMEPAGE_VISUAL_NARRATIVE --brief "Hero + lane token direction"

# 3. Ben pastes packets manually (existing relay habit)

# 4. Cousins reply to inbox with GD_RECEIPT line

# 5. Collect receipts into run
node foreman/gd-intent-router/gd-intent-router.mjs collect GD_RUN_HOMEPAGE_VISUAL_NARRATIVE_...

# 6. Synthesis packet
node foreman/gd-intent-router/gd-intent-router.mjs synthesize GD_RUN_HOMEPAGE_VISUAL_NARRATIVE_...
```

## Receipt contract

Cousin replies must include on line 2:

```text
GD_RECEIPT: GD_RECEIPT_<MISSION_CLASS>_<COUSIN>_<RUN_ID>
```

Save to `foreman/handoffs/inbox/FROM_<COUSIN>_<MISSION_CLASS>_<RUN_ID>.md`

## Gates

Router generates draft packets only. Operator Send remains a human gate.

## Human consumable output (definition of done)

Every completed mission must emit an **Operator Brief** per `HUMAN_CONSUMABLE_OUTPUT_RULE_V1.md`:

1. Executive summary (10-second read)
2. Key findings
3. Recommended next action
4. Paste-ready prompt (if next step is another AI)
5. Artifact paths (optional evidence)

Artifact creation alone is not mission completion. Ben must be able to act without opening repo files.

Auto-emitted on `synthesize` → `foreman/handoffs/outbox/OPERATOR_BRIEF_<MISSION>_<RUN_ID>.md`

Thread refresh (cockpit handoff for fresh ChatGPT threads):

```bash
npm run gd:thread-refresh
```

Output: `foreman/handoffs/outbox/THREAD_REFRESH_PACKET.md`

**GimpDash UI:** http://127.0.0.1:4317/#gimpdash (integrated on Foreman home — `/gd` redirects here)
