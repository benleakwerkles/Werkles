# Direwolf Dink@Betsy — Werkles.com Only Packet

Status: ACTIVE — SUPERSEDES BRANCH-SYNC MERGE GUIDANCE
Issued: 2026-07-04
Audience: **Direwolf Dink** @ Betsy (Operator decree 2026-07-04; see `foreman/messages/DIREWOLF_DINK_NAME_DECREE_20260704.md`)
Human gate: Ben severed Harvey work from Betsy. Direwolf Dink is Werkles.com mechanical labor only.

## Starter message for Direwolf Dink

```text
Ben says your name is Direwolf Dink.

You are Direwolf Dink@Betsy on the Werkles.com lane only.

Execute:
foreman/messages/DINK_BETSY_WERKLES_COM_ONLY_PACKET_20260704.md
foreman/werkles-com/WERKLES_COM_PROJECT_LOCK.md

Git root: C:\Users\Ben Leak\github\Werkles
Branch: maker/site-g-20260703

Do NOT take Harvey architecture, ThinkIt relay, or Nerdkle organism tasks.
Do NOT merge origin/main Harvey commits (ec4772c) into this branch.
Do NOT push to main without Ben gate.

Begin with LOCAL HANDS READBACK. Return the required readback block.
```

## Plain mission

Keep Betsy focused on **werkles.com** — public pages, auth, member surfaces, site CSS, copy, and localhost preview.

Harvey / Nerdkle nursery architecture is **explicitly out of scope** for Direwolf Dink@Betsy. Other Aeyes on other machines own that lane per `foreman/messages/HARVEY_NERDKLE_EARLY_WORK_AEYES_PACKET_20260704.md`.

---

## Verified Betsy anchor (2026-07-04)

```text
LOCAL HANDS READBACK
Machine: Betsy
Repo: C:\Users\Ben Leak\github\Werkles
Branch: maker/site-g-20260703
Remote: https://github.com/benleakwerkles/Werkles.git
Upstream: origin/consolidation/werkles-unified-20260702-push (site lane; do not merge Harvey from main)
Cursor workspace mirror: C:\Users\Ben Leak\Desktop\github\Werkles (NO .git — never commit from here)
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS
```

---

## In scope

| Task | Examples |
|------|----------|
| Site pages | home, proof, membership, login, signup, dashboard member UI |
| Site styling | `app/globals.css`, design tokens, responsive polish |
| Copy | `lib/copy.ts`, narrative sections per `foreman/SITE_MAP.md` |
| Local proof | `npm run typecheck`, `npm run dev`, localhost screenshot/readback |
| Site receipts | commit site fixes with clear messages |
| Canonical guard | `Assert-WerklesCanonical.ps1` — verification only |

---

## Out of scope — return LANE_VIOLATION if assigned

| Task | Route to |
|------|----------|
| Harvey architecture drafts | Skybro / Petra / DOSS — `HARVEY_NERDKLE_EARLY_WORK_AEYES_PACKET_20260704.md` |
| ThinkIt relay stewardship | Swanson / non-Betsy Dink — relay handoff packet |
| Nerdkle organism UI | Harvey lane on `feature/harvey-nursery-v0` |
| Merge `ec4772c` from main | **Forbidden** until Ben merge gate |
| Merge to `main` | Ben gate |
| Production deploy | Ben gate |

---

## Git rules (Werkles.com lane)

```powershell
cd C:\Users\Ben Leak\github\Werkles
git fetch origin
git status -sb
git branch --show-current   # expect maker/site-g-20260703
```

**Do:**

- Commit site work on `maker/site-g-20260703`
- Push this branch **only after Ben names the push target**

**Do not:**

```powershell
git merge origin/main                    # pulls Harvey ec4772c — forbidden
git cherry-pick ec4772c                  # forbidden
git push origin main                     # forbidden
git checkout feature/harvey-nursery-v0   # wrong lane for Betsy Dink
```

Safe push after Ben approval:

```powershell
git push -u origin maker/site-g-20260703
```

---

## Session startup (every time)

```powershell
cd C:\Users\Ben Leak\github\Werkles
git status -sb
Get-Content foreman\werkles-com\WERKLES_COM_PROJECT_LOCK.md
Get-Content foreman\messages\DINK_BETSY_WERKLES_COM_ONLY_PACKET_20260704.md
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Assert-WerklesCanonical.ps1
```

Optional site proof:

```powershell
npm run typecheck
npm run dev
```

---

## Coordination with Lady Jessica (Maker@Betsy)

Lady Jessica and Direwolf Dink share one lane:

- Same branch: `maker/site-g-20260703`
- Same git root: `C:\Users\Ben Leak\github\Werkles`
- Same forbidden set: Harvey files, relay deep work, main merge

If Lady Jessica asks Dink to touch Harvey or relay files, Dink returns:

```text
LANE_VIOLATION: WERKLES_COM_ONLY — reassign to Harvey lane Aeye on non-Betsy host.
```

---

## Required readback block

```text
HANDOFF_PACKET: DINK_BETSY_WERKLES_COM_ONLY_PACKET_20260704
AEYE_NAME: Direwolf Dink
PROJECT_LOCK: WERKLES_COM_PROJECT_LOCK
MACHINE: Betsy
HOSTNAME:
CANONICAL_PATH:
BRANCH:
HEAD:
WORKTREE_STATUS:
HARVEY_LANE_TOUCHED: NO
SITE_FILES_EDITED:
TYPECHECK:
LOCALHOST:
PORT:
COMMITS_MADE:
PUSHED: NO|YES — branch name if yes
MAIN_MERGE_ATTEMPTED: NO
HARVEY_MERGE_ATTEMPTED: NO
BLOCKERS:
NEXT_ACTION:
```

---

## Supersedes

This packet supersedes merge-to-main guidance in `DINK_BETSY_WERKLES_BRANCH_SYNC_AND_CLEAN_WORKFLOW_PACKET_20260704.md` for lane assignment. Branch sync steps there still apply for git hygiene, but **Harvey merge and main promotion remain forbidden**.

Relay handoff packet remains valid for **non-Betsy** relay stewards only — not Dink@Betsy while Werkles.com lock is active.
