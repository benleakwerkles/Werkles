# Harvey Handeye v0.2

Status: local proof implementation

## What changed

Handeye KNOCK now retrieves two payload classes from Harvey:

1. the machine-addressed KNOCK envelopes; and
2. the current no-secret Foreman cockpit packet plus every required Harvey file.

The cockpit returns each required file with its relative path, Base64-encoded
bytes, and SHA-256. The ASCII-safe transport avoids Windows PowerShell 5.1 JSON
Unicode decoding drift. Handeye decodes the original bytes and recomputes every
hash locally before returning `COMPLETED`.

This gives live LAN-connected machines a packet path that does not require Ben
to paste text and does not require the latest local packet to be pushed to
GitHub first.

## Proof boundary

- A queued KNOCK is not delivery.
- `RECEIVED` proves the correctly named machine Handeye accepted the command.
- `COMPLETED` proves the Handeye retrieved and hash-verified the current cockpit
  payload returned by Doss.
- It does not prove a human read the packet or that a cousin executed an
  assignment.
- Machine-local work still requires a separate assignment receipt.
- Doss cannot impersonate another machine; hostname mismatch remains a hard stop.

## Persistence

v0.2 installs no package, service, watcher, or scheduled task. A foreground or
explicitly launched session process must be running to receive commands.
