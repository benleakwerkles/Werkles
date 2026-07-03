# BLIND_PASSWORD_RELAY_SYSTEM_V0

Status: OPERATING_PROTOCOL
Created: 2026-06-30
Owner: Ben / Operator
Human relay: Courtney
Scope: Aeye crew sign-ins, workstation setup, browser/app access, and emergency login help.

## Purpose

Courtney needs a way to help the Aeye crew get signed in without handing passwords to an Aeye, a chat, a repo, a dashboard, a receipt, or a screenshot. This protocol makes Courtney the human keyholder and keeps the Aeyes as requesters, witnesses, and receipt writers only.

## Hard Rule

No password, passkey recovery phrase, TOTP seed, YubiKey PIN, backup code, API key, OAuth token, session cookie, or recovery email code is ever pasted into:

- Codex chat
- Aeye chat
- GitHub
- local repo files
- dashboard forms
- screenshots
- logs
- receipts
- task packets

If a secret appears in any of those places, treat it as compromised and rotate it.

## Recommended Storage Model

Use a real password manager as the source of truth. Good fits:

- 1Password: shared vaults for selected people; Business adds audit log/reporting.
- Bitwarden: organization vault plus collections; emergency access is available for individual vault continuity.

Do not use the Werkles repo as a password inventory. The repo only stores request and receipt metadata.

## Vault Shape

Create a vault or collection named:

```text
Aeye Crew Access - Courtney Relay
```

Suggested item tags:

```text
aeye
courtney-relay
human-gate
werkles
machine-betsy
machine-spanzee
machine-medullina
shared-login
personal-login
2fa-required
yubikey-required
break-glass
```

Every vault item should include non-secret notes:

```text
SERVICE:
LOGIN URL:
OWNER:
PURPOSE:
ALLOWED MACHINES:
WHO MAY REQUEST:
WHO MAY APPROVE:
2FA METHOD:
YUBIKEY REQUIRED: YES / NO
BACKUP CODES LOCATION: password manager item only / offline envelope / none
ROTATION OWNER:
LAST REVIEWED:
```

## Roles

Ben / Operator:

- Decides which accounts belong in the relay vault.
- Approves high-risk sign-ins.
- Holds final authority for deleting, rotating, or revoking access.

Courtney / Human Relay:

- Opens the password manager.
- Autofills or types credentials directly into the target app/browser.
- Touches YubiKey or enters second-factor codes only when approved.
- Reports success/failure without revealing the secret.

Aeye Crew:

- Requests a login using the request packet below.
- Prepares the exact URL/app/screen for Courtney.
- Pauses capture/logging/screenshots while Courtney performs the secret step.
- Writes a receipt after the login state is visible.
- Never asks Courtney to paste a password into chat.

## Blind Relay Flow

1. Aeye writes a credential request packet.
2. Ben or Courtney confirms the request is legitimate.
3. Aeye opens the target app/browser to the login screen.
4. Aeye stops screenshots, screen scraping, transcript capture, and clipboard logging for the secret step.
5. Courtney uses the password manager to autofill/type the credential.
6. Courtney completes 2FA or YubiKey touch if required.
7. Aeye resumes only after Courtney says the secret step is complete.
8. Aeye records a receipt with login status, account/service, machine, and blocker if any.
9. If login fails, Aeye reports the error text without asking for the password.

## Request Packet

```text
CREDENTIAL_RELAY_REQUEST
REQUEST_ID:
REQUESTED_BY:
MACHINE:
SERVICE:
LOGIN_URL_OR_APP:
ACCOUNT_LABEL:
WHY_NEEDED:
URGENCY: LOW / NORMAL / HIGH / EMERGENCY
APPROVED_BY:
SECRET_VISIBILITY_RISK: NONE / PASSWORD_FIELD_MASKED / SCREEN_MAY_SHOW_SECRET / UNKNOWN
2FA_EXPECTED: YES / NO / UNKNOWN
YUBIKEY_EXPECTED: YES / NO / UNKNOWN
SCREEN_READY_FOR_COURTNEY: YES / NO
WHAT_COURTNEY_SHOULD_DO:
WHAT_COURTNEY_SHOULD_NOT_DO:
RETURN_TO_AEYE_WHEN_DONE:
```

## Completion Receipt

```text
CREDENTIAL_RELAY_RECEIPT
REQUEST_ID:
SERVICE:
MACHINE:
ACCOUNT_LABEL:
COURTNEY_RELAY_USED: YES / NO
PASSWORD_DISCLOSED_TO_AEYE: NO
SECRET_STORED_IN_REPO_OR_CHAT: NO
2FA_COMPLETED: YES / NO / NOT_REQUIRED
YUBIKEY_TOUCHED: YES / NO / NOT_REQUIRED
LOGIN_RESULT: SUCCESS / FAILED / BLOCKED
VISIBLE_PROOF:
BLOCKER:
NEXT_ACTION:
```

## High-Risk Accounts

These require Ben approval before Courtney relays them:

- banking
- Stripe or payment processor
- domain registrar
- production database
- GitHub owner/admin
- Google Workspace admin
- Apple ID / Microsoft account recovery
- password manager admin account
- any account with billing, payroll, legal, or court/corporate authority

## Break-Glass Rule

Break-glass credentials may exist only in the password manager or a physical offline envelope. The repo may contain the location label, not the secret.

Example allowed repo text:

```text
BREAK_GLASS_LOCATION: 1Password item "Werkles Break Glass Index" / offline envelope in known home safe
```

Example forbidden repo text:

```text
The actual password, TOTP seed, backup code, or recovery phrase.
```

## Rotation Rule

Rotate a credential immediately if:

- it was pasted into any chat or repo
- it appeared in a screenshot
- an Aeye saw an unmasked password field
- a remote session recording captured it
- a device was lost or untrusted
- Courtney is unsure whether it was exposed

## First Setup Checklist

```text
[ ] Choose password manager source of truth.
[ ] Create "Aeye Crew Access - Courtney Relay" vault/collection.
[ ] Add Courtney with only the access level actually needed.
[ ] Add Ben as owner/admin.
[ ] Turn on 2FA for Courtney and Ben.
[ ] Move only required Aeye/workstation credentials into the vault/collection.
[ ] Add non-secret metadata notes to each item.
[ ] Create first credential relay request packet.
[ ] Run one low-risk test login.
[ ] Save completion receipt with no secrets.
```

## First Test Candidate

Use a low-risk account first. Do not begin with GitHub admin, billing, bank, registrar, or password-manager admin.

Suggested first test:

```text
SERVICE: RustDesk or non-admin app login
MACHINE: Medullina or Betsy
GOAL: prove Courtney can relay access without exposing the secret
SUCCESS: Aeye sees logged-in state and receipt says PASSWORD_DISCLOSED_TO_AEYE: NO
```
