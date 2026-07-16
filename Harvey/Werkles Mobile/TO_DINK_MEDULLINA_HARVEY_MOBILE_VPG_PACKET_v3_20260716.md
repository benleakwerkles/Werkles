# TO DINK@MEDULLINA — HARVEY MOBILE V/P/G PACKET v3

Date: 2026-07-16  
Owner/executor: Dink@Medullina (root)  
Canon: `benleakwerkles/Werkles` / `codex/cloud-harvey-mobile-vpg-20260715` / `Harvey/Werkles Mobile/`  
Pulled head: `317d8ce34caf9df2529ce73ed2b3589fc313ff66`

## V — Fresh handoff

Build Harvey Mobile without a local source checkout. Root owns every edit, commit, verification decision, and push. Do not merge to `main`, deploy, create credentials, mutate remotes, or claim live relay delivery without evidence.

## P — Pulled state

- SSH onboarding source blob: `06694988d56406d7bdb1a4e2998ce4f39eedd449`
- Access screen blob: `2a961d2f...`
- Duck screen blob: `03a58b78...`
- Previous Dink packet: `96d47b53d7e212f2fc807df677bb3efa9f4361cb`
- Latest exact-head cloud verification: Actions run `29471013935`, successful at `317d8ce...`.
- Read-only relay probes to `10.1.10.8:3339` and `10.1.10.8:3342` timed out after three seconds on 2026-07-16. This is a transport proof boundary, not proof of relay state.

## Ranked ideas

1. Harden the machine-name and SSH key-title identity contract.
2. Make Duck local-draft receipts secret-safe and metadata-only.
3. Add machine receipt import after a live bridge exists.
4. Add durable local receipt storage only after its threat model is approved.

## G — Execute these two

### 1. Machine/key-title identity hardening

Normalize and strictly validate machine names. Generate the real key title as `Harvey · <machine> · YYYY-MM-DD`, save it in the local request receipt, and show it in Access. Invalid names must not create a receipt.

### 2. Secret-safe Duck receipts

Move Duck validation into a typed data module. Reject oversized/deep payloads and sensitive field names recursively. A receipt may retain only a summary (top-level keys and character count), never the raw payload.

## Receipt contract

Return exact commit SHA, final blobs, and a GitHub Actions run proving lint and typecheck at the final head. No local checkout is an invariant.

Status: ROOT EXECUTION STARTED.
