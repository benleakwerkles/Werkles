import Link from "next/link";

type InternalOperatorBoundaryProps = {
  tool: "TinkerDen" | "ThinkIt";
};

const toolCopy = {
  TinkerDen: {
    title: "Legacy TinkerDen diagnostics",
    detail: "Historical diagnostic evidence only. It is not current crew activity and cannot send, post, or dispatch work."
  },
  ThinkIt: {
    title: "Legacy ThinkIt diagnostics",
    detail: "Pre-Harvey compatibility evidence only. Current Harvey transport is not available from this screen."
  }
} as const;

export function InternalOperatorBoundary({ tool }: InternalOperatorBoundaryProps) {
  const copy = toolCopy[tool];

  return (
    <aside className="internal-operator-boundary" aria-label={`${tool} internal Operator tool notice`}>
      <div>
        <span>LEGACY DIAGNOSTICS__NOT_CURRENT_HARVEY_TRANSPORT</span>
        <strong>{copy.title}</strong>
        <p>{copy.detail}</p>
      </div>
      <nav aria-label="Leave internal Operator tools">
        <Link href="/dashboard">Return to Member Home</Link>
        <Link href="/operator">Open Operator Bench</Link>
      </nav>
    </aside>
  );
}
