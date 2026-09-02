# Werkles VPGM Command Issued — ACTION_VS_INFORMATION_AFFORDANCE v0.1

**Issued:** 2026-08-18T03:00:39.969Z
**Issued by:** Heimerdinker@Betsy, Werkles Foreman
**Mission file:** `foreman\crew-dispatch\missions\action_vs_information_affordance_20260817.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_ACTION_VS_INFORMATION_AFFORDANCE_v0.1_20260818-0300.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 4147 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_ACTION_VS_INFORMATION_AFFORDANCE_v0.1.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
