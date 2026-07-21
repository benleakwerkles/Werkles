# Red Team - Harvey Book Loop V0

Status: `GO_SHADOW_ROUTER__NO_GO_LIVE_ORSON_AUTOSEND`

Reviewer: Bean red-team, independent read-only lane  
Execution context reviewed: `CODEX_LOCAL @ DOSS`

## Required invariants

- `CURRENT_PACKET.md` remains the sole active pointer.
- Compare-and-swap must reject a stale or conflicting pointer.
- Receipt publication and next-packet release are separate facts.
- Canonical hashes are recomputed from bounded mailbox bytes.
- All paths are exact, contained, and link-free.
- Replay is idempotent; same ID with different bytes is a conflict.
- The router never invents Packet 003 or selects book material.
- Pointer advancement proves no delivery, custody, incorporation, acceptance,
  effect, completion, outcome, or returned time.
- The dirty canonical Werkles checkout and unrelated mailbox files remain
  untouched.
- The final manual Orson `KNock` is measured bootstrap transport, not proof that
  future human mule labor is gone.

## Route finding

The existing signed Doss courier is bound to a Codex task, not to an arbitrary
ChatGPT Work browser tab. The existing Orson thread is preserved but remains
`BROWSER_ONLY` until Orson returns supported callable route evidence. A title,
tab index, guessed URL, intended machine name, or Work-container hostname is
not stable thread identity.

## Verdict

Proceed with a disabled, local, deterministic receipt-to-pointer router and the
one-time Orson bootstrap packet. Do not enable a daemon, browser submission,
provider action, or automatic Orson wake in V0.

## Final review closure

The first staged implementation received `NO_GO` and was not committed. The
following independent-review blockers were corrected and regression-tested:

- transition-receipt conflicts are preflighted before pointer mutation;
- dry-run validates existing transition receipts and identifies missing-receipt
  recovery;
- a known post-pointer receipt failure reports one performed write;
- only `COMPLETED` or a constrained `BLOCKER: <UPPERCASE_CODE>` is terminal;
- destination packets must be sealed and ready;
- duplicate routing fields and duplicate return Packet IDs fail closed;
- missing source/return evidence has specific blockers; `PACKET_QUEUE_EMPTY` is
  reserved for an absent destination; and
- mailbox contract V0.1 separates local byte validation from later Git commit
  and push proof.

The published Orson 000 packet lacked a separately named terminal receipt. It
was never delivered, remains immutable, and was superseded by corrected Orson
001 through a recorded blocker transition before the final Operator `KNock`.
