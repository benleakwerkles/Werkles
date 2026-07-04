# TO_DINK@MEDULLINA — Install 1Password

**From:** Maker (Cursor Cloud Agent, `CURSOR_CLOUD_CONTAINER`)
**To:** Dink@Medullina, or Ben directly
**Mission:** MEDULLINA_1PASSWORD_INSTALL
**Dispatch class:** AUTO_LOAD_HUMAN_SEND
**Receipt required:** Y
**Issued:** 2026-07-04
**Human gate:** Install is mechanical (non-gate). **Sign-in, account creation, MFA, and vault unlock are BEN-ONLY.** No agent enters credentials, ever.

---

## Context

Ben ordered 1Password installed on Medullina. A cloud agent cannot touch Medullina, so this packet carries the mechanical steps for local hands.

Per `foreman/messages/DINK_BETSY_RELAY_PROJECT_HANDOFF_PACKET_20260703.md`:

- Password/1Password work runs in its **own clean project/thread**, never inside relay test threads.
- **Forbidden everywhere:** passwords, MFA codes, recovery codes, tokens, account numbers, vault exports, or 1Password item secrets in chat, repo files, receipts, packets, screenshots, or handoffs.
- Allowed in receipts: install status, app version, account/item **names** if needed, and status fields like `KNOWN`, `MISSING`, `MFA_HUMAN_GATE`, `BLOCKED`.

---

## Required Local Hands Readback (before installing)

Per `foreman/EXECUTION_CONTEXT_RULES.md`, lead with:

```text
LOCAL HANDS READBACK
Machine: <hostname>          ← must confirm this is Medullina
Repo: <path or N/A — this task does not require the repo>
Branch: <branch or N/A>
Commit: <hash or N/A>
Working tree: <status or N/A>
Terminal: available
Localhost: <running | not running>
Port: <port | none>
EXECUTION_CONTEXT: LOCAL (Medullina)
```

If the hostname does not confirm Medullina, stop. Do not install on a guessed machine.

---

## Install Steps (Windows, mechanical, non-gate)

Preferred — winget:

```powershell
winget install --id AgileBits.1Password --accept-source-agreements --accept-package-agreements
```

Optional CLI (only if Ben wants `op` scripting later):

```powershell
winget install --id AgileBits.1Password.CLI --accept-source-agreements --accept-package-agreements
```

If winget is unavailable, download the installer from the official source only:

```text
https://1password.com/downloads/windows/
```

Do not source the installer from anywhere else.

Verify:

```powershell
winget list --id AgileBits.1Password
```

---

## STOP — Ben-Only Gate

Stop after the app launches to its sign-in screen. The following are **BEN-ONLY**:

- signing in or creating an account
- entering the Secret Key, password, or MFA
- unlocking or creating vaults
- browser-extension sign-in approval
- importing or exporting any credential data

Leave the app at the sign-in screen and report.

---

## Required Receipt

Return to `foreman/handoffs/inbox/` as `FROM_DINK_MEDULLINA_1PASSWORD_INSTALL_<timestamp>.md`:

```text
PACKET: TO_DINK_MEDULLINA_1PASSWORD_INSTALL
MACHINE:
HOSTNAME_CONFIRMED_MEDULLINA: YES|NO
INSTALL_METHOD: winget|manual-download
APP_INSTALLED: YES|NO
APP_VERSION:
CLI_INSTALLED: YES|NO|SKIPPED
STOPPED_AT_SIGNIN_GATE: YES
SECRETS_ENTERED: NONE
BLOCKERS:
```

No secrets, no screenshots of vault content, no account identifiers beyond what Ben already uses openly.
