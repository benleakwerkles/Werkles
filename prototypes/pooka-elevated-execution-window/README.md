# POOKA Elevated Execution Window — Prototype

**Project:** `POOKA-ELEVATED-EXECUTION-WINDOW`  
**Status:** Isolated prototype — **no live activation**  
**Execution context for this build:** `CURSOR_CLOUD_CONTAINER` (protocol tests only)  
**Does not modify:** PUB / Swanson shared authorization modules  
**Does not install:** Windows service, scheduled task, watcher, or recurring receiver

Session-limited elevated local worker that complements PreApp: after the Operator
opens an authorized worker through **supported Windows elevation**, repeated UAC
interruptions are reduced for a **bounded, named-op-only** window.

---

## Smallest supported architecture

```text
┌──────────────────────────┐         authenticated local IPC
│  PreApp (unelevated)     │  ←───── (prototype: in-process calls;
│  prepare / bind / reserve│         live: named pipe + peer bind)
│  / request execute       │
└────────────┬─────────────┘
             │  Operator UAC once (supported elevation — NOT automated)
             ▼
┌──────────────────────────┐
│  Elevated Worker         │  session TTL · integrity manifest
│  (session-limited)       │  named ops only · reservation ledger
│  exact machine+receiver  │  no shell/eval endpoint
│  + registered handoff    │
└────────────┬─────────────┘
             │  effect (synthetic marker file)
             ▼
┌──────────────────────────┐
│  Independent Verifier    │  filesystem read OUTSIDE worker trust
└──────────────────────────┘
```

### Components (minimum)

| Piece | Responsibility |
|-------|----------------|
| **Integrity manifest** | Hash protected worker code + config + ops allowlist at boot; re-check before reserve |
| **Named operations** | `SYNTHETIC_NOOP`, `SYNTHETIC_WRITE_MARKER`, `SYNTHETIC_READ_MARKER` only |
| **Client binding** | `machineId` + `receiverId` + `clientProcessId` + `clientExecutableHash` + `sessionToken` + nonce/MAC |
| **Action scope** | Exact machine, receiver, handoff id, allowed ops, session expiry, max effects |
| **Reservation** | Fresh authorization **before** effect; `irrevocableOnceReserved: true` |
| **Lifecycle** | prepare → elevate_ack → bind → reserve → execute → verify → complete / expire / shutdown |
| **Independent verify** | Re-read marker from disk; does not ask the worker “did it work?” |

### Explicit non-claims

- Later **revocation of new work** does **not** cancel an already-**reserved** effect (until reservation TTL).
- No unattended password typing.
- No invented UAC bypass — Operator opens elevated worker via supported Windows elevation.
- Resetting AppX / installing services is **out of scope** for this prototype.

---

## Separated phases

| Phase | Who | What |
|-------|-----|------|
| **1. Preparation** | PreApp / worker (may be unelevated bootstrap) | Build scope, integrity check, create session |
| **2. Elevation** | **Operator** | Supported Windows elevation opens worker; client only `acknowledgeElevation(true)` after that fact |
| **3. Execution** | Bound client → worker | Reserve named op → execute reserved op once |
| **4. Independent verification** | Verifier | Filesystem read of synthetic marker |

---

## Exact prototype files

```text
prototypes/pooka-elevated-execution-window/
  README.md                          ← this document
  package.json
  tsconfig.json
  src/
    types.ts                         shared contracts
    integrity.ts                     protected code/config hashing
    operations.ts                    named-ops allowlist + payload validation
    reservation.ts                   fresh reservation + irrevocable rule
    binding.ts                       client/process/token binding + MAC
    effects.ts                       synthetic marker write/read + independent verify
    lifecycle.ts                     expire / complete / shutdown / revoke-new-work
    worker.ts                        elevated worker (in-process prototype)
    client.ts                        PreApp client stub + happy-path orchestration
    index.ts                         barrel
  tests/
    happy-path.test.ts
    attack-cases.test.ts
    lifecycle.test.ts
  scripts/windows/
    README.md                        dormant — DO NOT RUN live from cloud
    Prepare-ElevatedSession.ps1      documents Operator elevation entry (dormant)
```

---

## Tests

From this directory:

```bash
cd prototypes/pooka-elevated-execution-window
npm install
npm test
```

Covered:

- Happy path phase separation + independent verify
- Already-reserved execute after `revokeNewWork`
- Unknown ops / shell-like strings rejected
- Forged PID / token rejected
- Machine / receiver / handoff mismatch rejected
- Marker path injection rejected
- Elevation without Operator confirmation rejected
- Bind before elevate rejected
- Max effects enforced
- Session expire / complete / shutdown terminal behavior

---

## Attack cases (modeled)

| Attack | Expected defense |
|--------|------------------|
| Arbitrary command / eval as “operation” | Allowlist reject `unknown_operation` |
| Op not in session scope | `operation_out_of_scope` |
| Stolen/forged session token | MAC / token mismatch |
| Wrong client PID or exe hash | Binding reject |
| Cross-machine or cross-receiver | Prepare/bind scope mismatch |
| Wrong handoff id | `handoff_mismatch` |
| Path traversal in markerId | Charset validation |
| Extra payload keys | Strict payload schema |
| Skip UAC / fake elevation | `elevation_not_operator_confirmed` |
| Bind before elevate | Phase guard |
| Exhaust session | `max_effects_reached` |
| Claim revoke cancels reserved effect | Reserved execute still allowed; new reserve blocked |

---

## Lifecycle

```text
prepared
   │ Operator elevation (external)
   ▼
elevated ──bind──► bound ──reserve/execute──► executing
   │                                            │
   │         session clock / max effects         │
   ▼                                            ▼
expired ◄─────────────────────────────── completed
   │                                            │
   └──────────── shutdown (explicit) ───────────┘
```

- **Expiration:** `sessionExpiresAt` → phase `expired`, `revokedForNewWork=true`
- **Completion:** Operator/client `complete()` → terminal
- **Shutdown:** `shutdown()` clears binding, terminal
- **Revoke new work:** blocks **new** reservations only

---

## Dormant installation prerequisites (NOT performed here)

These are prerequisites for a **future** Windows live build. This prototype
**must not** install or start any of them:

1. Signed elevated worker binary + integrity catalog matching `buildIntegrityManifest`
2. PreApp client with stable executable hash registration for this machine
3. Machine id + receiver id registry entries agreeing with worker config
4. Local IPC channel (proposed: named pipe ACL’d to Operator + elevated worker SID)
5. Documented Operator elevation path (e.g. `Start-Process -Verb RunAs` on the worker) — **human UAC consent**
6. Session policy defaults (TTL, reservation TTL, max effects) checked into protected config
7. Sandbox directory for synthetic/production effects with ACLs
8. Independent verifier tool (or PreApp module) that only reads effect artifacts

**Forbidden until explicit Operator activation packet:**

- Installing a Windows service
- Creating a scheduled task
- Starting a watcher / recurring receiver
- Live elevation, credentials, deployment
- Modifying PUB/Swanson authorization modules

---

## Relation to PreApp

PreApp remains the unelevated orchestrator. This worker is the **session-limited
elevated complement**: opened once via supported elevation, then serves named
operations under exact scope until complete/expire/shutdown.
