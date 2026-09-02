# Werkles VPGM Command Issued — WERKLE_FORMATION_LEGIBILITY_REDTEAM_20260822 v0.1

**Issued:** 2026-08-22T04:19:13.928Z
**Issued by:** Heimerdinker@Betsy, Werkles Foreman
**Mission file:** `foreman/crew-dispatch/missions/werkle_formation_legibility_redteam_20260822.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_WERKLE_FORMATION_LEGIBILITY_REDTEAM_20260822_v0.1_20260822-0419.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 4671 |
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_WERKLE_FORMATION_LEGIBILITY_REDTEAM_20260822_v0.1_20260822-0419.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 4372 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_WERKLE_FORMATION_LEGIBILITY_REDTEAM_20260822_v0.1.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
