# Werkles VPGM Command Issued — WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831 v0.1

**Issued:** 2026-08-31T05:10:57.475Z
**Issued by:** Heimerdinker@Betsy, Werkles Foreman
**Mission file:** `foreman/crew-dispatch/missions/WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 2 | Skybro (SKYBRO) | `TO_SKYBRO_VPGM_WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831_v0.1_20260831-0510.md` | `foreman/handoffs/outbox/SKYBRO_NETWORK_PASTE_BLOCK.txt` | 4859 |
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831_v0.1_20260831-0510.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 4986 |
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831_v0.1_20260831-0510.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 4803 |
| 5 | Thufir Hawat (COMPUTER) | `TO_COMPUTER_VPGM_WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831_v0.1_20260831-0510.md` | `foreman/handoffs/outbox/COMPUTER_NETWORK_PASTE_BLOCK.txt` | 4906 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831_v0.1.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
