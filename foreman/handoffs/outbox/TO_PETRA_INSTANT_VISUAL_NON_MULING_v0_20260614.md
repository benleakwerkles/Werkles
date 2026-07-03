# To Petra / Comptroller: Instant Visual Non-Muling v0

## SoleDash dispatch · receipt

| Field | Value |
|-------|-------|
| Dispatched | 2026-06-14 |
| Cousin | MAKER @ Betsy |
| Mission | Instant Visual Non-Muling v0 — SoleDash → Petra transport proof |
| Execution context | LOCAL_SALLY_WINDOWS |

## Goal

Ben types in SoleDash Operator Chat → **Send to Petra** → message appears in Petra ChatGPT composer on Betsy without copy/paste.

## Built

1. **UI:** `Send to Petra` button in Operator Chat (collapsed tier)
2. **Envelope:** target_cousin, target_machine, source, raw_text, created_at, delivery_status, delivery_attempted, delivery_confirmed, transport_engine, failure_reason
3. **Transport:** Playwright CDP paste first; PowerShell Aeye Crew courier fallback (clipboard + tab focus + Ctrl+V)
4. **Receipt:** inline in Operator Chat + append to `foreman/soledash/PETRA_TRANSPORT_RECEIPTS.jsonl`
5. **No auto-send** — human Send gate preserved

## How to run

1. Open **Aeye Crew Bay** Edge profile with Petra (ChatGPT) on **tab 1**
2. Start SoleDash: `npm run dev` → http://localhost:3000/soledash
3. Expand **Operator chat — pivot intent**
4. Type message → click **Send to Petra**
5. Watch Petra tab — message should appear in composer
6. **Ben clicks Send** in ChatGPT manually

### CLI (optional)

```powershell
node scripts/foreman/soledash-petra-deliver.mjs --text "Hello Petra from SoleDash"
```

## Transport engine

| Priority | Engine | When |
|----------|--------|------|
| 1 | `playwright_cdp` | Edge running with CDP on 9222/9223/9333 + ChatGPT tab found |
| 2 | `powershell_courier` | Default on Betsy — `crew-edge-courier.ps1` clipboard + Ctrl+1 + Ctrl+V |

## What Ben must do manually

- Keep **Aeye Crew Bay** Edge open (Petra on tab 1)
- **Click Send** in ChatGPT after paste (never automated in v0)
- If delivery partial: switch to Petra tab and Ctrl+V (clipboard has text)

## Files changed

- `scripts/foreman/relay-courier-lib.mjs` — `deliverSoleDashTextToPetra()`
- `scripts/foreman/soledash-petra-deliver.mjs` — CLI
- `lib/soledash/petra-transport/types.ts`
- `lib/soledash/petra-transport/run-deliver.ts`
- `app/api/soledash/v1/petra-transport/route.ts`
- `components/soledash/decision-surface.tsx`
- `app/soledash/soledash.css`

## Not built (by design)

- Full cousin routing
- Other cousins
- Queue logic
- Auto-submit to ChatGPT

## Commit

Not committed — awaiting Ben explicit approval.

RECEIVED — one mule loop removed: SoleDash → Petra composer without Operator copy/paste.
