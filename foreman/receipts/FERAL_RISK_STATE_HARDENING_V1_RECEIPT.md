# FERAL_RISK_STATE_HARDENING_V1_RECEIPT

STATUS: ARTIFACT.

PACKET RECEIVED:
VG_FOOD_PACKET -- FERAL_RISK_STATE_HARDENING_V1.

LOCAL INTERPRETATION:
Patch the corrected v1.1 Risk-state screen spec so Design Desk is not handed live-path, typo-poison, casual Force Live, or v1 scope-creep language.

ARTIFACT CREATED:
- `foreman/design/FERAL_RISK_STATE_HARDENING_SPEC_v1_1.md`

CHANGED SECTIONS:
- Corrected the Risk-state label to `OPERATOR INTENT / STAGED PATH`.
- Corrected typo poison to `Organism-defined constraint` and limited it to non-bypass usage.
- Tightened Force Live drawer requirements: reason code, affected objects, operator confirmation, rollback status, Drift Log receipt emission, and Graveyard receipt when deletion/archive is involved.
- Replaced v1 native-UI deprecation scope with V1/V2/V3 staged adoption language.
- Preserved the rule that risky/destructive actions do not execute live while Shadow is evaluating.

UNRESOLVED RISKS:
- Thufir validation is still needed for Lexical Governor semantics.
- Bean attack is still needed for Force Live bypass, fake-safe Shadow path, stale simulation, bad replay into TinkerDen, and spoofed provenance.
- Ender cleanup is still needed to confirm poisoned language and vocabulary collisions are fully removed.
- Swanson confirmation is still needed for smallest prototype surface.
- Design Desk remains held.

DESIGN-DESK READINESS:
- NO.

NEXT OWNER:
- Thufir@Doss.

CHILD PACKETS NEEDED:
- Yes, validation/attack/cleanup/prototype confirmation are needed before Design Desk.
- Maker created the child packets directly:
  - `foreman/handoffs/outbox/TO_THUFIR_FERAL_RISK_STATE_LEXICAL_GOVERNOR_VALIDATION_20260626.md`
  - `foreman/handoffs/outbox/TO_BEAN_FERAL_RISK_STATE_FORCE_LIVE_ATTACK_20260626.md`
  - `foreman/handoffs/outbox/TO_ENDER_FERAL_RISK_STATE_LANGUAGE_CLEANUP_20260626.md`
  - `foreman/handoffs/outbox/TO_SWANSON_FERAL_RISK_STATE_SMALLEST_PROTOTYPE_20260626.md`

BEN ACTION:
- None.

