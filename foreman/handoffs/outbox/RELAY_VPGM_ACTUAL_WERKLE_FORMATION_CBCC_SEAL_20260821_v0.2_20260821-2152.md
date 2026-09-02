# Werkles VPGM Command Issued — ACTUAL_WERKLE_FORMATION_CBCC_SEAL_20260821 v0.2

**Issued:** 2026-08-21T21:52:42.428Z
**Issued by:** Heimerdinker@Betsy, Werkles Foreman
**Mission file:** `foreman/crew-dispatch/missions/actual_werkle_formation_cbcc_seal_20260821.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_ACTUAL_WERKLE_FORMATION_CBCC_SEAL_20260821_v0.2_20260821-2152.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 5944 |
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_ACTUAL_WERKLE_FORMATION_CBCC_SEAL_20260821_v0.2_20260821-2152.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 6020 |
| 5 | Computer (COMPUTER) | `TO_COMPUTER_VPGM_ACTUAL_WERKLE_FORMATION_CBCC_SEAL_20260821_v0.2_20260821-2152.md` | `foreman/handoffs/outbox/COMPUTER_NETWORK_PASTE_BLOCK.txt` | 5989 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_ACTUAL_WERKLE_FORMATION_CBCC_SEAL_20260821_v0.2.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
