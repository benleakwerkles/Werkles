export function formatRelayReceiptReadable(
  receipt: Record<string, unknown>
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const pick = (key: string, label: string) => {
    const v = receipt[key];
    if (v == null || v === "") return;
    rows.push({ label, value: String(v) });
  };
  pick("card_name", "Card");
  pick("status", "Status");
  pick("packet_id", "Packet ID");
  pick("timestamp", "Fired at");
  pick("updated_at", "Updated");
  pick("success", "Success");
  pick("blocker", "Blocker");
  pick("error", "Error");
  pick("packet_path", "Packet path");
  pick("receipt_path", "Receipt path");
  pick("outbound_path", "Outbound path");
  pick("ARTIFACT_REQUIRED", "ARTIFACT_REQUIRED");
  const gate = receipt.artifact_gate as
    | { passed?: unknown; artifact_count?: unknown; blocker?: unknown }
    | undefined;
  if (gate) {
    rows.push({
      label: "Artifact gate",
      value: `${gate.passed ? "PASS" : "BLOCKED"} (${gate.artifact_count ?? 0} artifact${
        gate.artifact_count === 1 ? "" : "s"
      })`
    });
    if (gate.blocker) rows.push({ label: "Artifact blocker", value: String(gate.blocker) });
  }
  const artifacts = Array.isArray(receipt.artifacts) ? receipt.artifacts : [];
  if (artifacts.length > 0) {
    rows.push({
      label: "Artifacts",
      value: artifacts
        .map((artifact) => {
          if (!artifact || typeof artifact !== "object") return "";
          const item = artifact as { kind?: unknown; label?: unknown; value?: unknown };
          return `${String(item.kind ?? "artifact")}: ${String(item.label ?? "")} ${String(item.value ?? "")}`.trim();
        })
        .filter(Boolean)
        .join(" | ")
    });
  }
  pick("next_action", "Next action");
  pick("next_missing_integration", "Missing integration");
  return rows;
}
