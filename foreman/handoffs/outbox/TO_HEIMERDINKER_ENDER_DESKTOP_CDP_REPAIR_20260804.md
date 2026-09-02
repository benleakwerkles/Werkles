# TO HEIMERDINKER — Ender Desktop CDP Repair

**From:** Foreman (VPGM)  
**At:** 2026-08-04T18:01Z  
**Machine:** Betsy (`LOCAL_SALLY_WINDOWS`)  
**Lane:** Infra / courier — **not** product code

## Mission context

`CBCC_FULL_WALKTHROUGH_REDTEAM v0.2` — Ender (Claude) owes a clean dispatch leg. Chrome tab posted **partial/quarantined**. Perplexity desktop courier **works**; Claude desktop courier **does not** yet.

## Your repair target

Make `scripts/foreman/desktop-electron-courier.mjs` able to **prove route + dispatch** on **Claude Desktop** (Ender seat), same contract as Thufir.

Config: `foreman/crew-dispatch/desktop-seats.config.json` → seat `ENDER`, CDP port **9348**.

## Evidence (2026-08-04)

| Check | Result |
|-------|--------|
| Claude Store install | `Get-AppxPackage *Claude*` → `Claude_1.24012.11.0_x64__pzs8sxrjxfjjc` |
| Exe (exists) | `C:\Program Files\WindowsApps\Claude_1.24012.11.0_x64__pzs8sxrjxfjjc\app\claude.exe` |
| StartApps ID | `Claude_pzs8sxrjxfjjc!Claude` |
| `--remote-debugging-port=9348` | **CDP never listens** (45s wait, multiple flag variants) |
| `--inspect=9348` | Same failure |
| Perplexity desktop (control) | **Works** on `:9349` via puppeteer-core + `Input.insertText` |

Thufir proof: `foreman/receipts/DESKTOP_ELECTRON_COURIER_20260804.md`

## Owed packet (do not re-issue until route proves)

- File: `foreman/handoffs/outbox/TO_ENDER_VPGM_CBCC_FULL_WALKTHROUGH_REDTEAM_v0.2_20260804-1637.md`
- `submissionId`: `VPGM:ENDER:01bb51498a9c` — consumed ambiguous on Chrome; desktop never received clean bytes
- Foreman will dispatch when you report **ROUTE_PROVED** on desktop surface

## Suggested repair directions (pick what proves)

1. **Fleet launch** — PowerToys / workspace recipe launches Claude with debug port at boot (avoid Foreman taskkill mid-session)
2. **Non-Store Claude install** if Store build blocks CDP
3. **Desktop harvest path** — extend `crew-reply-harvest.mjs` to read from `:9348` when up
4. **Dynamic exe resolve** — already added Appx fallback in `resolveExe()`; keep version-proof

## Done when

```bash
node scripts/foreman/desktop-electron-courier.mjs prove --cousins ENDER
# prints ENDER ROUTE_PROVED

node scripts/foreman/desktop-electron-courier.mjs dispatch --cousins ENDER
# prints ENDER POSTED_NOT_CUSTODY with transcriptEcho.bodyMatches true
```

Receipt back to: `foreman/handoffs/inbox/FROM_HEIMERDINKER_ENDER_DESKTOP_CDP_REPAIR.md`

Foreman holds dispatch until your receipt lands. No Operator paste.
