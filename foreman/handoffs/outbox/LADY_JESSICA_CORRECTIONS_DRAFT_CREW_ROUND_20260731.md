# CORRECTIONS DRAFT — Full Crew Round (Demo, Locke, Ender, Bean), 2026-07-31

**Status: CORRECTION-SIDE RED TEAM COMPLETE (Locke, 2026-07-31 ~2:45 PM).
Amended P0 slice LANDED locally per his verdicts; P1 judgment items await
Ben's walkthrough.**

## Locke's amendments (all adopted)

- P0-2 SPLIT: `/proof/den` + `/proof/goop-cycle` 404 via middleware (exact
  paths, `/proof` stays public); `/dashboard/billing` + `/dashboard/crucible`
  get the client-side auth guard pattern from member-dashboard-client —
  middleware can't see localStorage sessions, so a blanket 404 or middleware
  redirect would have locked out real members. Cookie-session (@supabase/ssr)
  migration logged as its own future item, not smuggled into this slice.
- MATCHING_STORAGE_MODE clearance REVOKED as "proven": log row ≠ runtime
  truth, and the code silently fell back to ephemeral file writes. Root fix
  landed: on Vercel the fallback is now `supabase`, never silent `file`.
- Record-path leak fixed at the API boundary (response no longer returns
  `record_path`, `shadow_run_id`, or smoke telemetry), not just the UI.
- Signup whitespace-password block argued UP from P1 to P0 — landed.
- Per-route titles: mystery solved (client pages can't export metadata;
  Bean measured the stale deploy). Landed as `layout.tsx` metadata for
  /membership, /login, /signup, /onboarding, /dashboard.
- P0-4 (duplicate headline) demoted to ride with the P1 homepage
  bottom-third collapse — editorial pick of which instance dies.
- Locke's "missing" items 1/4/6 (cancel claim, check icons, PLAID copy)
  were already fixed and deployed in `fd23e01` before his pass — stale
  context from his morning read. Items 2/3/5 adopted: background-check
  contradiction (P2, with legal review), stale privacy verification
  paragraph (P2, flag the factually-wrong paragraph specifically),
  Quick Weld leftovers (landed).
- test-case-0 rename: add a redirect from the old slug when it lands (P1).

## Landed in the local tree this round (awaiting build + deploy)

Discovery form crash + try/catch + reference-number-only success; discovery
API response slimmed; /proof/den + /proof/goop-cycle 404; auth guards on
billing + crucible; "Test-mode billing is wired" scrubbed; tier2 attribution
render deleted (component + prop); narrative-arc attribution render deleted;
Bellows figcaptions rewritten for visitors; membership orphan icon rail
removed + featured card wears violet primary; login test-account strings
reworded; signup trim + whitespace-password block + brand-mark way home;
storage-mode Vercel fallback hardened; five route layouts with titles;
onboarding Quick Weld leftovers renamed.
Author: Lady Jessica, foreman.
Sources: Demo (stranger eyes), Locke (claims/legal audit), Ender (design
director, `FROM_ENDER_DESIGN_DIRECTOR_REVIEW_20260731.md`), Bean (attack
pass, 20 findings).

## Cleared — no action

- Discovery intake storage: `MATCHING_STORAGE_MODE=supabase` confirmed set
  on Production 2026-07-13 (approval log row). Bean's /tmp data-loss
  scenario does not apply.
- Maria hero scrim: lightened scrim is live in deployed CSS (Bean verified
  fingerprint). Remaining fog = browser cache.
- Links/images: all 15 internal links and all 36 referenced images return
  200. No dead icon-family path is served in any public HTML.

## P0 — mechanical defects (immediate-fix exception candidates)

