# Thread Identity Claims

Drop one JSON claim per observed thread into:

`foreman/nerdkle/thread_identity_claims/inbox/`

Then run:

```powershell
node foreman\nerdkle\ingest-thread-identity-claims.mjs
```

The script writes:

`foreman/artifacts/thread_identity_claims_status.json`

## Rule

Claims are evidence, not ratification.

- `local_daemon` proves a local file-backed chat identity.
- `local_codex_index` proves a visible Codex thread identity.
- `external_platform` is required before the kernel can stop reporting missing external Aeye thread IDs.
- `remote_machine` is for Maker@Doss or other machine receipts.

No claim may include secrets, tokens, cookies, API keys, or account credentials.

## Minimal Claim

```json
{
  "claim_id": "thufir-sally-local-example",
  "address": "Thufir@Sally",
  "platform": "local_file",
  "proof_scope": "local_daemon",
  "thread_id": "local-aeye-chat-thufir-sally-example",
  "observed_at": "2026-06-28T21:55:56.935Z",
  "evidence": [
    {
      "kind": "file",
      "value": "tinkarden/aeyes/Thufir@Sally/chats/local-aeye-chat-thufir-sally-example.md"
    }
  ]
}
```
