# Spanzee Completion Report v0.1

Date: 2026-06-15

From: Codex Foreman on Sally

For: Petra / Dink2 lane coordination

Mission: Finish Spanzee as a usable Aeye node.

## Status

Spanzee is not completed yet.

The blocking condition is earlier than SSH/RDP setup: Sally cannot currently resolve `spanzee`, `spanzee.local`, `betsy`, or `betsy.local`, and the cached LAN neighbors visible from Sally did not expose SSH, RDP, or Sunshine ports during a read-only probe.

No credentials were requested or entered. No account, OAuth, billing, router, firewall, deploy, push, SQL, or production-data changes were made.

## What Is Working

- Sally is on the `10.1.10.x` LAN. Local probes observed Sally's Wi-Fi address as `10.1.10.14`.
- Sally can inspect local network neighbor state when elevated read-only access is allowed.
- Reverse DNS/PTR records exist for several nearby LAN devices:
  - `10.1.10.238` -> `amazon-38bad6195`
  - `10.1.10.233` -> `amazon-fabb6d0ee`
  - `10.1.10.232` -> `BRWF4289D75FFCD`
  - `10.1.10.194` -> `DESKTOP-KTBH0LA`
  - `10.1.10.63` -> `DESKTOP-GBO5E4I`
  - `10.1.10.44` -> `none-2.local`
  - `10.1.10.34` -> `linux.local`
  - `10.1.10.30` -> `none.local`
  - `10.1.10.8` -> `Doss`
- Sunshine/Moonlight is a good recommendation for the graphics/desktop-streaming path once base reachability is fixed. Moonlight lists Sunshine as the recommended host, and Sunshine is a self-hosted Moonlight host with Windows support, hardware encoding support for AMD/Intel/Nvidia GPUs, a browser configuration UI, and Moonlight clients across common platforms.

References:

- Moonlight: https://moonlight-stream.org/
- Sunshine: https://app.lizardbyte.dev/Sunshine/
- Moonlight setup guide: https://github.com/moonlight-stream/moonlight-docs/wiki/Setup-Guide

## What Is Blocked

### 1. SSH Path Complete

Blocked.

Evidence from Sally:

- `Resolve-DnsName spanzee` returned no answer.
- `Resolve-DnsName spanzee.local` returned no answer.
- `Test-NetConnection -ComputerName spanzee -Port 22` failed at name resolution.
- `Test-NetConnection -ComputerName spanzee.local -Port 22` failed at name resolution.
- A small TCP probe of cached LAN neighbors on port `22` found no open SSH port.

### 2. RDP Path Complete

Blocked.

Evidence from Sally:

- `Resolve-DnsName spanzee` returned no answer.
- `Resolve-DnsName spanzee.local` returned no answer.
- `Test-NetConnection -ComputerName spanzee -Port 3389` failed at name resolution.
- `Test-NetConnection -ComputerName spanzee.local -Port 3389` failed at name resolution.
- A small TCP probe of cached LAN neighbors on port `3389` found no open RDP port.

### 3. Sunshine/Moonlight Recommendation

Recommended, but not installed or configured in this run.

Recommendation:

- Use Sunshine as the host on Spanzee.
- Use Moonlight as the client from porch devices.
- Pair Moonlight to Sunshine while on the same trusted LAN first.
- Keep RDP as the administrative desktop fallback, and use Sunshine/Moonlight for low-latency interactive desktop or graphics streaming.
- Do not expose Sunshine directly to the public internet until the base node is known, patched, named, and access-controlled. Prefer trusted LAN, WireGuard/Tailscale-style private overlay, or the existing porch-access path if one already exists.

Blocked setup items:

- Spanzee is not reachable by name or identified by IP from Sally.
- Sunshine web UI/default discovery could not be checked because no candidate Spanzee endpoint was found.
- Sunshine first-run account setup and Moonlight pairing require a human gate because they create access credentials/pairings for remote access.

### 4. Workstation Baseline Parity

Blocked.

No repo-local Betsy Golden Image manifest, Spanzee manifest, or workstation baseline checklist was found in this workspace. The terms `Spanzee`, `Betsy`, `Golden Image`, `Aeye`, `porch`, `Sunshine`, and `Moonlight` were not present in repo text outside this new report at the time of inspection.

### 5. Receipt

This file is the receipt.

## Exact Parity Gaps vs Betsy

