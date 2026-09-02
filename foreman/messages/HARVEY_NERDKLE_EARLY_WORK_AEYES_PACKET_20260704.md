# Harvey / Nerdkle Early Work — Non-Betsy Aeyes Packet

Status: ACTIVE — SEVERED FROM WERKLES.COM LANE
Issued: 2026-07-04
Audience: Skybro, Petra, Swanson, Ender, Bean, Computer, Thufir, Atlas, and any Dink **not** on Betsy site duty
Human gate: Ben opened severe lane demarcation. No merge with Werkles.com site branch until explicit merge gate.

## Hand this to a non-Betsy Aeye

```text
Execute foreman/messages/HARVEY_NERDKLE_EARLY_WORK_AEYES_PACKET_20260704.md

You are on the Harvey / Nerdkle nursery lane — NOT Werkles.com page build.
Do not edit werkles.com marketing pages, member dashboard UI, or homepage rewrite.
Do not merge maker/site-g-20260703 or pull Betsy site commits.
Begin with LOCAL HANDS READBACK. Return the required readback block.
```

## Plain mission

Coordinate **early Harvey / Nerdkle organism architecture** — relay ontology, nursery containment, ThinkIt status mirrors, source-truth maps, and receipt-backed design memos.

**Not in scope:** werkles.com public pages, membership UI, homepage narrative, Bellows shell polish, or Betsy localhost site preview.

Later Ben may merge lanes. **Right now: do not merge.**

---

## Who owns what

| Lane | Crew | Machine | Branch |
|------|------|---------|--------|
| **Werkles.com** | Maker + Dink@Betsy | Betsy | `maker/site-g-20260703` |
| **Harvey nursery** | Other Aeyes | DOSS primary; relay hosts as assigned | `feature/harvey-nursery-v0` (create on first Harvey machine if missing) |

**Betsy is reserved for Werkles.com.** Do not assign Harvey build work to Dink@Betsy or Maker on Betsy.

---

## Canonical repo (shared GitHub object, separate branches)

```text
https://github.com/benleakwerkles/Werkles.git
full_name: benleakwerkles/Werkles
repo_id: 1242158598
```

Local checkout per machine:

```text
C:\Users\<user>\github\Werkles
```

Harvey lane must **not** default to Betsy's `maker/site-g-20260703`. Create or checkout:

```text
feature/harvey-nursery-v0
```

Base that branch from `origin/main` @ `ec4772c` (Harvey nursery architecture artifacts) unless a fresher readback says otherwise.

```powershell
cd C:\Users\<user>\github\Werkles
git fetch origin
git checkout -b feature/harvey-nursery-v0 origin/main
# or, if branch exists remotely:
# git checkout feature/harvey-nursery-v0
# git pull --ff-only origin feature/harvey-nursery-v0
```

---

## In-scope paths (Harvey lane)

| Purpose | Paths |
|---------|-------|
| Architecture drafts | `foreman/nerdkle/HARVEY_*`, `foreman/nerdkle/NURSERY_*` |
| Project lock (Harvey) | `foreman/nerdkle/NERDKLE_PROJECT_LOCK.md` — update only on Harvey branch |
| Architecture packets | `foreman/messages/*HARVEY*`, `foreman/messages/SKYBRO_HARVEY_*` |
| ThinkIt / Operator status | `data/thinkit/**`, `app/api/thinkit/**` (Harvey mirrors only) |
| Relay contracts / proof | `source-truth-plan/AEYE_RELAY_CONTRACT_V0.md`, `source-truth-plan/references/swanson_relay_build_20260629/**` |
| Book / source-truth maps | `source-truth-plan/BOOK_NERDKLE_*`, `source-truth-plan/references/betsy_desktop_nerdkle_the_book/**` |
| Organism receipts | `data/organism/nerdkle/` (when building organism slice) |
| Nerdkle UI/API (organism) | `app/nerdkle/`, `app/api/nerdkle/` — Harvey lane only |

---

