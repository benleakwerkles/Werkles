# Machine Topology

Status: cockpit reference — **machine registry + forge roles**. Pairs with `foreman/EXECUTION_CONTEXT_RULES.md` (LOCAL HANDS READBACK required before hands-capable agents mutate repo/runtime state).

**Source of truth is the GitHub repo `benleakwerkles/Werkles1` (`main`), not any single machine.** Machines are work surfaces; the repo is canon.

**Registry rule:** Do not rename machines by guess. Do not mark **Doss** PASS without a live Doss readback (`LOCAL_DOSS_WINDOWS` or a confirmed Windows hostname). Update this file after every LOCAL HANDS READBACK that changes branch, commit, path, or localhost state.

> **BLDer** (Builder) was an earlier **laptop** build surface. It is **not** the same physical machine as **Betsy** (desktop). Retire BLDer references to historical context only unless the Operator rebinds.

---

## Machine registry

| Human name | Windows hostname | Primary repo path | Current branch | Current commit | Forge role | Localhost | Evidence |
|------------|------------------|-------------------|----------------|----------------|------------|-----------|----------|
| **Sally** | `DESKTOP-SJSJMNK` | `C:\Users\benle\Desktop\github\Werkles` | `rescue/sally-dirty-worktree-2026-06-01` | `8ba905b` | **mirror forge** | `:3000` running on host (live) | Live readback 2026-06-12 on `DESKTOP-SJSJMNK`; historical: `foreman/reviews/WORKTREE_STABILIZATION_2026-06-01.md`, `FROM_DINK_BETSY_SETUP_RECORD_V1.md` |
| **Sally** *(second surface, same host)* | `DESKTOP-SJSJMNK` | `C:\Dev\Werkles` | `snapshot/sally-good-werkles-2026-06-12` | `437792b` | **mirror forge** (snapshot lane) | shares host `:3000` (live) | Live readback 2026-06-12 on `DESKTOP-SJSJMNK` |
| **Betsy** | `Betsy` | `C:\Users\Ben Leak\github\Werkles` | `maker/site-g-20260703` | `19333c9` | **primary forge** | verify at session start | Operator bind 2026-07-03; local pointer `foreman/source-truth/LOCAL_SOURCE_TRUTH_POINTER.json`; baseline `foreman/BETSY_BASELINE_v1.md` |
| **Doss** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNASSIGNED** | **UNKNOWN** | **NOT PROVEN** — awaiting `LOCAL_DOSS_WINDOWS` readback or confirmed hostname |
| **Atlas** | **UNKNOWN** | vault path per `foreman/ATLAS_MACHINE_PLAN.md` | n/a (not a git writer) | n/a | **archive forge** | n/a | Plan doc only — no live readback recorded |
| **Medullina** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **auxiliary forge candidate** | **UNKNOWN** | RustDesk on **Betsy private server** — Operator PASS 2026-07-18 (`RECEIPT_RUSTDESK_BETSY_SERVER_FLEET_ALIGNED_20260718`). ID historically `254196301`. Still needs `LOCAL_MEDULLINA_WINDOWS` hostname/path readback + workstation receipt. See `foreman/MEDULLINA_ONBOARDING_PACKET.md`. |
| **Spanzee** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **remote forge / former RD host** | **UNKNOWN** | RustDesk on **Betsy private server** — Operator PASS 2026-07-18. Legacy hbbs at `10.1.10.63` retired; do not re-point peers there. PowerToys pack `spanzee_forge` still capture_pending. |

### Sally work-surface detail (live 2026-06-12, host `DESKTOP-SJSJMNK`)

| Path | Branch | Commit | Working tree | Notes |
|------|--------|--------|--------------|-------|
| `C:\Users\benle\Desktop\github\Werkles` | `rescue/sally-dirty-worktree-2026-06-01` | `8ba905b` | **dirty** (modified + untracked; ahead of origin rescue by 27) | Historical Sally relay path. **Do not switch branch or reset without explicit Operator approval.** |
| `C:\Dev\Werkles` | `snapshot/sally-good-werkles-2026-06-12` | `437792b` | **clean** (synced with `origin/snapshot/sally-good-werkles-2026-06-12`) | Snapshot lane; current Maker session workspace. |

**Localhost on `DESKTOP-SJSJMNK`:** `127.0.0.1:3000` listening (live). Foreman/GD default `4317` not observed listening at last readback.

### Betsy (live 2026-07-03, host `Betsy`)

| Path | Branch | Commit | Working tree | Notes |
|------|--------|--------|--------------|-------|
| `C:\Users\Ben Leak\github\Werkles` | `maker/site-g-20260703` | `19333c9` | dirty (`app/globals.css` modified; ahead 2 of upstream) | **Active local source-truth repo folder.** Supersedes `C:\Users\Ben Leak\Desktop\github\Werkles` (retired). Pointer: `foreman/source-truth/LOCAL_SOURCE_TRUTH_POINTER.json`. Remote: `https://github.com/benleakwerkles/Werkles.git`. |

**Prior path retired:** `C:\Users\Ben Leak\Desktop\github\Werkles` is no longer the Betsy canonical checkout. Do not use Desktop path for new sessions.

