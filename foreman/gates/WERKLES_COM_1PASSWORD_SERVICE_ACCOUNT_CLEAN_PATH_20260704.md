# Werkles.com 1Password clean automation path

STATUS: READY_FOR_SAFE_MODE  
DATE: 2026-07-04  
SCOPE: `Werkles Automation` vault / `Werkles Vercel Secrets` item / Werkles Vercel env sync

## Why This Exists

1Password desktop CLI integration prompted repeatedly from Codex hidden shells.
That path is now blocked in the Werkles helper scripts.

The clean automation path uses a dedicated `Werkles Automation` vault plus a
short-lived scoped service account token supplied as `OP_SERVICE_ACCOUNT_TOKEN`.
This avoids repeated Windows Hello/password prompts and keeps Codex out of the
normal human account unlock loop.

Important 1Password rule: service accounts cannot access built-in `Private`,
`Personal`, `Employee`, or default `Shared` vaults. Safe mode therefore copies
the item into a dedicated automation vault without printing values.

## Required 1Password Scope

Create/use a service account with access only to this vault:

```text
Werkles Automation
```

Required vault permissions:

```text
read_items
write_items
```

Do not grant vault creation. Do not grant unrelated vaults.

## One-Session Safe Mode

Preferred command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Invoke-WerklesVercelSafeMode.ps1 -ExecuteSync -GenerateMissingCronSecret
```

This runner:

```text
1. Creates/uses the Werkles Automation vault
2. Copies/merges Private / Werkles Vercel Secrets into the automation vault
3. Creates a short-lived service account scoped to Werkles Automation
4. Runs the Vercel sync with the token kept in process memory only
5. Clears OP_SERVICE_ACCOUNT_TOKEN from the process environment
```

Use `-DryRunSync` to exercise the path without changing Vercel.

## Token Handling Rule

The service account token is a secret.

```text
DO NOT paste it into chat.
DO NOT commit it.
DO NOT save it in a repo file.
DO NOT screenshot it.
```

It can be placed in the live PowerShell process environment only:

```powershell
$env:OP_SERVICE_ACCOUNT_TOKEN = '<paste token in local terminal only>'
```

After the cleanup/sync:

```powershell
Remove-Item Env:\OP_SERVICE_ACCOUNT_TOKEN -ErrorAction SilentlyContinue
```

## Cleanup Command If Token Already Exists

From:

```text
C:\Users\Ben Leak\github\Werkles
```

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Invoke-WerklesOnePasswordTransaction.ps1
```

Expected result:

```text
matching_item_count_after: 1
duplicate_items_renamed_count: 1
secret_values_printed: NO
secret_values_written_to_repo: NO
```

## Then Sync Vercel From 1Password

Dry run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Sync-WerklesVercelEnvFrom1Password.ps1 -DryRun -Mode OpRefs -Target Both
```

Real sync, after confirming the 1Password item has correct values:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Sync-WerklesVercelEnvFrom1Password.ps1 -Mode OpRefs -Target Both
```

## Official References

- 1Password service accounts with CLI: https://developer.1password.com/docs/service-accounts/use-with-1password-cli/
- 1Password service account setup: https://developer.1password.com/docs/service-accounts/get-started
- 1Password service account security: https://developer.1password.com/docs/service-accounts/security/
