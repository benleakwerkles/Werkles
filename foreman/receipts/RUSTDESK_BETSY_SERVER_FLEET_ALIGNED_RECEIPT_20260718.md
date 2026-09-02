# RUSTDESK_BETSY_SERVER_FLEET_ALIGNED_RECEIPT_20260718

RECEIPT_ID: RECEIPT_RUSTDESK_BETSY_SERVER_FLEET_ALIGNED_20260718
TIMESTAMP: 2026-07-18
AUTHORITY: Ben (Operator) verbal confirm
AGENT: Maker@Betsy
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS
MACHINE: Betsy

## Operator confirm

Spanzee and Medullina are lined up with the **Betsy** private RustDesk server and are good.

## Current canon (supersedes Spanzee-as-server packets)

| Role | Machine | Notes |
|------|---------|--------|
| **Private ID / relay server** | **Betsy** (`10.1.10.194`) | `hbbs` / `hbbr` under `C:\Users\Ben Leak\RustDeskServer\` |
| Peer | Spanzee | On Betsy server world — Operator PASS |
| Peer | Medullina | On Betsy server world — Operator PASS |

Do **not** point new peers at legacy Spanzee rendezvous `10.1.10.63:21116` unless Operator re-homes the server.

Prefer **IPv4** `10.1.10.194:21116` / `:21117` over `betsy.local` (mDNS/IPv6 flakiness).

## Superseded guidance

- `foreman/handoffs/outbox/TO_OPERATOR_MEDULLINA_JOIN_SPANZEE_RUSTDESK_SERVER_20260630.md` — historical; Medullina joins **Betsy** server, not Spanzee hbbs.
- `foreman/MEDULLINA_ONBOARDING_PACKET.md` — server-mismatch blocker cleared by Operator confirm (live hostname/readback still separate).
- June dual-session / Medullina onboarding receipts that assume Spanzee hosts hbbs — historical only.

## Still open (separate from RD server)

- PowerToys fleet packs `spanzee_forge` / `medullina_aux` remain **capture_pending** until workspace IDs return.
- Medullina `LOCAL_MEDULLINA_WINDOWS` topology readback still not filed.
- No passwords/keys recorded in this receipt.