Because Dink owns Betsy Golden Image and no Betsy baseline artifact is present in this repo, the exact parity comparison is limited to observable access and documentation gaps from Sally.

| Area | Betsy Golden Image evidence in repo/from Sally | Spanzee evidence from Sally | Exact parity gap |
| --- | --- | --- | --- |
| Node inventory | No Betsy Golden Image manifest found. `betsy` and `betsy.local` do not resolve from Sally. | No Spanzee manifest found. `spanzee` and `spanzee.local` do not resolve from Sally. | Both baseline and target lack a repo-local inventory record; Spanzee cannot be compared beyond access probes. |
| DNS/hostname | `betsy` and `betsy.local` unresolved. | `spanzee` and `spanzee.local` unresolved. | Spanzee does not have a resolvable porch/LAN hostname from Sally. |
| SSH | Betsy SSH not verifiable by name because Betsy does not resolve. | Spanzee SSH not verifiable by name; cached LAN IP probe found no open `22`. | Spanzee lacks a proven SSH endpoint. |
| RDP | Betsy RDP not verifiable by name because Betsy does not resolve. | Spanzee RDP not verifiable by name; cached LAN IP probe found no open `3389`. | Spanzee lacks a proven RDP endpoint. |
| Sunshine/Moonlight | No Betsy Sunshine/Moonlight baseline found. | No Spanzee Sunshine/Moonlight endpoint found; cached LAN IP probe found no open `47990` or `47984`. | Spanzee lacks a proven Sunshine host path and pairing receipt. |
| Workstation baseline | No Betsy package/config/service baseline found. | No Spanzee package/config/service baseline found. | Spanzee lacks a baseline parity manifest to compare OS, packages, GPU/driver, services, users, power settings, and remote access config. |
| Porch access | No Betsy porch route record found. | No Spanzee porch route record found. | Spanzee is not yet proven porch-accessible. |

## Next Action

Hand Dink/Petra one of these concrete identifiers so Sally can finish the node without guessing:

- Spanzee's current LAN IP address, or
- the router/DHCP reservation name for Spanzee, or
- a repo-local Betsy Golden Image baseline manifest plus Spanzee's intended hostname.

Then rerun, in order:

1. Resolve/probe Spanzee by IP and hostname.
2. Complete SSH reachability on port `22`.
3. Complete RDP reachability on port `3389`.
4. Install/configure Sunshine on Spanzee only after human approval for first-run account/pairing.
5. Pair Moonlight from the porch client only after human approval for access pairing.
6. Record a workstation parity manifest against Betsy Golden Image.

## Verification Commands Run

Read-only local checks:

- `rg -n --hidden -g '!node_modules/**' -g '!dist/**' -g '!*.png' "Spanzee|spanzee|Betsy|betsy|Aeye|porch|porch-access|SSH|RDP|Sunshine|Moonlight|workstation|Golden"`
- `Resolve-DnsName spanzee -ErrorAction SilentlyContinue`
- `Resolve-DnsName spanzee.local -ErrorAction SilentlyContinue`
- `Resolve-DnsName betsy -ErrorAction SilentlyContinue`
- `Resolve-DnsName betsy.local -ErrorAction SilentlyContinue`
- `Test-NetConnection -ComputerName spanzee -Port 22 -InformationLevel Detailed`
- `Test-NetConnection -ComputerName spanzee -Port 3389 -InformationLevel Detailed`
- `Test-NetConnection -ComputerName spanzee.local -Port 22 -InformationLevel Detailed`
- `Test-NetConnection -ComputerName spanzee.local -Port 3389 -InformationLevel Detailed`
- `Test-NetConnection -ComputerName betsy -Port 22 -InformationLevel Detailed`
- `Test-NetConnection -ComputerName betsy -Port 3389 -InformationLevel Detailed`
- `Get-NetNeighbor -AddressFamily IPv4 | Select-Object IPAddress,LinkLayerAddress,State,InterfaceAlias`
- reverse DNS checks for cached `10.1.10.x` neighbors
- TCP probe of cached neighbor IPs for ports `22`, `3389`, `47990`, and `47984`

## Human Gates

Stop for Ben before any of the following:

- entering credentials or secrets
- creating Sunshine admin credentials
- pairing Moonlight clients
- changing router, firewall, port-forward, VPN, OAuth, account, billing, or provider settings
- installing paid software or activating paid services
- making destructive or irreversible changes

