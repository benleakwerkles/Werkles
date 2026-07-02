"use client";

import { useState } from "react";

import { HeroHeadlinePreview } from "@/components/foundry/hero-headline-preview";
import { copy } from "@/lib/copy";
import { HERO_HEADLINE_PRIMARY } from "@/lib/hero-copy-variants";

export function HeroCopyBlock() {
  const [headline, setHeadline] = useState(HERO_HEADLINE_PRIMARY);

  return (
    <>
      <h1>{headline}</h1>
      <HeroHeadlinePreview onHeadlineChange={setHeadline} />
      <p className="hero-lead">{copy.hero.subhead}</p>
      {copy.hero.positioning ? <p className="hero-positioning">{copy.hero.positioning}</p> : null}
      {copy.hero.beforeState ? <p className="hero-before">{copy.hero.beforeState}</p> : null}
    </>
  );
}
