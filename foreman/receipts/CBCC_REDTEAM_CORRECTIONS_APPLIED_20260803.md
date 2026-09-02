# CBCC red team corrections applied — Recommendation View

DATE: 2026-08-03
FOREMAN: LJ
EXECUTION CONTEXT: LOCAL_SALLY_WINDOWS
REPO: C:\Users\Ben Leak\github\Werkles (live tree)
SOURCE FINDINGS: `foreman/receipts/CBCC_REDTEAM_FINDINGS_ASSIMILATED_20260803.md`
CREW: Ender (Claude), Petra (ChatGPT), Skybro (Gemini)
STATUS: applied and self-tested — **NOT crew-reviewed. Second seat still owed.**

---

## FOREMAN ERROR, CORRECTED FIRST

I gave the crew a bad measurement and it shaped a blocking finding.

I reported the verdict body copy as **12.2px bold**. It is **16px/400**. My selector
was `.recview__verdict p` (descendant), which matched the first `p` in the section —
the small-caps `RECOMMENDATION` kicker inside `.card-heading`, which is *correctly*
12.2px and bold. Re-measured with `.recview__verdict > p`.

Consequence: Ender's "hierarchy is inverted — the answer is the smallest text on the
page" finding was **false**, and he reasoned correctly from my false number. His
other two blocks (Ava contradiction, `Watch` legend collision) came from reading
copy I quoted verbatim and stand entirely on their own.

Real type defects that survive re-measurement:

| Element | Was | Now |
|---|---|---|
| Band chip | 11.2px | 13px |
| Reason / alternative body | 14.4–14.7px | 15px |
| Disabled-action explanation | 13.1px | 16px |
| `.workshop-list__detail` in recview | 14.4px | 15px |
| `.recview__meta dt` | 11.8px | 13px |
| Body line-height | `normal` (~1.2) | 1.5 |
| Measure | uncapped | 72ch |

**Standing rule adopted:** no font size on this surface may be expressed as an
ad-hoc value. All sizes come from tokens on `.recview`, and `--recview-floor: 13px`
is the floor. Verified in the browser: zero text nodes below 13px, zero bold body
paragraphs, zero body copy under 1.45 leading.

---

## CORRECTIONS APPLIED

### Blocking (Ender)

1. **Type tokens + floor** — `--recview-verdict/body/secondary/note/label/floor`,
   leading and measure. Sizes bound to tokens, including two rules that were
   overriding them with hardcoded rem values and one shared class scoped locally.
2. **The Ava contradiction** — the page argued its strongest evidence for a named
   individual, showed no door, then argued against that individual's whole lane,
   then offered a dead button. Reasons are now built *after* the door decision and
   de-name individuals when no door is shown ("One member in the pool"). This also
   avoids presenting a named unverified member, which is a trust call routed to Bean
   and **not yet ruled** — so the conservative variant ships. Ender's named-door
   variant remains available if Bean approves naming.
3. **Band legend split** — fit strength and risk were one ladder, so `Watch` meant
   "barely a fit" on a person and "counts against you" on a reason. Now
   `Strong/Medium/Slim evidence` on one axis and `Counts against` on the other,
   with different chip shapes (rounded pill vs square dashed flag), not just
   different words. `Thin` and `Watch` retired.

### Copy and coherence

4. Verdict ladder rewritten to plain words; states no longer double as
   member-facing sentences. Verdicts lead `Next move:`.
5. **The squeeze is named.** The interpretation printed detector labels joined by
   "or". It now quotes the member's own tension clause ("without dropping the road
   jobs that pay the bills") in both the verdict body and the interpretation.
6. Fabricated statistic removed — "the rarest useful match in this pool" was a
   frequency claim about pool composition, computed by nobody, about a synthetic
   pool. Standing rule: no superlative, frequency, or count in a "why it matters"
   line unless derived from data on the page.
7. Doors heading bound to the branch (`Why no door yet` vs `The door this points
   at`), so a heading never promises what the body cannot pay.
8. Three-tier confidence retired. `HIGH` was unreachable by construction, so a
   third of the legend was decoration. The explaining sentence stays, the label
   goes, and the duplicate instance in the header is gone.
9. Empty `Arena` row suppressed instead of rendering `Unnamed`.
10. Internal vocabulary removed from member-facing copy ("Sharpen the Workshop",
    "Strengthen the Foundry record", "Proof posture").
11. Section order: verdict → interpretation → receipt. **Ender flagged this as the
    weakest call in his review and asked for it to be tested rather than trusted.**
12. Enabled forward action added ("Put your numbers in"). Every path previously
    dead-ended: the knock was disabled and the only real next step appeared twice,
    both times as something Werkles would not do for you.

### Defects I introduced while fixing, then caught

13. The primary action rendered **three times** after the enabled-action fix.
    Secondary actions were deduped by `kind` while two kinds shared one `href`.
    Now deduped by destination, and the Next block no longer repeats the primary.
14. Removing the header's duplicate confidence line left the title card holding an
    inherited 310px `min-height` with 133px of content — ~180px of empty paper
    pushing the answer toward the fold. Card now sizes to content: 310px → 149px,
    verdict top 239px.

---

## TEST HARNESS DEFECT (found while verifying)

`ghost-fleet-handeye-attack.mjs` accepted only positional args. Invoked as
`--base <url> --count 24` it parsed `--base` as the URL and `NaN` as the limit,
sliced the fleet to zero members, and printed **`pass: 0, fail: 0` with exit code
0**. A suite that tested nothing reported that nothing was wrong.

Fixed: both arg forms accepted, and a zero-case run now exits 2 with `FATAL`.

New assertions added, each encoding a defect a human caught by reading that the
old suite passed clean — it checked that fields were populated, not that populated
fields agreed with each other:

- reasons may not name a member while no door is shown
- no unearned superlative/frequency claim in a reason
- doors heading may not promise doors and deliver none
- at least one enabled action must exist in every state
- retired confidence label may not reappear
- nulls may not render as words
- verdict must precede the receipt in source order
- internal vocabulary may not reach a member

---

## PROOF

- `npx tsc --noEmit` — clean
- `next build` — compiled successfully, 83/83 pages
- `ghost-fleet-handeye-attack.mjs` × 150 ghosts — **150 pass / 0 fail**, against
  the shipped production build, with the new coherence assertions live
- Browser type audit on the live page — **0 offenders** below the 13px floor,
  no bold body copy, no tight body leading
- Receipt: `foreman/receipts/WERKLES_GHOST_FLEET_HANDEYE_REDTEAM_2026-08-03T19-40-53-749Z.json`

---

## STILL OWED — this is not signed off

Lane law is that corrections are red-teamed before they land. These are self-tested
only, and my own mismeasurement this cycle is the argument for why that is not
enough.

1. **Second seat review.** Ender recused himself from reviewing copy he wrote, so
   the corrected surface needs a different seat.
2. **Bean's trust rulings — 4 open**, one of which gates whether a named unverified
   member may be shown at all. Blocked at sign-in (Operator gate).
3. **Computer** still owed the packet. Blocked at sign-in (Operator gate).
4. **Two-tree resolution** — Petra and Skybro independently ruled this an Operator
   gate. This work landed in the live tree; the Cursor workspace still points at
   the retired clone.
5. **Ender's section-order swap** is explicitly untested by his own request.
6. Tier 1 flag: `BUDGET.md` still has no CBCC dispatch lane. Spend $0. Not blocking.

Walkthrough verdict stands at **NO-GO as reviewed work** until item 1 clears.
