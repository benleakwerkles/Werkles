# Werkles Auth Tooling Readiness

Status: `NOT_READY`

Machine: `Betsy`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
HEAD: `6790477`  
Date: `2026-07-13`

## Bottom Line

The Supabase CLI/API path and the 1Password noninteractive automation path are not ready for Lady Jessica's matching preview rollout yet.

1Password CLI itself is installed, but the automation/session pieces needed to run gated probes without waking desktop prompts are missing.

Supabase CLI/API auth is missing. Current shell cannot run authenticated Supabase CLI/API work without a visible OAuth/login step or another approved token path.

## Supabase Readiness

| Check | Result |
|---|---:|
| `supabase` on PATH | `MISSING` |
| `npx --no-install supabase --version` | `MISSING_PACKAGE` |
| `C:\Users\Ben Leak\.supabase\access-token` | `MISSING` |
| `SUPABASE_ACCESS_TOKEN` environment variable | `MISSING` |
| `.supabase\config.toml` | `MISSING` |
| `supabase\config.toml` | `MISSING` |

Verdict:

`SUPABASE_CLI_API_NOT_READY`

## 1Password Readiness

| Check | Result |
|---|---:|
| `op` CLI | `PRESENT` |
| `op --version` | `2.34.1` |
| `OP_SERVICE_ACCOUNT_TOKEN` environment variable | `MISSING` |
| `OP_SESSION*` environment variable | `MISSING` |
| Windows Credential Manager target `Werkles/1Password/AutomationToken` | `MISSING` |
| `foreman\gates\werkles-vercel-tier-a.env.oprefs` | `PRESENT` |

Verdict:

`ONEPASSWORD_CLI_PRESENT__AUTOMATION_NOT_READY`

## Vercel Tooling Side Check

This also affects preview rollout:

| Check | Result |
|---|---:|
| `vercel` on PATH | `MISSING` |
| `C:\Users\Ben Leak\AppData\Roaming\Vercel\auth.json` | `MISSING` |
| `npx --no-install vercel --version` | `MISSING_PACKAGE` |

Verdict:

`VERCEL_CLI_NOT_READY_IN_THIS_SHELL`

## What Is Still Needed

One of the following must happen before the live Supabase table probe or preview deploy can be trusted:

1. Complete visible Betsy Supabase OAuth, then verify `~\.supabase\access-token` exists and link the target project.
2. Restore/install the scoped 1Password automation token so `op run --env-file=foreman\gates\werkles-vercel-tier-a.env.oprefs` can run noninteractively.
3. Restore Vercel CLI auth/tooling if the next step is preview env mutation or preview deploy from this shell.

## Safety Boundary

- Secrets printed: `NO`
- Token values printed: `NO`
- SQL applied: `NO`
- Supabase project changed: `NO`
- Vercel environment changed: `NO`
- Deploy run: `NO`
