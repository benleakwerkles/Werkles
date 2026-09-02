# Document-score visibility fix — Operator test feedback

Date: 2026-07-17  
Seat: LadyJessica@Betsy  
Trigger: Operator reported scoring did not show up after Tier A test

## Root causes

1. **Wrong place to look:** Scores never appear on public `/bellows/recommendations` (example-only by design). They only render on `/operator/matching/document-score` after a successful POST.
2. **Silent empty UI:** If Matching returned a session with `ranked.length === 0`, `SquibbRecommendationSurface` returned `null` — so a “successful” score looked like nothing happened.
3. **Wedged localhost:** Earlier `:3001` hung; POST could time out with little visible feedback.

## Fix (local)

- API now returns a **scoreboard** (kind / rules score / band / eligible|ruled out)
- Client shows a **Scoreboard** panel, scrolls it into view, and only mounts cards when eligible paths exist
- Copy states results stay on this page only
- Dev server restarted healthy on **:3000**; POST proof returned 200 with 6 scored paths

## Retest

Open: http://127.0.0.1:3000/operator/matching/document-score  
Click **Score against Autonomous Matching** → page should jump to **Rules scores from this paste**.

`COMPLETED — SCOREBOARD VISIBILITY FIXED; LOCAL :3000 PROVED`
