# Werkles VPGM Command Issued — PLAID_SANDBOX_ACTIVATION v0.1

**Issued:** 2026-08-22T06:58:09.095Z
**Issued by:** Heimerdinker@Betsy, Werkles Foreman
**Mission file:** `foreman/crew-dispatch/missions/plaid_sandbox_activation_20260822.json`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
| 3 | Ender (ENDER) | `TO_ENDER_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658.md` | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` | 4788 |
| 4 | Bean (BEAN) | `TO_BEAN_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658.md` | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` | 4847 |
| 5 | Computer (COMPUTER) | `TO_COMPUTER_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658.md` | `foreman/handoffs/outbox/COMPUTER_NETWORK_PASTE_BLOCK.txt` | 5021 |

## Delivery

```text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
```

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
`foreman/handoffs/inbox/FROM_{COUSIN}_PLAID_SANDBOX_ACTIVATION_v0.1.md` and run
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.
