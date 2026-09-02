# VPGM Dispatch — CBCC_FULL_WALKTHROUGH_REDTEAM v0.2

DATE: 2026-08-04  
FOREMAN: Lady Jessica@Betsy  
MISSION: `foreman/crew-dispatch/missions/CBCC_FULL_WALKTHROUGH_REDTEAM_20260804.json`  
MANIFEST: `foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json`

## Intent

Full-path walkthrough red team via CBCC. **Foreman issued and dispatched only — no product code changes this session.**

## Route proof

| Seat | Result |
|------|--------|
| PETRA | ROUTE_PROVED |
| SKYBRO | ROUTE_PROVED |
| ENDER | ROUTE_PROVED |
| BEAN | BLOCKED_RECEIVER_SIGNED_OUT |
| COMPUTER | BLOCKED_RECEIVER_SIGNED_OUT |

## Dispatch

| Seat | Result | Obligation |
|------|--------|------------|
| PETRA | `POSTED_PARTIAL_OR_MUTATED__DO_NOT_REPEAT` | CONSUMED_AMBIGUOUS — **quarantined, no auto-resend** |
| SKYBRO | `POSTED_NOT_CUSTODY` | POSTED_AWAITING_CUSTODY — harvest when reply lands |
| ENDER | `SEND_CONTROL_UNAVAILABLE` | STILL_OWED — bytes composed, Send not found |
| BEAN | not sent | STILL_OWED — Human Gate sign-in |
| COMPUTER | not sent | STILL_OWED — Human Gate sign-in |

### Petra note

Head and tail found in transcript; normalized body equality failed (7272 vs 7278 chars). Per Swanson delta: partial post may already be executing at receiver. **Do not re-dispatch** same SUBMISSION_ID. Operator decision required.

### Ender note

Composer holds full packet; Send control selector did not match at dispatch time. **Non-gate option:** Operator clicks Send on Claude tab once. **Foreman may fix selector** in `crew-dispatch-send.mjs` in a separate infra pass — not done this turn to avoid solo churn.

## Next Foreman actions (no solo product work)

1. Harvest Skybro when reply visible: `node scripts/foreman/crew-reply-harvest.mjs harvest --cousins SKYBRO`
2. After Operator sign-in: dispatch Bean + Computer same mission
3. After Ender send resolved: re-prove route + dispatch (new submission only if prior consumed — Ender submission NOT consumed)
4. Assimilate cousin findings → **then** dispatch implementation missions to Maker/seats — not Foreman solo patches

## Human gates

- Sign in DeepSeek (Bean) and Perplexity (Computer)
- Petra partial packet — Operator aware before trusting Petra reply
- Walkthrough GO/NO-GO remains with cousins, not Foreman
