# Aeye Machine Credential Baseline - 2026-07-11

Mode: no secrets, machine-local readiness architecture

## Bottom Line

Yes. Betsy can absolutely be part of the problem if Google Password Manager / Google autofill is still active, if the 1Password browser extension is not signed into the right accounts, or if the browser profile is different from the one that was fixed on Doss.

But Google autofill is only one layer. The real rule is:

1Password syncs vault data. It does not sync machine trust.

That means each machine needs its own baseline for:

- browser profile
- 1Password extension
- 1Password desktop app
- Windows Hello / local unlock
- 1Password CLI integration
- GitHub CLI
- Git branches / repo roots
- Chrome / Google Password Manager settings
- local relay / Harvey / Codex worker permissions

## Why "No Items To Show" Can Still Happen

If an item is fixed in 1Password on Doss, another machine can still show no usable item when:

- the machine is signed into the wrong 1Password account
- the 1Password browser extension is locked
- the browser profile does not have the 1Password extension installed
- the extension is signed into Family but not Business, or the reverse
- the relevant vault is not available to that account/profile
- the site's URL match has not synced yet
- Chrome/Google Password Manager is taking over passkey/password prompts
- the user clicked a provider's passkey path when the 1Password item only has password plus OTP
- the provider has multiple login portals and the extension is matching the wrong one

Google autofill usually does not prevent 1Password from having matches by itself. It does create noise, wrong suggestions, passkey prompts, and focus stealing. For this workflow it should be turned off on every machine/browser profile that is used for password cleanup.

## Handeye 1Password Browser Fix

Use this section when a machine says `No items to show`, the inline 1Password field button is blank, or 1Password does not offer a login that exists in the desktop app.

This is a per-machine and per-browser-profile fix. Doss doing this does not fix Betsy, Spanzee, Sally, or any other Handeye.

## Universal No-Items Fix Routine

Every Handeye should run this exact routine when 1Password does not offer the expected login in Chrome:

1. Run the desktop detection check:
   - `Get-StartApps | Where-Object { $_.Name -match '1Password' }`
   - `Get-AppxPackage *1Password*`
   - `winget list --id AgileBits.1Password`
   - `winget list --id AgileBits.1Password.CLI`
2. Use the Chrome profile that actually has the 1Password extension installed and unlocked.
3. Open 1Password desktop and enable Settings > Browser integration.
4. Turn off Google Password Manager/autofill in the active Chrome profile.
5. Test via the 1Password extension popup search, not the inline field icon.

Betsy-specific current instruction:

- use Chrome `Default` for password cleanup, because `Profile 1` lacks the 1Password extension until it is installed/unlocked there

## Workspace And CLI Setup

The password baseline now rolls into the broader workstation baseline:

- `AEYE_WORKSPACE_AND_CLI_BASELINE_20260711.md`
- `Test-AeyeWorkspaceCliBaseline.ps1`

Every relevant Handeye should prove:

- PowerToys / Workspaces / FancyZones state
- 1Password desktop, browser integration, and `op` presence
- Chrome profile and 1Password extension state
- Google Password Manager/autofill conflict state
- Git and GitHub CLI presence
- local Werkles checkout path and branch state if repo work is assigned
- core runtime CLIs: PowerShell, winget, git, gh, op, node, npm/npm.cmd, Python, ssh
- provider/app CLIs when relevant: codex, openai, vercel, supabase, stripe, firebase, netlify, wrangler, docker, wsl, gcloud, aws, az, playwright
- local Harvey worker scripts and relay surfaces when present

Do not run auth-status or login commands from the baseline. It is detection and receipt-only.

### 1. 1Password Desktop

Open and unlock 1Password desktop on that machine.

Check:

- Settings > Security: Windows Hello / system unlock is enabled
- Settings > Browser: browser integration / connect with 1Password in the browser is enabled
- Settings > Developer: `Integrate with 1Password CLI` is enabled only if this machine is an operator station

The forgotten one-click from the earlier fix is most likely the Settings > Browser integration toggle. If that is off, Chrome can have the extension installed but still fail to talk cleanly to the unlocked desktop app.

### 2. 1Password Browser Extension

In the actual Chrome profile used for the login:

- confirm the 1Password extension is installed and enabled
- open the extension from the toolbar
- unlock it
- confirm the needed account is present: business for Werkles Tier 1, family for family/shared items
- confirm the needed vault is visible to that extension/account
- use extension popup search as the source of truth when the inline field icon is blank

For Wells Fargo-style failures:

