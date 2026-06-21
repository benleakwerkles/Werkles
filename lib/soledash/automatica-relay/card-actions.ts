import "server-only";

import fs from "node:fs";
import path from "node:path";

import { dispatchBuild } from "@/lib/soledash/command-surface/dispatch";

import { cardById } from "./cards";
import { fireRelayCard } from "./fire-card";
import { saveRouteOverride, readRouteOverride } from "./route-overrides";
import { rel, AUTOMATICA_DIR } from "./storage";
import type { RelayCardActionKind } from "./artifact-types";
import type { RelayCardDef } from "./types";

const ROOT = process.cwd();
const DINK_OUTBOX = path.join(ROOT, "foreman", "handoffs", "outbox");

export type { RelayCardActionKind } from "./artifact-types";

export type RelayCardActionResult = {
  ok: boolean;
  detail: string;
  outbox_path: string | null;
  receipt_path: string | null;
};

function stamp(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\..+$/, "").slice(0, 15);
}

function effectiveCard(card: RelayCardDef): RelayCardDef {
  const override = readRouteOverride(card.id);
  if (!override) return card;
  return { ...card, cousin: override.cousin };
}

export async function runRelayCardAction(
  cardId: string,
  action: RelayCardActionKind,
  opts?: { cousin?: RelayCardDef["cousin"]; note?: string }
): Promise<RelayCardActionResult> {
  const card = cardById(cardId);
  if (!card) {
    return { ok: false, detail: `Unknown relay card: ${cardId}`, outbox_path: null, receipt_path: null };
  }

  if (action === "approve") {
    const result = await fireRelayCard(cardId);
    if ("error" in result) {
      return { ok: false, detail: result.error, outbox_path: null, receipt_path: null };
    }
    return {
      ok: result.ok,
      detail: result.ok ? "Approved — packet fired" : result.receipt.blocker ?? result.receipt.error ?? "Approve failed",
      outbox_path: result.receipt.outbound_path,
      receipt_path: result.receipt.receipt_path
    };
  }

  if (action === "edit_route") {
    const cousin = opts?.cousin;
    if (!cousin) {
      return { ok: false, detail: "cousin required for edit_route", outbox_path: null, receipt_path: null };
    }
    saveRouteOverride(cardId, cousin, opts?.note);
    return {
      ok: true,
      detail: `Route updated → ${cousin}`,
      outbox_path: null,
      receipt_path: null
    };
  }

  const routed = effectiveCard(card);
  const dispatchCousin = action === "needs_research" ? "COMPUTER" : "BEAN";
  const missionText = `[Relay card ${action.replace(/_/g, " ")}] ${routed.name}\n\n${routed.missionText}\n\nOperator action: ${action.toUpperCase()} from SoleDash Relay Card Surface.`;

  try {
    const result = await dispatchBuild({
      missionText,
      title: `[Automatica] ${routed.name} · ${action.replace(/_/g, " ")}`,
      cousin: dispatchCousin,
      decisionNote: `Relay card side action ${action} · ${cardId}`
    });

    if (!result.ok || !result.build?.outboxPath) {
      return {
        ok: false,
        detail: result.message ?? result.blocker ?? "Side action dispatch failed",
        outbox_path: result.build?.outboxPath ?? null,
        receipt_path: null
      };
    }

    fs.mkdirSync(DINK_OUTBOX, { recursive: true });
    const noteFile = path.join(
      DINK_OUTBOX,
      `TO_DINK_RELAY_${action.toUpperCase()}_${cardId}_${stamp(new Date().toISOString())}.md`
    );
    fs.writeFileSync(
      noteFile,
      `# Relay card · ${action.replace(/_/g, " ")}\n\n- Card: ${routed.name}\n- Routed to: ${dispatchCousin}\n- Outbox: \`${rel(result.build.outboxPath)}\`\n`,
      "utf8"
    );

    return {
      ok: true,
      detail: `${action.replace(/_/g, " ")} routed to ${dispatchCousin}`,
      outbox_path: rel(result.build.outboxPath),
      receipt_path: rel(noteFile)
    };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : "Side action failed",
      outbox_path: null,
      receipt_path: null
    };
  }
}

export { AUTOMATICA_DIR, rel };
