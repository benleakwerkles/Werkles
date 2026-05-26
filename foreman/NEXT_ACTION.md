[AWAITING HUMAN GATE: GHOST_FORGE_WEBHOOK_BASE_URL_FIX_APPROVAL]

One-prompt retry after Replicate diagnostic was approved and completed.

Result:

- Batch ID: `5d544518-17ae-4ad9-a5ed-19a502d42e62`
- Output ID: `0c31e055-9092-43a6-902b-427e7e7f96be`
- Replicate prediction ID: `0e7weaey99rmt0cycq6ackes4r`
- Replicate status: `succeeded`
- Batch status: `completed`
- Output status: `completed`
- Supabase storage path: `5d544518-17ae-4ad9-a5ed-19a502d42e62/hero-background/0c31e055-9092-43a6-902b-427e7e7f96be.png`
- Content type: `image/png`
- Byte size: `1460620`
- Estimated image spend: `$0.20`

Important finding:

- Replicate generation worked.
- The automatic webhook callback did not work because the generated webhook URL had a malformed trailing-dot host:
  - `https://werkles-ghost-forge1.onrender.com./webhook/replicate?...`
- Codex manually replayed the signed webhook from Render Shell for this one already-created prediction.
- The manual replay used Render environment secrets in-place, did not print secrets, did not create another prediction, and returned:
  - `200 {"ok":true,"handled":"completed",...}`

Local patch prepared, not pushed and not deployed:

- `ghost-forge-worker/server.mjs`
  - Adds `normalizedPublicBaseUrl()` and uses it when building Replicate webhook URLs.
  - Strips trailing slashes and trailing dots from `PUBLIC_BASE_URL`.
- `ghost-forge-worker/README.md`
  - Documents that `PUBLIC_BASE_URL` should have no trailing slash or dot.
- `ghost-forge-worker/render-env-checklist.md`
  - Adds the same trailing-dot warning.

NEXT HUMAN ACTION:

Ben says one of:

```text
APPROVE GHOST FORGE WEBHOOK BASE URL FIX PUSH DEPLOY
```

or

```text
STOP GHOST FORGE
```

If approved, Codex should syntax-check, commit/push only the webhook base URL fix and cockpit updates, manually deploy Render, then run one narrow webhook URL verification. Do not run background/batch generation.

Still blocked:

- Automatic Replicate webhook callback for future predictions.
- Background/batch image generation.

Do not enter, print, save, request, or paste secrets into chat. Do not enter billing or credit card information.
