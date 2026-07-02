"use client";

import { useState } from "react";

import {
  getNavDocumentaryIconPath,
  NAV_ICONS_TRANSPARENT_WIRE_ENABLED,
  navIconsTransparentFolder,
  type PrimaryNavItem
} from "@/lib/site-nav";

type Props = {
  item: PrimaryNavItem;
};

function transparentPath(lane: PrimaryNavItem["lane"]) {
  return `${navIconsTransparentFolder}/werkles-nav-icon-${lane}-transparent.png`;
}

export function NavDocumentaryIcon({ item }: Props) {
  const [useDraftFallback, setUseDraftFallback] = useState(false);
  const draftPath = getNavDocumentaryIconPath(item.lane);
  const transparent = transparentPath(item.lane);
  const src =
    NAV_ICONS_TRANSPARENT_WIRE_ENABLED && !useDraftFallback ? transparent : draftPath;

  if (!src) {
    return <span className="nav-doc-icon nav-doc-icon--empty" aria-hidden="true" />;
  }

  return (
    <span className="nav-doc-icon" aria-hidden="true">
      <span className="nav-doc-icon__frame">
        <img
          src={src}
          alt=""
          width={32}
          height={32}
          className={`nav-doc-icon__img${NAV_ICONS_TRANSPARENT_WIRE_ENABLED && !useDraftFallback ? " nav-doc-icon__img--transparent" : ""}`}
          onError={() => {
            if (NAV_ICONS_TRANSPARENT_WIRE_ENABLED && !useDraftFallback) {
              setUseDraftFallback(true);
            }
          }}
        />
      </span>
    </span>
  );
}
