# Werkles.com Project Lock

Status: **ACTIVE — SEVERED FROM HARVEY LANE**
Issued: 2026-07-04
Operator decree: **Lady Jessica** + **Direwolf Dink**@Betsy work **Werkles.com only**. Harvey/Nerdkle early work runs on other machines with other Aeyes. No merge between lanes until Ben explicitly opens a merge gate.

---

## Crew assignment

| Role | Machine | Scope |
|------|---------|-------|
| **Lady Jessica (Maker@Betsy)** | Betsy | Werkles.com product surface only |
| **Direwolf Dink@Betsy** | Betsy (`DESKTOP-KTBH0LA`) | Mechanical Werkles.com work only |
| **Other Aeyes** | DOSS, relay surfaces, non-Betsy hosts | Harvey / Nerdkle nursery only — not Werkles.com pages |

Direwolf Dink must **not** take Harvey architecture packets, ThinkIt relay stewardship, or Nerdkle organism build tasks while this lock is active.

Maker must **not** edit Harvey nursery specs, ThinkIt momentum surfaces, or relay merge code while this lock is active.

---

## Git lane

| Field | Value |
|-------|-------|
| Active branch | `maker/site-g-20260703` |
| Git root | `C:\Users\Ben Leak\github\Werkles` |
| Remote | `https://github.com/benleakwerkles/Werkles.git` |
| Merge target | **none** — do not merge to `main`, do not pull Harvey commits from `main` without Ben gate |
| Harvey branch (other crew) | `feature/harvey-nursery-v0` on non-Betsy machines — see `foreman/messages/HARVEY_NERDKLE_EARLY_WORK_AEYES_PACKET_20260704.md` |

---

## In-scope paths (Werkles.com)

Public and member product surfaces for **werkles.com**:

| Area | Paths |
|------|-------|
| Marketing / home | `app/page.tsx`, `app/proof/`, `app/pricing/`, `app/bellows/` |
| Auth / onboarding | `app/login/`, `app/signup/`, `app/auth/`, `app/onboarding/` |
| Member app | `app/dashboard/**`, `app/membership/` |
| Site UI | `components/**` (site-facing only), `app/globals.css`, `lib/copy.ts`, `lib/design-tokens.ts` |
| Public assets | `public/assets/**` |
| Site planning | `foreman/SITE_MAP.md`, `foreman/MASCOT_RULES.md`, homepage/discovery packets |
| Site receipts | `foreman/receipts/WERKLES_*` when site-related |

Local preview: `npm run dev` on Betsy (default port 3000).

---

## Out-of-scope (Harvey lane — hands off)

Do not edit on the Werkles.com lane:

| Area | Paths / systems |
|------|-----------------|
| Harvey architecture | `foreman/nerdkle/HARVEY_*`, `foreman/nerdkle/NURSERY_*`, `foreman/messages/*HARVEY*` |
| Nerdkle organism UI/API | `app/nerdkle/`, `app/api/nerdkle/` |
| Organism state | `data/organism/nerdkle/` |
| ThinkIt / relay command surfaces | `app/api/thinkit/**`, `components/tinkerden/swanson-relay-control.tsx`, SoleDash API tree |
| Relay handoff execution | `foreman/messages/DINK_BETSY_RELAY_PROJECT_HANDOFF_PACKET_20260703.md` tasks |
| Speaker / mesh metabolism | Harvey status mirrors beyond what a public page needs |

If site work accidentally touches these files, stop and return `LANE_VIOLATION` readback.

---

## Human gates (unchanged)

No production deploy, no push to `main`, no Stripe live, no SQL, no secrets, no Ghost Forge spend without explicit Ben gate.

Branch push to `maker/site-g-20260703` (or successor `werkles-com/*` branch) requires Ben naming the target.

---

## Success condition

Ben can preview **werkles.com-shaped pages** on localhost and trust that Harvey/Nerdkle architecture churn is not landing in the same branch or the same machine session.
