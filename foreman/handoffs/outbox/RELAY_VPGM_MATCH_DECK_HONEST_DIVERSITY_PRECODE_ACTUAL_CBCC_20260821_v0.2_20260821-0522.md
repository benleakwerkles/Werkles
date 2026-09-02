# Werkles VPGM Command Issued — MATCH_DECK_HONEST_DIVERSITY_PRECODE_ACTUAL_CBCC_20260821 v0.2

**Issued:** 2026-08-21T05:22:50.227Z
**Issued by:** Heimerdinker@Betsy, Werkles Foreman
**Mission file:** `foreman/crew-dispatch/missions/match_deck_honest_diversity_precode_actual_cbcc_20260821.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 1 | Petra (PETRA) | `TO_PETRA_VPGM_MATCH_DECK_HONEST_DIVERSITY_PRECODE_ACTUAL_CBCC_20260821_v0.2_20260821-0522.md` | `foreman/handoffs/outbox/PETRA_NETWORK_PASTE_BLOCK.txt` | 6609 |
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_MATCH_DECK_HONEST_DIVERSITY_PRECODE_ACTUAL_CBCC_20260821_v0.2_20260821-0522.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 6517 |
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_MATCH_DECK_HONEST_DIVERSITY_PRECODE_ACTUAL_CBCC_20260821_v0.2_20260821-0522.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 6536 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_MATCH_DECK_HONEST_DIVERSITY_PRECODE_ACTUAL_CBCC_20260821_v0.2.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
