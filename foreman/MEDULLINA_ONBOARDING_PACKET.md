# MEDULLINA_ONBOARDING_PACKET.md

Status: RustDesk server aligned (Operator 2026-07-18) — topology readback still pending
Created: 2026-06-30
Updated: 2026-07-18
Requested by: Ben / Operator
Machine name: Medullina
Intended role: auxiliary forge candidate for the Aeye Workstation loop

## Current State

Operator reports RustDesk is installed and running on Medullina.

**2026-07-18 Operator confirm:** Medullina is lined up with the **Betsy** private RustDesk server (same world as Spanzee). Server-mismatch blocker cleared. Receipt: `foreman/receipts/RUSTDESK_BETSY_SERVER_FLEET_ALIGNED_RECEIPT_20260718.md`.

Historical Betsy-side evidence (2026-06-30 era — Spanzee-hosted hbbs):

- Medullina RustDesk ID reported by Operator: `254196301`.
- Permanent password configured on Medullina; value stays out of repo/chat.
- Older logs showed `ID does not exist` against rendezvous `10.1.10.63:21116` when Medullina was not on that server world.

## RustDesk Server Canon (current)

Private ID / relay host is **Betsy**, not Spanzee:

```text
ID server: 10.1.10.194:21116
relay server: 10.1.10.194:21117
```

Prefer IPv4 over `betsy.local`. All peers (Betsy, Spanzee, Medullina) share this server + key.

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