## Out-of-scope (Werkles.com lane — hands off)

Do not edit on the Harvey lane:

```text
app/page.tsx
app/proof/
app/membership/
app/dashboard/**  (member product UI)
app/globals.css   (site styling pass)
components/**     (public site components)
lib/copy.ts
foreman/SITE_MAP.md
foreman/receipts/WERKLES_GLOBALS_CSS*
maker/site-g-20260703
```

Do not merge, rebase, or cherry-pick from `maker/site-g-20260703` without Ben merge gate.

---

## Required source files (read first)

1. `foreman/messages/HARVEY_NERDKLE_EARLY_WORK_AEYES_PACKET_20260704.md` (this file)
2. `foreman/messages/SKYBRO_HARVEY_NERDKLE_ARCHITECTURE_PACKET_20260703.md` (on `origin/main`)
3. `foreman/nerdkle/HARVEY_NERDKLE_ARCHITECTURE_DRAFT_20260703.md`
4. `foreman/nerdkle/NURSERY_CONTAINMENT_ARCHITECTURE_BUILDER_SPEC_20260703.md`
5. `foreman/nerdkle/NERDKLE_PROJECT_LOCK.md`
6. `foreman/werkles-com/WERKLES_COM_PROJECT_LOCK.md` (boundary reference — do not execute site tasks from it)
7. `foreman/messages/ALL_AEYES_WERKLES_GITHUB_ACCESS_GUARDRAIL_PACKET_20260703.md`
8. `data/thinkit/thinkit_status.md`

---

## Live surfaces (Harvey / relay — re-read before claiming health)

```text
http://10.1.10.8:3339/v1/relay/status?limit=50
http://10.1.10.8:3342/thinkit
http://10.1.10.8:3339/v1/relay/thread_bridge/status
```

PowerShell fallback:

```powershell
Invoke-RestMethod -Uri "http://10.1.10.8:3339/v1/relay/status?limit=50"
```

Relay proof rules remain: `SENT` is not `COMPLETED`. Receiver readback required.

---

## Coordination rules

1. **No cross-lane file edits.** If Werkles.com needs a ThinkIt link on a public page, file a packet to Maker@Betsy — do not edit site files from DOSS.
2. **No silent merge.** Harvey branch and site branch stay separate until Ben opens merge gate.
3. **Push requires Ben gate.** Harvey lane may push `feature/harvey-nursery-v0` only after Ben names the target.
4. **DOSS is Harvey reference host** for ground-zero repo cleanliness — not Betsy site forge.
5. **Atlas** may mirror/index Harvey docs — must not push or promote without gate.

---

## First actions by role

### Skybro / Petra (architecture)

Draft or extend Harvey ontology, organ system map, and data contracts per `SKYBRO_HARVEY_NERDKLE_ARCHITECTURE_PACKET_20260703.md`.

### Swanson / relay cousins (transport proof)

Receiver proof and thread-bridge blockers — without touching Werkles.com pages.

### Dink@DOSS (mechanical)

Ground-zero verify, Harvey branch checkout, commit architecture artifacts, return readback.

---

## Required readback block

```text
HANDOFF_PACKET: HARVEY_NERDKLE_EARLY_WORK_AEYES_PACKET_20260704
MACHINE:
HOSTNAME:
CANONICAL_PATH:
BRANCH:
HEAD:
WERKLES_COM_BRANCH_TOUCHED: NO
SITE_FILES_EDITED: NO
HARVEY_FILES_EDITED:
RELAY_STATUS_READ:
THINKIT_STATUS_READ:
COMMITS_MADE:
PUSH_TARGET:
MAIN_MERGE_ATTEMPTED: NO
SITE_BRANCH_MERGE_ATTEMPTED: NO
BLOCKERS:
NEXT_ACTION:
```

---

## Final rule

Harvey work makes the organism more real. Werkles.com work makes the public product more real. Mixing them in one branch or one Betsy session is a lane violation until Ben says otherwise.
