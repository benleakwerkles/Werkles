import { copy } from "@/lib/copy";
import { isAuthStripeTestBlocked } from "@/lib/app-infra-preview";
import { isLocalRoutePreviewUnlocked } from "@/lib/local-route-preview";

type RouteUnlockBannerProps = {
  blockedDetail: string;
};

export function RouteUnlockBanner({ blockedDetail }: RouteUnlockBannerProps) {
  if (isLocalRoutePreviewUnlocked()) {
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
