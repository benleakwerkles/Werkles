# Werkles VPGM Command Issued — CBCC_GHOST_MATCH_REDTEAM v0.1

**Issued:** 2026-08-03T07:41:54.457Z
**Issued by:** Foreman (Lady Jessica / Maker, LOCAL_SALLY_WINDOWS)
**Mission file:** `foreman/crew-dispatch/missions/CBCC_GHOST_MATCH_REDTEAM_20260803.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 1 | Petra (PETRA) | `TO_PETRA_VPGM_CBCC_GHOST_MATCH_REDTEAM_v0.1_20260803-0741.md` | `foreman/handoffs/outbox/PETRA_NETWORK_PASTE_BLOCK.txt` | 6491 |
| 2 | Skybro (SKYBRO) | `TO_SKYBRO_VPGM_CBCC_GHOST_MATCH_REDTEAM_v0.1_20260803-0741.md` | `foreman/handoffs/outbox/SKYBRO_NETWORK_PASTE_BLOCK.txt` | 6211 |
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_CBCC_GHOST_MATCH_REDTEAM_v0.1_20260803-0741.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 6951 |
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_CBCC_GHOST_MATCH_REDTEAM_v0.1_20260803-0741.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 7139 |
| 5 | Computer (COMPUTER) | `TO_COMPUTER_VPGM_CBCC_GHOST_MATCH_REDTEAM_v0.1_20260803-0741.md` | `foreman/handoffs/outbox/COMPUTER_NETWORK_PASTE_BLOCK.txt` | 6170 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_CBCC_GHOST_MATCH_REDTEAM_v0.1.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
