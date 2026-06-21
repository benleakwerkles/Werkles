# HUMAN_CONSUMABLE_OUTPUT_RULE_V1

Status: **LOCKED** — GD definition of done  
Applies to: all GD intent router missions, Sherlock dossiers, homepage/visual narrative reviews, dispatch synthesis packets, future GD missions

---

## Problem

GD was completing missions by writing repository artifacts (synthesis files, dossiers, run folders) that still required Ben to act as middleware — open files, hunt paths, reconstruct the next step, and paste context into another AI by hand.

**Artifact creation alone is not mission completion.**

---

## Rule

Every GD mission **must** return an **Operator Brief** containing these five sections, in this order:

| # | Section | Requirement |
|---|---------|-------------|
| 1 | **Executive summary** | 10-second read — one short paragraph, plain language |
| 2 | **Key findings** | Bullet list — deduped, ranked, no jargon walls |
| 3 | **Recommended next action** | Single concrete step Ben can take now |
| 4 | **Paste-ready prompt** | Full prompt block if the next step is another AI; otherwise `_None — Operator action only._` |
| 5 | **Artifact paths** | Optional supporting evidence — repo paths for audit only |

---

## Definition of done

Ben can take the next step **without opening repository files**.

The Operator Brief must be:

- Written to **`foreman/handoffs/outbox/OPERATOR_BRIEF_<MISSION_CLASS>_<RUN_ID>.md`**
- Copied to **`foreman/gd-intent-router/runs/<RUN_ID>/OPERATOR_BRIEF.md`**
- Prepended to **`FROM_GD_SYNTHESIS_*`** synthesis packets (same five sections at top)

If a mission produces a standalone dossier (e.g. Sherlock), the dossier **must** open with the same five sections before evidence tables.

---

## Scope

| Mission type | Operator Brief required | Notes |
|--------------|-------------------------|-------|
| All `mission-classes.json` entries | Yes | Auto-generated on `gd:synthesize` |
| Sherlock dossiers | Yes | Dossier front matter = Operator Brief |
| **Thread refresh packet** | Yes | `THREAD_REFRESH_PACKET.md` — cockpit-sourced, no cousins |
| Homepage discovery / synthesis | Yes | Petra handoff → Petra reply must include brief |
| Visual narrative reviews | Yes | GD run + paste prompt only if next AI |
| Dispatch synthesis packets | Yes | Use `foreman/handoffs/templates/DISPATCH_SYNTHESIS_OPERATOR_BRIEF_TEMPLATE.md` |
| Future GD missions | Yes | Register `humanConsumable` block in mission class |

---

## Anti-patterns

- Synthesis that says "see run folder" with no inline summary
- Paste prompts that reference file paths Ben must open first
- Ten recommended actions with no default
- Mission marked complete when only packets were generated (receipts/synthesis/brief missing)

---

## CLI

Operator Brief is emitted automatically:

```bash
npm run gd:synthesize -- <RUN_ID>
```

Output: `foreman/handoffs/outbox/OPERATOR_BRIEF_<MISSION>_<RUN_ID>.md`

---

## Related

- `foreman/gd-intent-router/templates/OPERATOR_BRIEF_TEMPLATE.md`
- `foreman/handoffs/templates/DISPATCH_SYNTHESIS_OPERATOR_BRIEF_TEMPLATE.md`
- `foreman/gd-intent-router/GD_INTENT_ROUTER_V1.md`
