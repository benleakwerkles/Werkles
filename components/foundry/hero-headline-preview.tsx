"use client";

import { useState } from "react";

import {
  HERO_COPY_PREVIEW_ENABLED,
  HERO_HEADLINE_PRIMARY,
  HERO_HEADLINE_VARIANTS
} from "@/lib/hero-copy-variants";

type Props = {
  onHeadlineChange?: (headline: string) => void;
};

export function HeroHeadlinePreview({ onHeadlineChange }: Props) {
  const [active, setActive] = useState(HERO_HEADLINE_PRIMARY);

  if (!HERO_COPY_PREVIEW_ENABLED) return null;

  return (
    <div className="hero-headline-preview" role="group" aria-label="Hero headline variants (dev preview)">
      <span className="hero-headline-preview__label">Headline variants</span>
      <div className="hero-headline-preview__pills">
        {HERO_HEADLINE_VARIANTS.map((variant, index) => {
          const isActive = active === variant;
          return (
            <button
              key={variant}
              type="button"
              className={`hero-headline-preview__pill${isActive ? " hero-headline-preview__pill--active" : ""}`}
              aria-pressed={isActive}
              onClick={() => {
                setActive(variant);
                onHeadlineChange?.(variant);
              }}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
