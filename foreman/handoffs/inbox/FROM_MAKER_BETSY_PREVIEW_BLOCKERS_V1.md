# FROM MAKER - BETSY PREVIEW BLOCKERS V1

Execution context: `CURSOR_CLOUD_CONTAINER`.

Status: blocker-identification report. No install, deploy, merge, checkout, worktree creation on Betsy, SQL, secrets, billing, provider mutation, app code change, or live data mutation was performed by this report.

## Mission

Determine what prevents local preview on Betsy.

Report:

- Node installed? Y/N
- npm installed? Y/N
- repo present? Y/N
- env vars required?
- exact commands needed
- first successful preview milestone

## Evidence Boundary

This agent cannot inspect Betsy's Windows filesystem, PATH, installed Node/npm, local repo, local env, local ports, or localhost from `CURSOR_CLOUD_CONTAINER`.

Therefore:

```text
Betsy Node/npm/repo state cannot be truthfully marked Y/N from this container.
```

What can be determined from cloud/Git evidence:

```text
The SoleDash/GD console server file is absent on origin/main and absent on this current PR #15 report branch.
The SoleDash/GD console server file exists on PR #12 top-of-stack.
The browser error ERR_CONNECTION_REFUSED means no server is listening on Betsy's port 4317 at the time of the browser request.
```

---

# Executive Diagnosis

Most likely blocker:

```text
Betsy is trying to open http://127.0.0.1:4317 while no SoleDash/GD server is running.
```

Most likely reason no server is running:

```text
Betsy's current checkout probably does not contain scripts/foreman/foreman-control-server.mjs, because that file is not on main or this current branch. It is on PR #12.
```

Second likely reason:

```text
The server command may not have been started, or it exited immediately due to missing Node / wrong directory / missing file.
```

Browser error meaning:

```text
ERR_CONNECTION_REFUSED = browser reached localhost, but the OS refused the connection because nothing is listening on port 4317.
```

This is not a browser problem.

---

# Known Repo-Side Facts

Checked from `CURSOR_CLOUD_CONTAINER`:

```text
origin/main has scripts/foreman/foreman-control-server.mjs? NO
current PR #15 branch has scripts/foreman/foreman-control-server.mjs? NO
PR #12 has scripts/foreman/foreman-control-server.mjs? YES
PR #12 has foreman/control-panel/README.md? YES
```

Implication:

```text
If Betsy is on main or this PR #15 branch, the GD/SoleDash local preview command cannot work because the server file is not present.
```

---

# Betsy Local Checks - No Install, No Modify

Run these on Betsy PowerShell from the expected repo location.

## 1. Repo present?

```powershell
Test-Path "C:\Users\benle\Desktop\github\Werkles\.git"
```

Interpretation:

```text
True  = repo present at expected path
False = repo absent or path wrong
```

Y/N field:

```text
Repo present? UNKNOWN until this command runs on Betsy.
```

## 2. Current branch / commit

```powershell
cd C:\Users\benle\Desktop\github\Werkles
git status --short --branch
git rev-parse --short HEAD
```

Interpretation:

```text
If branch is main or cursor/dink-non-human-gate-agent-c25f, the SoleDash/GD server file is expected to be absent.
If branch/worktree is PR #12 top-of-stack, the server file should exist.
```

## 3. Server file present?

```powershell
Test-Path ".\scripts\foreman\foreman-control-server.mjs"
```

Interpretation:

```text
True  = server file exists; continue Node checks
False = primary blocker found: current checkout does not contain GD/SoleDash server
```

## 4. Node installed?

```powershell
node -v
```

Interpretation:

```text
Prints version = Node installed
Command not found / not recognized = Node missing from PATH or not installed
```

Y/N field:

```text
Node installed? UNKNOWN until this command runs on Betsy.
```

## 5. npm installed?

```powershell
npm -v
```

Interpretation:

```text
Prints version = npm installed
Command not found / not recognized = npm missing from PATH or not installed
```

Y/N field:

```text
npm installed? UNKNOWN until this command runs on Betsy.
```

Note:

```text
The SoleDash/GD control server itself uses Node built-ins only. npm is not required to start that server, but npm is required for normal Next app preview flows like npm run dev.
```

## 6. Is anything listening on port 4317?

```powershell
Get-NetTCPConnection -LocalPort 4317 -State Listen -ErrorAction SilentlyContinue
```

Interpretation:

```text
Output row = something is listening
Blank      = nothing is listening; browser will get ERR_CONNECTION_REFUSED
```

## 7. Local health probe

Only run after starting the server.

```powershell
Invoke-WebRequest "http://127.0.0.1:4317/health" -UseBasicParsing
```

Expected body:

```json
{"ok":true,"service":"foreman-control-server","readOnly":true}
```

---

# Env Vars Required?

## SoleDash/GD control server

Required env vars:

```text
None.
```

Optional env var:

```text
FOREMAN_CONTROL_PORT
```

