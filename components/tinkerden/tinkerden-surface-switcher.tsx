import Link from "next/link";

import {
  readReceiverHandoffIndex,
  type ReceiverHandoffIndex,
} from "@/lib/organism/contracts/receiver-handoff-index";

type TinkerDenSurfaceKey =
  | "mission-control"
  | "bridge"
  | "inbox"
  | "human-gates"
  | "receipts"
  | "relay-proof"
  | "thinkit";

type ActiveTinkerDenSurface = TinkerDenSurfaceKey;
type ReceiverHandoffSummary = Pick<
  ReceiverHandoffIndex,
  "posted_count" | "pending_count" | "returned_unposted_count" | "template_return_blocked_count"
>;

type TinkerDenSurfaceLink = {
  href: string;
  label: string;
};

const surfaceLinks: Record<TinkerDenSurfaceKey, TinkerDenSurfaceLink> = {
  "mission-control": { href: "/tinkerden/mission-control", label: "Mission Control" },
  bridge: { href: "/tinkerden", label: "Bridge" },
  inbox: { href: "/tinkerden/inbox", label: "Inbox" },
  "human-gates": { href: "/tinkerden/human-gates", label: "Human Gates" },
  receipts: { href: "/tinkerden/receipts", label: "Receipts" },
  "relay-proof": { href: "/tinkerden/relay-proof", label: "Relay Proof" },
  thinkit: { href: "/thinkit", label: "ThinkIt" },
};

const defaultSurfaceOrder: Record<ActiveTinkerDenSurface, TinkerDenSurfaceKey[]> = {
  "mission-control": ["mission-control", "bridge", "human-gates"],
  bridge: ["mission-control", "bridge", "human-gates"],
  inbox: ["bridge", "inbox", "receipts", "thinkit"],
  "human-gates": ["mission-control", "bridge", "human-gates"],
  receipts: ["bridge", "inbox", "receipts", "thinkit"],
  "relay-proof": ["bridge", "relay-proof"],
  thinkit: ["mission-control", "bridge", "thinkit", "receipts"],
};

function receiverHandoffReceiptsHref(receiverHandoff: ReceiverHandoffSummary) {
  if (receiverHandoff.returned_unposted_count > 0) return "/tinkerden/receipts#legacy-receiver-handoffs";
  if (receiverHandoff.template_return_blocked_count > 0) return "/tinkerden/receipts#receiver-handoff-template-blocked";
  if (receiverHandoff.pending_count > 0) return "/tinkerden/receipts#receiver-handoff-pending";
  if (receiverHandoff.posted_count > 0) return "/tinkerden/receipts#receiver-handoff-posted";
  return "/tinkerden/receipts";
}

function receiverHandoffTargetState(receiverHandoff: ReceiverHandoffSummary) {
  if (receiverHandoff.returned_unposted_count > 0) return "returned_unposted";
  if (receiverHandoff.template_return_blocked_count > 0) return "template_return_blocked";
  if (receiverHandoff.pending_count > 0) return "pending_receiver";
  if (receiverHandoff.posted_count > 0) return "posted";
  return "empty";
}

type TinkerDenSurfaceSwitcherProps = {
  active: ActiveTinkerDenSurface;
  links?: TinkerDenSurfaceKey[];
  handoffSummary?: ReceiverHandoffSummary;
};

export async function TinkerDenSurfaceSwitcher({ active, links, handoffSummary }: TinkerDenSurfaceSwitcherProps) {
  const receiverHandoff = handoffSummary ?? (await readReceiverHandoffIndex(1));
  const orderedLinks = links ?? defaultSurfaceOrder[active];

  return (
    <nav className="td-surface-switcher" aria-label="TinkerDen surface switcher">
      {orderedLinks.map((surfaceKey) => {
        const surface = surfaceLinks[surfaceKey];
        const isActive = surfaceKey === active;
        const className = `td-surface-switcher__link${isActive ? " td-surface-switcher__link--active" : ""}`;
        const href = surfaceKey === "receipts" ? receiverHandoffReceiptsHref(receiverHandoff) : surface.href;

        return (
          <Link
            className={className}
            href={href}
            key={surfaceKey}
            data-receiver-handoff-target-state={surfaceKey === "receipts" ? receiverHandoffTargetState(receiverHandoff) : undefined}
            data-receiver-handoff-target-href={surfaceKey === "receipts" ? href : undefined}
          >
            {surface.label}
            {surfaceKey === "receipts" ? (
              <span
                className="td-surface-switcher__receipt-badges"
                data-receiver-handoff-state-strip
                data-posted-count={receiverHandoff.posted_count}
                data-pending-count={receiverHandoff.pending_count}
                data-returned-unposted-count={receiverHandoff.returned_unposted_count}
                data-template-return-blocked-count={receiverHandoff.template_return_blocked_count}
              >
                <span
                  className="td-surface-switcher__receipt-badge td-surface-switcher__receipt-badge--posted"
                  data-receiver-handoff-posted-count-badge
                  data-posted-count={receiverHandoff.posted_count}
                >
                  {receiverHandoff.posted_count} posted
                </span>
                {" "}
                <span
                  className="td-surface-switcher__receipt-badge td-surface-switcher__receipt-badge--pending"
                  data-receiver-handoff-pending-count-badge
                  data-pending-count={receiverHandoff.pending_count}
                >
                  {receiverHandoff.pending_count} pending
                </span>
                {" "}
                <span
                  className="td-surface-switcher__receipt-badge td-surface-switcher__receipt-badge--returned"
                  data-receiver-handoff-returned-unposted-count-badge
                  data-returned-unposted-count={receiverHandoff.returned_unposted_count}
                >
                  {receiverHandoff.returned_unposted_count} ready
                </span>
                {" "}
                <span
                  className="td-surface-switcher__receipt-badge td-surface-switcher__receipt-badge--blocked"
                  data-receiver-handoff-template-return-blocked-count-badge
                  data-template-return-blocked-count={receiverHandoff.template_return_blocked_count}
                >
                  {receiverHandoff.template_return_blocked_count} blocked
                </span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
