# Power Automate Flow Spec — Crew Dispatch v2

Status: **SPEC ONLY** — implement on Sally when approved  
Doctrine: **STOPS BEFORE SEND**

This flow assists Operator prep. It must never submit messages, trigger AI APIs, deploy, push, or apply SQL.

---

## Flow name

`Werkles_CrewDispatch_v2_PrepareOnly`

---

## Trigger

**Manual button** — `Prepare crew dispatch`  
Location: Operator Power Automate app or desktop shortcut on Sally

Optional secondary trigger: **Recurrence** every 4 hours → `Refresh` only (dashboard sync, no Prepare)

---

## Inputs (manual form)

| Field | Type | Values |
|-------|------|--------|
| `Mission` | Dropdown | crew-checkin, ghost-forge-resume, morale-preview, app-infra-slice |
| `Role` | Dropdown | petra, codex, maker, ender, bean |
| `Action` | Dropdown | Refresh, Generate, Prepare |

Default safe action: **Refresh**

---

## Steps

### 1. Validate inputs

- If `Action` = Prepare → show confirmation card:

> **STOP BEFORE SEND**  
> This will copy a paste block to clipboard and open a packet file.  
> You must paste manually into the AI seat. Continue?

- If Operator cancels → terminate (Succeeded, no side effects)

### 2. Run PowerShell (Sally local)

```powershell
cd C:\Users\BenLeak\github\Werkles
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\crew-dispatch-console.ps1 -Action @{Action} -Mission @{Mission} -Role @{Role}
```

Use **Run script** connector or **Command line** on local machine — not cloud-only runner unless Sally is the host.

### 3. Read dashboard status (optional)

- Parse `foreman/crew-dispatch-console/DISPATCH_DASHBOARD.json`
- Surface in Teams/notification card:
  - `cockpit.nextActionHeadline`
  - selected role `status`
  - `lastPreparedAt`

### 4. Operator notification (allowed)

Post to **Operator-only** channel or toast:

```
Crew Dispatch PREPARED (not sent)
Mission: {Mission}
Role: {Role}
Status: prepared_not_sent
Next: paste manually into Edge tab {Role}
```

### 5. Hard stop — forbidden actions

The flow must **NOT** include:

| Forbidden step | Reason |
|----------------|--------|
| Send an email | Send gate |
| Post message to ChatGPT/Codex API | Send gate |
| HTTP POST to Render/Vercel/Stripe | Provider gate |
| Clipboard simulation into browser | Send gate |
| `git push` | Human gate |
| SQL apply | Human gate |
| Power Automate **Send an HTTP request** to AI providers | Send gate |

If any template suggests auto-send, delete that step.

---

## Optional follow-up flow (separate)

`Werkles_CrewDispatch_v2_MarkReplied`

Manual button after Ben pastes and receives AI reply:

- Input: role, mission, free-text summary
- Action: append row to SharePoint list or local log `foreman/crew-dispatch-console/dispatch-log.ndjson`
- Update role status to `awaiting_next_gate` via another local Refresh call

Still **no Send**.

---

## SharePoint / list schema (optional)

| Column | Type |
|--------|------|
| `TimestampUtc` | datetime |
| `Mission` | text |
| `Role` | text |
| `Status` | text (`prepared_not_sent`, `replied`, `blocked`) |
| `PacketFile` | text |
| `OperatorNote` | text |

---

## Test plan

1. Run `Refresh` — dashboard files update; no clipboard change.
2. Run `Generate` — packet files appear in outbox; no clipboard.
3. Run `Prepare` — clipboard populated; packet opens; dashboard status `prepared_not_sent`.
4. Confirm flow has **zero** Send/POST steps.
5. Cancel confirmation card — no filesystem changes beyond Refresh.

---

## Source of truth

Script: `scripts/foreman/crew-dispatch-console.ps1`  
Config: `foreman/crew-dispatch-console/dispatch-config.json`

If flow and script disagree, **script wins**.
