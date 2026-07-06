# WERKLES_COM_1PASSWORD_CLI_DESKTOP_INTEGRATION_20260704

RECEIPT_ID: RECEIPT_WERKLES_COM_1PASSWORD_CLI_DESKTOP_INTEGRATION_20260704
TIMESTAMP: 2026-07-04
LANE: Werkles.com / Betsy / 1Password CLI Desktop Integration
MODE: METADATA_ONLY_CLI_PLUMBING

## Secret Safety

SECRET_VALUES_READ: NO
SECRET_VALUES_PRINTED: NO
SECRET_VALUES_WRITTEN_TO_REPO: NO
SECRET_REFS_EXPANDED: NO
VAULT_ITEMS_READ: NO
RAW_PASSWORD_EXPORTS_OPENED: NO
LIVE_LOGINS_ATTEMPTED: NO
WEBSITES_OR_DASHBOARDS_CREATED_FROM_SECRETS: NO

## Official Guidance Checked

- 1Password CLI desktop app integration:
  - https://developer.1password.com/docs/cli/app-integration
- 1Password CLI get started:
  - https://developer.1password.com/docs/cli/get-started/
- 1Password app integration security model:
  - https://developer.1password.com/docs/cli/app-integration-security
- Windows Hello for 1Password:
  - https://support.1password.com/windows-hello/

## Installed CLI State

Stable CLI:

- `op --version`: `2.34.1`
- Path: `C:\Users\Ben Leak\AppData\Local\Microsoft\WinGet\Packages\AgileBits.1Password.CLI_Microsoft.Winget.Source_8wekyb3d8bbwe\op.exe`

Beta CLI also present:

- `2.36.0-beta.02`
- Path: `C:\Users\Ben Leak\AppData\Local\1PasswordCLI-beta\op.exe`

Both CLIs listed the same 1Password account:

- URL: `my.1password.com`
- Email: `benleak81@gmail.com`
- User ID: `4OBKT4IVLVF4FBXNV4UHPQWKM4`
- Account ID: `AFS6SJ5WYRBDNDSDKRSWBIUOME`

## Desktop Integration Test

Added helper:

`scripts/foreman/Test-1PasswordCliDesktopIntegration.ps1`

Helper behavior:

- Opens/runs a visible `op vault list --account <account> --format json` test.
- Triggers 1Password desktop authorization / Windows Hello.
- Writes a metadata-only receipt.
- Does not read vault items, fields, secret refs, or password values.

Visible tester receipt:

`foreman/receipts/OP_DESKTOP_INTEGRATION_TEST_20260704.json`

Observed result:

- Status: `PASS`
- Machine: `BETSY`
- Account: `my.1password.com`
- CLI version: `2.34.1`
- Vault count: `1` account result containing visible vault names:
  - `Private`
  - `Shared`

## Important Behavior

1Password desktop authorization is prompt/session sensitive. Running multiple `op` commands in parallel can create overlapping authorization prompts and timeouts.

Rule for follow-on secret sync:

- Run one `op` command at a time.
- Prefer a visible helper window for the final secret-sync command if Codex's hidden shell cannot surface the Windows Hello prompt.
- Do not treat an authorization timeout as a secret failure; it means the user prompt was not approved in time or was not surfaced.

## Repo Fix Applied

Updated:

`foreman/gates/werkles-vercel-tier-a.env.oprefs`

Change:

- Replaced nonexistent `op://Ben vault/...` vault segment with CLI-confirmed `op://Private/...`.

Post-fix check:

- `op://Private/` refs: `8`
- `op://Ben vault/` refs: `0`
- `REPLACE_ME` placeholders: `0`
- Plain secret-value assignments: `0`

Updated guide:

`foreman/gates/WERKLES_COM_1PASSWORD_UI_FALLBACK_20260704.md`

Change:

- Corrected Path B vault wording from `Ben vault` to `Private`.

## Dry Run

Command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Sync-WerklesVercelEnvFrom1Password.ps1 -Mode OpRefs -Target Both -DryRun
```

Result:

- PASS
- Preview names-only dry run: 8 Tier A names.
- Production names-only dry run: 8 Tier A names.
- No secret values expanded, read, printed, or sent.

## Remaining Blocker Before Real Vercel Sync

Earlier metadata-only title check did not find an item titled:

`Werkles Vercel Secrets`

in either CLI-visible vault:

- `Private`
- `Shared`

Next required state before non-dry-run sync:

- A normal 1Password item titled `Werkles Vercel Secrets` exists in `Private`.
- It has these exact eight field names:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID`
  - `STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID`
  - `CRON_SECRET`

Do not run the non-dry-run Vercel sync until that item exists and is filled.
