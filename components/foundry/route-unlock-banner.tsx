"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { isAuthStripeTestBlocked } from "@/lib/app-infra-preview";
import { isLocalRoutePreviewUnlocked, isRuntimeRoutePreviewUnlocked } from "@/lib/local-route-preview";

type RouteUnlockBannerProps = {
  blockedDetail: string;
};

export function RouteUnlockBanner({ blockedDetail }: RouteUnlockBannerProps) {
  const [previewUnlocked, setPreviewUnlocked] = useState(isLocalRoutePreviewUnlocked());

  useEffect(() => {
    setPreviewUnlocked(isRuntimeRoutePreviewUnlocked());
  }, []);

  if (previewUnlocked) {
    return (
      <p className="trust-badge local-preview-banner" role="status">
        {copy.localPreview.banner}
      </p>
    );
  }

  if (isAuthStripeTestBlocked()) {
    return (
      <p className="trust-badge infra-preview-banner" role="status">
        {copy.infraPreview.banner} — {blockedDetail}
      </p>
    );
  }

  return null;
}
