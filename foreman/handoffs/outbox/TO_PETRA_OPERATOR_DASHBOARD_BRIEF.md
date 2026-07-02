# To Petra (Comptroller): Explain the Operator Dashboard to Ben

## Mission

Ben is confused about the **Foreman Dashboard** (localhost:4317) vs **Edge cousin chats**. Edge tabs show **no commands** because packets exist as **files on Sally** until the **relay pastes and Ben Sends**.

Your job: explain the dashboard in **plain English** so Ben can operate it without hunting repo paths.

**Do not** recommend deploy, push, SQL, or auto-merge.

---

## Cast

| Name | Role |
|------|------|
| **Ben** | Operator — only human who clicks **Send** |
| **Petra** | Comptroller — explain + eventual routing verdict |
| **Foreman Dashboard** | Local Sally control panel — not werkles.com |
| **Aeye Crew Bay** | Edge window — tabs 1–5 cousins |

---

## Key truth Ben must hear first

> **Outbox packets are not delivered commands.**  
> `RELAY_NETWORK_ROLE_AWARENESS_SYNC_*.md` and `TO_*_RELAY_*.md` on disk mean Sally **prepared** mail.  
> Cousins receive nothing until:  
> 1. Ben clicks **Run Network Sync Relay** on the dashboard  
> 2. Text appears in the Edge chat input  
> 3. Ben clicks **Send** on that provider tab  

If Edge chats are empty, the relay did not complete — not cousin failure.

---

## How the dashboard works (human)

### 1. Open cockpit

Desktop: **Werkles - Foreman Dashboard** → http://localhost:4317

### 2. Open crew room

**Open Aeye Crew Bay** — Edge with Petra, Skybro, Ender, Bean, Computer tabs.

### 3. Run network relay (primary button)

Card: **AEYE Network Relay (automated)**  
Button: **Run Network Sync Relay**

Machine: issues fresh packets if needed → opens Edge → **pastes tab 1 automatically**

### 4. Ben's gates only

| Gate | Ben action |
|------|------------|
| Deliver to provider | **Send** in Edge tab |
| Advance relay | **I Sent - Next Cousin** on dashboard |
| File replies | Drop Zone or save `FROM_*` to inbox |
| Promote to repo | **Validate Inbox** → **Process** → Ben reads — never auto-merge |

### 5. Repeat tabs 1–5

Send in Edge → I Sent on dashboard → next tab pasted → … until **COMPLETE**.

---

## Two jobs — do not conflate

| Job | When | Tool |
|-----|------|------|
| **Role awareness sync** | First — cousins learn lanes | Run Network Sync Relay |
| **Comptroller check-in** | After A or in parallel | Fresh Petra mission packet + Send |

Stale pre-sync Petra packets: **DO NOT SEND**.

---

## Your script for Ben

Full talk track: `foreman/crew-dispatch/PETRA_TO_OPERATOR_DASHBOARD_SCRIPT.md`  
Ben self-serve: `foreman/crew-dispatch/BEN_DASHBOARD_QUICKSTART.md`

---

## Reply format

Use standard relay metadata if replying into inbox, or plain chat:

1. One-paragraph dashboard explanation for Ben  
2. Numbered steps Ben clicks **today**  
3. Diagnosis if Edge still empty after Run Relay  
4. Whether APP_INFRA / Gate 05 verdict should wait until role sync completes  

```
VERDICT: ...
SLICE: ...
GATE_05: PAUSE | RESUME | STOP
```

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "PETRA",
  "source_packet_id": "TO_PETRA_OPERATOR_DASHBOARD_BRIEF",
  "source_packet_file": "TO_PETRA_OPERATOR_DASHBOARD_BRIEF.md",
  "generated_at": "2026-05-31T00:00:00.000Z",
  "CONFIDENCE": "HIGH",
  "VERDICT": "Explain dashboard first — relay idle means nothing reached Edge",
  "UNKNOWNS": "none"
}
```

*(Ben: replace generated_at / hashes from live packet if using strict intake.)*
