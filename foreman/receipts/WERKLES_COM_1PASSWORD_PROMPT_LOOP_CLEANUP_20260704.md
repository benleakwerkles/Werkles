# WERKLES_COM_1PASSWORD_PROMPT_LOOP_CLEANUP_20260704

RECEIPT_ID: RECEIPT_WERKLES_COM_1PASSWORD_PROMPT_LOOP_CLEANUP_20260704  
TIMESTAMP: 2026-07-04  
MACHINE: BETSY  
LANE: Werkles.com / Vercel env / 1Password cleanup  
STATUS: PARTIAL_CLEANUP_COMPLETE_WITH_1PASSWORD_DUPLICATE_BLOCKER

## Secret Safety

SECRET_VALUES_PRINTED: NO  
SECRET_VALUES_WRITTEN_TO_REPO: NO  
SECRET_VALUES_SCREENSHOT: NO  
SECRET_VALUES_LEFT_IN_TEMP: NO OBSERVED  
HIDDEN_1PASSWORD_PROMPT_LOOP_DISABLED: YES

## What Happened

1Password desktop integration treated Codex-spawned hidden shells as fresh
authorization contexts. Repeated `op` calls caused repeated 1Password prompts.
That workflow is no longer considered acceptable for Werkles secret sync.

During the failed write attempts, a duplicate `Werkles Vercel Secrets` item was
likely created in the `Private` vault. The receipt
`WERKLES_COM_1PASSWORD_FIELD_SET_20260704.json` records one created item id:
`m6pawzxsa5fqi6xxmay4fjawpm`. The earlier item id should be resolved only after
non-interactive 1Password auth is available.

## Current Variable Status

Vercel Preview contains these six names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID
```

Vercel Production contains zero names.

Known missing tier-A names:

```text
STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID
CRON_SECRET
```

Vercel sensitive values were not readable through `env pull`, `env run`, or
`env ls --format json`; only names were available.

## Cleanup Completed

The following scripts now refuse hidden desktop-integration `op` use unless
`OP_SERVICE_ACCOUNT_TOKEN` or `OP_SESSION` is already present:

```text
scripts/foreman/Set-1PasswordFieldFromStdin.ps1
scripts/foreman/Import-ProcessEnvTo1Password.ps1
scripts/foreman/Import-VercelPreviewEnvTo1Password.ps1
scripts/foreman/Invoke-WerklesOnePasswordTransaction.ps1
scripts/foreman/Sync-WerklesVercelEnvFrom1Password.ps1
```

`scripts/foreman/Sync-WerklesVercelEnvPreviewToProduction.ps1` now uses a
temporary file under `%TEMP%` instead of writing `.env.vercel-preview.pull` in
the repo root.

## Verification

Guard test results:

```text
Set-1PasswordFieldFromStdin.ps1 without OP_SERVICE_ACCOUNT_TOKEN/OP_SESSION:
  BLOCKED before op call

Invoke-WerklesOnePasswordTransaction.ps1 without OP_SERVICE_ACCOUNT_TOKEN/OP_SESSION:
  BLOCKED before op call

Sync-WerklesVercelEnvFrom1Password.ps1 -DryRun -Mode OpRefs -Target Preview:
  DRY_RUN names-only output
```

Temp residue check:

```text
%TEMP%\werkles-vercel-to-1p-*                NONE OBSERVED
%TEMP%\werkles-vercel-preview-pull-*.env     NONE OBSERVED
repo\.env.vercel-preview.pull                NONE OBSERVED
```

Syntax check:

```text
scripts/foreman/Set-1PasswordFieldFromStdin.ps1                 OK
scripts/foreman/Import-ProcessEnvTo1Password.ps1                OK
scripts/foreman/Import-VercelPreviewEnvTo1Password.ps1          OK
scripts/foreman/Invoke-WerklesOnePasswordTransaction.ps1        OK
scripts/foreman/Sync-WerklesVercelEnvFrom1Password.ps1          OK
scripts/foreman/Sync-WerklesVercelEnvPreviewToProduction.ps1    OK
```

Script hashes after cleanup:

```text
Set-1PasswordFieldFromStdin.ps1                 AF87ADBB738602B423FC16F6F27210E9D06F409675C0AF8AA60CFD0C8B335A5B
Import-ProcessEnvTo1Password.ps1                158815DF54FCF155CEE0850543CBA1FEDDBD33AA53C88DBAEDDACC917817607A
Import-VercelPreviewEnvTo1Password.ps1          A2C4B32BC76BC6BB0EDA6599C3FF105D6B0B586FD0CF0AF86465B877AA8FEE4E
Invoke-WerklesOnePasswordTransaction.ps1        C35CC4453254CA5E5219B75EE09DBFACA22244FEFA83C5FD5D3C1580E460906B
Sync-WerklesVercelEnvFrom1Password.ps1          84E3242C6BF4EAF1E74F458FF6C8BC159C4C4BC38A9BE278A94110F76D053F0C
Sync-WerklesVercelEnvPreviewToProduction.ps1    4F30B3DFEB8AAB51B37551FA4B5168D0A96DABE21B629872F5505872EF20DC26
```

## Remaining Blocker

Do not run hidden Codex 1Password CLI writes with desktop integration.

Allowed next auth models:

```text
OP_SERVICE_ACCOUNT_TOKEN
OP_SESSION from a visible terminal session owned by Ben
```

Once one of those is available, run the single transaction script to merge the
duplicate item, verify one `Werkles Vercel Secrets` item remains, and complete
the import without printing values.

Clean path doc:

```text
foreman/gates/WERKLES_COM_1PASSWORD_SERVICE_ACCOUNT_CLEAN_PATH_20260704.md
```

## Explicit Non-Actions

- Did not call `op` during cleanup receipt creation.
- Did not open 1Password or source dashboards after the prompt-loop failure.
- Did not delete or rename any 1Password items because that would have required
  the broken auth path.
