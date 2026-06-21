# Ghost Forge — Imagery Prompt Template (People & Formation)

Status: **PAUSED** — Gate 05 / Ghost Forge image spend remains parked until separately approved.  
Doctrine: `foreman/IMAGERY_DIRECTION.md`  
**Do not run prompts from this file until Ben opens Gate 05 or a dedicated imagery budget gate.**

---

## Viability record

Imagery direction is **viable** with restrained visual grammar.

Transformation is implied through **cards, formation states, props, and subtle motion** — **not** literal magical morphing.

---

## When Gate 05 reopens — test order

1. **P01** — Identity shift triptych (static, three panels or one composite)
2. **P02** — Unlikely collaboration still
3. **P03** — Werkle formation (locked joints)
4. **P04** — Lane card set (five props, optional single lead)
5. Motion smoke tests **only after** static grammar approved

---

## Global prefix (append to every people prompt)

```
Grounded cinematic photograph, heightened realism, believable workshop or small-business space.
Anonymous adult professional, no celebrity likeness, no copyrighted character.
Protagonist making decisions — notes, plans, tools, contracts, or blueprints visible.
Cast-and-formation composition, warm steel and copper frame, restrained violet-teal accent.
Not movie poster, not fantasy, not corporate stock photo, not melodramatic, not banking ad.
Werkles private partner matching — Builder Operator Backer Connector Spark lanes.
```

---

## Global negative (append to every people prompt)

```
readable text, letters, numbers, watermark, logo,
movie poster, epic fantasy, medieval, dragon, magical morphing, face morph, body transform,
cartoon squash stretch, RPG class change UI, game art,
stock photo handshake, boardroom pointing, fake team laugh, guru on stage,
luxury lifestyle, champagne, penthouse, melodramatic victory pose,
celebrity likeness, copyrighted character, anime unless requested,
pure white background, neon overload, candy wonderland, cartoon mascot
```

Also append atmosphere negatives from `DRAFT_SITE_ASSET_BATCH_v0.2.md` for non-people assets.

---

## Prompt catalog (static — Tier P)

### P01 — Identity shift triptych

| Field | Value |
|-------|--------|
| Filename | `werkles-draft-formation-identity-shift-v0.1.png` |
| Aspect | 16:9 or 3:1 composite |
| Placement | Home `#people` or `#how` (after UI_COMMIT opens) |
| Prompt | Three-panel editorial photograph same anonymous professional in believable workshop, panel one trade tools on bench, panel two operator schedule folder and keys, panel three at table with blueprint and second empty chair pulled in, heightened realism, warm practical light, copper and dark steel, no text, no morphing between panels |

### P02 — Unlikely collaboration

| Field | Value |
|-------|--------|
| Filename | `werkles-draft-formation-unlikely-pair-v0.1.png` |
| Aspect | 16:9 |
| Prompt | Two different tradespeople at one workshop table, mismatched tools but shared stamped blueprint between them, unlikely collaboration energy without buddy-comedy stock photo, grounded cinematic, warm steel copper palette, no handshake, no text |

### P03 — Werkle locked

| Field | Value |
|-------|--------|
| Filename | `werkles-draft-formation-werkle-locked-v0.1.png` |
| Aspect | 16:9 |
| Prompt | Three complementary professionals around one work table, shared contract and blueprint, distinct props suggesting builder operator backer roles, formation locked like working machine, grounded workshop, no team poster pose, no text |

### P04 — Lane card reference (Builder example)

| Field | Value |
|-------|--------|
| Filename | `werkles-draft-lane-builder-portrait-v0.1.png` |
| Aspect | 4:5 |
| Prompt | Waist-up environmental portrait anonymous builder at fab table, hands on material sample, marked-up sketch, protagonist energy without performance, workshop depth behind, copper frame light, no text |

Repeat P04 pattern for operator, backer, connector, spark with lane props from `IMAGERY_DIRECTION.md`.

---

## Motion tests (Tier M — after static approved)

**M01 — Prop crossfade loop (3–5s):** static masters only; After Effects or CSS parallax — **not** generative face video.

**M02 — Second chair enters frame:** same set, person unchanged, chair + blueprint slide in.

Never autoplay on `/proof`, `/login`, `/dashboard/billing`.

---

## Operational

- One prompt per Ghost Forge request (`MAX_PROMPTS_PER_BATCH=1`)
- Log to `foreman/ghost-forge/DRAFT_SITE_ASSET_RESULTS_v0.2.md`
- **Gate 05 PAUSE** — Codex/Maker do not execute until cockpit gate opens
- No Squibb/Brass mascot via Ghost Forge — Ben manual cutout per `public/assets/mascot/README.md`
