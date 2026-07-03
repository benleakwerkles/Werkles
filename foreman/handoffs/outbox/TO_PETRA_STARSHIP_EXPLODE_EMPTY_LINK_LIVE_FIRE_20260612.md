# TO PETRA — Starship Explode Empty-Link Live Fire Test

**From:** Maker (Cursor) @ LOCAL_SALLY_WINDOWS  
**Date:** 2026-06-12  
**Mission:** EMPTY-LINK LIVE FIRE TEST — prove outbound message path  
**Execution context:** LOCAL_SALLY_WINDOWS · `http://localhost:3000/soledash`

---

## Summary

One button, one route, honest outcomes. No new dashboard features — only **LIVE FIRE: PETRA EMPTY LINK** fixed above the operator bar.

---

## Button

**LIVE FIRE: PETRA EMPTY LINK**

Creates packet → exposes/sends via simplest link → shows phase status → writes local receipt → surfaces exact failure class if link fails.

---

## Route

`POST /api/soledash/v1/petra-empty-link-live-fire`

**Link cascade (empty/minimal):**

1. Always write packet JSON to `foreman/soledash/outbound/petra/{packet_id}.json`
2. If `foreman/soledash/PETRA_EMPTY_LINK.json` has `endpoint_url` → HTTP POST packet
3. Else on Windows → existing Petra composer transport (`soledash-petra-deliver.mjs`)

Config example: `foreman/soledash/PETRA_EMPTY_LINK.json.example`

---

## Packet fields

| Field | Value |
|-------|-------|
| packet_id | `lf_petra_{timestamp}_{random}` |
| timestamp | ISO |
| source | Starship Explode |
| target | Petra |
| message | LIVE FIRE TEST |

---

## UI status phases

1. Packet created  
2. Send attempted  
3. Awaiting response  
4. Receipt returned **or** Failed  

Failure classes (exact):

- `no_target_link_configured`
- `browser_cannot_reach_endpoint`
- `file_written_but_not_transmitted`
- `transmitted_but_no_receipt`
- `receipt_exists_but_ui_did_not_refresh`

---

## Local receipt (always written)

Path: `foreman/soledash/receipts/{packet_id}.json`  
Companion action: `foreman/soledash/actions/{packet_id}.json`

Receipt includes: packet id, outbound path/URL, success/failure, error, next missing integration, full phase log.

---

## API proof (LOCAL_SALLY_WINDOWS, Edge not running)

422 response with:

- `failure_class`: `file_written_but_not_transmitted`
- `error`: `Aeye Crew Edge not running. Click Open Aeye Crew Bay first…`
- `receipt_path`: `foreman/soledash/receipts/lf_petra_….json`
- `outbound_path`: `foreman/soledash/outbound/petra/lf_petra_….json`

No mock success. No vague "sent".

---

## Files

| File | Role |
|------|------|
| `lib/soledash/petra-empty-link/types.ts` | Packet, receipt, failure types |
| `lib/soledash/petra-empty-link/config.ts` | Read PETRA_EMPTY_LINK.json |
| `lib/soledash/petra-empty-link/run-live-fire.ts` | Server orchestration + receipt write |
| `app/api/soledash/v1/petra-empty-link-live-fire/route.ts` | POST handler |
| `app/api/soledash/v1/petra-empty-link-live-fire/verify/route.ts` | UI refresh verification |
| `components/soledash/petra-empty-link-fire.tsx` | Button + phase panel |
| `components/soledash/decision-surface.tsx` | Anchor above operator bar |
| `foreman/soledash/PETRA_EMPTY_LINK.json.example` | Optional HTTP endpoint config |

---

## Ben acceptance test

1. Open `/soledash`
2. Click **LIVE FIRE: PETRA EMPTY LINK**
3. See phase panel update in-place
4. Outcome A: receipt path shown + receipt center refreshes  
   Outcome B: exact failure class + error (e.g. Edge not running)

To pass with composer transport: open Aeye Crew Bay Petra tab, click again.

To pass with HTTP only: copy `PETRA_EMPTY_LINK.json.example` → `PETRA_EMPTY_LINK.json`, set `endpoint_url`.