### Doss (unproven machine)

**Doss machine identity is unresolved.**

- `foreman/handoffs/live/DOSS_HANDOFF.md` defines **Doss** as a live handoff operator surface (task routing), not proof of a Windows host.
- No `LOCAL_DOSS_WINDOWS` readback and no confirmed hostname are on record.
- **Do not mark Doss PASS** for branch verification until live evidence exists.

---

## Unresolved identity conflicts

1. **Two Werkles clones on Sally (`DESKTOP-SJSJMNK`)** — rescue mirror at Desktop path vs clean snapshot at `C:\Dev\Werkles`. Same host, different branches/commits. Operator must name which surface is canonical for each task.
2. **Betsy hostname vs Sally hostname** — Betsy → `Betsy`; Sally work → `DESKTOP-SJSJMNK`. These are **different hosts**; do not collapse them without Operator confirmation.
3. **Doss: machine vs operator role** — live handoff files use "Doss" as a crew operator name. Physical machine mapping (hostname, repo path, forge role) is **still unknown**.
4. **BLDer legacy name** — earlier docs reference **BLDer** (Builder). Relationship to Betsy is unconfirmed. Do not alias BLDer → Betsy without Operator say-so.
5. **Medullina: household auxiliary machine** — RustDesk server world aligned with Betsy (Operator 2026-07-18). Do not schedule background jobs or claim unattended access until `LOCAL_MEDULLINA_WINDOWS` readback + workstation receipt exist.

---

## Forge roles (definitions)

| Role | Meaning | Typical machine |
|------|---------|-----------------|
| **primary forge** | Main app/UI build, local dev server, primary commits | Betsy (when live-verified) |
| **mirror forge** | Relay/coordination, rescue lanes, snapshot lanes, crew bay | Sally |
| **archive forge** | Backups, asset vault, non-critical jobs — not canon writer | Atlas |
| **auxiliary forge** | Spare compute for builds, smoke tests, indexing, and non-secret background work during approved idle windows | Medullina candidate |

Legacy permission matrix (unchanged intent):

| Name | Source of truth? | Active writer? | May deploy/push/SQL/secrets/money? |
|------|------------------|----------------|------------------------------------|
| **Sally** | No (mirrors repo) | Only when named in `foreman/ACTIVE_AGENT.md` | No automatically — human gates apply |
| **Betsy** | No (mirrors repo) | Yes, when named active writer | Push/deploy/SQL/secrets remain human gates |
| **Atlas** | **No** | **No** | **No** |
| **Medullina** | **No** | **No until live readback + onboarding receipt** | **No** |

---

## Atlas — boundaries (summary)

Atlas is **not** the source of truth and **not** the main active writer. Atlas must **not** deploy, push, apply SQL, hold secrets, or move money. Full plan: `foreman/ATLAS_MACHINE_PLAN.md`.

Atlas **may** be used for:

- repo backups
- asset vault
- screenshot / log archive
- Ghost Forge output archive
- Bellows draft archive
- local preview mirror
- file indexing / search
- non-critical background jobs
- optional local image/video experiments

---

## Execution context mapping

| Machine / surface | Typical `EXECUTION_CONTEXT` | LOCAL HANDS READBACK machine field |
|-------------------|------------------------------|-------------------------------------|
| Sally (`DESKTOP-SJSJMNK`) | `LOCAL_SALLY_WINDOWS` | `DESKTOP-SJSJMNK` |
| Betsy (`Betsy`) | `LOCAL_SALLY_WINDOWS`-class (declare **Betsy** + hostname) | `Betsy` |
| Doss (when proven) | `LOCAL_DOSS_WINDOWS` (reserved) | confirmed hostname only |
| Atlas (vault box) | local context, archive-only — declare `ATLAS` intent | confirmed hostname only |
| Medullina (when proven) | `LOCAL_MEDULLINA_WINDOWS` (reserved) | confirmed hostname only |
| Cursor Cloud Agent | `CURSOR_CLOUD_CONTAINER` | n/a |
| Codex | `CODEX_LOCAL` (must declare local vs sandboxed) | declare actual hostname |
| Cowork browser | `COWORK_BROWSER` | n/a |

A cloud agent (`CURSOR_CLOUD_CONTAINER`) cannot inspect any machine's local filesystem, local `.env`, or local dev server; it must request a local check. See `foreman/EXECUTION_CONTEXT_RULES.md`.

---

## Registry update checklist

When taking LOCAL HANDS READBACK on any forge machine, update the registry row for:

1. Windows hostname
2. Repo path used for the session
3. `git branch --show-current`
4. `git rev-parse --short HEAD`
5. `git status -sb` summary
6. localhost running yes/no and port
7. Evidence source: `live readback YYYY-MM-DD` or cite handoff path
8. For Medullina: owner consent state, allowed work windows, RustDesk ID, and resource limits

**Last registry readback:** 2026-07-03 — `Betsy` canonical path `C:\Users\Ben Leak\github\Werkles`; Sally rows unchanged on `DESKTOP-SJSJMNK`.
