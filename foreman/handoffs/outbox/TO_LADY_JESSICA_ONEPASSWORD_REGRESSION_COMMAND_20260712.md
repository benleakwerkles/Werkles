# TO LADY JESSICA - 1Password Regression Command

## Mission

Make the prompt-risk audit a named repository command so every agent can run the same non-secret check after editing 1Password automation.

## Acceptance

- One package command runs the static audit.
- Audit invokes no `op` process.
- Existing unsafe caller count remains zero.
- Missing token remains a blocker, not a prompt.

No token install, provider login, push, or deploy.
