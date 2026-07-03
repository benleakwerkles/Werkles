# Werkles AI Worker Rules

Use `foreman/platform-instructions/CODEX_FOREMAN_INSTRUCTIONS.md` as the repo-local Codex Foreman instruction shim for this workspace.

Repo cockpit files are source of truth. Do not make Ben a copy/paste mule.

## LOCAL HANDS READBACK (mandatory)

**Hard crew rule.** Any hands-capable agent (Maker, Dink, or any future local operator) must begin every local work session with a **LOCAL HANDS READBACK** before editing files, running migrations, installing packages, switching branches, merging, pushing, or starting dev servers.

Required fields: machine name, repo path, git branch, latest commit hash, working tree status, terminal availability, localhost running yes/no, port in use.

Full format and gate: `foreman/EXECUTION_CONTEXT_RULES.md`.

## Automation Authority

Before stopping for Ben, check:

1. `foreman/HUMAN_GATES.md`
2. `foreman/LANES.md`
3. `foreman/BUDGET.md`
4. `foreman/NEXT_ACTION.md`
5. `foreman/AI_COUSINS_PROTOCOL.md`

If `foreman/HUMAN_GATES.md` classifies the action as a non-gate technical proof inside approved scope, proceed without asking Ben and do not trigger the Gate Review UI Protocol.

Cursor/Agents may classify a prompt as `PROCEED: not a human gate` or `STOP: HUMAN GATE`, but must never approve a human gate for Ben.

Do not enter credentials, secrets, payment information, OAuth approvals, account settings, or final create/save/share/deploy approvals automatically.

## Execution Context

Every agent must report its execution context before making file-system, repo-state, environment, runtime, or deployment claims. Allowed: `LOCAL_SALLY_WINDOWS`, `CURSOR_CLOUD_CONTAINER`, `CODEX_LOCAL`, `COWORK_BROWSER`, `UNKNOWN`. A `CURSOR_CLOUD_CONTAINER` agent must not claim to inspect Windows desktop folders, Sally local `.env` files, Sally localhost/dev server, or Sally uncommitted changes; it requests a `LOCAL_SALLY_WINDOWS` check instead.

Hands-capable local agents must also deliver **LOCAL HANDS READBACK** at session start (see above). Full format and gate: `foreman/EXECUTION_CONTEXT_RULES.md`.

**Permission Swatter (Aeye Windows):** `foreman/PERMISSION_SWATTER_V1.md` — sub-steps inside total-approved projects in `foreman/gates/APPROVED_PROJECT_REGISTRY.json` may proceed without treating each prompt as a new human gate. Never swat push, merge, deploy, money, secrets, or destructive actions.
