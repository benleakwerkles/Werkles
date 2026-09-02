# TO HEIMERDINKER - 1Password Single Handoff Setup

## Mission

Replace repeated Cursor/1Password approvals with one visible, bounded setup handoff. The launcher may request the scoped service-account token once through a hidden prompt, store it in Windows Credential Manager, verify the wrapper, and return a names-only receipt.

## Rules

- Never accept the token as a command argument.
- Never print, log, or write the token.
- Do not use clipboard mode by default.
- Do not open repeated desktop authorization requests.
- If setup is not completed, automation stays fail-closed.
