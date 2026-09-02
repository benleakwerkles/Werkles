# RECEIPT — CBCC owner-bound intake local proof

Date: 2026-08-02  
Foreman: Lady Jessica (Maker) · Machine: Betsy · Context: `LOCAL_SALLY_WINDOWS`  
Branch: `maker/site-g-20260703`  
Crew: **CBCC** (Care Bot Cousin Crew)

## LOCAL HANDS READBACK (session)

- Machine: Betsy
- Repo: `C:\Users\Ben Leak\github\Werkles`
- Branch: `maker/site-g-20260703`
- Server: `npm run start` → `http://127.0.0.1:3000`

## Proof

| Check | Result |
|-------|--------|
| POST `/api/bellows/intake` | 200, top path `verify_proof` |
| Cookie `werkles_bellows_owner` set | true |
| `ownerId` on stored intake | `bellows_owner_…` |
| Recommendations with cookie shows Norfolk/CBCC need | true |
| Bakery demo after bound submit | false |
| Unbound recommendations → empty session copy | true |
| `VERCEL_ENV=production` personal path | still hard-closed in code |

## CBCC packets

- `TO_ENDER_CBCC_OWNER_BOUND_INTAKE_REDTEAM_20260802.md`
- `TO_BEAN_CBCC_OWNER_BOUND_INTAKE_TRUST_20260802.md`
- `TO_HEIMERDINKER_CBCC_OWNER_BOUND_INTAKE_PUSH_PREP_20260802.md`
- Hashes: `TO_HEIMERDINKER_CBCC_OWNER_BOUND_INTAKE_FILE_HASHES_20260802.sha256`

## Canon

- `foreman/AI_COUSINS_PROTOCOL.md` v0.4 — CBCC named
- Approval log rows for CBCC + build authorization

## Not done (human gates)

- Open intake on werkles.com
- Production personal matching delivery
- Push/Preview (waiting Ender + Bean)
