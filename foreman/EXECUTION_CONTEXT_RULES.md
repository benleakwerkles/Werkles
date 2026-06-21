# Execution Context Rules

Status: automation authority doctrine. Source of truth for execution-context reporting and LOCAL HANDS READBACK.

Every agent must report its execution context **before** making any file-system, repo-state, environment, runtime, or deployment claim. An agent that has not declared context may not assert what it can or cannot see.

## LOCAL HANDS READBACK (mandatory)

**Hard crew rule.** Not a suggestion.

Any **hands-capable** agent — including Maker, Dink, or any future local operator — must begin **every local work session** with a **LOCAL HANDS READBACK** before taking any action that touches the machine, repo, runtime, or network.

### Required readback fields

1. Machine name
2. Repo path
3. Git branch
4. Latest commit hash
5. Working tree status (clean / dirty; staged / unstaged summary if dirty)
6. Whether terminal execution is available
7. Whether localhost is currently running
8. Which port is in use (or `none` if no local server is running)

### Hard gate — no action until readback

No hands-capable agent may do any of the following until LOCAL HANDS READBACK is given:

- edit files
- run migrations
- install packages
- switch branches
- merge
- push
- start dev servers

Read-only inspection to **produce** the readback (for example `git status`, `hostname`, port checks) is allowed and required.

### Purpose

Prevent Ben from having to remember to ask which repo, branch, machine, or workspace the agent is operating inside.

### Report format

Lead every local hands session with:

```text
LOCAL HANDS READBACK
Machine: <hostname>
Repo: <absolute path>
Branch: <branch>
Commit: <short or full hash>
Working tree: <clean | dirty — summary>
Terminal: <available | unavailable>
Localhost: <running | not running>
Port: <port number | none>
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS
```

If any field cannot be determined, report `UNKNOWN` for that field and stop. Do not guess repo, branch, or port.

## Allowed execution contexts

- `LOCAL_SALLY_WINDOWS`
- `CURSOR_CLOUD_CONTAINER`
- `CODEX_LOCAL`
- `COWORK_BROWSER`
- `UNKNOWN`

Report format (lead with this before file ops):

```text
EXECUTION_CONTEXT: <one of the above>
```

## Context rules

### 1. `LOCAL_SALLY_WINDOWS`

Can inspect:

- `C:\Users\benle\...` and other local Windows desktop folders
- local repo files
- local working tree (including uncommitted changes)
- local dev server / runtime state
- local `.env` **existence** — but must never print, save, or transmit secret values

### 2. `CURSOR_CLOUD_CONTAINER`

Can inspect:

- `/workspace`
- GitHub branches
- pull requests
- committed/pushed repo state
- cloud build/typecheck results

Cannot inspect (must not claim to):

- `C:\Users\...` or any Windows desktop folder
- Sally/BLDer local `.env` files
- Sally localhost / local dev server state
- Sally uncommitted changes
- local runtime logs unless committed or uploaded into the repo

If asked to inspect any of the above, a `CURSOR_CLOUD_CONTAINER` agent must decline the direct claim and instead request a `LOCAL_SALLY_WINDOWS` check (provide a read-only command for the Operator to run).

### 3. `CODEX_LOCAL`

Must declare whether it is local to Sally or sandboxed elsewhere **before** claiming local filesystem or runtime access. If sandboxed, the `CURSOR_CLOUD_CONTAINER` "cannot inspect" limits apply by analogy.

### 4. `COWORK_BROWSER`

Operates browser / computer-use only within its current browser session. Must not claim direct repo filesystem access unless that access is explicitly available in the session.

### 5. `UNKNOWN`

If context is unknown, the agent must **stop and identify** before any file operation. No filesystem, repo-state, runtime, or deployment claim is allowed under `UNKNOWN`.

## Merge / push / deploy evidence locality

Before any merge, push, or deploy recommendation, identify whether the required evidence is:

- cloud-side (GitHub / `/workspace` / cloud build), or
- local Sally-side (Windows working tree, local `.env`, local dev server), or
- both.

If local evidence is required, a `CURSOR_CLOUD_CONTAINER` agent must **request a `LOCAL_SALLY_WINDOWS` check** rather than guessing or fabricating local state. A recommendation that depends on unseen local evidence must be marked CONDITIONAL until that evidence is supplied.

## Relationship to other cockpit files

- This file is the source of truth for execution-context reporting and LOCAL HANDS READBACK.
- `AGENTS.md` and `foreman/AI_COUSINS_PROTOCOL.md` reference both rules for all cousins.
- `company/WERKLES_CONSTITUTION.md` Article X establishes LOCAL HANDS READBACK as constitutional crew law.
- `foreman/HUMAN_GATES.md` references the evidence-locality rule for merge/push/deploy gates.
- Secret handling remains governed by `foreman/HUMAN_GATES.md` (Secret Boundary) — no context may print or request secret values.
