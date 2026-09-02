# Werkles VPGM Command Issued — WERKLE_FORMATION_VALUE_LOOP v0.1

**Issued:** 2026-08-22T19:19:11.247Z
**Issued by:** Heimerdinker@Betsy, Werkles Foreman
**Mission file:** `foreman/crew-dispatch/missions/WERKLE_FORMATION_VALUE_LOOP_20260822.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 1 | Petra (PETRA) | `TO_PETRA_VPGM_WERKLE_FORMATION_VALUE_LOOP_v0.1_20260822-1919.md` | `foreman/handoffs/outbox/PETRA_NETWORK_PASTE_BLOCK.txt` | 4979 |
| 2 | Skybro (SKYBRO) | `TO_SKYBRO_VPGM_WERKLE_FORMATION_VALUE_LOOP_v0.1_20260822-1919.md` | `foreman/handoffs/outbox/SKYBRO_NETWORK_PASTE_BLOCK.txt` | 5074 |
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_WERKLE_FORMATION_VALUE_LOOP_v0.1_20260822-1919.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 5191 |
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_WERKLE_FORMATION_VALUE_LOOP_v0.1_20260822-1919.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 5123 |
| 5 | Computer (COMPUTER) | `TO_COMPUTER_VPGM_WERKLE_FORMATION_VALUE_LOOP_v0.1_20260822-1919.md` | `foreman/handoffs/outbox/COMPUTER_NETWORK_PASTE_BLOCK.txt` | 5247 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_WERKLE_FORMATION_VALUE_LOOP_v0.1.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
