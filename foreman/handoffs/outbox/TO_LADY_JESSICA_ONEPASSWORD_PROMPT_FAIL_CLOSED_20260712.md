# TO LADY JESSICA - 1Password Prompt Fail-Closed QA

## Mission

Ensure automation cannot wake the 1Password desktop prompt when the scoped service-account credential is absent. Patch the highest-risk unguarded callers to use the repo wrapper or stop before `op`.

## Acceptance

- Missing stored token produces a clear blocker before 1Password is invoked.
- Automation wrapper disables biometric desktop integration.
- The visible desktop-integration smoke remains explicitly human-only.
- Tests use no secret values and do not run provider authentication.

Return a receipt. No token install, deploy, or push.
