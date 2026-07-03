# Bridge Repair Result - 2026-05-27

## Outcome
Codex repaired the local Codex state/config that made Werkles chats appear missing and kept the node_repl bridge pointed at the crashing sandbox path.

## Chats
The chats are not gone on disk.

Verified in `C:\Users\benle\.codex\state_5.sqlite`:

- `019e39bc-8384-7d91-aedb-1aa8b853ae8e` - original Werkles build thread
- `019e5df1-c996-7742-b569-e73058adc3b5` - AI platform setup kit thread
- `019e6bda-2a1f-7b32-a1e6-1d797566e38a` - ghost bridge repair thread

Verified rollout files exist under `C:\Users\benle\.codex\sessions`.

## State Patch
Patched `C:\Users\benle\.codex\.codex-global-state.json`.

Backup created:

- `C:\Users\benle\.codex\.codex-global-state.json.bak-state-repair-20260527-223903`

Changes:

- Set Werkles sidebar collapsed state to false.
- Added Werkles workspace-root hints for the 3 known Werkles threads.
- Merged missing prompt-history keys from `.codex-global-state.json.bak-workspace-arrays-20260521-140532`.

## Bridge Config Patch
Patched `C:\Users\benle\.codex\config.toml`.

Backup created:

- `C:\Users\benle\.codex\config.toml.bak-bridge-repair-20260527-223809`

Changes:

- Removed `CODEX_CLI_PATH` from `mcp_servers.node_repl.env`.
- Kept `mcp_servers.node_repl.args = ['--disable-sandbox']`.

Reason:

`node_repl` failed on a one-line JS smoke test with `windows sandbox failed: spawn setup refresh`. Removing `CODEX_CLI_PATH` forces node_repl away from the Codex CLI sandbox-launch path on the next server start.

## Still Open
The current thread's `node_repl` transport stayed closed after stale `node_repl.exe` processes were cleared. This thread cannot prove the repaired MCP bridge until Codex desktop starts a fresh node_repl server from the patched config.

## Next Verification
After Codex desktop respawns the MCP server, run a one-line node_repl smoke test:

```js
nodeRepl.write(JSON.stringify({ ok: true, cwd: nodeRepl.cwd }));
```

Then test the Browser plugin against `file:///C:/Users/benle/Documents/Werkles/index.html`.
