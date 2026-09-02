# Werkles VPGM Command Issued — WERKLES_BROAD_ROTATION_M9_TECH_STACK v0.1

**Issued:** 2026-08-23T05:14:04.370Z
**Issued by:** Heimerdinker@Betsy, Werkles Foreman
**Mission file:** `foreman/crew-dispatch/missions/WERKLES_BROAD_ROTATION_M9_TECH_STACK_20260823.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 1 | Petra (PETRA) | `TO_PETRA_VPGM_WERKLES_BROAD_ROTATION_M9_TECH_STACK_v0.1_20260823-0514.md` | `foreman/handoffs/outbox/PETRA_NETWORK_PASTE_BLOCK.txt` | 4320 |
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_WERKLES_BROAD_ROTATION_M9_TECH_STACK_v0.1_20260823-0514.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 4103 |
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_WERKLES_BROAD_ROTATION_M9_TECH_STACK_v0.1_20260823-0514.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 4179 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_WERKLES_BROAD_ROTATION_M9_TECH_STACK_v0.1.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
