# Handoffs inbox

Save cousin responses here as `FROM_{COUSIN}_*.md` only.

## Intake

Use Foreman Dashboard:

- **Validate Inbox** — checks headers, hashes, lane; moves nothing
- **Process Responses** — atomic: all must pass before move to `processed/`

Or CLI:

```powershell
node foreman/crew-dispatch/crew-response-intake.mjs validate
node foreman/crew-dispatch/crew-response-intake.mjs process --dry-run
node foreman/crew-dispatch/crew-response-intake.mjs process
```

## Rules

- **Only `.md` files** — other extensions rejected
- SOURCE must match filename cousin
- Stale hash → `STALE_DO_NOT_APPLY` — do not apply
- **Never auto-merge** — conflicts go to `foreman/handoffs/merge-conflicts.md`

## Drop Zone

Foreman dashboard Drop Zone also writes sanitized `.md` here (max 100KB).

See `AEYE_CREW_RELAY.md` and `foreman/templates/FROM_COUSIN_RESPONSE_TEMPLATE.md`.
