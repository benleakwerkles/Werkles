# FROM BEAN — Werkle formation legibility red team

RECEIVED
CUSTODY_TOKEN: CUSTODY-BEAN-05A7F1FBD894DDAB93762D98DD93D0EE
COUSIN: BEAN
PACKET: TO_BEAN_VPGM_WERKLE_FORMATION_LEGIBILITY_REDTEAM_20260822_v0.1_20260822-0419.md
LANE_CHECK: IN_LANE — trust/compliance/hardening audit
BLOCKER: NONE — P0 findings block the visual patch

## Verdict

**PATCH.** The first visual patch addressed font size but failed on trust hierarchy. Provenance and mutual-decision signals must be continuously visible and prominent.

## P0 findings

1. **Provenance signals are visually subordinate.** “Self-reported, not verified” and the joint revision are smaller and lower contrast than the statements they qualify. Put source, verification state, and revision directly with the material at readable size and contrast—not as footnotes.
2. **Mutual-decision state disappears during the long scroll.** Keep a persistent, short reminder that only exact wording accepted by both people enters the shared Werkle.
3. **The qualitative readout is buried.** The page must make clear that the states report decisions; they do not calculate compatibility.

## P1 findings

1. Warm paper cards inside purple containers create competing contrast systems and can look more final than the provisional content actually is. Make the draft state unmistakable without watermark noise.
2. Repeated provenance sentences become visual noise. Preserve the essential state continuously, but shorten and structure it instead of repeating long disclaimer prose.
3. Twelve mobile decision cards form an exhausting wall. Add stronger section hierarchy and progressive disclosure where it does not hide consent or provenance.

## Signals that must remain visible

- `Self-reported · Not verified` directly with each source statement.
- The current joint-wording revision beside the editable proposal.
- The rule that only exact wording accepted by both people enters the shared Werkle.
- The local practice-draft custody boundary.
- The current state of each topic.

## Plain-language card hierarchy

1. What is this topic?
2. Who said what, and is it verified?
3. What has each person decided?
4. Is anything mutual yet?
5. What can the current member do now?
6. Where is this draft saved?

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "BEAN",
  "custody_token": "CUSTODY-BEAN-05A7F1FBD894DDAB93762D98DD93D0EE",
  "generated_at": "2026-08-22T04:22:00.000Z",
  "platform": "DeepSeek",
  "role": "Hostile trust and compliance audit",
  "requested_action": "Red-team the rendered Werkle formation room for human legibility without hiding provenance or consent.",
  "target_files": [],
  "lane": "Trust, compliance, hardening audits — not deploy execution.",
  "VERDICT": "PATCH (P0 trust-signal fixes required before GO)",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "none; all assumptions based on described candidate",
  "source_packet_id": "TO_BEAN_VPGM_WERKLE_FORMATION_LEGIBILITY_REDTEAM_20260822_v0.1_20260822-0419",
  "source_packet_file": "TO_BEAN_VPGM_WERKLE_FORMATION_LEGIBILITY_REDTEAM_20260822_v0.1_20260822-0419.md",
  "nextActionHash": "ddf58113ef50c4a72a8a602058677ed57032dd1ffcd4fa1f22db53e68a6474fe",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a"
  ,"DO_NOT": "No implementation, provider work, schema, push, deploy, secrets, or spend."
}
```
