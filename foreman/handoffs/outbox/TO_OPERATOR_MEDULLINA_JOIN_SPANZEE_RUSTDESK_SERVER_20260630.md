# TO_OPERATOR_MEDULLINA_JOIN_SPANZEE_RUSTDESK_SERVER_20260630

Status: ACTION_PACKET
From: Dink@Betsy
To: Ben / Operator at Medullina
Machine: Medullina
Goal: Point Medullina RustDesk at the same private RustDesk server Betsy uses for Spanzee/MaSheen work.

## Why This Packet Exists

Betsy tried to connect to Medullina RustDesk ID `254196301`, but Betsy's RustDesk log showed:

```text
Session 254196301 start
rendezvous server: 10.1.10.63:21116
Connection closed: ID does not exist(0)
```

That means Betsy is looking for Medullina on the private Spanzee RustDesk server. If Medullina is still on public/default RustDesk, Betsy will not find that ID.

## Do This On Medullina

1. Open RustDesk.
2. Open Settings.
3. Go to Network / ID Server settings.
4. Set the server fields to match Betsy's private RustDesk settings:

```text
ID server: 10.1.10.63:21116
Relay server: 10.1.10.63:21117
API server: leave blank unless RustDesk requires it
Key: copy from Betsy's RustDesk Network / ID Server settings
```

5. Save/apply the settings.
6. Fully quit and restart RustDesk on Medullina.
7. Confirm RustDesk shows a reachable ID after restart.

Do not paste the permanent RustDesk password into chat, docs, repo files, or receipts. Type it only into the RustDesk password prompt when connecting.

## Return This To Dink

```text
MEDULLINA_RUSTDESK_SERVER_SET: YES / NO
MEDULLINA_DISPLAYED_ID:
MEDULLINA_HOSTNAME:
PERMANENT_PASSWORD_CONFIGURED: YES / NO
RUSTDESK_RESTARTED_AFTER_SETTING_CHANGE: YES / NO
BLOCKERS:
```

## Optional Local Readback On Medullina

Run this in PowerShell on Medullina and return the JSON output:

```powershell
[ordered]@{
  machine_name_requested = "Medullina"
  hostname = hostname
  windows_user = "$env:USERDOMAIN\$env:USERNAME"
  date_utc = (Get-Date).ToUniversalTime().ToString("o")
  rustdesk_displayed_id = "TYPE_DISPLAYED_ID_HERE"
  rustdesk_server_set = "YES_OR_NO"
  permanent_password_configured = "YES_OR_NO"
  os = (Get-CimInstance Win32_OperatingSystem).Caption
  os_version = (Get-CimInstance Win32_OperatingSystem).Version
  cpu = (Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty Name)
  ram_gb = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
  git = (git --version 2>$null)
  node = (node --version 2>$null)
} | ConvertTo-Json -Depth 5
```

## Success Condition

After the return fields come back, Betsy retries:

```powershell
& "C:\Program Files\RustDesk\rustdesk.exe" --connect MEDULLINA_DISPLAYED_ID
```

Success is not the existence of a saved peer file. Success is a fresh Betsy RustDesk log line showing a live Medullina connection beyond the old `ID does not exist` failure, plus a hostname/readback from Medullina.
