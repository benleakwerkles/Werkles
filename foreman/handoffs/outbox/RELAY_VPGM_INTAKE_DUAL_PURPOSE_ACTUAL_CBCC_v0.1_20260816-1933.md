# Werkles VPGM Command Issued — INTAKE_DUAL_PURPOSE_ACTUAL_CBCC v0.1

**Issued:** 2026-08-16T19:33:40.338Z
**Issued by:** Heimerdinker@Betsy, acting Werkles Foreman
**Mission file:** `foreman/crew-dispatch/missions/intake_dual_purpose_actual_cbcc_20260816.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1_20260816-1933.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 4889 |
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1_20260816-1933.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 4881 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
