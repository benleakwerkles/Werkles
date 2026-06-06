# To Ender (Claude UX / brand): ender imagery direction

## Cast (do not confuse)

| Name | Role |
|------|------|
| **Ben** | Operator — human gates only |
| **Ender** | UX / brand — imagery grammar, placement, motion guidance |
| **Maker** | Cursor — app/UI only when separately routed |
| **Ghost Forge** | Render image worker — **PAUSED (Gate 05)** — no generation from this packet |

---

## Status

**READY FOR OPERATOR PREPARE** — generated 2026-06-01T04:28:10.542Z.

**Stops before Send.** No deploy. No push. No SQL. No Ghost Forge runs. No new app UI commits (**UI_COMMIT: HOLD**).

---

## Mission

Review IMAGERY_DIRECTION — site placements, static vs motion, formation beats. No assets. UI_COMMIT HOLD. Gate 05 PAUSE.

---

## Canonical imagery doctrine (read first)

| File | Role |
|------|------|
| `foreman/IMAGERY_DIRECTION.md` | **Source of truth** — protagonist without cringe, formation grammar, bans |
| `foreman/SITE_STYLE_APPROVED_v0.6.md` | Locked UI palette / workshop facets |
| `foreman/DESIGN_SYSTEM.md` | Tokens — copper frame, forge-orange atmosphere only |
| `foreman/MASCOT_RULES.md` | Squibb scale — not human protagonist |
| `foreman/SITE_MAP.md` | Route placements for static vs motion |

---

## Recorded viability (do not re-litigate)

Imagery direction is **viable** with restrained visual grammar.

**Transformation** is implied through **cards, formation states, props, and subtle motion** — **not** literal magical morphing.

---

## Ender deliverables (this mission)

Return structured guidance only — **no image generation, no UI patches**:

1. **Site placements** — priority order for `/`, `#people`, `#how`, `/onboarding`, avoid list (proof/billing/login)
2. **Static vs motion** — what stays static until APP_INFRA-01 + UI_COMMIT open
3. **Formation beats** — identity shift, lane choice, unlikely collaboration, Werkle locked (one frame each)
4. **Cringe audit** — flag anything in current site copy/layout that fights doctrine
5. **Handoff to Ghost Forge** — when Gate 05 reopens, which prompts from `IMAGERY_PROMPT_TEMPLATE.md` to run first

Use `FROM_COUSIN_RESPONSE_TEMPLATE.md` for reply. Lane: product / UX — not SQL, billing, deploy.

---

## Cockpit context

| File | Role |
|------|------|
| `foreman/NEXT_ACTION.md` | cockpit / doctrine source |
| `foreman/CURRENT_STATE.md` | cockpit / doctrine source |
| `foreman/IMAGERY_DIRECTION.md` | cockpit / doctrine source |
| `foreman/ghost-forge/IMAGERY_PROMPT_TEMPLATE.md` | cockpit / doctrine source |
| `foreman/SITE_STYLE_APPROVED_v0.6.md` | cockpit / doctrine source |
| `foreman/SITE_MAP.md` | cockpit / doctrine source |

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "ENDER",
  "generated_at": "2026-06-01T04:28:10.587Z",
  "currentStateHash": "7aa2cec90918b92dc2db7fc63fe0511aacba38eae2b1f9c9def67e3c0dc8540b",
  "nextActionHash": "2000c1e3352cb60ff6a0cd0835c70fa63f8357f367c8e87e435ba72c019d6faa",
  "source_files_included": [
    "foreman/NEXT_ACTION.md",
    "foreman/CURRENT_STATE.md"
  ],
  "REQUIRED_RESPONSE_FIELDS": [
    "schemaVersion",
    "cousin",
    "source_packet_id",
    "source_packet_file",
    "generated_at",
    "nextActionHash",
    "CONFIDENCE",
    "VERDICT",
    "UNKNOWNS"
  ],
  "packet_id": "TO_ENDER_ENDER_IMAGERY_DIRECTION_v2_20260601-0428",
  "source_packet_file": "TO_ENDER_ENDER_IMAGERY_DIRECTION_v2_20260601-0428.md",
  "role_lane": "product / UX — not SQL, billing, security, or deploy execution",
  "human_gate_required": true
}
```

json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "ENDER",
  "generated_at": "2026-06-01T04:28:10.542Z",
  "currentStateHash": "7aa2cec90918b92dc2db7fc63fe0511aacba38eae2b1f9c9def67e3c0dc8540b",
  "nextActionHash": "2000c1e3352cb60ff6a0cd0835c70fa63f8357f367c8e87e435ba72c019d6faa",
  "source_files_included": [
    "foreman/NEXT_ACTION.md",
    "foreman/CURRENT_STATE.md",
    "foreman/IMAGERY_DIRECTION.md",
    "foreman/ghost-forge/IMAGERY_PROMPT_TEMPLATE.md",
    "foreman/SITE_STYLE_APPROVED_v0.6.md",
    "foreman/SITE_MAP.md"
  ],
  "REQUIRED_RESPONSE_FIELDS": [
    "schemaVersion",
    "cousin",
    "source_packet_id",
    "source_packet_file",
    "generated_at",
    "nextActionHash",
    "CONFIDENCE",
    "VERDICT",
    "UNKNOWNS"
  ],
  "packet_id": "TO_ENDER_ENDER_IMAGERY_DIRECTION_v2_20260601-0428",
  "source_packet_file": "TO_ENDER_ENDER_IMAGERY_DIRECTION_v2_20260601-0428.md",
  "role_lane": "product / UX — not SQL, billing, security, or deploy execution",
  "human_gate_required": true,
  "dispatch_class": "AUTO_LOAD_HUMAN_SEND",
  "doctrine_files": [
    "foreman/IMAGERY_DIRECTION.md"
  ]
}
```
