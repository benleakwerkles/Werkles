# UNBLOCK — Heimerdinker repo routing

| Field | Value |
|-------|-------|
| **Blocker** | `LOCAL_HANDS_READBACK_TO_HEIMERDINKER_MATCHING_MISSION_LEAD_V1_20260710_BLOCKER.md` |
| **Wrong workspace** | `C:\Users\Ben Leak\Documents\Werkles` — empty git root, no commits, no `foreman/` |
| **Correct workspace** | `C:\Users\Ben Leak\github\Werkles` |
| **Branch** | `maker/site-g-20260703` |
| **Issued** | 2026-07-10 · Maker@Betsy |

---

## Do not use

| Path | Why |
|------|-----|
| `C:\Users\Ben Leak\Documents\Werkles` | Empty repo — blocker confirmed |
| `C:\Users\Ben Leak\Desktop\github\Werkles` | Desktop clone — not canonical for G lane work |

---

## Canonical checkout (open Codex / Cursor here)

```text
cd C:\Users\Ben Leak\github\Werkles
git checkout maker/site-g-20260703
git rev-parse --short HEAD
```

Expected: branch `maker/site-g-20260703`, commit at or after matching engine work (`8e77ace` matching build; HEAD may be `97ab2cd` or newer).

---

## Packet paths (relative to canonical root)

| # | Path |
|---|------|
| 1 | `foreman/messages/HEIMERDINKER_MATCHING_MISSION_LEAD_TAG_20260710.md` |
| 2 | `foreman/handoffs/outbox/TO_HEIMERDINKER_MATCHING_MISSION_LEAD_V1_20260710.md` |
| 3 | `foreman/handoffs/outbox/TO_DINK_MATCHING_NOT_MATCHING_SHADOW_QA_20260710.md` |
| 4 | `foreman/messages/MAKER_MATCHING_BUILD_DEPUTY_TAG_20260710.md` |

Verify before smoke:

```powershell
Test-Path "C:\Users\Ben Leak\github\Werkles\foreman\handoffs\outbox\TO_HEIMERDINKER_MATCHING_MISSION_LEAD_V1_20260710.md"
```

Must return `True`.

---

## Smoke mule (after readback)

```powershell
cd C:\Users\Ben Leak\github\Werkles
.\scripts\foreman\Test-WerklesMatchingShadowSmoke.ps1
```

---

## Note on git

Handoff packets may be **uncommitted** on disk at canonical root. They are readable locally without pull. Remote-only agents need Operator push of `maker/site-g-20260703` or file copy from Betsy.

Authority: `foreman/werkles-com/WERKLES_COM_PROJECT_LOCK.md`
