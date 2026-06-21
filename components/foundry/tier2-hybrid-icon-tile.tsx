"use client";

import { useState } from "react";

type Props = {
  label: string;
  primary: string;
  fallback?: string;
};

export function Tier2HybridIconTile({ label, primary, fallback }: Props) {
  const [src, setSrc] = useState(primary);

  return (
    <figure className="tier2-visual__icon-tile">
      <img
        src={src}
        alt={`${label} lane prop`}
        width={72}
        height={72}
        className="tier2-visual__icon-img"
        onError={() => {
          if (fallback && src !== fallback) {
            setSrc(fallback);
          }
        }}
      />
      <figcaption>{label}</figcaption>
    </figure>
  );
}
