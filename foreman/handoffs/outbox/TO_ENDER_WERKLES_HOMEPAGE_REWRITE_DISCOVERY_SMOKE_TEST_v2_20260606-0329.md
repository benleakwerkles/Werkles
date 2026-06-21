# To Ender (Product Cousin): werkles homepage rewrite discovery smoke test

## Cast (do not confuse)

| Name | Role |
|------|------|
| **Ben** | Operator — human gates only |
| **Petra** | Comptroller — scope, GO/NO-GO |
| **Codex** | Foreman — cockpit sync |
| **Maker** | Cursor — bounded app/UI on Sally |
| **Sally** | Local machine — repo, dev server, clipboard |

---

## Status

**READY FOR OPERATOR PREPARE** — generated 2026-06-06T03:29:54.081Z.

**Stops before Send:** Ben must paste manually. No auto-send. No deploy. No push. No SQL.

---

## Mission

Ender crew relay packet — werkles-homepage-rewrite-discovery-smoke-test

---

## Read first (cockpit)

| File | Role |
|------|------|
| `foreman/NEXT_ACTION.md` | cockpit / doctrine source |
| `foreman/CURRENT_STATE.md` | cockpit / doctrine source |

---

## Required cousin response

Cousin must reply using `foreman/templates/FROM_COUSIN_RESPONSE_TEMPLATE.md`.

All fields in `REQUIRED_RESPONSE_FIELDS` inside Relay metadata are mandatory.

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "ENDER",
  "generated_at": "2026-06-06T03:29:54.081Z",
  "currentStateHash": "825a6e62583c9491cce68d836b7e8c345a803ad34effb97db1d82359454d13cf",
  "nextActionHash": "e5e1660283c42c971e5cdf8892f6dca22152ab12a9578e818356bd2e6a2fa801",
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
  "packet_id": "TO_ENDER_WERKLES_HOMEPAGE_REWRITE_DISCOVERY_SMOKE_TEST_v2_20260606-0329",
  "source_packet_file": "TO_ENDER_WERKLES_HOMEPAGE_REWRITE_DISCOVERY_SMOKE_TEST_v2_20260606-0329.md",
  "role_lane": "product / UX — not SQL, billing, security, or deploy execution",
  "human_gate_required": true
}
```

---

## Operator after response

1. Save cousin reply to `foreman/handoffs/inbox/` as `FROM_ENDER_<topic>.md`
2. Dashboard → **Validate Inbox (dry-run)**
3. Dashboard → **Process Responses** (only if validation passes)
4. **Never auto-merge** — Ben reviews processed summary