- do not trust the little inline field icon if it says no items or renders blank
- open the 1Password extension popup
- search the provider name
- choose the canonical item
- use `Open & Fill`

### 3. Chrome / Google Password Manager

In the same Chrome profile:

- turn off Google Password Manager password saving/filling for this workflow
- turn off Google passkey prompts where they conflict
- do not let Chrome save a replacement password for a Tier 1 or shared login
- do not use Chrome credentials as source truth

### 4. URL Coverage

If the extension popup cannot find the item by provider search, then the issue is probably not the inline menu. Check the item itself:

- correct vault/account
- correct username
- provider homepage URL
- provider exact login URL
- alternate portal URL if the provider redirects after a failed login

For GitHub Tier 1, current expected login path is password plus authenticator app. Do not choose `Use a passkey` until a fresh 1Password passkey is registered into the Tier 1 item and verified.

## Source Rules From Prior Work

This packet borrows the two important rules from the Werkles checkout audit lane:

- prove the actual host before claiming anything about a machine
- do not infer Betsy or Spanzee state from Doss

The Doss audit found canonical Werkles at:

- `C:\Users\BenLeak\github\Werkles`

But that path on Doss is only Doss truth. Betsy, Spanzee, Sally, and any other machine must each produce their own readback.

## Machine Roles

Do not make every machine a full operator station unless it actually needs to mutate 1Password or run CLI workers.

| Role | Purpose | Needs 1Password CLI | Needs browser extension | Mutates accounts |
| --- | --- | --- | --- | --- |
| Hub / Operator | Worker batches, metadata receipts, Tier 1 item organization | Yes | Yes | Yes, controlled |
| Browser Tester | Real provider login verification | Optional | Yes | No by default |
| Family Access Check | Confirm shared vaults/items appear | No | Optional | No |
| Repo Worker | Git branches, GitHub CLI, local code work | Yes for `gh`, optional for `op` | Optional | Git only |
| Hardware Gate Station | YubiKey / Windows Hello / passkey checks | Optional | Yes | Only when approved |

Current default:

- Doss: hub/operator unless moved
- Betsy: browser tester plus local machine baseline
- Spanzee: target machine baseline before any claims
- Sally: relay/notification lane, then baseline if used for account work

## Per-Machine Baseline Order

Run this order on each machine.

### 1. Prove The Host

Collect:

- machine nickname
- Windows hostname
- current user
- current directory
- PowerShell version
- date/time

If the host is not the intended machine, stop and return a blocker.

### 2. Clear Branch / Repo Confusion

For the local Werkles checkout:

- find the repo root
- show branch
- show HEAD
- show origin
- show compact dirty status
- do not delete, move, reset, checkout, or clean without a separate approval packet

The intended canonical path is usually:

- `C:\Users\BenLeak\github\Werkles`

But that must be proven per machine.

### 3. GitHub CLI

Check:

- `gh --version`
- `gh auth status` only when a GitHub task requires it
- default account / host
- repo remote

Do not paste tokens into chat or files.

### 4. 1Password Desktop

On the machine:

- install/open 1Password desktop
- sign into the business account where needed
- sign into the family account where needed
- enable Windows Hello / system unlock
- enable browser integration
- enable Developer > Integrate with 1Password CLI only for operator machines

Do not put account passwords, Secret Keys, recovery codes, OTP seeds, or PINs into files.

### 5. 1Password CLI

Only operator machines need full `op` readiness.

Checks:

- `op --version`
- `op account list --format json` only when an operator session is intentionally open
- worker queue receipt for metadata-only work

Avoid random one-shot `op` probes. Use the Harvey worker lane for controlled batches.

### 6. Browser And Autofill

For every Chrome profile used for account work:

- install the 1Password extension
- unlock the extension
- make sure it sees the correct account(s)
- pin the extension if useful
- turn off Google Password Manager password saving
- turn off Google autofill where it conflicts
- remove or ignore stale Chrome-saved passwords for shared/Tier 1 accounts
- avoid provider passkey prompts unless the 1Password item actually has a verified passkey

This is the likely Betsy-specific cause path.

### 7. YubiKey / Windows Hello

Device presence is not enrollment proof.

Collect only:

- visible YubiKey/security-key devices
- Windows Hello availability/user prompt state

Do not claim a provider is protected by a key until that provider confirms enrollment.

### 8. Provider Test

For a provider like GitHub:

- use the correct portal URL
- confirm 1Password suggests the intended item
- confirm password path
- confirm OTP/authenticator path
- only then move to passkey registration

