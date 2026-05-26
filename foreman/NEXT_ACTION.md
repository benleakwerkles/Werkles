[AWAITING HUMAN GATE: REPLICATE_DIAGNOSTIC_PATCH_REVIEW]

Browser handoff failed, so Codex prepared a no-browser Replicate diagnostic patch.

Patch prepared locally, not pushed and not deployed:

- `ghost-forge-worker/server.mjs`
  - Adds authenticated `GET /diagnostics/replicate/account`.
  - Calls Replicate `GET /v1/account` and `GET /v1/predictions` using the private `REPLICATE_API_TOKEN` already stored in Render.
  - Returns non-secret account context only: account type, username, name, GitHub URL, and redacted recent prediction summaries.
  - Does not create a prediction.
  - Does not print or return the Replicate token.
  - Switches Replicate API calls to the current documented `Bearer` authorization scheme.
- `ghost-forge-worker/replicate-account-check.ps1`
  - Calls the diagnostic endpoint using `GHOST_FORGE_API_KEY`.
  - Does not need or print the Replicate token.
- `ghost-forge-worker/README.md`
  - Documents the diagnostic route.

NEXT HUMAN ACTION:

Ben says one of:

```text
APPROVE REPLICATE DIAGNOSTIC PATCH PUSH DEPLOY
```

or

```text
STOP REPLICATE PATCH
```

If approved, Codex should run syntax checks, commit/push the patch to `ghost-forge-one-prompt-test`, wait for Render deploy, then call the diagnostic endpoint. Codex must not print, request, enter, or save secrets and must not create predictions during the diagnostic.

Still blocked until after diagnostic:

- Replicate credit recognized by provider.
- One-prompt successful image generation.
- Background/batch image generation.

Do not enter, print, save, request, or paste secrets into chat. Do not enter billing or credit card information.
