# MEDULLINA_ONBOARDING_REQUEST_RECEIPT_20260630

Status: ARTIFACT
Machine: Betsy
Requested machine: Medullina
Created: 2026-06-30

## What Changed

- Added Medullina to `foreman/MACHINE_TOPOLOGY.md` as an auxiliary forge candidate.
- Added a Medullina gate to `foreman/WORKSTATION_2_0_STACK.md`.
- Created `foreman/MEDULLINA_ONBOARDING_PACKET.md`.

## Betsy-Side RustDesk State

- RustDesk executable exists at `C:\Program Files\RustDesk\rustdesk.exe`.
- RustDesk service is running with automatic startup.
- RustDesk processes are present.
- Medullina RustDesk ID reported by Operator: `254196301`.
- Operator reports a permanent RustDesk password has been configured on Medullina.
- Betsy launched `rustdesk.exe --connect 254196301`.
- Betsy log showed a fresh `Session 254196301 start`.
- Betsy log showed the rendezvous server as `10.1.10.63:21116`.
- Betsy log showed `Connection closed: ID does not exist(0)`.
- `C:\Users\Ben Leak\AppData\Roaming\RustDesk\config\peers\254196301.toml` exists, but only as an empty placeholder peer record with no hostname/user/platform readback.

## Current Blocker

The reported Medullina ID is not disproven. Betsy is currently using the Spanzee/private RustDesk rendezvous server (`10.1.10.63:21116`) and forced relay settings, while Medullina is likely still on the public/default RustDesk ID server. That server mismatch can produce `ID does not exist` even when the photo ID is correct.

To onboard Medullina into the MaSheen loop, put Medullina on the same private RustDesk server settings as Betsy/Spanzee, then retry `254196301`. If the goal is a one-off public RustDesk connection instead, use a separate/default RustDesk profile on Betsy so the private Spanzee settings are not disturbed.

## What Is Not Proven

- No Medullina hostname has been read back.
- No Medullina RustDesk reconnect has succeeded from Betsy yet.
- The Medullina permanent password value is not stored in this repo or receipt.
- No owner consent/resource window receipt exists yet.
- No repo clone, branch, commit, typecheck, or localhost state has been proven.

## Required Next Receipt

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
