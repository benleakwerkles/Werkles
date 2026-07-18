# Harvey Handeye v0.3 — Betsy Ephemeral Pairing

Status: local implementation and test slice. This document does not claim a live Betsy receiver.

## Purpose

Bind one foreground PowerShell receiver on the physical Betsy session to Harvey without installing a persistent service or placing a reusable Harvey agent secret on Betsy. The receiver directly opens the Harvey LAN preview, returns browser `PAGE_READY`, emits authenticated heartbeats, and may claim only the server-authorized command set.

## Truth boundary

The proof is deliberately split:

1. The pinned PowerShell script refuses network activity unless the local Windows hostname is `BETSY`.
2. Doss approves possession of one displayed ephemeral RSA public key by matching the exact pairing code and fingerprint visible on Betsy.
3. The Betsy browser consumes a one-time fragment capability, clears the fragment immediately, and returns `PAGE_READY`.
4. Only then does Harvey activate the paired key and accept a heartbeat or command receipt.

This is `OPERATOR_APPROVED_EPHEMERAL_PAIRING` plus a local hostname check. It is not cryptographic operating-system hostname attestation.

## Lifecycle

`PENDING -> OPERATOR_APPROVED -> REDEEMED -> PAGE_READY -> ACTIVE -> EXPIRED`

- The expiry is fixed at request time plus 15 minutes and is never renewed.
- Restarting the receiver requires a new pairing.
- The RSA private key exists only in the running PowerShell process and is disposed on exit.
- The one-time browser capability is stored only as a SHA-256 digest by Harvey.
- The bootstrap browser open is performed directly by the pinned receiver. It is not described as a delivered or completed `OPEN_URL` command.

## Signed request contract

Authentication mode: `EPHEMERAL_RSA_V1`

Audience: `HARVEY_HANDEYE`

Identity is derived by Harvey and fixed to:

- machine: `Betsy`
- hostname: `BETSY`
- agent: `handeye-betsy-betsy`

The signature is RSA-2048 / SHA-256 over the following UTF-8, LF-delimited value:

```text
EPHEMERAL_RSA_V1
HARVEY_HANDEYE
<pairing_id>
<METHOD>
<exact pathname>
Betsy
BETSY
handeye-betsy-betsy
<10-digit Unix timestamp>
<128-bit lowercase-hex nonce>
<SHA-256 of the exact raw request body>
```

Every nonce is one-use. Method, path, body, deployment audience, key, session, identity, and time are all signature-bound.

## Authority

The caller cannot choose its identity, auth mode, credential ID, expiry, or capabilities. This bootstrap slice grants the ephemeral receiver only `PING`; the preview is already opened directly during bootstrap. It cannot approve pairing, create commands, target another machine, run `KNOCK`, impersonate the HMAC Handeye, or terminalize another credential session's claim.

Claims and receipts record `auth_mode`, `credential_id`, and `credential_expires_at`. A terminal receipt is accepted only from the exact credential that created the active claim.

## Completion gate

Betsy is not `LIVE` merely because a pairing was requested, approved, redeemed, or because a browser process launch was attempted. Closure requires all of the following:

- Betsy `LOCAL HANDS READBACK` with hostname, checkout, commit, dirty status, terminal, localhost, and ports.
- Pinned receiver script hash matches the Doss source.
- `PAGE_READY` is returned for the active pairing.
- A fresh authenticated heartbeat identifies the same pairing.
- A Doss-created `PING` receives separate `RECEIVED` and `COMPLETED` receipts from that same pairing.
- Doss authoritative readback matches those receipts.
- Negative, replay, expiry, race, browser-compatibility, typecheck, build, and source-boundary tests pass.
- Independent Bean red team returns PASS and an independent final verifier returns GO.

Until that gate closes, Harvey must show the exact blocker instead of a live-machine claim.