Default:

```text
4317
```

Port fallback:

```powershell
$env:FOREMAN_CONTROL_PORT=4500
node .\scripts\foreman\foreman-control-server.mjs
```

Then open:

```text
http://127.0.0.1:4500
```

## Next app local preview

If preview means the main Next app (`npm run dev`), env vars may be required for auth, Supabase, Stripe, membership, billing, or Crucible flows.

But for the SoleDash/GD control console:

```text
No Supabase/Stripe/provider secrets are required.
No .env is required to open the console itself.
```

---

# Exact Commands Needed

## A. If Betsy already has PR #12 server file

From Betsy PowerShell:

```powershell
cd C:\Users\benle\Desktop\github\Werkles
Test-Path ".\scripts\foreman\foreman-control-server.mjs"
node -v
node .\scripts\foreman\foreman-control-server.mjs
```

Keep that PowerShell window open.

Then in a second PowerShell window or browser:

```powershell
Start-Process "http://127.0.0.1:4317"
```

Health check:

```powershell
Invoke-WebRequest "http://127.0.0.1:4317/health" -UseBasicParsing
```

## B. If port 4317 is blocked or occupied

```powershell
cd C:\Users\benle\Desktop\github\Werkles
$env:FOREMAN_CONTROL_PORT=4500
node .\scripts\foreman\foreman-control-server.mjs
```

Open:

```powershell
Start-Process "http://127.0.0.1:4500"
```

## C. If the server file is missing

This is the repo-side blocker.

No-install/no-modify identification stops here:

```text
Blocker found: Betsy's current checkout does not contain scripts/foreman/foreman-control-server.mjs.
```

To actually preview, Betsy must use code from PR #12 or a fresh consolidated console PR. That requires a branch/worktree/checkout/copy step, which is a local repo modification and is outside this "Do not modify" blocker-identification task.

PR #12 source branch:

```text
cursor/soledash-build-continue-eeea
```

---

# First Successful Preview Milestone

The first successful preview milestone is not "browser opened." It is:

```text
GET http://127.0.0.1:4317/health returns:
{"ok":true,"service":"foreman-control-server","readOnly":true}
```

Then the visual milestone is:

```text
http://127.0.0.1:4317 opens a page titled:
SoleDash - Operator Command Console
```

Expected visible sections:

- Status Layer
- SoleDash Inbox / Outbox / Receipts
- APP_INFRA Review
- Repo / PRs
- Deploy / Hosting
- Ghost Forge / Render
- Supabase
- Stripe
- Aeye / Crew

Expected packet proof:

```text
/outbox returns at least one packet item
/inbox returns packet metadata if inbox files exist
/receipts returns outbox-derived receipt rows
/summary returns outbox/inbox counts
```

---

# Blocker Table

| Check | Betsy Y/N | Evidence source | Most likely blocker if failing |
|-------|-----------|-----------------|--------------------------------|
| Node installed? | UNKNOWN | Requires Betsy `node -v` | Node missing or not in PATH |
| npm installed? | UNKNOWN | Requires Betsy `npm -v` | npm missing or not in PATH; not required for SoleDash server |
| Repo present? | UNKNOWN | Requires Betsy `Test-Path ...\.git` | wrong path or repo not cloned |
| Server file present? | LIKELY NO if on main/PR15 | Cloud verified absent on main/current branch; present on PR #12 | Betsy is not on PR #12 console code |
| Env vars required? | NO for SoleDash/GD | Server code/README from PR #12 | none; optional port override only |
| Port 4317 listening? | NO at browser error time | ERR_CONNECTION_REFUSED | server not running or exited |

---

# Fastest Next Checks

Run in order on Betsy:

```powershell
cd C:\Users\benle\Desktop\github\Werkles
Test-Path ".\.git"
git status --short --branch
Test-Path ".\scripts\foreman\foreman-control-server.mjs"
node -v
npm -v
Get-NetTCPConnection -LocalPort 4317 -State Listen -ErrorAction SilentlyContinue
```

Decision:

```text
If server file is False: Betsy does not have the console code.
If node -v fails: Node/PATH blocker.
If server file is True and node works but port is blank: start server.
If server starts and health passes: preview milestone reached.
```

---

# Current Best Answer

The most likely current blocker is:

```text
Betsy's current checkout does not contain the GD/SoleDash server file, because it is only present on PR #12, not on main or this current PR #15 branch.
```

The immediate browser error is:

```text
No process is listening on 127.0.0.1:4317.
```

The fastest successful path, after confirming the server file exists, is:

```powershell
node .\scripts\foreman\foreman-control-server.mjs
Start-Process "http://127.0.0.1:4317"
```

If the file is missing, stop and report:

```text
SERVER FILE MISSING ON BETSY CHECKOUT - NEED PR #12 CONSOLE CODE OR CONSOLIDATED CONSOLE PR BEFORE PREVIEW.
```
