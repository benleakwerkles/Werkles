# Independent Red Team - Private Harvey Speaking VPG Loop

Status: `GO`

Reviewer: hands-capable Dink receiver task `019f0fb9-c2b8-7fd0-99d6-1ac67a52edb7`

Review mode: read-only on Doss. The reviewer reported no mutations, no secret inspection, and no test execution.

## Scope

The review covered the expanded path that turns a private Harvey command into a reply:

- signed cloud claim and receipt routes;
- machine HMAC canonicalization, audience binding, timestamp, and nonce replay protection;
- service-role function exposure and database receiver/machine/recipient binding;
- leases, claim-token rotation, stale-worker rejection, crash/reclaim behavior;
- exact allowlisted Codex task dispatch;
- courier secret, input, output, and reply-size boundaries;
- truthful command-deck rendering;
- Doss launcher checkout binding and network exposure;
- production activation assumptions.

## Initial expanded verdict

`PATCH`

Findings:

1. `HIGH`: `REPLIED` was nonterminal but not reclaimable after a courier crash.
2. `MEDIUM`: fresh receiver nonces had time cleanup but no bounded per-receiver ceiling.

Requested tests:

- expired `REPLIED` reclaim with claim-token rotation and stale-token rejection;
- courier restart after `REPLIED`;
- nonce flood/cap behavior;
- activation checkout binding.

## First patch readback

The executing lane added:

- reclaim for expired `CLAIMED`, `WORKING`, and `REPLIED`;
- claim-token rotation and old-token rejection;
- a 256-fresh-nonce per-receiver ceiling under an advisory lock;
- exact clean, provider-bound runtime checkout enforcement;
- audience-bound HMAC;
- UTF-8 reply-size enforcement;
- behavioral SQL and contract coverage.

The reviewer confirmed those corrections but returned a second `PATCH`:

- `HIGH`: the local Doss Next dev server listened on `0.0.0.0`, making the dev-mode cloud work-order surface reachable from the LAN without private-session enforcement.

## Final correction

- Doss local Next control plane now binds only to `127.0.0.1`.
- The launcher receipt reports `web_bind_address = 127.0.0.1` and `lan_url = null`.
- The regression contract requires loopback binding and rejects `0.0.0.0`.

## Terminal independent verdict

```text
RED_TEAM_VERDICT: GO

REMAINING_FINDINGS:
NONE

MISSING_TESTS:
NONE IDENTIFIED IN THIS NARROW READBACK. Tests were not run by this reviewer.

RECOMMENDED_GATE_DECISION:
GO. LAN exposure patch is present: launcher binds Next to 127.0.0.1, reports loopback-only receipt fields, and the contract rejects 0.0.0.0.
```

Test-pass claims remain supported by the executing Swanson lane's separate local and transactional evidence, not by the reviewer.
