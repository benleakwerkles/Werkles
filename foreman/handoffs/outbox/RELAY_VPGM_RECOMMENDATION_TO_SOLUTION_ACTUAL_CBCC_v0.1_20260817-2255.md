# Werkles VPGM Command Issued — RECOMMENDATION_TO_SOLUTION_ACTUAL_CBCC v0.1

**Issued:** 2026-08-17T22:55:28.580Z
**Issued by:** Heimerdinker@Betsy, acting Werkles Foreman
**Mission file:** `foreman/crew-dispatch/missions/recommendation_to_solution_actual_cbcc_20260817.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_RECOMMENDATION_TO_SOLUTION_ACTUAL_CBCC_v0.1_20260817-2255.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 5929 |
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_RECOMMENDATION_TO_SOLUTION_ACTUAL_CBCC_v0.1_20260817-2255.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 5983 |
| 5 | Computer (COMPUTER) | `TO_COMPUTER_VPGM_RECOMMENDATION_TO_SOLUTION_ACTUAL_CBCC_v0.1_20260817-2255.md` | `foreman/handoffs/outbox/COMPUTER_NETWORK_PASTE_BLOCK.txt` | 6187 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_RECOMMENDATION_TO_SOLUTION_ACTUAL_CBCC_v0.1.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
