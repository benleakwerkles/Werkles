# Mascot Rules — Canonical Squibb

Status: **APPROVED** by Ben (2026-05-28)

## One canonical character

**Squibb** is the single workshop owl for Werkles product UI and education voice.

| Rule | Detail |
|---|---|
| **Name on product** | Squibb |
| **Role** | Crucible foreman — inspects, explains, does not vouch |
| **Look** | Brass owl in workshop suit, goggles, tool-belt (cutout from approved source) |
| **Not Squibb** | Legacy perched-on-plaque helper avatar — brand mark only (`public/assets/brand/` if staged) |
| **Not two owls** | Do not ship separate “Brass” and “Squibb” characters on site surfaces |

Internal filenames may remain `brass-foreman-*.png` until a rename pass; UI copy and alt text use **Squibb**.

## Asset files (manual Ben cutout — not Ghost Forge)

| File | Display | Routes |
|---|---|---|
| `public/assets/mascot/brass-foreman-full.png` | 200–280px | `/membership/success`, hero aside accents |
| `public/assets/mascot/brass-foreman-bust.png` | 64–96px | `/dashboard/crucible`, empty states |
| `brass-foreman-thinking.png` | TBD | future — optional W03 |

Workflow: `public/assets/mascot/README.md` → cutout → drop PNGs → tell Foreman **`ASSETS_LANDED`**.

## Bellows (public learning surface)

Squibb hosts **Bellows** at `/bellows` — the Werkles learning area for anti-guru lessons, SOPs, templates, and honest operator knowledge. Same character as Crucible: helpful, reality-checking, never snide, never selling trust.

Internal draft worker: **Education Forge** (`education-forge/`) — not Bellows, not a public route.

## Ghost Forge

Do **not** generate cartoon mascot via Ghost Forge. Squibb is manual cutout only.

## UI until PNGs land

`WorkshopGreeter` W-mark is a temporary greeter, not Squibb. Replace with Squibb bust when cutout lands.
