# ART DIRECTOR'S HANDOFF — Midjourney icon + photography packet

- Date: 2026-07-31
- From: Lady Jessica, Werkles.com foreman
- To: Ben (Operator), for Midjourney runs
- Mission: icons that POP like a billion-dollar site, and photography that
  kills the "it looks sooo CGI" first impression.

---

## PART 0 — The style DNA (paste this into every prompt)

Werkles V0i identity, for reference in all prompts:

- Violet: `#4520C9` (bright) and `#2A0E8C` (deep)
- Teal: `#02917E`
- Warm cream paper: `#FDF8EE`
- Feel: a real workshop run by serious people — Macmillan polish, one Wonka
  surprise. Not corporate SaaS, not craft-fair rustic.

**Universal style tail** (append to every icon prompt):

```
flat vector icon, deep violet #2A0E8C and teal #02917E with cream #FDF8EE counters, single consistent 3px line weight, subtle metallic ink sheen, on solid cream background, centered, generous negative space, premium fintech quality like Stripe or Linear iconography --v 7 --style raw --ar 1:1 --no photo, 3d render, gradient mesh, drop shadow, text, watermark
```

**Consistency trick:** run ONE icon until you love it, then feed that image
to every other icon prompt with `--sref <image URL>` so the whole family
inherits its exact style. That is how the set stops looking like ten
different passes.

**Transparency:** Midjourney can't output true transparency. Generate on
solid cream — my flood-fill script (`scripts/one-off/make-step-icons-transparent.mjs`)
strips it in one pass once you hand the files over.

---

## PART 1 — Three art directions to A/B

Run direction A first; it's my bet for POP without drift.

### Direction A — "Inked metal" (premium flat, my recommendation)
Flat vector but with one dimensional cheat: a metallic ink sheen on the
violet, like a debossed foil business card. Use the universal tail as-is.

### Direction B — "Foundry brass" (dimensional, controlled)
Replace the style tail with:

```
small cast-brass workshop token, deep violet enamel inlay and teal patina accents, photographed straight-on on warm cream paper, soft single-source studio light, crisp edge shadows only, premium hardware feel like a Leica dial or a letterpress die --v 7 --style raw --ar 1:1 --no cartoon, plastic, CGI gloss, text
```

Risk: reads "object" not "icon" at 24px. Test at nav size before falling in
love.

### Direction C — "Engraved plate" (the Wonka surprise)
```
engraving-style icon, fine crosshatched line art in deep violet ink on cream paper, single teal accent element, vintage patent-drawing precision with modern minimal composition, like a currency engraving redrawn by a brand studio --v 7 --style raw --ar 1:1 --no photo, 3d, sketch roughness, text
```

---

## PART 2 — The icon inventory (subject line for each slot)

Paste the subject, then the style tail from your chosen direction.

| Slot | Where it lives | Subject prompt |
|---|---|---|
| Spark lane | home lanes, nav | `a single flint striking one bright teal spark above a violet steel bar` |
| Builder lane | home lanes | `a T-square crossed over a carpenter pencil at a confident diagonal` |
| Operator lane | home lanes | `a keyring holding three distinct workshop keys, one teal` |
| Backer lane | home lanes | `a stack of three cast metal ingots, top ingot teal, coin edge visible` |
| Connector lane | home lanes | `two interlocking forged rings, one violet one teal, perfectly joined` |
| Worker lane | home lanes | `crucible tongs gripping a small glowing teal crucible` |
| Step: Name it | "Name it. Verify it. Move." | `a clipboard dossier with one bold teal checkmark line among violet lines` |
| Step: Verify it | same strip | `a precision caliper measuring a teal gem` |
| Step: Move | same strip | `a workshop door ajar with a teal check floating in the doorway` |
| Armory | pricing | `a violet toolbox with drawers open, teal tool handles visible` |
| Funds check | pricing/crucible | `a ledger book with a teal coin stack resting on it` |
| Crucible shield | pricing (Ben's call) | `a shield in teal green with a bold violet checkmark, inverted-color heraldry` |
| Squibb mark | bellows | `a small wise owl perched on a caliper, violet body, teal eyes, dignified not cute` |

Ask Midjourney for `--ar 1:1` always; upscale winners; hand me the raws and
I do transparency, resize, and wiring.

---

## PART 3 — Photography: killing the CGI verdict

The daughter test is the real test. The current landing images are
AI-renders with the telltale CGI sheen: too-smooth skin, too-even light,
too-perfect props. Two ways out:

### Option 1 — Midjourney v7 photorealism, prompted against the sheen

Skeleton for every story/landing photo:

```
editorial documentary photograph, [SCENE], shot on Kodak Portra 400 film, 35mm lens, natural window light with real falloff, authentic cluttered workspace, visible skin texture and flyaway hair, candid mid-action not posed, slight grain, imperfect framing like a magazine feature --v 7 --style raw --ar 16:9 --no CGI, 3d render, smooth plastic skin, perfect symmetry, video game, illustration
```

Scenes to regenerate first (the landing page set):
1. `a woman in her late 30s at a flour-dusted bakery counter at dawn, looking up from a notebook with quiet resolve` (Maria hero)
2. `two business partners in their finished shop the evening before opening day, one crossing off a checklist` (pricing featured)
3. `a florist behind her counter mid-arrangement, morning light` (industry set)

Keep `--style raw` ON for all photography — it strips Midjourney's
house-beautification, which is half of what reads as CGI.

### Option 2 — Real photography (the honest kill-shot)

No generator fully beats the daughter test. Licensed documentary stock from
Stocksy or Offset ($15–125/image) of real small-shop owners would end the
CGI conversation permanently for the 3–5 hero slots, with AI images kept
for interior pages. Worth pricing before another generation cycle.

---

## Handback protocol

Drop whatever you generate into a folder and tell me — I take it from raw
files to transparent, resized, wired, and red-teamed. You never touch the
pipeline.

— Lady Jessica, foreman