1. **Discovery form crashes on successful submit** — `event.currentTarget`
   used after two awaits (`app/discovery/discovery-intake-form.tsx:56`);
   React nulls it, so the thank-you state never renders. Fix: capture form
   element before awaiting (pattern already correct in
   `app/beta-signup-form.tsx:12`); add try/catch so network failure doesn't
   freeze the button at "Saving". (Bean #14)
2. **Anonymous access to internal surfaces** — `/dashboard/billing` (shows
   "Test-mode billing is wired"), `/dashboard`, `/dashboard/crucible`,
   `/proof/den`, `/proof/goop-cycle` all serve 200 to strangers while
   `/operator/*` and `/tinkerden/*` correctly 404. Gate the missed routes
   the same way. (Bean #5, #6)
3. **Tier-2 attribution string still in HEAD** — "Tier-2 preview — Act III
   Forge + hybrid prop icons. Draft only…" (`lib/tier2-page-imagery.ts:13`)
   renders on 4+ pages and mis-names the dead hybrid family. Remove at
   source (CSS hides it, DOM still carries it). Same for "Four-act
   narrative wire — draft Ghost Forge previews" (`lib/narrative-arc.ts:131`)
   and the unclassed Bellows figcaptions ("draft exploration, not canonical
   cutout", `app/bellows/page.tsx:54`). (Bean #7–9, Ender)
4. **Homepage duplicate headline** — "Safe to act, not alone." + its body
   copy appear twice verbatim (proof band vs Formation ops-card). Dedupe.
   (Ender)
5. **Membership: orphaned second icon-rail block under hero; featured plan
   card wears the secondary teal button while the non-featured card wears
   primary violet.** Swap the buttons, drop the orphan rail. (Ender)
6. **Signup has no site header / brand mark / way home.** Add SiteHeader or
   minimally the brand mark linking to /. (Ender)
7. **Login publicly says "Use the test account"** on `?logged_out=1` /
   `?auth_error` (`app/login/page.tsx:41,46`). Reword for real users.
   (Bean #10)
8. **Discovery success state prints internal record path**
   (`data/discovery/records/WZ-….md`) into public DOM. Replace with a
   reference number only. (Bean #18)

## P1 — judgment items (Ender verdicts attached; need Ben's direction only
where marked)

- **Jargon definitions** — DO, once-at-first-use appositive then confident
  use: "Foundry Dues — the $9.99/month membership —"; Crucible heading →
  "Crucible — our verification desk"; first Bellows body use → "Bellows,
  the free learning floor." Promote Spark's "Three rooms, plain names"
  strip (it IS the decoder) with lane icons and card weight.
- **"ID, face, phone" reframe** — DO DIFFERENTLY per Ender: not euphemism,
  specificity: "verify your ID and phone — a photo match to your ID comes
  only when you ask to be vouched for." Apply wherever verification steps
  are enumerated.
- **Honest-answers treatment** — keep placement/calm; raise card surface to
  elevated paper, Fraunces h3s one step up, optional copper numerals.
- **Act-language translation** — "Act I–IV", "spark/space/forge/foundry"
  rail codenames, "Continue → Act II" all leak internal storyboard to
  strangers (Bean #13, Ender). Translate to visitor language site-wide.
- **Squibb** — (i) unify to the flat-illustrated owl everywhere (homepage
  brass render retires) — **[BEN CALL: retiring the brass Squibb render]**;
  (ii) give him a one-line intro on first mention per page (bellows,
  membership), not just homepage. (Ender + Bean #12, Demo)
- **Pricing** — move tier2 photo band below the plan grid (prices first);
  unify plan-card grammar with membership (h2 = plan name or h2 = price,
  pick one). (Ender)
- **Homepage bottom third** — collapse: merge operations grid into one dues
  CTA band, end the page once. (Ender)
- **test-case-0** — public intake page links "See a complete example" to a
  URL/title reading "Concierge User #0". Rename to a real sample name and
  clean URL. (Bean #11)
- **Signup input hygiene** — trim email/password, block whitespace-only
  passwords; discovery assets checkboxes need a required indicator so the
  bounce isn't post-submit. (Bean #16, #17)
- **Per-route titles** — Bean saw one generic title on all routes despite
  metadata exports landing in polish v2; suspect "use client" pages ignore
  metadata exports. Investigate + fix pattern. (Bean #20)

## P2 — operator decisions (true Ben items)

- **Legal pages**: remove "draft pending Operator review" and link
  /privacy + /terms from footer and signup — **but Ben must read and
  approve the legal text first** (currently unreviewed drafts collecting
  credential traffic; Bean #3–4, Locke earlier).
- **Stale Desktop clone** (`C:\Users\Ben Leak\Desktop\github\Werkles`):
  git-broken, pre-icon-sweep, no brand assets folder — the best explanation
  for "I reload and nothing changed." Recommend archive/delete and point
  all tools at `C:\Users\Ben Leak\github\Werkles`. Deletion is Ben's call.
  (Bean #1)
- **Dirty working tree** in the real repo (~675 entries): foreman to triage
  into labeled commits or discard, in slices, so production and git stop
  diverging. (Bean #2)
- **Dead asset families still deployed** (`icons-v2`, `icons-nav-
  transparent-v1`, v0.1 icons; unused heavy cream-wash CSS at
  `globals.css:3511`): prune from `public/` and delete the path-builder
  code so they can't resurface. (Bean #19)

— Lady Jessica, foreman
