# All Aeyes 1Password Cursor No-Prompt Packet

Status: ACTIVE
Issued: 2026-07-04
Audience: Heimerdinker, Maker, Doozer, and every Werkles Windows workstation agent
Scope: Stop repeated 1Password CLI authorization prompts in Cursor/Codex terminals without exposing secrets.

## Starter Message

```text
Execute this packet:
foreman/messages/ALL_AEYES_1PASSWORD_CURSOR_NO_PROMPT_PACKET_20260704.md

Goal: install or verify the no-prompt 1Password CLI path for this machine.

Rules:
- Do not print, paste, screenshot, or write secret values.
- Do not put a 1Password service-account token in chat, command history, git, logs, or receipts.
- Use the repo-local wrapper, not raw desktop 1Password CLI integration, for automation.
- If the token is missing on this Windows user, return BLOCKED_TOKEN_NOT_STORED unless Ben explicitly chooses one hidden/clipboard token install.

Return the REQUIRED READBACK block at the end.
```

## Why This Exists

1Password desktop CLI integration on Windows authorizes per process/session. Cursor creates new shells and sub-processes, so "1Password is unlocked" and "Windows Hello is enabled" still does not mean every `op` call stays authorized forever.

For Werkles automation, the durable path is:

```text
Windows Credential Manager stores a scoped 1Password service-account token once per Windows user.
Repo-local op wrapper loads that token into only the child op process.
Cursor terminals put the repo wrapper first in PATH.
Desktop biometric prompts are disabled for automation commands.
```

## Files That Must Exist

```text
.vscode/settings.json
scripts/foreman/WerklesOnePasswordCredential.ps1
scripts/foreman/Invoke-WerklesOp.ps1
scripts/foreman/Enter-WerklesOnePasswordAutomationSession.ps1
scripts/foreman/Install-WerklesCursorOnePasswordNoPrompt.ps1
scripts/foreman/Store-WerklesOnePasswordAutomationToken.ps1
scripts/foreman/bin/op.cmd
```

## One Command, Existing Token

Run this first on every machine:

```powershell
$WerklesRoot = @(
  "$env:USERPROFILE\github\Werkles",
  "$env:USERPROFILE\Desktop\github\Werkles"
) | Where-Object { Test-Path (Join-Path $_ "scripts\foreman\Install-WerklesCursorOnePasswordNoPrompt.ps1") } | Select-Object -First 1
if (-not $WerklesRoot) { throw "Werkles checkout not found. Open the canonical Werkles repo and run this from its root." }
Set-Location -LiteralPath $WerklesRoot
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Install-WerklesCursorOnePasswordNoPrompt.ps1 -VerifyOnly
```

If status is `PASS`, reload Cursor or open a new Cursor terminal. Done.

## One-Time Token Install, If Missing

Only if the script returns `BLOCKED_TOKEN_NOT_STORED`, Ben may choose one of these. The token must never appear in chat.

Hidden prompt:

```powershell
$WerklesRoot = @(
  "$env:USERPROFILE\github\Werkles",
  "$env:USERPROFILE\Desktop\github\Werkles"
) | Where-Object { Test-Path (Join-Path $_ "scripts\foreman\Install-WerklesCursorOnePasswordNoPrompt.ps1") } | Select-Object -First 1
if (-not $WerklesRoot) { throw "Werkles checkout not found. Open the canonical Werkles repo and run this from its root." }
Set-Location -LiteralPath $WerklesRoot
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Install-WerklesCursorOnePasswordNoPrompt.ps1 -PromptForToken
```

Clipboard handoff:

```powershell
$WerklesRoot = @(
  "$env:USERPROFILE\github\Werkles",
  "$env:USERPROFILE\Desktop\github\Werkles"
) | Where-Object { Test-Path (Join-Path $_ "scripts\foreman\Install-WerklesCursorOnePasswordNoPrompt.ps1") } | Select-Object -First 1
if (-not $WerklesRoot) { throw "Werkles checkout not found. Open the canonical Werkles repo and run this from its root." }
Set-Location -LiteralPath $WerklesRoot
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Install-WerklesCursorOnePasswordNoPrompt.ps1 -FromClipboard
```

After either path, reload Cursor or open a new Cursor terminal.

## Expected Behavior

In a new Cursor terminal in this repo:

```powershell
Get-Command op
op item list --vault "Werkles Automation" --format json
```

Expected:

```text
Get-Command op resolves to the repo-local wrapper/function.
op exits 0.
No 1Password desktop prompt appears.
No secret values print.
```

## Failure Rules

Return `BLOCKED_TOKEN_NOT_STORED` if the token is absent and Ben has not approved a hidden/clipboard install.

Return `BLOCKED_WRAPPER_MISSING` if `scripts/foreman/bin/op.cmd` is missing.

Return `BLOCKED_CURSOR_SETTINGS_MISSING` if `.vscode/settings.json` is missing.

Return `BLOCKED_OP_VERIFY_FAILED` if the wrapper exists but `op item list --vault "Werkles Automation"` fails.

Do not retry raw `op vault list` repeatedly through desktop integration. That is the prompt loop this packet is meant to stop.

## Required Readback

```text
PACKET_ID: ALL_AEYES_1PASSWORD_CURSOR_NO_PROMPT_PACKET_20260704
AEYE_NAME:
MACHINE:
CANONICAL_PATH:
TOKEN_STORED_IN_WINDOWS_CREDENTIAL_MANAGER: YES|NO
WRAPPER_PATH:
CURSOR_SETTINGS_PATH:
CURSOR_DEFAULT_PROFILE:
OP_AUTH_SOURCE:
WRAPPER_VERIFY_EXIT_CODE:
VISIBLE_ITEM_COUNT_NAMES_ONLY:
ONEPASSWORD_DESKTOP_PROMPT_TRIGGERED: NO|YES
SECRET_VALUES_PRINTED: NO
TOKEN_PRINTED: NO
RECEIPT_PATH:
STATUS: PASS|BLOCKED_TOKEN_NOT_STORED|BLOCKED_WRAPPER_MISSING|BLOCKED_CURSOR_SETTINGS_MISSING|BLOCKED_OP_VERIFY_FAILED|BLOCKED_OTHER
NEXT_ACTION:
```

## Source Anchors

- 1Password CLI app integration security: Windows sub-shells can require separate authorization.
- 1Password CLI environment variables: `OP_SERVICE_ACCOUNT_TOKEN` is the supported automation auth path.
- Local proof on Betsy: `foreman/receipts/WERKLES_COM_CURSOR_1PASSWORD_PROMPT_LOOP_FIX_20260704.json`
