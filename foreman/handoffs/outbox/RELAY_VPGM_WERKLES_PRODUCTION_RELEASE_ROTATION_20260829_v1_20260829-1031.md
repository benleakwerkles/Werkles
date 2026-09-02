# Werkles VPGM Command Issued — WERKLES_PRODUCTION_RELEASE_ROTATION_20260829 v1

**Issued:** 2026-08-29T10:31:01.701Z
**Issued by:** Heimerdinker@Betsy, Werkles Foreman
**Mission file:** `foreman/crew-dispatch/missions/WERKLES_PRODUCTION_RELEASE_ROTATION_20260829.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 2 | Skybro (SKYBRO) | `TO_SKYBRO_VPGM_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1_20260829-1031.md` | `foreman/handoffs/outbox/SKYBRO_NETWORK_PASTE_BLOCK.txt` | 4933 |
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1_20260829-1031.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 5045 |
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1_20260829-1031.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 4849 |
| 5 | Computer (COMPUTER) | `TO_COMPUTER_VPGM_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1_20260829-1031.md` | `foreman/handoffs/outbox/COMPUTER_NETWORK_PASTE_BLOCK.txt` | 4937 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
