import { stockPreviewAttributionNote } from "@/lib/stock-preview-imagery";

export function StockPreviewBadge() {
  return (
    <p className="stock-preview-badge" role="note">
      {stockPreviewAttributionNote}
    </p>
  );
}
