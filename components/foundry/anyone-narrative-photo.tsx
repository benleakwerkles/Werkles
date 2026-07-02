"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  renderSrc: string;
  stockSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

/** Prefer Ghost Forge render; fall back to stock batch on 404 until Sally run lands. */
export function AnyoneNarrativePhoto({
  renderSrc,
  stockSrc,
  alt,
  width,
  height,
  className = "",
  priority = false
}: Props) {
  const [src, setSrc] = useState(renderSrc);

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={() => {
        if (src !== stockSrc) setSrc(stockSrc);
      }}
    />
  );
}
