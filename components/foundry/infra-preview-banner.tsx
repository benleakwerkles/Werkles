import { copy } from "@/lib/copy";
import { isCruciblePreview } from "@/lib/app-infra-preview";

type InfraPreviewBannerProps = {
  detail: string;
};

export function InfraPreviewBanner({ detail }: InfraPreviewBannerProps) {
  if (!isCruciblePreview()) return null;

  return (
    <p className="trust-badge infra-preview-banner" role="status">
      {copy.infraPreview.banner} — {detail}
    </p>
  );
}
