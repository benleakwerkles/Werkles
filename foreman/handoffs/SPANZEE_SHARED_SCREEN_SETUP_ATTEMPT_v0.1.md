# Spanzee Shared Screen Setup Attempt v0.1

Date: 2026-06-15

From: Codex Foreman on Sally

Goal: Set up Spanzee for split/shared screen monitoring, MWB-style interactive use, extra agent work on other Aeyes, and drag/drop-style file movement.

## Outcome

Blocked before host configuration.

Spanzee is still not discoverable or reachable from Sally by hostname, Windows network discovery, or currently cached LAN endpoints. No login, credential, account, OAuth, router, firewall, paid-service, or pairing action was attempted.

## Attempted From Sally

- Refreshed cockpit and Spanzee completion receipt.
- Checked `spanzee` and `spanzee.local` name resolution again.
- Checked Windows workgroup discovery with `net view`.
- Checked for local discovery helpers:
  - `mstsc.exe` is available.
  - `winget.exe` is available.
  - `dns-sd` is not available.
  - `ssh` resolves to the sandbox deny wrapper here, so no SSH login attempt can be made from this tool lane.
- Re-read ARP and neighbor candidates on the `10.1.10.x` LAN.
- Probed known/cached LAN devices for:
  - SSH: `22`
  - RDP: `3389`
  - Sunshine/Moonlight control/streaming candidates: `47984`, `47989`, `47990`, `47998`, `48010`
  - VNC: `5900`
  - Common local web/control candidate: `8042`
- Checked local service names:
  - `_nvstream._tcp.local`
  - `_sunshine._tcp.local`
  - `_rdp._tcp.local`

No candidate host answered on the needed ports.

## Staged Artifact

Created:

- `foreman/handoffs/SPANZEE_MWB_MULTIMON_TEMPLATE.rdp`

Purpose:

- full-screen RDP
- multimonitor/span support
- clipboard redirection
- local drive redirection for file movement
- smartcard/WebAuthn redirection where the RDP host supports it
- prompt for credentials instead of storing credentials

This template is intentionally pointed at `spanzee`. It will become usable only after `spanzee` resolves or the `full address:s:` line is changed to Spanzee's current LAN/private-overlay IP.

## Recommended Architecture

Use two paths, because they solve different problems:

1. RDP for administration, file movement, clipboard, drive redirection, and multi-monitor work.
2. Sunshine on Spanzee plus Moonlight on porch/client machines for low-latency shared/split-screen viewing and interactive desktop streaming.

For headless or extra-display use, add a virtual display driver only after Spanzee is reachable and after a human approves driver installation. The current best candidate remains Virtual Display Driver for Windows 10/11 because it is designed to add virtual monitors and explicitly supports Sunshine/desktop-sharing workflows.

Do not use Sunshine as the file-transfer layer. Sunshine/Moonlight is the low-latency display/input layer; RDP, SMB, or a private sync/drop folder should own file movement.

## Source Notes

- Sunshine docs identify Sunshine as a self-hosted Moonlight host with a browser configuration UI, client pairing, Windows support, and hardware encoding support for AMD, Intel, and Nvidia GPUs.
- Moonlight's setup guide says Sunshine's web UI is available locally at `https://localhost:47990/`, first run creates a configuration-interface account, and pairing should usually happen while client and host are on the same network.
- Virtual Display Driver's project page describes adding virtual monitors on Windows 10/11 and working with Sunshine/desktop-sharing software, but it also warns to uninstall VDD before major GPU/chipset driver updates due to possible black-screen/display-priority issues.

References:

- Sunshine docs: https://docs.lizardbyte.dev/projects/sunshine/latest/
- Moonlight setup guide: https://github.com/moonlight-stream/moonlight-docs/wiki/Setup-Guide
- Virtual Display Driver: https://github.com/VirtualDrivers/Virtual-Display-Driver

## Blockers

- `spanzee` does not resolve from Sally.
- `spanzee.local` does not resolve from Sally.
- Windows workgroup discovery is unavailable from Sally: `net view` returned system error `6118`.
- No known/cached `10.1.10.x` candidate exposed RDP, Sunshine, VNC, or SSH ports.
- Actual Sunshine installation, first-run admin account setup, Moonlight pairing, virtual display driver installation, firewall changes, router changes, and credential entry are human-gated.

## Next Action

Get one concrete Spanzee endpoint:

- current LAN IP,
- private overlay IP/name,
- DHCP reservation,
- router client name, or
- physical-console confirmation of Spanzee's hostname/IP.

Then:

1. Replace `full address:s:spanzee` in `SPANZEE_MWB_MULTIMON_TEMPLATE.rdp` with the reachable endpoint if DNS is still missing.
2. Open the RDP file from Sally and complete credential entry manually.
3. Confirm clipboard and drive redirection.
4. Configure Windows display settings for Extend across physical/virtual displays.
5. Install Sunshine on Spanzee after human approval.
6. Create Sunshine first-run account manually on Spanzee.
7. Pair Moonlight manually from porch/client device.
8. Add Virtual Display Driver only if Spanzee needs extra/headless monitors for shared screen lanes.

