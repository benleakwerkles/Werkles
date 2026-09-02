# VPGM Routing Surface — Operator Note

**At:** 2026-08-04T17:11Z  
**Execution context:** `LOCAL_SALLY_WINDOWS` (Betsy)  
**Operator note:** All cousin provider tabs open on second monitor in Google Chrome. Thufir (Perplexity) and Ender (Claude) also have native desktop apps open on Betsy.

## Seat map (canonical on Betsy)

| Seat ID | Cousin | Chrome CDP (:9335) | Native app |
|---------|--------|--------------------|------------|
| PETRA | Petra | `chatgpt.com` | — |
| SKYBRO | Skybro | `gemini.google.com` | — |
| ENDER | Ender | `claude.ai/chat/5d2b54b4-…` | Claude desktop |
| BEAN | Bean | `chat.deepseek.com` | — |
| COMPUTER | Thufir | `www.perplexity.ai` | Perplexity desktop |

Monitor placement does not affect CDP — all Chrome tabs above are visible to the courier regardless of display.

**Automation boundary:** Chrome cousins use `scripts/foreman/crew-dispatch-send.mjs` (port 9335). Native desktop cousins use `scripts/foreman/desktop-electron-courier.mjs` (Perplexity :9349, Claude :9348). Foreman restarts desktop apps with CDP when needed — Operator does not paste.

## CBCC_FULL_WALKTHROUGH_REDTEAM v0.2 — dispatch status after desktop courier

| Seat | Result | Notes |
|------|--------|-------|
| **SKYBRO** | Reply harvested | `foreman/handoffs/inbox/FROM_SKYBRO_VPGM_20260804-171130.md` |
| **COMPUTER / Thufir desktop** | **POSTED_NOT_CUSTODY** | Full body match via desktop CDP — `DESKTOP_ELECTRON_COURIER_20260804.md` |
| **PETRA** | `POSTED_PARTIAL_OR_MUTATED__DO_NOT_REPEAT` | Quarantined |
| **ENDER (Chrome)** | `POSTED_PARTIAL_OR_MUTATED__DO_NOT_REPEAT` | Quarantined; Claude desktop path unresolved this session |
| **BEAN** | `BLOCKED_RECEIVER_SIGNED_OUT` | Chrome tab at sign-in |

## Foreman next (no solo product work)

- Harvest Thufir reply when ready
- Resolve Claude desktop exe path for ENDER desktop leg (config candidates in `desktop-seats.config.json`)
- Do not auto-resend quarantined Petra/Ender Chrome legs
