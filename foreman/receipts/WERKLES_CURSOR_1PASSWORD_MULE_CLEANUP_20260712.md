# Werkles Cursor 1Password Mule Cleanup

Status: `BLOCKED_ONE_TIME_TOKEN_INSTALL`

## Proven root cause

- Cursor workspace settings already prepend `scripts\foreman\bin` and disable biometric unlock for automation.
- The repo-local `op.cmd` wrapper exists.
- The real 1Password CLI is installed.
- Windows Credential Manager does **not** contain `Werkles/1Password/AutomationToken`.
- Without that stored scoped token, automation cannot use the non-interactive service-account path and raw/legacy `op` processes can trigger desktop authorization requests.

## Repairs completed

- Restored the shared helper functions required by the no-prompt wrapper and installer.
- Made the installer return a truthful blocked receipt under strict mode instead of crashing while reporting missing optional fields.
- Verified the installer now returns `BLOCKED_TOKEN_NOT_STORED` without opening 1Password or printing secrets.

## One-time human action

From the canonical repo, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\Install-WerklesCursorOnePasswordNoPrompt.ps1 -PromptForToken
```

Paste the scoped **Werkles Automation service-account token** into the hidden PowerShell prompt. Do not paste it into chat, Cursor text, command arguments, files, logs, or receipts. Then fully reload Cursor or open a new Werkles terminal.

## Required verification

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\Install-WerklesCursorOnePasswordNoPrompt.ps1 -VerifyOnly
```

Success is `PASS`, wrapper resolution, names-only item count, and no 1Password desktop prompt.

## Policy cleanup still needed

Legacy automation scripts that invoke raw `op` must be migrated to `Invoke-WerklesOp.ps1` or explicitly fail closed when neither a service-account token nor approved session exists. Desktop integration should remain a visible human-only diagnostic path, not the automation default.

No credential value was read or printed during this diagnosis.
