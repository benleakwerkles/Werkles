# Homepage story protagonist recast — beat 1 — 2026-07-25

Seat: Lady Jessica (Cursor, Betsy local hands)  
Operator report: "The lady thinking about starting a business on the home page are obviously two different people."

## Finding

The homepage "Maria" visual story (`components/foundry/visual-story-section.tsx`, assets in `public/assets/draft/anyone-narrative-v2/`) promises one protagonist across five beats (`lib/anyone-narrative-v2-imagery.ts`: "Same woman throughout"). **Beat 1** (`werkles-story-v2-beat01-wrong-need.png`) showed a visibly older woman — deep age lines, gaunter and more angular face — while beats 2–5 and the hero render show a consistent younger woman. Beat 1 is also wired as the hero fallback, so the mismatched face led the story.

## Fix (local only)

- Generated a replacement beat 1 with the same scene (home kitchen, green apron, flour-dusted hands, crossed-out notebook lists, frustrated read) using the hero and beat 2 renders as face references.
- Center-cropped from 1536x1024 to 1536x864 (16:9, matching the 960x540 render slot).
- Swapped into `public/assets/draft/anyone-narrative-v2/werkles-story-v2-beat01-wrong-need.png`; original preserved as `...-OLD-MISMATCHED-PROTAGONIST.png` in the same folder.
- Cleared `.next/cache/images` (stale optimizer cache) and verified in-browser on `127.0.0.1:3000/#story`: beat 1 now matches beats 2–5.

## Beat 2 recast (Operator follow-up, same session)

Operator confirmed the beat 1 fix and asked for a new picture for the next beat. Replaced `werkles-story-v2-beat02-squibb-moment.png` (old: her holding a paper list — visually repetitive with the new beat 1 notebook shot) with a distinct "Squibb moment" composition. First attempt had the laptop screen facing the camera instead of her (Operator caught it: "her laptop is backwords"); final version is an over-the-shoulder shot with the screen correctly facing her, an unbranded chat window showing the beat's exact line — "What would have to be true before customers matter?" — and no third-party product branding. Cropped 1536x1024 to 1536x864, original preserved as `...-OLD.png`, optimizer cache cleared, verified in-browser: beats 1–5 read as one person, no repeated composition, laptop geometry correct.

## Beat 3 recast (Operator follow-up, same session)

Operator flagged beat 3 as "a noticeably different person again." Replaced `werkles-story-v2-beat03-money-reveal.png` with a matching-protagonist render of the same scene — credit-union desk, gray-haired loan officer holding the LOAN document, her hands folded, faint flour on her forearms (came straight from baking). Original preserved as `...-OLD.png`, cropped to 1536x864, optimizer cache cleared, verified in-browser alongside beats 4–5.

## Beats 4–5 recast + hero wallpaper fix (Operator follow-up, same session)

- Beat 4 (`equipment-reveal`) and beat 5 (`shop-open`) recast with the same protagonist references; beat 4's price tag reads "USED $4,200" matching the copy. Originals preserved as `...-OLD.png`.
- **Hero wallpaper ("lander") bug found and fixed.** `--werkles-story-v2-hero` holds two url() layers (render + stock fallback), but `.hero--story-v2` used shorthand `var(...) center / cover`, which sized only the last layer — the hero render tiled at natural size, repeating Maria vertically behind the headline. Rewrote the rule in `app/globals.css` as longhand (`background-image`/`position`/`size`/`repeat`) so every layer gets center/cover/no-repeat.
- Replaced `werkles-story-v2-hero-wide.png` with a wallpaper-composed render: Maria in profile kneading dough on the right third, muted low-contrast warm atmosphere on the left for headline legibility. Original preserved as `...-OLD.png`. Verified in-browser: no tiling, single cover image, copy readable.
- `app/globals.css` is not in the frozen Heimerdinker slice manifests; hash freeze remains valid.

## Boundary notes

- **Prod still shows the old mismatched image** — werkles.com serves deployed tip `674f3db`. The recast ships with the next approved production deploy (human gate).
- Image assets are not in the frozen Heimerdinker slice hash manifests; the push freeze remains valid.
