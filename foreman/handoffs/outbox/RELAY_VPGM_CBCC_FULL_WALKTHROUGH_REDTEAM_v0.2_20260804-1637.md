# Werkles VPGM Command Issued — CBCC_FULL_WALKTHROUGH_REDTEAM v0.2

**Issued:** 2026-08-04T16:37:12.989Z
**Issued by:** Foreman (Lady Jessica, LOCAL_SALLY_WINDOWS)
**Mission file:** `foreman/crew-dispatch/missions/CBCC_FULL_WALKTHROUGH_REDTEAM_20260804.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 1 | Petra (PETRA) | `TO_PETRA_VPGM_CBCC_FULL_WALKTHROUGH_REDTEAM_v0.2_20260804-1637.md` | `foreman/handoffs/outbox/PETRA_NETWORK_PASTE_BLOCK.txt` | 7278 |
| 2 | Skybro (SKYBRO) | `TO_SKYBRO_VPGM_CBCC_FULL_WALKTHROUGH_REDTEAM_v0.2_20260804-1637.md` | `foreman/handoffs/outbox/SKYBRO_NETWORK_PASTE_BLOCK.txt` | 7095 |
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_CBCC_FULL_WALKTHROUGH_REDTEAM_v0.2_20260804-1637.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 7230 |
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_CBCC_FULL_WALKTHROUGH_REDTEAM_v0.2_20260804-1637.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 7028 |
| 5 | Computer (COMPUTER) | `TO_COMPUTER_VPGM_CBCC_FULL_WALKTHROUGH_REDTEAM_v0.2_20260804-1637.md` | `foreman/handoffs/outbox/COMPUTER_NETWORK_PASTE_BLOCK.txt` | 6995 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_CBCC_FULL_WALKTHROUGH_REDTEAM_v0.2.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
