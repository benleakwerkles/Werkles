# Harvey Human Command Deck v0.1

The command deck is the human front door for Harvey. It accepts a plain-language instruction, one target, and one bounded command-language verb: VERIFY, PREPARE, GO, or KNOCK.

## Truthful lifecycle

The visible lifecycle is Draft -> Queued -> Sending -> Received -> Working -> Completed or Blocked. A stage is marked complete only when Harvey has evidence for that exact transition.

The v0.1 Doss operator route writes a durable local work order with `status: QUEUED_LOCAL` and `route_state: UNBOUND`. That is not a dispatch. The UI therefore says `QUEUED LOCALLY - NOT SENT YET` until a courier claims a future route.

An unbound LAN browser remains interactive, preserves the typed draft in the current page session, and returns `BLOCKED - NOT SENT`. It does not send a loopback request or create a durable work order.

## Security boundary

Work-order text is durable on Doss. The UI warns operators not to enter passwords, codes, tokens, recovery keys, or other secrets. The Doss loopback bridge holds operator authority server-side and strips instruction text from its browser response.

The Bird/Flock relay remains the Oddly Godly / Spanzee pilot adapter. The generic Harvey work-order queue does not claim Bird/Flock dispatch, RECEIVED, or COMPLETED proof.
