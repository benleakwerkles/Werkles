# CBCC — Full Ghost Fleet Walkthrough Mission

Status: **ACTIVE**  
Foreman: Lady Jessica (Maker) · Machine: Betsy · `LOCAL_SALLY_WINDOWS`  
Date: 2026-08-02  
Crew: **CBCC** (Care Bot Cousin Crew)

## Goal

Ben walks Intake → Workshop → Intros → Proof → Dues against a **150 synthetic ghost member** fleet with Aeye faces, after Handeyes attack each surface. Production stays closed until Operator phrases.

## Sequencing (locked)

One shared Ghost Fleet substrate. Attack order:

1. Intake + personal matching  
2. Workshop  
3. Intros  
4. Proof / Crucible (sandbox)  
5. Dues (dry-run until HG-4/HG-5)

## Substrate

- Schema/loader: `lib/ghost-fleet/`  
- Data: `data/ghost-fleet/members.json` (synthetic labeled)  
- Handeye runner: `scripts/foreman/ghost-fleet-handeye-attack.mjs`  
- Faces: placeholder paths until `APPROVE GHOST FLEET FACE BATCH 150`

## Activation

`foreman/handoffs/outbox/TO_OPERATOR_CBCC_GHOST_FLEET_ACTIVATION_LADDER_20260802.md`

## CBCC packets

- Ender: `TO_ENDER_CBCC_GHOST_FLEET_UX_20260802.md`  
- Bean: `TO_BEAN_CBCC_GHOST_FLEET_DISCLOSURE_20260802.md`  
- Heimerdinker: `TO_HEIMERDINKER_CBCC_GHOST_FLEET_PUSH_PREP_20260802.md`  
- Image Sniper: `TO_IMAGE_SNIPER_CBCC_GHOST_FLEET_FACES_150_20260802.md` (draft — no spend)

## Non-goals until phrased

Production personal delivery · open intake on werkles.com · live Stripe · unpaid face batch · SQL