For GitHub specifically, current expected Tier 1 path is password plus authenticator app, not "Use a passkey", until a fresh 1Password passkey is registered and verified.

## Standard Receipt Shape

Each machine should write one redacted receipt:

```json
{
  "machine": "Betsy",
  "hostname": "DESKTOP-...",
  "user": "BenLeak",
  "timestamp": "2026-07-11T00:00:00-04:00",
  "repo": {
    "path": "C:\\Users\\BenLeak\\github\\Werkles",
    "is_git": true,
    "branch": "main",
    "head": "abcdef0",
    "origin": "https://github.com/benleakwerkles/Werkles.git",
    "status": "clean or compact dirty summary"
  },
  "tools": {
    "git": "present",
    "gh": "present",
    "op": "present",
    "one_password_desktop": "present"
  },
  "chrome_profiles": [
    {
      "profile": "Default",
      "one_password_extension": "present",
      "google_password_manager": "off"
    }
  ],
  "blockers": []
}
```

## Implementation Artifact

Use:

- `Test-AeyeMachineCredentialBaseline.ps1`

If that script is absent on the target machine, the Handeye must either sync/copy the script into that machine's local password-project folder or recreate it from this packet's contract. The receipt must say whether the runner was preexisting, copied, or recreated locally.

Default mode is read-only and avoids `op account list` / `gh auth status` so it does not create fresh human gates.

For a plain machine receipt:

```powershell
cd "C:\Users\BenLeak\Documents\1password Project"
powershell -NoProfile -ExecutionPolicy Bypass -File .\Test-AeyeMachineCredentialBaseline.ps1 -Nickname Betsy
```

For an operator-machine receipt when 1Password is already unlocked:

```powershell
cd "C:\Users\BenLeak\Documents\1password Project"
powershell -NoProfile -ExecutionPolicy Bypass -File .\Test-AeyeMachineCredentialBaseline.ps1 -Nickname Doss -CheckOpAccounts -CheckGhAuth
```

## Thread Split Recommendation

This password thread should not become the permanent workstation-baseline thread.

Create or use a separate machine-baseline task for:

- Doss baseline
- Betsy baseline
- Spanzee baseline
- Sally baseline
- branch cleanup planning
- CLI setup receipts
- Chrome/Google autofill cleanup receipts
- 1Password browser-extension receipts

Then bring only the credential-specific blockers back into this password project.

## Hub Decision

Agreed: the hub architecture is now:

- Doss/Swanson coordinates
- each machine proves itself locally
- no cross-machine guessing
- no secrets in packets
- no blind PIN or Windows Hello automation
- 1Password data cleanup stays in the password project
- machine readiness moves into its own baseline lane

## Betsy Baseline Import - 2026-07-11

Betsy produced a local read-only baseline from a recreated runner.

Imported packet:

- `BETSY_CREDENTIAL_BASELINE_READBACK_20260711.md`

High-signal readback:

- host proved as `BETSY`
- canonical repo found at `C:\Users\Ben Leak\github\Werkles`
- branch was `maker/site-g-20260703`
- Git, GitHub CLI, and 1Password CLI were present
- Chrome `Default` had the 1Password extension
- Chrome `Profile 1` did not have the 1Password extension
- Google Password Manager/autofill state remained unknown
- 1Password desktop was not found by standard per-user-path detection and needs Start Apps / Appx / winget verification

## Spanzee Baseline Import - 2026-07-11

Spanzee produced a local read-only baseline from a recreated runner.

Imported packet:

- `SPANZEE_CREDENTIAL_BASELINE_READBACK_20260711.md`

High-signal readback:

- host proved as `SPANZEE`
- Git, GitHub CLI, and 1Password CLI were present
- 1Password desktop command was present
- Chrome 1Password extension was present
- `op account list` and `gh auth status` were not run
- Google Password Manager/autofill state remained unknown
- expected Werkles path was missing: `C:\Users\BenLeak\github\Werkles`
- current blocker is `EXPECTED_WERKLES_PATH_MISSING_ON_SPANZEE`

## Medullina Packet - 2026-07-11

Medullina has no fresh credential baseline imported into this password project yet.

Execution packet:

- `MEDULLINA_1PASSWORD_BROWSER_FIX_PACKET_20260711.md`

Special rule:

- do not treat older Medullina workstation starter-kit recovery as proof of current machine state
- run the Medullina packet locally and return a current read-only credential baseline receipt first
- if the hostname is not obviously Medullina, return `MEDULLINA_HOST_ALIAS_NEEDS_OPERATOR_CONFIRMATION` until Ben confirms the alias
