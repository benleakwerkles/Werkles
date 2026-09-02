# Werkles VPGM — ACTION_VS_INFORMATION_AFFORDANCE v0.1

**To Ender** (Product / UX cousin · Claude · Edge tab 3)
**Issued by:** Heimerdinker@Betsy, Werkles Foreman
**Doctrine:** STOP BEFORE SEND — Foreman prepares and pastes; Ben clicks Send.

## Slice under review

Red-team one small, site-wide interaction cue that makes real buttons and links immediately distinguishable from rounded information-only bubbles without removing or visually demoting those bubbles.

## Context handed to the cousin

- Ben likes the rounded bubbles and wants them preserved.
- A human user currently tries clicking information bubbles to discover whether they navigate into Intake or elsewhere.
- The distinction must be obvious before hover or tap, but the site must not become louder or more decorated.
- Native semantics remain authoritative: actions are links or buttons; information bubbles are not focusable or clickable.

## Verbatim member-facing strings

- Rounded action buttons and rounded information cards currently share similar silhouettes.
- Some static bubbles contain short labels and therefore look like navigation choices.
- The desired repair is small and nearly unnoticeable, not a component rewrite.

## Known gaps disclosed up front

- The site has multiple historical button and card classes rather than one fully normalized component library.
- Color alone cannot carry the distinction.
- Hover-only evidence fails on touch devices.
- A global selector that guesses intent from rounded geometry could break unrelated controls.

## Assignment

- **V:** Make the action grammar immediately understandable to an ordinary person without sacrificing Werkles' rounded visual language.
- **P:** Evaluate first-glance human expectation, visual affordance, cognitive load, mobile/touch behavior, keyboard focus, reduced motion, and forced-colors behavior.
- **M:** Give five concrete human/browser acceptance tests, including a first-glance test and a touch-device test.
- **Out of lane:** Do not implement code, create subagents/tasks/environments, or recommend push, deploy, provider calls, secrets, SQL, or spend.

### G — work items

1. Name the smallest reliable cue real actions should always receive and information bubbles should never receive.

2. Define the complementary information-bubble rule so a person understands it is explanatory without needing an 'information only' disclaimer on every card.

3. Attack color-only, shadow-everywhere, hover-only, decorative-arrow, pointer-cursor, animation, and overly loud solutions; return a better bounded pattern.

## Expected return

`foreman/handoffs/inbox/FROM_ENDER_ACTION_VS_INFORMATION_AFFORDANCE_v0.1.md`
with a filled `## Relay metadata` block. Validate with
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.

## Paste block delivered to the chat tab

