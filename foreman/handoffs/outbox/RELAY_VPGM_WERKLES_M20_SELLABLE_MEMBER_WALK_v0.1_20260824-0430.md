# Werkles VPGM Command Issued — WERKLES_M20_SELLABLE_MEMBER_WALK v0.1

**Issued:** 2026-08-24T04:30:43.831Z
**Issued by:** Heimerdinker@Betsy, Werkles Foreman
**Mission file:** `foreman\crew-dispatch\missions\WERKLES_M20_SELLABLE_MEMBER_WALK_20260824.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 1 | Petra (PETRA) | `TO_PETRA_VPGM_WERKLES_M20_SELLABLE_MEMBER_WALK_v0.1_20260824-0430.md` | `foreman/handoffs/outbox/PETRA_NETWORK_PASTE_BLOCK.txt` | 4221 |
| 2 | Skybro (SKYBRO) | `TO_SKYBRO_VPGM_WERKLES_M20_SELLABLE_MEMBER_WALK_v0.1_20260824-0430.md` | `foreman/handoffs/outbox/SKYBRO_NETWORK_PASTE_BLOCK.txt` | 4382 |
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_WERKLES_M20_SELLABLE_MEMBER_WALK_v0.1_20260824-0430.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 4340 |
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_WERKLES_M20_SELLABLE_MEMBER_WALK_v0.1_20260824-0430.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 4367 |
| 5 | Computer (COMPUTER) | `TO_COMPUTER_VPGM_WERKLES_M20_SELLABLE_MEMBER_WALK_v0.1_20260824-0430.md` | `foreman/handoffs/outbox/COMPUTER_NETWORK_PASTE_BLOCK.txt` | 4354 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_WERKLES_M20_SELLABLE_MEMBER_WALK_v0.1.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
