import type { CSSProperties, ReactNode } from "react";
import type { WorkshopBandTone } from "@/lib/workshop-atmosphere";
import { workshopBandImageStyle } from "@/lib/workshop-atmosphere";

type WorkshopBandLayout = "panel" | "bare" | "split";

type WorkshopBandPanelProps = {
  tone: WorkshopBandTone;
  className?: string;
  layout?: WorkshopBandLayout;
  /** When false, warm paper panel only — no drift background plate. */
  atmosphere?: boolean;
  children: ReactNode;
  style?: CSSProperties;
};

export function WorkshopBandPanel({
  tone,
  className = "",
  layout = "panel",
  atmosphere = true,
  children,
  style
}: WorkshopBandPanelProps) {
  const bandClass = [
    "workshop-band",
    `workshop-band--${tone}`,
    layout === "bare" ? "workshop-band--bare" : "",
    layout === "split" ? "workshop-band--split" : "",
    !atmosphere ? "workshop-band--no-atmosphere" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={bandClass}
      style={{ ...(atmosphere ? workshopBandImageStyle(tone) : undefined), ...style }}
    >
      {layout === "bare" ? children : <div className="workshop-band__panel">{children}</div>}
    </div>
  );
}
