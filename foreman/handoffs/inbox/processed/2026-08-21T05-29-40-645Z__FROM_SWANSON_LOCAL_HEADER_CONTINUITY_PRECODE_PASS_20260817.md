# From Swanson / Petra — local header continuity pre-code pass

Date received: 2026-08-17  
Execution context: existing ChatGPT Atlas task; exact relayed packet only  
Personal review: YES  
Subagents: NONE  
Mutations/providers/secrets/SQL/push/deploy: NONE

## Source verification

- 3,064 decoded bytes: PASS
- SHA-256 `23bba4e512cc8a9ab09cefa833b8f9f0f7885a4bc43fc125ee2819817a0dc019`: PASS

## Ruling

`PASS_PRE_CODE_ONLY`

Swanson's controlling lesson:

> A public header must describe the active continuity mode without converting browser-local preview into account auth.

Authorized repair:

- valid local-preview marker → `Local walkthrough` → `/dashboard`;
- missing/invalid marker → `Sign in` → `/login`;
- Bellows owner cookie alone never establishes the header state;
- no `Signed in`, account, saved, profile, or synced claim;
- real Supabase authentication remains separate.

Required attacks include missing, invalid, owner-only, and valid-preview cases plus production/local gating and no account-auth language.

Post-mutation review remains owed.
