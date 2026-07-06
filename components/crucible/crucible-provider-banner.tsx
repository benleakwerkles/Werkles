import { copy } from "@/lib/copy";
import { isCrucibleProviderTestEnabled } from "@/lib/app-infra-preview";

export function CrucibleProviderBanner() {
  if (!isCrucibleProviderTestEnabled()) return null;

  return (
    <p className="trust-badge infra-preview-banner" role="status">
      {copy.crucible.providerTestBanner}
    </p>
  );
}
