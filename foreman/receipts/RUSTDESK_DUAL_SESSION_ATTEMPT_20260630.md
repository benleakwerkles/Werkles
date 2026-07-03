# RUSTDESK_DUAL_SESSION_ATTEMPT_20260630

Status: PARTIAL
Machine: Betsy
Created: 2026-06-30

## Goal

Run both remote machines from Betsy's RustDesk without switching RustDesk server worlds:

- Spanzee: `1545781219`
- Medullina: `254196301`

## Actions Tried

From Betsy:

```powershell
& "C:\Program Files\RustDesk\rustdesk.exe" --connect 1545781219
& "C:\Program Files\RustDesk\rustdesk.exe" --connect 254196301
Start-Process "rustdesk://connect/1545781219"
Start-Process "rustdesk://connect/254196301"
& "C:\Program Files\RustDesk\rustdesk.exe" --connect 1545781219@10.1.10.63
Start-Process "rustdesk://connect/1545781219@10.1.10.63"
Start-Process "C:\Program Files\RustDesk\rustdesk.exe"
& "C:\Program Files\RustDesk\rustdesk.exe" --connect 10.1.10.63
Start-Process "rustdesk://connect/10.1.10.63"
```

## Observed Result

- Medullina remote window was active: `254196301 - Remote Desktop - RustDesk`.
- Spanzee did not open as a second remote session from the command launches.
- RustDesk main window was opened alongside the active remote session.
- Current log did not show fresh Spanzee session evidence after the launches.
- UI automation against the visible RustDesk input did not change the remote ID field while Medullina was active.
- Clipboard paste attempt failed because the Windows clipboard was locked by another process.
- Lower-level key injection also did not change the visible RustDesk remote ID field.
- Direct LAN-IP launches against `10.1.10.63` were also swallowed without fresh session evidence.

## Current Boundary

No RustDesk server-world conflict was created. Betsy stayed on the private RustDesk configuration. The unresolved issue is that RustDesk `1.4.8` on Betsy swallowed/ignored the second command-line/URI/UI-driven launch while Medullina was already active.

## Next Human Action

With Medullina still connected, use the RustDesk main window on Betsy and start Spanzee from the LAN/peer list or control-remote-desktop field:

```text
Spanzee ID: 1545781219
Spanzee LAN address: 10.1.10.63
```

Do not change Betsy's RustDesk Network / ID Server settings.
