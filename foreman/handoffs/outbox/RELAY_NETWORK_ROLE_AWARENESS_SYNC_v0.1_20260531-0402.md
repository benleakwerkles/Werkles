# AEYE Edge Network — First Command Issued

**Command:** `ROLE_AWARENESS_SYNC` v0.1  
**Issued:** 2026-05-31T04:02:17.125Z  
**Issued by:** Operator (Ben) via Foreman relay  
**Doctrine:** STOP BEFORE SEND — no auto-submit across Edge tabs

---

## What this is

The **first command across the Edge network** synchronizes role awareness for all five Aeye cousins before real cousin handoffs are processed.

Each cousin receives:

1. A full packet in `foreman/handoffs/outbox/`
2. A short paste block for the Edge chat tab
3. Relay metadata with cockpit hashes for stale detection

---

## Network map

| Tab | Cousin | Platform | Lane |
|-----|--------|----------|------|
| 1 | **Petra** (PETRA) | ChatGPT | Gate verdict and crew routing — GO/NO-GO, slice choice, Gate 05 posture. Not implementation patches. |
| 2 | **Skybro** (SKYBRO) | Gemini | Infra, ops, provider navigation prep — not SQL apply or deploy execution. |
| 3 | **Ender** (ENDER) | Claude | UX, brand voice, design system — not SQL, billing, security, or deploy execution. |
| 4 | **Bean** (BEAN) | DeepSeek | Trust, compliance, hardening audits — not deploy execution. |
| 5 | **Computer** (COMPUTER) | Perplexity | Synthesis, current-world checks, cited research — not unsourced deploy decisions. |

---

## Operator walk (Edge bay)

1. **Open Aeye Crew Bay** (Foreman dashboard → tab order in `crew-tabs.config.json`)
2. For each cousin, in tab order:

1. **Petra** — open tab → dashboard **Load Petra Network Paste** (or PETRA_NETWORK_PASTE_BLOCK.txt) → Ctrl+V → **Ben Send** → save reply to inbox
2. **Skybro** — open tab → dashboard **Load Skybro Network Paste** (or SKYBRO_NETWORK_PASTE_BLOCK.txt) → Ctrl+V → **Ben Send** → save reply to inbox
3. **Ender** — open tab → dashboard **Load Ender Network Paste** (or ENDER_NETWORK_PASTE_BLOCK.txt) → Ctrl+V → **Ben Send** → save reply to inbox
4. **Bean** — open tab → dashboard **Load Bean Network Paste** (or BEAN_NETWORK_PASTE_BLOCK.txt) → Ctrl+V → **Ben Send** → save reply to inbox
5. **Computer** — open tab → dashboard **Load Computer Network Paste** (or COMPUTER_NETWORK_PASTE_BLOCK.txt) → Ctrl+V → **Ben Send** → save reply to inbox

3. After all five reply: **Validate Inbox** → **Process Responses** on Foreman dashboard
4. Review processed summary for Ben-review flags — **never auto-merge**

---

## Artifacts

| Artifact | Path |
|----------|------|
| Master command (this file) | `foreman/handoffs/outbox/RELAY_NETWORK_ROLE_AWARENESS_SYNC_v0.1_20260531-0402.md` |
| Manifest | `foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json` |
| Petra packet | `foreman/handoffs/outbox/TO_PETRA_RELAY_ROLE_AWARENESS_SYNC_v0.1_20260531-0402.md` |
| Skybro packet | `foreman/handoffs/outbox/TO_SKYBRO_RELAY_ROLE_AWARENESS_SYNC_v0.1_20260531-0402.md` |
| Ender packet | `foreman/handoffs/outbox/TO_ENDER_RELAY_ROLE_AWARENESS_SYNC_v0.1_20260531-0402.md` |
| Bean packet | `foreman/handoffs/outbox/TO_BEAN_RELAY_ROLE_AWARENESS_SYNC_v0.1_20260531-0402.md` |
| Computer packet | `foreman/handoffs/outbox/TO_COMPUTER_RELAY_ROLE_AWARENESS_SYNC_v0.1_20260531-0402.md` |
| Petra paste | `foreman/handoffs/outbox/PETRA_NETWORK_PASTE_BLOCK.txt` |
| Skybro paste | `foreman/handoffs/outbox/SKYBRO_NETWORK_PASTE_BLOCK.txt` |
| Ender paste | `foreman/handoffs/outbox/ENDER_NETWORK_PASTE_BLOCK.txt` |
| Bean paste | `foreman/handoffs/outbox/BEAN_NETWORK_PASTE_BLOCK.txt` |
| Computer paste | `foreman/handoffs/outbox/COMPUTER_NETWORK_PASTE_BLOCK.txt` |

---

## CLI

```powershell
node foreman/crew-dispatch/crew-relay-network-command.mjs show
node foreman/crew-dispatch/crew-relay-network-command.mjs show --cousin PETRA
```

See `foreman/crew-dispatch/RELAY_NETWORK.md`.
