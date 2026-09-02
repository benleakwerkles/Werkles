# Werkles VPGM Command Issued — BELLOWS_TWO_SEAT_PRODUCTION v0.1

**Issued:** 2026-08-17T23:33:23.572Z
**Issued by:** Heimerdinker@Betsy, acting Werkles Foreman
**Mission file:** `foreman/crew-dispatch/missions/bellows_two_seat_production_20260817.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_BELLOWS_TWO_SEAT_PRODUCTION_v0.1_20260817-2333.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 4461 |
| 5 | Computer (COMPUTER) | `TO_COMPUTER_VPGM_BELLOWS_TWO_SEAT_PRODUCTION_v0.1_20260817-2333.md` | `foreman/handoffs/outbox/COMPUTER_NETWORK_PASTE_BLOCK.txt` | 4735 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_BELLOWS_TWO_SEAT_PRODUCTION_v0.1.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
