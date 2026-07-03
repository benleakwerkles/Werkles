# MEDULLINA_ONBOARDING_PACKET.md

Status: pending Betsy-side connection and local readback
Created: 2026-06-30
Requested by: Ben / Operator
Machine name: Medullina
Intended role: auxiliary forge candidate for the Aeye Workstation loop

## Current State

Operator reports RustDesk is installed and running on Medullina.

Betsy-side evidence as of creation:

- Betsy RustDesk executable exists at `C:\Program Files\RustDesk\rustdesk.exe`.
- Betsy RustDesk service is running with automatic startup.
- Medullina RustDesk ID reported by Operator: `254196301`.
- Operator reports a permanent RustDesk password has been configured on Medullina; the password value must stay out of repo/chat artifacts.
- Betsy launched `rustdesk.exe --connect 254196301`.
- Betsy has not yet completed a fresh Medullina reconnect test.
- Latest Betsy log shows `Session 254196301 start`, then `rendezvous server: 10.1.10.63:21116`, then `Connection closed: ID does not exist(0)`.
- A `254196301.toml` peer placeholder exists, but it has no hostname, username, platform, or connection proof.

## RustDesk Server Mismatch Blocker

Betsy is currently configured for the Spanzee/private RustDesk server:

```text
ID server: 10.1.10.63:21116
relay server: 10.1.10.63:21117
force relay: enabled
```

If Medullina is still using public/default RustDesk, Betsy will not find it from the private server. That does not prove the photographed ID is wrong.

Preferred MaSheen fix: configure Medullina's RustDesk network settings to match the private Spanzee server used by Betsy, then retry the same ID from Betsy.

Fallback one-off fix: use a separate/default RustDesk profile or reset Betsy to public/default servers temporarily, then restore the private Spanzee settings after Medullina is configured.

## Boundary

Medullina is not proven live yet. No agent should claim access, capacity, repo parity, or unattended execution until a live readback and receipt exist.

This is a household machine. Onboarding must keep owner consent, privacy, resource limits, and pause/removal ability visible.

## Intended Use

Medullina can become spare compute for:

- local builds and typechecks
- preview smoke tests
- browser-based review while idle
- file indexing inside the Werkles repo only
- non-secret batch jobs
- screenshot/log archive work

Medullina must not be used for:

- secret handling, API keys, tokens, or credentials
- production deploys
- pushes to `main` or shared branches
- Stripe, billing, banking, SQL, RLS, or account recovery
- reading or indexing personal files
- heavy GPU/CPU work while the owner is using the machine
- hidden remote control

## First Local Readback

Run on Medullina after the RustDesk connection opens:

```powershell
$receipt = [ordered]@{
  machine_name_requested = "Medullina"
  hostname = hostname
  windows_user = "$env:USERDOMAIN\$env:USERNAME"
  date_utc = (Get-Date).ToUniversalTime().ToString("o")
  os = (Get-CimInstance Win32_OperatingSystem).Caption
  os_version = (Get-CimInstance Win32_OperatingSystem).Version
  cpu = (Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty Name)
  ram_gb = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
  git = (git --version 2>$null)
  node = (node --version 2>$null)
  rustdesk_service = (Get-Service -Name RustDesk -ErrorAction SilentlyContinue | Select-Object Status, StartType)
  repo_path = "pending"
  owner_consent_recorded = "operator_to_confirm"
  allowed_work_windows = "operator_to_confirm"
  resource_limits = "operator_to_confirm"
}
$receipt | ConvertTo-Json -Depth 5
```

Return the JSON to Betsy and save it as a receipt before marking Medullina live.

## RustDesk Link

From Betsy, test:

```powershell
& "C:\Program Files\RustDesk\rustdesk.exe" --connect 254196301
```

Confirm the Betsy log shows a fresh connection event:

```text
C:\Users\Ben Leak\AppData\Roaming\RustDesk\log\rustdesk_rCURRENT.log
```

The target is a real reconnect, not just a saved peer. If no fresh secure connection appears, keep status as BLOCKER.

## Repo Setup

Preferred repo location on Medullina:

```text
C:\Werkles\github\Werkles
```

Reason: keeps Werkles work out of personal profile folders.

Initial setup:

```powershell
New-Item -ItemType Directory -Force -Path C:\Werkles\github
cd C:\Werkles\github
git clone https://github.com/benleakwerkles/Werkles1.git Werkles
cd C:\Werkles\github\Werkles
git status -sb
npm.cmd install
npm.cmd run typecheck
```

Do not push from Medullina during onboarding. Treat the first clone as read/build/test only.

## Activation Receipt Fields

Return exactly these fields when Medullina is first proven:

```text
MEDULLINA_HOSTNAME:
MEDULLINA_RUSTDESK_ID: 254196301
OWNER_CONSENT_RECORDED:
ALLOWED_WORK_WINDOWS:
RESOURCE_LIMITS:
REPO_PATH:
BRANCH:
COMMIT:
TYPECHECK:
BETSY_CAN_CONNECT:
RECONNECT_TEST:
BLOCKERS:
NEXT_ACTION:
```