```text
[WERKLES VPGM — ACTION_VS_INFORMATION_AFFORDANCE v0.1]

Ender (Product / UX cousin, Claude). Your lane: UX, brand voice, design system — not SQL, billing, security, or deploy execution.

CUSTODY_TOKEN: CUSTODY-ENDER-A0734CC41CEE0D04480D9D1349129DDF

This is a real work request from the Werkles Foreman, not a role-sync ping. Everything
you need is in this message — do not ask for repo files.

SLICE UNDER REVIEW
Red-team one small, site-wide interaction cue that makes real buttons and links immediately distinguishable from rounded information-only bubbles without removing or visually demoting those bubbles.

CONTEXT
- Ben likes the rounded bubbles and wants them preserved.
- A human user currently tries clicking information bubbles to discover whether they navigate into Intake or elsewhere.
- The distinction must be obvious before hover or tap, but the site must not become louder or more decorated.
- Native semantics remain authoritative: actions are links or buttons; information bubbles are not focusable or clickable.

WHAT THE MEMBER ACTUALLY SEES (verbatim strings)
- Rounded action buttons and rounded information cards currently share similar silhouettes.
- Some static bubbles contain short labels and therefore look like navigation choices.
- The desired repair is small and nearly unnoticeable, not a component rewrite.

KNOWN GAPS (already admitted — do not spend your answer rediscovering these)
- The site has multiple historical button and card classes rather than one fully normalized component library.
- Color alone cannot carry the distinction.
- Hover-only evidence fails on touch devices.
- A global selector that guesses intent from rounded geometry could break unrelated controls.

--- YOUR ASSIGNMENT ---

V (vision): Make the action grammar immediately understandable to an ordinary person without sacrificing Werkles' rounded visual language.

P (pull): Evaluate first-glance human expectation, visual affordance, cognitive load, mobile/touch behavior, keyboard focus, reduced motion, and forced-colors behavior.

G (go) — work these, in this order:

1. Name the smallest reliable cue real actions should always receive and information bubbles should never receive.

2. Define the complementary information-bubble rule so a person understands it is explanatory without needing an 'information only' disclaimer on every card.

3. Attack color-only, shadow-everywhere, hover-only, decorative-arrow, pointer-cursor, animation, and overly loud solutions; return a better bounded pattern.

M (momentum): Give five concrete human/browser acceptance tests, including a first-glance test and a touch-device test.

OUT OF LANE: Do not implement code, create subagents/tasks/environments, or recommend push, deploy, provider calls, secrets, SQL, or spend.

--- HOW TO ANSWER ---

Reply as a markdown document Ben can save to foreman/handoffs/inbox/ as
FROM_ENDER_ACTION_VS_INFORMATION_AFFORDANCE_v0.1.md

OPEN your reply with this exact block, filled in. It is how the cockpit proves the
packet reached you rather than a composer, a wrong tab, or a stale thread:

RECEIVED
CUSTODY_TOKEN: CUSTODY-ENDER-A0734CC41CEE0D04480D9D1349129DDF
COUSIN: ENDER
PACKET: TO_ENDER_VPGM_ACTION_VS_INFORMATION_AFFORDANCE_v0.1_20260818-0300.md
LANE_CHECK: IN_LANE | OUT_OF_LANE — <one line>
BLOCKER: NONE | <exact>

End your reply with this exact block, filled in:

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "ENDER",
  "custody_token": "CUSTODY-ENDER-A0734CC41CEE0D04480D9D1349129DDF",
  "VERDICT": "<one line>",
  "CONFIDENCE": "HIGH | LOW",
  "UNKNOWNS": "none | <list> | outside my lane",
  "source_packet_id": "TO_ENDER_VPGM_ACTION_VS_INFORMATION_AFFORDANCE_v0.1_20260818-0300",
  "source_packet_file": "TO_ENDER_VPGM_ACTION_VS_INFORMATION_AFFORDANCE_v0.1_20260818-0300.md",
  "nextActionHash": "79e0feb64da7116d9571fbe2000fbd6689696a53c5a23fd51991b8438a3bbd8f",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a"
}
```

Do not recommend deploy, push, SQL apply, secret entry, or spending money. Those are
Operator gates. Say what you would do and stop.

```

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "ENDER",
  "generated_at": "2026-08-18T03:00:39.970Z",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a",
  "nextActionHash": "79e0feb64da7116d9571fbe2000fbd6689696a53c5a23fd51991b8438a3bbd8f",
  "source_files_included": [
    "foreman/NEXT_ACTION.md",
    "foreman/CURRENT_STATE.md"
  ],
  "REQUIRED_RESPONSE_FIELDS": [
    "schemaVersion",
    "cousin",
    "source_packet_id",
    "source_packet_file",
    "generated_at",
    "nextActionHash",
    "CONFIDENCE",
    "VERDICT",
    "UNKNOWNS"
  ],
  "custody_token": "CUSTODY-ENDER-A0734CC41CEE0D04480D9D1349129DDF",
  "packet_id": "TO_ENDER_VPGM_ACTION_VS_INFORMATION_AFFORDANCE_v0.1_20260818-0300",
  "source_packet_file": "TO_ENDER_VPGM_ACTION_VS_INFORMATION_AFFORDANCE_v0.1_20260818-0300.md",
  "network_command": "ACTION_VS_INFORMATION_AFFORDANCE",
  "network_command_version": "v0.1",
  "role_lane": "UX, brand voice, design system — not SQL, billing, security, or deploy execution.",
  "human_gate_required": true,
  "edge_tab_index": 3,
  "edge_url": "https://claude.ai/"
}
```

