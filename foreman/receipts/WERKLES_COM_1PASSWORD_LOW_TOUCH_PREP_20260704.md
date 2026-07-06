# WERKLES_COM_1PASSWORD_LOW_TOUCH_PREP_20260704

RECEIPT_ID: RECEIPT_WERKLES_COM_1PASSWORD_LOW_TOUCH_PREP_20260704
TIMESTAMP: 2026-07-04T01:32:41-04:00
LANE: Werkles.com / Betsy
GATE: APPROVE SECRET ENTRY - already approved
SECRET_VALUES_WRITTEN: NO
SECRET_VALUES_PRINTED: NO

## Purpose

Reduce Ben's 1Password/Vercel secret-sync work to the fewest possible touches.

## Canonical Path

Active Git root:

`C:\Users\Ben Leak\github\Werkles`

Retired path avoided:

`C:\Users\Ben Leak\Desktop\github\Werkles`

## Prep Completed

- Confirmed 1Password CLI is installed but not on PATH.
- Confirmed the existing sync script finds beta CLI at:
  - `C:\Users\Ben Leak\AppData\Local\1PasswordCLI-beta\op.exe`
- Confirmed `op account list` sees:
  - `my.1password.com`
  - `benleak81@gmail.com`
- Confirmed Vercel CLI works through `npx.cmd`.
- Confirmed Vercel auth:
  - `benleak-2090`
- Confirmed Vercel project link:
  - project name: `werkles1`
  - project id: `prj_IAwxCYEv9mCNiBONFWWu99uymkoq`
- Updated op refs file for Path B single-item layout:
  - `foreman/gates/werkles-vercel-tier-a.env.oprefs`
- Updated UI fallback guide:
  - `foreman/gates/WERKLES_COM_1PASSWORD_UI_FALLBACK_20260704.md`
- Patched Windows `npx.ps1` execution-policy trap by using `npx.cmd` in:
  - `scripts/foreman/Sync-WerklesVercelEnvFrom1Password.Inner.ps1`
  - `scripts/foreman/Sync-WerklesVercelEnvPreviewToProduction.ps1`
- Updated local readback commands to the Windows-safe `npx.cmd vercel` form in:
  - `foreman/gates/WERKLES_COM_VERCEL_SECRET_ENTRY_SESSION_20260704.md`
  - `foreman/receipts/WERKLES_COM_BLIND_ENV_SYNC_EXECUTION_20260704.md`

## Names-Only Dry Run

Command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Sync-WerklesVercelEnvFrom1Password.ps1 -Mode OpRefs -Target Both -DryRun
```

Result:

- PASS
- Mode: `OpRefs`
- Target preview: 8 tier-A names would sync.
- Target production: 8 tier-A names would sync.
- No secret values read or printed in dry run.

## Current Vercel Env Name State

Preview currently has 6 tier-A names:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID`
- `NEXT_PUBLIC_SUPABASE_URL`

Preview missing:

- `STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID`
- `CRON_SECRET`

Production currently has:

- no environment variables

## Current 1Password Blocker

`op vault list` cannot complete yet.

Observed states:

- Earlier result: `connecting to desktop app: cannot connect to 1Password app, make sure it is running`
- Later result: command timed out waiting for desktop unlock/integration.

Likely cause:

- 1Password desktop app is locked, CLI integration is disabled, or the newer Developer setting requires `Integrate with other apps` / CLI support to be enabled.

## Low-Touch Human Action

Touch 1:

Open/unlock 1Password on Betsy and enable whichever Developer toggle exists:

- `Integrate with 1Password CLI`
- `Command-Line Interface -> Integrate with 1Password CLI`
- `Integrate with other apps`

Then tell Codex:

`OP_IS_READY`

## What Codex Runs After OP_IS_READY

```powershell
cd C:\Users\Ben Leak\github\Werkles

$op = Join-Path $env:LOCALAPPDATA '1PasswordCLI-beta\op.exe'
& $op vault list

powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Sync-WerklesVercelEnvFrom1Password.ps1 -Mode OpRefs -Target Both

npx.cmd vercel@latest env ls preview
npx.cmd vercel@latest env ls production
```

If the vault is named something other than `Ben vault`, Codex updates only the vault segment in:

`foreman/gates/werkles-vercel-tier-a.env.oprefs`

No secret values go into chat, repo files, or receipts.

## Important Boundary

Production env sync is not a production deploy.

Still gated after sync:

- `APPROVE PRODUCTION ROLLOUT`
- `APPROVE PAID CHECKOUT GO-LIVE`
