import type { Metadata } from "next";
import Link from "next/link";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { readOrganismContractIndex } from "@/lib/organism/contracts/read-index";
import { readReceiverHandoffIndex } from "@/lib/organism/contracts/receiver-handoff-index";
import { readCanonicalExecutionRecords } from "@/lib/tinkerden/execution-records";
import { readTinkerdenCommandDestinations } from "@/lib/tinkerden/command-surface";
import { readPacketRelayReadyEvents } from "@/lib/tinkerden/packet-relay-events";
import { readTinkerdenReceiptStream } from "@/lib/tinkerden/receipt-stream";
import { TinkerDenSurfaceSwitcher } from "@/components/tinkerden/tinkerden-surface-switcher";

import { DriftLogFooter } from "./drift-log-footer";

export const metadata: Metadata = {
  title: "TinkerDen Bridge",
  description: "TinkerDen Bridge: current frontier, top moves, and operator choice.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

type Recommendation = "PROCEED" | "DEFER" | "KILL";
type ReversibilityGate = "PASS" | "FAIL";

type RecommendationCard = {
  card_id: string;
  move: string;
  why_now: string;
  recommended_because: string;
  scores: {
    momentum_gain: number;
    mule_labor_reduction: number;
    cooperation_gain: number;
    continuity_gain: number;
    capacity_gain: number;
  };
  reversibility_gate: ReversibilityGate;
  risk_extraction_flag: string;
  swateyes: {
    tier: string;
    confidence: number;
  };
  recommendation: Recommendation;
};

type RecommendationFile = {
  generated_at?: string;
  stale_after_minutes?: number;
  current_frontier?: {
    title?: string;
    summary?: string;
  };
  cards?: RecommendationCard[];
};

type ReceiptPickup = {
  receiptId: string;
  mission: string;
  producer: string;
  statusGuess: string;
  timestamp: string;
  path: string;
  linkedPacketId: string;
};

type BridgeState =
  | {
      found: false;
      sourcePath: string;
    }
  | {
      found: true;
      sourcePath: string;
      generatedAt: string;
      staleAfterMinutes: number;
      isStale: boolean;
      currentFrontier: {
        title: string;
        summary: string;
      };
      cards: Array<RecommendationCard & { compositeScore: number }>;
    };

type ReceiptPickupState =
  | {
      found: false;
      sourcePath: string;
      receipts: [];
    }
  | {
      found: true;
      sourcePath: string;
      receipts: ReceiptPickup[];
    };

type PacketRecord = {
  packet_id?: unknown;
  assigned_to?: unknown;
  machine?: unknown;
  mission?: unknown;
  status?: unknown;
  due_status?: unknown;
};

type TinkerDenPacketState = {
  packets?: PacketRecord[];
};

type PacketLifecycle = {
  active: string;
  awaitingReceipt: string;
  receiptReturned: string;
  blocked: string;
  archive: string;
};

type AeyeLane = {
  lane: string;
  activePackets: string;
  latestStatus: string;
};

type RelayStatusLane = {
  packetId: string;
  relayId: string;
  receiptId: string;
  relayStatus: string;
  timestamp: string;
};

type ContractLane = {
  packetId: string;
  lane: string;
  receiver: string;
  receiptId: string;
  receiptStatus: string;
  latestEventType: string;
  latestEventAt: string;
  joinedEventCount: number;
  packetPath: string;
  receiptPath: string;
  truthBoundary: string;
};

type ContractFreshness = {
  label: string;
  state: "LIVE" | "STALE" | "CHECK" | "NO_MIRRORS";
};

type ReceiverHandoffLane = {
  bundleId: string;
  packetId: string;
  lane: string;
  state: string;
  returnedStatus: string;
  returnedReceiptId: string;
  receiver: string;
  returnedReceiver: string;
  contractEventJoined: boolean;
  handoffPath: string;
  returnedReceiptPath: string;
  contractReceiptPath: string;
  postCommand: string;
  truthBoundary: string;
  syntheticProof: boolean;
  syntheticReason: string;
};

type ReceiverHandoffFreshness = {
  label: string;
  state: "POSTED" | "PENDING" | "CHECK" | "EMPTY";
};

type ReceiverHandoffLatestPosted = ReceiverHandoffLane | null;

const spawnGateProposal = {
  operatorIntent: "Review an Intent-to-Anatomy proposal before it becomes buildable work.",
  proposedAnatomy: [
    "Intent intake",
    "Anatomy proposal",
    "Human Gate decision",
    "Receipt slot",
    "Termination check"
  ],
  riskLevel: "WOUND - shapes workflow and architecture, but does not execute by itself.",
  humanGates: [
    "Operator must choose PROCEED, DEFER, or KILL.",
    "No Genesis Sandbox work starts from this card.",
    "No packet, process, or agent spawn is allowed without explicit Human Gate.",
    "Receipt is required before any follow-on build can claim completion."
  ],
  terminationCondition:
    "Stop if the proposal would auto-spawn, create a sandbox, write execution packets, or bypass the Human Gate."
} as const;

const RECOMMENDATION_PATH = path.join("tinkerden", "recommendations", "recommendation_cards.json");
const TINKERDEN_PACKET_STATE_PATH = path.join("foreman", "soledash", "tinkerden-return-system-v0", "state.json");
const DEFAULT_STALE_AFTER_MINUTES = 720;

const bridgeScript = `
(() => {
  function text(value) {
    return typeof value === "string" && value.trim() ? value.trim() : "UNKNOWN";
  }

  function renderReceiptPickupCard(receipt, index) {
    const card = document.createElement("article");
    card.className = "td-receipt-pickup__card";

    const header = document.createElement("header");
    const number = document.createElement("span");
    number.textContent = "#" + (index + 1);
    const status = document.createElement("strong");
    status.textContent = text(receipt.status_guess);
    header.append(number, status);

    const dl = document.createElement("dl");
    [
      ["Receipt ID", text(receipt.receipt_id)],
      ["Linked packet", text(receipt.linked_packet_id || receipt.packet_id)],
      ["Mission", text(receipt.mission)],
      ["Producer", text(receipt.producer)],
      ["Timestamp", text(receipt.timestamp)],
      ["Status guess", text(receipt.status_guess)]
    ].forEach(([label, value]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      row.append(dt, dd);
      dl.append(row);
    });

    card.append(header, dl);
    return card;
  }

  async function hydrateReceiptPickup() {
    const panel = document.querySelector("[data-receipt-pickup-panel]");
    const list = document.querySelector("[data-receipt-pickup-list]");
    if (!panel || !list) return;

    try {
      const response = await fetch(panel.dataset.receiptsApi || "/api/tinkerden/receipts", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Receipt API failed.");

      list.textContent = "";
      const receipts = Array.isArray(result.receipts) ? result.receipts : [];
      if (receipts.length === 0) {
        const empty = document.createElement("p");
        empty.className = "td-receipt-pickup__empty";
        empty.textContent = result.missing ? "No receipt pickup stream found." : "Receipt pickup stream found, but no receipts are present.";
        list.append(empty);
        return;
      }

      receipts.forEach((receipt, index) => list.append(renderReceiptPickupCard(receipt, index)));
    } catch (error) {
      list.textContent = "";
      const empty = document.createElement("p");
      empty.className = "td-receipt-pickup__empty";
      empty.textContent = "Receipt API blocked: " + (error?.message || "unknown");
      list.append(empty);
    }
  }

  function renderContractIndexRow(label, value) {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    row.append(dt, dd);
    return row;
  }

  function renderContractRecord(record) {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    const button = document.createElement("button");
    const status = document.createElement("span");

    dt.textContent = text(record.packet_id);
    dd.textContent =
      text(record.lane) +
        " / " + text(record.receipt_status) +
        " / " + text(record.latest_event_type) +
        " / joined " + text(String(record.joined_event_count ?? 0)) +
        " / " + text(record.latest_event_at) +
        "\\npacket " + text(record.packet_path) +
        "\\nreceipt " + text(record.receipt_path) +
        "\\n" + text(record.truth_boundary);
    button.type = "button";
    button.dataset.createReceiverHandoff = "true";
    button.dataset.packetId = text(record.packet_id, "");
    button.dataset.receiver = text(record.to, "Receiver@Unknown");
    button.textContent = "CREATE HANDOFF";
    status.dataset.receiverHandoffCreateStatus = "true";
    status.textContent = "";
    dd.append(document.createElement("br"), button, status);
    row.append(dt, dd);
    return row;
  }

  function contractFreshnessFor(records, result) {
    const invalidCount = Number(result.invalid_count ?? 0) + Number(result.malformed_count ?? 0);
    if (invalidCount > 0) return { label: "CHECK · " + invalidCount + " invalid", state: "CHECK" };
    if (records.length === 0) return { label: "NO MIRRORS", state: "NO_MIRRORS" };
    const missingJoins = records.filter((record) => Number(record.joined_event_count ?? 0) <= 0).length;
    if (missingJoins > 0) return { label: "CHECK · " + missingJoins + " unjoined", state: "CHECK" };

    const latest = records
      .map((record) => Date.parse(text(record.latest_event_at, "")))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => b - a)[0];
    if (!Number.isFinite(latest)) return { label: "CHECK · no event time", state: "CHECK" };

    const ageMinutes = Math.max(0, Math.floor((Date.now() - latest) / 60000));
    const state = ageMinutes <= 60 ? "LIVE" : "STALE";
    return { label: state + " · " + records.length + " lanes · " + ageMinutes + "m", state };
  }

  function setContractFreshness(panel, freshness) {
    const node = panel.querySelector("[data-contract-freshness]");
    if (!node) return;
    node.textContent = freshness.label;
    node.dataset.state = freshness.state;
  }

  async function hydrateContractIndex() {
    const panel = document.querySelector("[data-contract-index-panel]");
    const list = document.querySelector("[data-contract-index-list]");
    if (!panel || !list) return;

    try {
      const response = await fetch(panel.dataset.contractIndexApi || "/api/organism/contracts/index?limit=25", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Contract index API failed.");

      const records = Array.isArray(result.records)
        ? result.records.filter((record) => typeof record?.lane === "string" && record.lane.startsWith("TinkerDen "))
        : [];
      setContractFreshness(panel, contractFreshnessFor(records, result));

      list.textContent = "";
      list.append(renderContractIndexRow("Records", records.length + " / " + text(String(result.packet_count ?? 0)) + " packets"));
      list.append(renderContractIndexRow("Events", text(String(result.event_count ?? 0))));
      list.append(renderContractIndexRow("Invalid", text(String((result.invalid_count ?? 0) + (result.malformed_count ?? 0)))));

      if (records.length === 0) {
        list.append(renderContractIndexRow("Status", "No TinkerDen contract mirrors found"));
        return;
      }

      records.forEach((record) => list.append(renderContractRecord(record)));
    } catch (error) {
      setContractFreshness(panel, { label: "CHECK · API blocked", state: "CHECK" });
      list.textContent = "";
      list.append(renderContractIndexRow("Status", "Contract index API blocked: " + (error?.message || "unknown")));
    }
  }

  function renderReceiverHandoffRecord(record) {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    const copyButton = document.createElement("button");
    const copyStatus = document.createElement("span");
    const postButton = document.createElement("button");
    const postStatus = document.createElement("span");

    row.dataset.receiverHandoffProvenanceItem = "true";
    row.dataset.receiverHandoffBridgeCard = "true";
    row.dataset.bundleId = text(record.bundle_id, "");
    row.dataset.syntheticProof = record.synthetic_proof === true ? "true" : "false";
    row.dataset.syntheticReason = text(record.synthetic_reason, "operator_handoff");
    dt.textContent = text(record.packet_id);
    dd.textContent =
      text(record.state) +
        " / " + text(record.returned_status) +
        " / joined " + (record.contract_event_joined ? "YES" : "NO") +
        " / " + text(record.receiver) +
        "\\nhandoff " + text(record.handoff_path) +
        "\\nreturned " + text(record.returned_receipt_path) +
        "\\ncontract " + text(record.contract_receipt_path) +
        "\\nreturn command " + text(record.post_command) +
        "\\n" + text(record.truth_boundary);
    copyButton.type = "button";
    copyButton.dataset.copyReceiverHandoffCommand = "true";
    copyButton.dataset.command = text(record.post_command, "");
    copyButton.textContent = "COPY RETURN COMMAND";
    copyStatus.dataset.copyReceiverHandoffStatus = "true";
    copyStatus.textContent = "";
    postButton.type = "button";
    postButton.dataset.postReceiverHandoffReturn = "true";
    postButton.dataset.bundleId = text(record.bundle_id, "");
    postButton.disabled = text(record.state) === "posted";
    postButton.textContent = text(record.state) === "posted" ? "RETURN POSTED" : "POST RETURNED RECEIPT";
    postStatus.dataset.postReceiverHandoffStatus = "true";
    postStatus.textContent = "";
    if (record.synthetic_proof === true) {
      dd.append(document.createElement("br"), renderReceiverHandoffProvenanceBadge(record));
    }
    dd.append(document.createElement("br"), copyButton, copyStatus, document.createElement("br"), postButton, postStatus);
    if (text(record.state) === "pending_receiver") {
      dd.append(document.createElement("br"), renderReceiverHandoffFillForm(record));
    }
    row.append(dt, dd);
    return row;
  }

  function renderReceiverHandoffProvenanceBadge(record) {
    const badge = document.createElement("span");
    badge.className = "td-receipt-pickup__provenance td-receipt-pickup__provenance--synthetic";
    badge.dataset.receiverHandoffProvenanceBadge = "true";
    badge.dataset.syntheticProof = "true";
    badge.dataset.syntheticReason = text(record.synthetic_reason, "");
    badge.textContent = "SYNTHETIC PROOF";
    return badge;
  }

  function renderReceiverHandoffFillForm(record) {
    const form = document.createElement("form");
    const status = document.createElement("span");
    const select = document.createElement("select");
    const attempted = document.createElement("input");
    const changed = document.createElement("input");
    const proof = document.createElement("textarea");
    const button = document.createElement("button");

    form.dataset.fillReceiverHandoffReturn = "true";
    form.dataset.bundleId = text(record.bundle_id, "");
    form.dataset.receiver = text(record.receiver, "");

    select.dataset.fillReturnStatus = "true";
    select.name = "status";
    ["partial", "completed"].forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    });

    attempted.dataset.fillReturnAttempted = "true";
    attempted.name = "attempted";
    attempted.placeholder = "receiver attempted";
    changed.dataset.fillReturnChanged = "true";
    changed.name = "changed";
    changed.placeholder = "changed artifact path";
    proof.dataset.fillReturnProof = "true";
    proof.name = "proof_readbacks";
    proof.placeholder = "proof readback";
    proof.rows = 2;
    button.type = "submit";
    button.textContent = "FILL RETURN RECEIPT";
    status.dataset.fillReceiverHandoffStatus = "true";
    status.textContent = "";
    form.append(select, attempted, changed, proof, button, status);
    return form;
  }

  function receiverHandoffFreshnessFor(result) {
    const invalidCount = Number(result.invalid_count ?? 0) + Number(result.malformed_count ?? 0);
    if (invalidCount > 0) return { label: "CHECK / " + invalidCount + " invalid", state: "CHECK" };
    const count = Number(result.count ?? 0);
    if (count === 0) return { label: "EMPTY", state: "EMPTY" };
    const pending =
      Number(result.pending_count ?? 0) +
        Number(result.returned_unposted_count ?? 0) +
        Number(result.template_return_blocked_count ?? 0);
    if (pending > 0) return { label: "PENDING / " + pending + " open / " + count + " bundles", state: "PENDING" };
    return { label: "POSTED / " + Number(result.posted_count ?? 0) + " of " + count, state: "POSTED" };
  }

  function setReceiverHandoffFreshness(panel, freshness) {
    const node = panel.querySelector("[data-receiver-handoff-freshness]");
    if (!node) return;
    node.textContent = freshness.label;
    node.dataset.state = freshness.state;
  }

  function latestPostedHandoffFor(records) {
    return records.find((record) => text(record.state) === "posted" && record.contract_event_joined)
      || records.find((record) => text(record.state) === "posted")
      || null;
  }

  function postedReceiptHref(record) {
    const bundleId = text(record?.bundle_id, "");
    return bundleId ? "/tinkerden/receipts#receiver-handoff-posted-" + bundleId : "/tinkerden/receipts#receiver-handoff-posted";
  }

  function appendReceiverHandoffPostedLink(node, record) {
    const link = document.createElement("a");
    link.href = postedReceiptHref(record);
    link.dataset.receiverHandoffLatestPostedLink = "true";
    link.textContent = "Open posted receipts";
    node.append(document.createTextNode(" "), link);
  }

  function setReceiverHandoffLatestPosted(panel, record) {
    const node = panel.querySelector("[data-receiver-handoff-latest-posted]");
    if (!node) return;

    if (!record) {
      node.textContent = "Latest posted NONE";
      node.dataset.state = "EMPTY";
      node.dataset.bundleId = "";
      node.dataset.receiptId = "";
      node.dataset.contractReceiptPath = "";
      appendReceiverHandoffPostedLink(node, null);
      return;
    }

    node.textContent =
      "Latest posted " + text(record.bundle_id) +
        " / receipt " + text(record.returned_receipt_id) +
        " / contract " + text(record.contract_receipt_path) +
        " / joined " + (record.contract_event_joined ? "YES" : "NO");
    node.dataset.state = text(record.state);
    node.dataset.bundleId = text(record.bundle_id);
    node.dataset.receiptId = text(record.returned_receipt_id);
    node.dataset.contractReceiptPath = text(record.contract_receipt_path);
    appendReceiverHandoffPostedLink(node, record);
  }

  function receiverHandoffProvenanceCounts(records) {
    const synthetic = records.filter((record) => record?.synthetic_proof === true).length;
    return {
      total: records.length,
      synthetic,
      operator: records.length - synthetic
    };
  }

  function normalizeReceiverHandoffProvenanceMode(mode) {
    return mode === "operator" || mode === "synthetic" ? mode : "all";
  }

  function receiverHandoffProvenanceModeFromLocation() {
    try {
      const params = new URLSearchParams(window.location.search);
      return normalizeReceiverHandoffProvenanceMode(params.get("handoff_provenance") || params.get("provenance") || "all");
    } catch {
      return "all";
    }
  }

  function syncReceiverHandoffProvenanceModeToLocation(mode) {
    if (!window.history?.replaceState) return;
    const safeMode = normalizeReceiverHandoffProvenanceMode(mode);
    const url = new URL(window.location.href);
    if (safeMode === "all") {
      url.searchParams.delete("handoff_provenance");
    } else {
      url.searchParams.set("handoff_provenance", safeMode);
    }
    window.history.replaceState(null, "", url);
  }

  function initializeReceiverHandoffProvenanceFilter(panel) {
    const root = panel.querySelector("[data-receiver-handoff-provenance-filter]");
    if (!root || root.getAttribute("data-url-mode-initialized") === "true") return;
    root.setAttribute("data-active-filter", receiverHandoffProvenanceModeFromLocation());
    root.setAttribute("data-url-mode-initialized", "true");
  }

  function shouldShowReceiverHandoffProvenance(mode, synthetic) {
    if (mode === "operator") return !synthetic;
    if (mode === "synthetic") return synthetic;
    return true;
  }

  function applyReceiverHandoffProvenanceFilter(panel, mode, options = {}) {
    const root = panel.querySelector("[data-receiver-handoff-provenance-filter]");
    if (!root) return;
    const safeMode = normalizeReceiverHandoffProvenanceMode(mode);
    const items = Array.from(panel.querySelectorAll("[data-receiver-handoff-provenance-item]"));
    let visible = 0;

    items.forEach((item) => {
      const synthetic = item.getAttribute("data-synthetic-proof") === "true";
      const show = shouldShowReceiverHandoffProvenance(safeMode, synthetic);
      item.hidden = !show;
      item.setAttribute("data-provenance-visible", show ? "true" : "false");
      if (show) visible += 1;
    });

    root.setAttribute("data-active-filter", safeMode);
    root.querySelectorAll("[data-provenance-filter-mode]").forEach((button) => {
      button.setAttribute("aria-pressed", button.getAttribute("data-provenance-filter-mode") === safeMode ? "true" : "false");
    });
    const summary = root.querySelector("[data-receiver-handoff-provenance-visible-count]");
    if (summary) summary.textContent = visible + " visible";
    if (options.updateUrl) syncReceiverHandoffProvenanceModeToLocation(safeMode);
  }

  function setReceiverHandoffProvenanceCounts(panel, records) {
    const root = panel.querySelector("[data-receiver-handoff-provenance-filter]");
    if (!root) return;
    initializeReceiverHandoffProvenanceFilter(panel);
    const counts = receiverHandoffProvenanceCounts(records);
    root.setAttribute("data-total-count", String(counts.total));
    root.setAttribute("data-operator-count", String(counts.operator));
    root.setAttribute("data-synthetic-count", String(counts.synthetic));
    const all = root.querySelector('[data-provenance-filter-mode="all"]');
    const operator = root.querySelector('[data-provenance-filter-mode="operator"]');
    const synthetic = root.querySelector('[data-provenance-filter-mode="synthetic"]');
    if (all) all.textContent = "ALL " + counts.total;
    if (operator) operator.textContent = "OPERATOR " + counts.operator;
    if (synthetic) synthetic.textContent = "SYNTHETIC " + counts.synthetic;
    applyReceiverHandoffProvenanceFilter(panel, root.getAttribute("data-active-filter") || "all");
  }

  async function hydrateReceiverHandoffs() {
    const panel = document.querySelector("[data-receiver-handoff-panel]");
    const list = document.querySelector("[data-receiver-handoff-list]");
    if (!panel || !list) return;

    try {
      const response = await fetch(panel.dataset.receiverHandoffApi || "/api/organism/contracts/receiver-handoffs?limit=25", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Receiver handoff API failed.");

      const records = Array.isArray(result.records) ? result.records : [];
      setReceiverHandoffFreshness(panel, receiverHandoffFreshnessFor(result));
      setReceiverHandoffLatestPosted(panel, latestPostedHandoffFor(records));
      setReceiverHandoffProvenanceCounts(panel, records);
      list.textContent = "";
      list.append(renderContractIndexRow("Bundles", text(String(result.count ?? 0))));
      list.append(renderContractIndexRow("Posted", text(String(result.posted_count ?? 0))));
      list.append(renderContractIndexRow("Pending", text(String(
        (result.pending_count ?? 0) +
          (result.returned_unposted_count ?? 0) +
          (result.template_return_blocked_count ?? 0)
      ))));
      list.append(renderContractIndexRow("Invalid", text(String((result.invalid_count ?? 0) + (result.malformed_count ?? 0)))));

      if (records.length === 0) {
        list.append(renderContractIndexRow("Status", "No receiver handoff bundles found"));
        applyReceiverHandoffProvenanceFilter(
          panel,
          panel.querySelector("[data-receiver-handoff-provenance-filter]")?.getAttribute("data-active-filter") || "all"
        );
        return;
      }

      records.forEach((record) => list.append(renderReceiverHandoffRecord(record)));
      applyReceiverHandoffProvenanceFilter(
        panel,
        panel.querySelector("[data-receiver-handoff-provenance-filter]")?.getAttribute("data-active-filter") || "all"
      );
    } catch (error) {
      setReceiverHandoffFreshness(panel, { label: "CHECK / API blocked", state: "CHECK" });
      list.textContent = "";
      setReceiverHandoffProvenanceCounts(panel, []);
      list.append(renderContractIndexRow("Status", "Receiver handoff API blocked: " + (error?.message || "unknown")));
    }
  }

  async function createReceiverHandoffFromContract(button) {
    const packetId = button.dataset.packetId || "";
    const receiver = button.dataset.receiver || "Receiver@Unknown";
    const status = button.parentElement?.querySelector("[data-receiver-handoff-create-status]");

    if (!packetId) {
      if (status) status.textContent = " BLOCKED: packet id missing.";
      return;
    }

    button.disabled = true;
    if (status) status.textContent = " Creating handoff...";

    try {
      const response = await fetch("/api/organism/contracts/receiver-handoffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packet_id: packetId,
          receiver,
          base_url: window.location.origin
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Receiver handoff create failed.");
      button.dataset.createdBundleId = result.bundle_id;
      button.dataset.createdHandoffPath = result.handoff_path;
      button.textContent = "HANDOFF CREATED";
      if (status) status.textContent = " " + text(result.bundle_id) + " / " + text(result.receipt_template_status) + ".";
      hydrateReceiverHandoffs();
    } catch (error) {
      button.disabled = false;
      if (status) status.textContent = " BLOCKER: " + (error?.message || "unknown");
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-create-receiver-handoff]");
    if (!button) return;
    createReceiverHandoffFromContract(button);
  });

  async function postReceiverHandoffReturn(button) {
    const bundleId = button.dataset.bundleId || "";
    const status = button.parentElement?.querySelector("[data-post-receiver-handoff-status]");

    if (!bundleId.trim()) {
      if (status) status.textContent = " BLOCKED: bundle id missing.";
      return;
    }

    button.disabled = true;
    if (status) status.textContent = " Posting returned receipt...";

    try {
      const response = await fetch("/api/organism/contracts/receiver-handoffs/post-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundle_id: bundleId,
          detected_by: "TinkerDenReceiverHandoffLane@Browser"
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Receiver handoff return post failed.");
      button.textContent = "RETURN POSTED";
      button.dataset.postedReceiptId = text(result.receipt_id);
      button.dataset.contractReceiptPath = text(result.contract_write?.artifact_path);
      if (status) status.textContent = " " + text(result.receipt_id) + " / " + text(result.receipt_status) + ".";
      hydrateReceiverHandoffs();
    } catch (error) {
      button.disabled = false;
      if (status) status.textContent = " BLOCKER: " + (error?.message || "unknown");
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-post-receiver-handoff-return]");
    if (!button) return;
    postReceiverHandoffReturn(button);
  });

  function lineValues(value) {
    return String(value || "")
      .split(/\\r?\\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function fillReceiverHandoffReturn(form) {
    const status = form.querySelector("[data-fill-receiver-handoff-status]");
    const button = form.querySelector("button[type='submit']");
    const bundleId = form.dataset.bundleId || "";
    const receiver = form.dataset.receiver || "Receiver@Unknown";
    const receiptStatus = form.querySelector("[data-fill-return-status]")?.value || "partial";
    const attempted = form.querySelector("[data-fill-return-attempted]")?.value || "";
    const changed = form.querySelector("[data-fill-return-changed]")?.value || "";
    const proof = form.querySelector("[data-fill-return-proof]")?.value || "";

    if (!bundleId.trim()) {
      if (status) status.textContent = " BLOCKED: bundle id missing.";
      return;
    }

    button.disabled = true;
    if (status) status.textContent = " Filling returned receipt...";

    try {
      const response = await fetch("/api/organism/contracts/receiver-handoffs/fill-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundle_id: bundleId,
          receiver,
          status: receiptStatus,
          attempted,
          changed: lineValues(changed),
          proof_readbacks: lineValues(proof),
          next_safe_action: "Post this returned receipt through the Receiver Handoff Lane after receiver review."
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Receiver handoff fill-return failed.");
      const panel = form.closest("[data-receiver-handoff-panel]");
      if (panel) {
        panel.dataset.lastFillReturnReceiptId = text(result.receipt_id);
        panel.dataset.lastFillReturnPath = text(result.returned_receipt_path);
      }
      button.textContent = "RETURN FILLED";
      form.dataset.filledReceiptId = text(result.receipt_id);
      form.dataset.filledReturnPath = text(result.returned_receipt_path);
      if (status) status.textContent = " " + text(result.receipt_id) + " / " + text(result.returned_receipt_path) + ".";
      hydrateReceiverHandoffs();
    } catch (error) {
      button.disabled = false;
      if (status) status.textContent = " BLOCKER: " + (error?.message || "unknown");
    }
  }

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-fill-receiver-handoff-return]");
    if (!form) return;
    event.preventDefault();
    fillReceiverHandoffReturn(form);
  });

  function renderCommandSurfaceReceipt(panel, result) {
    panel.textContent = "";

    const card = document.createElement("article");
    card.className = "td-command-console__receipt";

    const header = document.createElement("header");
    const title = document.createElement("strong");
    title.textContent = text(result.status || result.receipt?.status_guess);
    const receiptId = document.createElement("code");
    receiptId.textContent = text(result.receipt_id);
    header.append(title, receiptId);

    const dl = document.createElement("dl");
    [
      ["Packet", text(result.packet_id)],
      ["Destination", text(result.destination_label || result.receipt?.destination_label)],
      ["Packet path", text(result.packet_path)],
      ["Receipt path", text(result.receipt_path)],
      ["Aeye relay status", text(result.aeye_relay_status || result.receipt?.aeye_relay_status)],
      ["Aeye packet", text(result.aeye_packet_id || result.receipt?.aeye_packet_id)],
      ["Aeye receipt", text(result.aeye_receipt_id || result.receipt?.aeye_receipt_id)],
      ["Aeye outbox", text(result.aeye_outbox_path || result.receipt?.aeye_outbox_path)],
      ["Aeye inbox", text(result.aeye_inbox_path || result.receipt?.aeye_inbox_path)],
      ["Aeye receipt path", text(result.aeye_receipt_path || result.receipt?.aeye_receipt_path)],
      ["Packet hash", text(result.packet_hash)],
      ["Receiver read hash", text(result.receiver_read_hash)],
      ["Aeye payload command hash", text(result.aeye_payload_command_hash || result.receipt?.aeye_payload_command_hash)],
      ["Aeye inbox packet link", result.aeye_inbox_packet_match || result.receipt?.aeye_inbox_packet_match ? "YES" : "NO"],
      ["Aeye receipt packet link", result.aeye_receipt_packet_match || result.receipt?.aeye_receipt_packet_match ? "YES" : "NO"],
      ["Hash match", result.receiver_hash_match ? "YES" : "NO"],
      ["Missing receiver proof", text(result.missing_receiver_proof || "NONE")]
    ].forEach(([label, value]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      row.append(dt, dd);
      dl.append(row);
    });

    card.append(header, dl);
    panel.append(card);
  }

  function commandSurfaceDestination(surface) {
    const select = surface?.querySelector("[data-command-destination]");
    const selected = select?.selectedOptions?.[0];

    return {
      id: selected?.value || "",
      label: selected?.textContent?.trim() || "NO VERIFIED DESTINATION",
      aeye: selected?.dataset?.aeye || "UNKNOWN",
      machine: selected?.dataset?.machine || "UNKNOWN",
      destination_type: selected?.dataset?.destinationType || "UNKNOWN",
      internal_destination: selected?.dataset?.internalDestination || "UNKNOWN"
    };
  }

  function commandSurfacePreviewPayload(command, destination, packet) {
    if (packet) return packet;

    return {
      schema: "tinkerden_command_packet_v0",
      packet_id: "generated_on_write",
      source: "TinkerDen@Betsy",
      target: destination.label,
      target_aeye: destination.aeye,
      target_machine: destination.machine,
      destination_id: destination.id || "select_verified_destination",
      destination_type: destination.destination_type,
      internal_destination: destination.internal_destination,
      command: command.trim() || "Write command text to preview packet payload.",
      status: "PREVIEW_NOT_WRITTEN",
      packet_type: "COMMAND",
      required_return: "ACK / BLOCKER / ARTIFACT",
      proof_rule: "This preview is not proof. Proof starts after WRITE TO INBOX and receiver hash read.",
      required_surfaces: {
        inbox: "tinkerden/inbox",
        receipts: "tinkerden/receipts",
        decision_ledger: "tinkerden/feedback/decision-ledger.jsonl"
      }
    };
  }

  function updateCommandSurfacePreview(surface, packet) {
    const preview = surface?.querySelector("[data-command-packet-preview]");
    const input = surface?.querySelector("[data-command-input]");
    if (!preview) return;
    const command = input?.value || "";
    preview.textContent = JSON.stringify(commandSurfacePreviewPayload(command, commandSurfaceDestination(surface), packet), null, 2);
  }

  function initializeCommandSurfacePreviews() {
    document.querySelectorAll("[data-command-surface]").forEach((surface) => {
      updateCommandSurfacePreview(surface);
    });
  }

  document.addEventListener("input", (event) => {
    const input = event.target?.closest?.("[data-command-input]");
    if (!input) return;
    updateCommandSurfacePreview(input.closest("[data-command-surface]"));
  });

  document.addEventListener("change", (event) => {
    const select = event.target?.closest?.("[data-command-destination]");
    if (!select) return;
    updateCommandSurfacePreview(select.closest("[data-command-surface]"));
  });

  document.addEventListener("submit", async (event) => {
    const form = event.target?.closest?.("[data-command-surface-form]");
    if (!form) return;

    event.preventDefault();

    const surface = form.closest("[data-command-surface]");
    const input = form.querySelector("[data-command-input]");
    const destination = form.querySelector("[data-command-destination]");
    const button = form.querySelector("button[type='submit']");
    const status = surface?.querySelector("[data-command-surface-status]");
    const receiptPanel = surface?.querySelector("[data-command-receipt-panel]");
    const command = input?.value || "";
    const destinationId = destination?.value || "";

    if (!command.trim()) {
      if (status) {
        status.dataset.kind = "error";
        status.textContent = "BLOCKER: command text is required.";
      }
      return;
    }

    if (!destinationId) {
      if (status) {
        status.dataset.kind = "error";
        status.textContent = "BLOCKER: choose a verified Aeye@Machine destination.";
      }
      return;
    }

    if (button) button.disabled = true;
    if (status) {
      status.dataset.kind = "pending";
      status.textContent = "Writing packet, relaying to Aeye inbox, and waiting for ACK / BLOCKER / ARTIFACT...";
    }

    try {
      const response = await fetch("/api/tinkerden/command-surface", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          destination_id: destinationId,
          source_surface: "TinkerDenBridge@Betsy",
          stream: "FERAL / TINKERDEN",
          command_type: "BRIDGE_COMMAND"
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "COMMAND_SURFACE_FAILED");

      if (status) {
        status.dataset.kind = result.status === "ACK" || result.status === "ARTIFACT" ? "ok" : "error";
        status.textContent =
          result.status + ": packet " + result.packet_id +
          " written for " + text(result.destination_label) +
          ", Aeye relay " + text(result.aeye_relay_status) +
          ", receiver hash " + (result.receiver_hash_match ? "matched" : "failed") +
          ", receipt " + result.receipt_id + " returned.";
      }
      updateCommandSurfacePreview(surface, { ...result.packet, packet_path: result.packet_path, packet_hash: result.packet_hash });
      if (receiptPanel) renderCommandSurfaceReceipt(receiptPanel, result);
      hydrateReceiptPickup();
      hydrateContractIndex();
      hydrateReceiverHandoffs();
    } catch (error) {
      if (status) {
        status.dataset.kind = "error";
        status.textContent = "BLOCKER: " + (error?.message || "unknown");
      }
    } finally {
      if (button) button.disabled = false;
    }
  });

  function executeStatusFor(form, message, kind) {
    const node = form.querySelector("[data-execute-status]");
    if (!node) return;
    node.textContent = message;
    node.dataset.kind = kind;
  }

  function contractProofText(result) {
    const packetPath = result.contract_write?.packet?.artifact_path;
    const receiptPath = result.contract_write?.receipt?.artifact_path;
    const runnerReceiptPath = result.contract_write?.runner_receipt?.artifact_path;
    const parts = [];
    if (packetPath) parts.push("contract packet " + text(packetPath));
    if (receiptPath) parts.push("contract receipt " + text(receiptPath));
    if (runnerReceiptPath) parts.push("runner contract receipt " + text(runnerReceiptPath));
    if (parts.length === 0) return "";
    return " " + parts.join(", ") + ".";
  }

  function rememberContractProof(form, result) {
    const packetPath = result.contract_write?.packet?.artifact_path;
    const receiptPath = result.contract_write?.receipt?.artifact_path;
    const runnerReceiptPath = result.contract_write?.runner_receipt?.artifact_path;
    if (packetPath) form.dataset.contractPacketPath = packetPath;
    if (receiptPath) form.dataset.contractReceiptPath = receiptPath;
    if (runnerReceiptPath) form.dataset.contractRunnerReceiptPath = runnerReceiptPath;
  }

  function bridgeStateFor(form, state) {
    const node = form.querySelector("[data-execute-state]");
    if (!node) return;
    node.textContent = state;
    node.dataset.state = state;
  }

  function cardStatusFor(form, status) {
    const node = form.querySelector("[data-card-status]");
    if (!node) return;
    node.textContent = status;
    node.dataset.state = status;
  }

  function copyFallback(text) {
    const node = document.createElement("textarea");
    node.value = text;
    node.setAttribute("readonly", "true");
    node.style.position = "fixed";
    node.style.left = "-9999px";
    document.body.appendChild(node);
    node.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(node);
    }
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        copyFallback(text);
        return;
      }
    }
    copyFallback(text);
  }

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-receiver-handoff-command]");
    if (!button) return;
    const command = button.dataset.command || "";
    const status = button.parentElement?.querySelector("[data-copy-receiver-handoff-status]");

    if (!command.trim()) {
      if (status) status.textContent = " BLOCKED: return command missing.";
      return;
    }

    try {
      await copyText(command);
      if (status) status.textContent = " Command copied.";
    } catch (error) {
      if (status) status.textContent = " BLOCKER: " + (error?.message || "copy failed");
    }
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-provenance-filter-mode]");
    if (!button) return;
    const panel = button.closest("[data-receiver-handoff-panel]");
    if (!panel) return;
    applyReceiverHandoffProvenanceFilter(panel, button.getAttribute("data-provenance-filter-mode") || "all", { updateUrl: true });
  });

  function setRelayChoice(form, choice) {
    if (!choice) return;
    form.dataset.operatorSelection = choice;
    form.querySelectorAll("[data-relay-choice]").forEach((candidate) => {
      candidate.dataset.selected = candidate.dataset.relayChoice === choice ? "true" : "false";
    });
    cardStatusFor(form, "SELECTED");
    bridgeStateFor(form, "SELECTED");
    executeStatusFor(form, choice + " selected. EXECUTE will create a dispatch packet.", "pending");
  }

  document.addEventListener("click", async (event) => {
    const relayChoice = event.target.closest("[data-relay-choice]");
    if (!relayChoice) return;

    const form = relayChoice.closest("[data-bridge-card]");
    if (!form) return;

    setRelayChoice(form, relayChoice.dataset.relayChoice);
  });

  document.addEventListener("click", (event) => {
    const gateChoice = event.target.closest("[data-spawn-gate-choice]");
    if (!gateChoice) return;

    const card = gateChoice.closest("[data-spawn-gate-card]");
    if (!card) return;

    const choice = gateChoice.dataset.spawnGateChoice || "UNKNOWN";
    card.querySelectorAll("[data-spawn-gate-choice]").forEach((candidate) => {
      candidate.dataset.selected = candidate === gateChoice ? "true" : "false";
    });

    const status = card.querySelector("[data-spawn-gate-status]");
    if (!status) return;
    status.dataset.state = choice;
    status.textContent = "Human Gate selected: " + choice + ". No action spawned.";
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-execute]");
    if (!button) return;

    const form = button.closest("[data-bridge-card]");
    if (!form) return;

    const operatorSelection = form.dataset.operatorSelection || "";

    if (!operatorSelection) {
      cardStatusFor(form, "BLOCKED");
      bridgeStateFor(form, "BLOCKED");
      executeStatusFor(form, "Select KEEP, KILL, STEAL, or MERGE before EXECUTE.", "error");
      return;
    }

    button.disabled = true;
    bridgeStateFor(form, "SELECTED");
    executeStatusFor(form, "Creating dispatch packet...", "pending");

    try {
      const response = await fetch("/api/tinkerden/bridge/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: form.dataset.cardId,
          operator_selection: operatorSelection,
          move: form.dataset.move,
          recommendation: form.dataset.recommendation,
          composite_score: Number(form.dataset.compositeScore),
          operator_reason: "",
          why_now: form.dataset.whyNow,
          recommended_because: form.dataset.recommendedBecause
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Execute failed.");
      cardStatusFor(form, result.card_status || "DISPATCHED");
      bridgeStateFor(form, "DISPATCHED");
      executeStatusFor(
        form,
        "Packet " + result.packet_id + " written to " + result.packet_path + ", relay event " + result.event_path + ", receipt " + result.receipt_id + " written to " + result.receipt_path + "." + contractProofText(result),
        "ok"
      );
      bridgeStateFor(form, result.visible_state || "RECEIPT_LINKED");
      form.dataset.packetId = result.packet_id;
      form.dataset.packetPath = result.packet_path;
      form.dataset.receiptId = result.receipt_id;
      form.dataset.receiptPath = result.receipt_path;
      rememberContractProof(form, result);
      hydrateReceiptPickup();
      hydrateContractIndex();
      hydrateReceiverHandoffs();
    } catch (error) {
      executeStatusFor(form, "Execute blocked: " + (error?.message || "unknown"), "error");
    } finally {
      button.disabled = false;
    }
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-packet-relay]");
    if (!button) return;

    const form = button.closest("[data-bridge-card]");
    if (!form) return;

    const operatorSelection = form.dataset.operatorSelection || "";

    if (!operatorSelection) {
      cardStatusFor(form, "BLOCKED");
      bridgeStateFor(form, "BLOCKED");
      executeStatusFor(form, "Select KEEP, KILL, STEAL, or MERGE before APPROVE + PACKET RELAY.", "error");
      return;
    }

    button.disabled = true;
    cardStatusFor(form, "SELECTED");
    bridgeStateFor(form, "SELECTED");
    executeStatusFor(form, "Creating Packet Relay packet and focusing workspace target...", "pending");

    try {
      const response = await fetch("/api/tinkerden/packet-relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: form.dataset.cardId,
          operator_selection: operatorSelection,
          move: form.dataset.move,
          recommendation: form.dataset.recommendation,
          composite_score: Number(form.dataset.compositeScore),
          operator_reason: "",
          why_now: form.dataset.whyNow,
          recommended_because: form.dataset.recommendedBecause
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Packet Relay failed.");

      if (!result.clipboard_set) {
        await copyText(result.packet_relay_text || "");
      }
      cardStatusFor(form, result.card_status || "RELAY_READY");
      bridgeStateFor(form, "RELAY_READY");
      executeStatusFor(
        form,
        (result.operator_instruction || "Target focused. Paste/send now.") +
          " Packet " + result.packet_id +
          " -> relay " + (result.relay_id || "UNKNOWN") +
          " -> receipt " + (result.receipt_id || "UNKNOWN") +
          " loaded to clipboard. Workspace target: " + (result.workspace_target?.label || "UNKNOWN") +
          ". Clipboard verified: " + (result.clipboard_verified ? "Y" : "N") +
          ". No auto-send performed." +
          contractProofText(result),
        "ok"
      );
      form.dataset.packetId = result.packet_id;
      form.dataset.packetPath = result.packet_path;
      form.dataset.relayId = result.relay_id;
      form.dataset.receiptId = result.receipt_id;
      form.dataset.receiptPath = result.receipt_path;
      rememberContractProof(form, result);
      hydrateReceiptPickup();
      hydrateContractIndex();
      hydrateReceiverHandoffs();
    } catch (error) {
      executeStatusFor(form, "Packet Relay blocked: " + (error?.message || "unknown"), "error");
    } finally {
      button.disabled = false;
    }
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-workspace-relay]");
    if (!button) return;

    const form = button.closest("[data-bridge-card]");
    if (!form) return;

    const operatorSelection = form.dataset.operatorSelection || "";

    if (!operatorSelection) {
      cardStatusFor(form, "BLOCKED");
      bridgeStateFor(form, "BLOCKED");
      executeStatusFor(form, "Select KEEP, KILL, STEAL, or MERGE before APPROVE + WORKSPACE RELAY.", "error");
      return;
    }

    button.disabled = true;
    cardStatusFor(form, "SELECTED");
    bridgeStateFor(form, "SELECTED");
    executeStatusFor(form, "Creating packet and handing it to the Betsy machine runner...", "pending");

    try {
      const response = await fetch("/api/tinkerden/workspace-relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: form.dataset.cardId,
          operator_selection: operatorSelection,
          move: form.dataset.move,
          recommendation: form.dataset.recommendation,
          composite_score: Number(form.dataset.compositeScore),
          operator_reason: "",
          why_now: form.dataset.whyNow,
          recommended_because: form.dataset.recommendedBecause
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Workspace Relay failed.");

      cardStatusFor(form, result.card_status || "WORKSPACE_RELAY_READY");
      bridgeStateFor(form, result.relay_status || "READY_FOR_AEYE");
      executeStatusFor(
        form,
        (result.operator_instruction || "Workspace Relay complete.") +
          " Packet " + result.packet_id +
          " -> relay " + (result.relay_id || "UNKNOWN") +
          " -> runner receipt " + (result.receipt_id || "UNKNOWN") +
          ". Clipboard verified: " + (result.clipboard_verified ? "Y" : "N") +
          ". Workspace focused: " + (result.workspace_focused ? "Y" : "N") +
          ". Runner mode: " + (result.runner?.runner_mode || "UNKNOWN") +
          "." +
          contractProofText(result),
        result.workspace_focused ? "ok" : "pending"
      );
      form.dataset.packetId = result.packet_id;
      form.dataset.packetPath = result.packet_path;
      form.dataset.relayId = result.relay_id;
      form.dataset.receiptId = result.receipt_id;
      form.dataset.receiptPath = result.receipt_path;
      rememberContractProof(form, result);
      hydrateReceiptPickup();
      hydrateContractIndex();
      hydrateReceiverHandoffs();
    } catch (error) {
      executeStatusFor(form, "Workspace Relay blocked: " + (error?.message || "unknown"), "error");
    } finally {
      button.disabled = false;
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      hydrateReceiptPickup();
      hydrateContractIndex();
      hydrateReceiverHandoffs();
      initializeCommandSurfacePreviews();
    }, { once: true });
  } else {
    hydrateReceiptPickup();
    hydrateContractIndex();
    hydrateReceiverHandoffs();
    initializeCommandSurfacePreviews();
  }
})();
`;

function clampScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(10, score));
}

function compositeScore(card: RecommendationCard) {
  const values = [
    card.scores.momentum_gain,
    card.scores.mule_labor_reduction,
    card.scores.cooperation_gain,
    card.scores.continuity_gain,
    card.scores.capacity_gain
  ].map(clampScore);

  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10);
}

function isRecommendation(value: string): value is Recommendation {
  return value === "PROCEED" || value === "DEFER" || value === "KILL";
}

function normalizeCard(card: RecommendationCard): RecommendationCard {
  const recommendation = isRecommendation(card.recommendation) ? card.recommendation : "DEFER";
  const reversibility_gate = card.reversibility_gate === "PASS" ? "PASS" : "FAIL";

  return {
    ...card,
    recommendation,
    reversibility_gate,
    scores: {
      momentum_gain: clampScore(card.scores?.momentum_gain),
      mule_labor_reduction: clampScore(card.scores?.mule_labor_reduction),
      cooperation_gain: clampScore(card.scores?.cooperation_gain),
      continuity_gain: clampScore(card.scores?.continuity_gain),
      capacity_gain: clampScore(card.scores?.capacity_gain)
    }
  };
}

function receiptField(value: unknown) {
  if (typeof value !== "string") return "UNKNOWN";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "UNKNOWN";
}

function packetField(value: unknown) {
  if (typeof value !== "string") return "UNKNOWN";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "UNKNOWN";
}

function normalizeReceiptPickup(record: {
  receipt_id?: unknown;
  mission?: unknown;
  producer?: unknown;
  status_guess?: unknown;
  timestamp?: unknown;
  path?: unknown;
  linked_packet_id?: unknown;
}): ReceiptPickup {
  return {
    receiptId: receiptField(record.receipt_id),
    mission: receiptField(record.mission),
    producer: receiptField(record.producer),
    statusGuess: receiptField(record.status_guess),
    timestamp: receiptField(record.timestamp),
    path: receiptField(record.path),
    linkedPacketId: receiptField(record.linked_packet_id)
  };
}

function joinOrNone(values: string[]) {
  const clean = values.filter((value) => value && value !== "UNKNOWN");
  return clean.length > 0 ? clean.join(" · ") : "No active packets found";
}

function activePackets(packets: PacketRecord[]) {
  return packets.filter((packet) => {
    const status = packetField(packet.status);
    return !["RECEIPT_RETURNED", "VALIDATED", "ASSIMILATED", "KILLED"].includes(status);
  });
}

function blockerList(packets: PacketRecord[]) {
  const blockers = packets
    .filter((packet) => ["BLOCKED", "MISSING_RECEIPT"].includes(packetField(packet.status)))
    .map((packet) => `${packetField(packet.packet_id)}: ${packetField(packet.due_status)}`);
  return blockers.length > 0 ? blockers.join(" · ") : "None in packet state";
}

async function loadPacketState(): Promise<PacketRecord[]> {
  try {
    const raw = await readFile(path.join(process.cwd(), TINKERDEN_PACKET_STATE_PATH), "utf8");
    const parsed = JSON.parse(raw) as TinkerDenPacketState;
    return Array.isArray(parsed.packets) ? parsed.packets : [];
  } catch {
    return [];
  }
}

function packetLabel(packet: PacketRecord) {
  return `${packetField(packet.packet_id)} (${packetField(packet.status)})`;
}

function buildPacketLifecycle(packets: PacketRecord[]): PacketLifecycle {
  const awaiting = packets.filter((packet) => ["DISPATCHED", "SENT", "WORKING"].includes(packetField(packet.status)));
  const returned = packets.filter((packet) => packetField(packet.status) === "RECEIPT_RETURNED");
  const blocked = packets.filter((packet) => ["BLOCKED", "MISSING_RECEIPT"].includes(packetField(packet.status)));
  const archived = packets.filter((packet) => ["VALIDATED", "ASSIMILATED", "KILLED"].includes(packetField(packet.status)));

  return {
    active: joinOrNone(activePackets(packets).map(packetLabel)),
    awaitingReceipt: joinOrNone(awaiting.map(packetLabel)),
    receiptReturned: joinOrNone(returned.map(packetLabel)),
    blocked: joinOrNone(blocked.map((packet) => `${packetField(packet.packet_id)}: ${packetField(packet.due_status)}`)),
    archive: archived.length > 0 ? archived.map(packetLabel).join(" · ") : "No archived packets found"
  };
}

function buildAeyeLanes(packets: PacketRecord[]): AeyeLane[] {
  const lanes = new Map<string, PacketRecord[]>();
  for (const packet of packets) {
    const lane = `${packetField(packet.assigned_to)}@${packetField(packet.machine)}`;
    if (!lanes.has(lane)) lanes.set(lane, []);
    lanes.get(lane)?.push(packet);
  }

  return [...lanes.entries()].map(([lane, lanePackets]) => {
    const active = activePackets(lanePackets);
    const latest = lanePackets[0];
    return {
      lane,
      activePackets: joinOrNone(active.map(packetLabel)),
      latestStatus: latest ? `${packetField(latest.status)} · ${packetField(latest.due_status)}` : "UNKNOWN"
    };
  });
}

function buildRelayStatusLanes(
  executions: Array<{ packet_id: string; relay_id: string; receipt_id: string; relay_status: string; created_at: string }>,
  relayEvents: Array<{ packet_id: string; relay_id: string; receipt_id: string; relay_status: string; timestamp: string }>
): RelayStatusLane[] {
  const lanes = new Map<string, RelayStatusLane>();

  for (const execution of executions) {
    lanes.set(execution.packet_id, {
      packetId: execution.packet_id,
      relayId: execution.relay_id,
      receiptId: execution.receipt_id,
      relayStatus: execution.relay_status,
      timestamp: execution.created_at
    });
  }

  for (const event of relayEvents) {
    if (!event.packet_id || lanes.has(event.packet_id)) continue;
    if (event.relay_id === "UNKNOWN" || event.receipt_id === "UNKNOWN") continue;
    lanes.set(event.packet_id, {
      packetId: event.packet_id,
      relayId: event.relay_id,
      receiptId: event.receipt_id,
      relayStatus: event.relay_status,
      timestamp: event.timestamp
    });
  }

  return [...lanes.values()].slice(0, 10);
}

function buildContractLanes(contractIndex: Awaited<ReturnType<typeof readOrganismContractIndex>>): ContractLane[] {
  return contractIndex.records
    .filter((record) => record.lane.startsWith("TinkerDen "))
    .map((record) => ({
      packetId: record.packet_id,
      lane: record.lane,
      receiver: record.to,
      receiptId: record.receipt_id,
      receiptStatus: record.receipt_status,
      latestEventType: record.latest_event_type,
      latestEventAt: record.latest_event_at,
      joinedEventCount: record.joined_event_count,
      packetPath: record.packet_path,
      receiptPath: record.receipt_path,
      truthBoundary: record.truth_boundary,
    }));
}

function buildContractFreshness(
  contractIndex: Awaited<ReturnType<typeof readOrganismContractIndex>>,
  contractLanes: ContractLane[]
): ContractFreshness {
  const invalidCount = contractIndex.invalid_count + contractIndex.malformed_count;
  if (invalidCount > 0) return { label: `CHECK · ${invalidCount} invalid`, state: "CHECK" };
  if (contractLanes.length === 0) return { label: "NO MIRRORS", state: "NO_MIRRORS" };
  const missingJoins = contractLanes.filter((lane) => lane.joinedEventCount <= 0).length;
  if (missingJoins > 0) return { label: `CHECK · ${missingJoins} unjoined`, state: "CHECK" };

  const latest = contractLanes
    .map((lane) => Date.parse(lane.latestEventAt))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];
  if (!Number.isFinite(latest)) return { label: "CHECK · no event time", state: "CHECK" };

  const ageMinutes = Math.max(0, Math.floor((Date.now() - latest) / 60000));
  const state = ageMinutes <= 60 ? "LIVE" : "STALE";
  return { label: `${state} · ${contractLanes.length} lanes · ${ageMinutes}m`, state };
}

function buildReceiverHandoffLanes(
  handoffIndex: Awaited<ReturnType<typeof readReceiverHandoffIndex>>
): ReceiverHandoffLane[] {
  return handoffIndex.records.map((record) => ({
    bundleId: record.bundle_id,
    packetId: record.packet_id,
    lane: record.lane,
    state: record.state,
    returnedStatus: record.returned_status,
    returnedReceiptId: record.returned_receipt_id,
    receiver: record.receiver,
    returnedReceiver: record.returned_receiver,
    contractEventJoined: record.contract_event_joined,
    handoffPath: record.handoff_path,
    returnedReceiptPath: record.returned_receipt_path,
    contractReceiptPath: record.contract_receipt_path,
    postCommand: record.post_command,
    truthBoundary: record.truth_boundary,
    syntheticProof: record.synthetic_proof,
    syntheticReason: record.synthetic_reason,
  }));
}

function buildReceiverHandoffFreshness(
  handoffIndex: Awaited<ReturnType<typeof readReceiverHandoffIndex>>
): ReceiverHandoffFreshness {
  const invalidCount = handoffIndex.invalid_count + handoffIndex.malformed_count;
  if (invalidCount > 0) return { label: `CHECK / ${invalidCount} invalid`, state: "CHECK" };
  if (handoffIndex.count === 0) return { label: "EMPTY", state: "EMPTY" };
  const pending =
    handoffIndex.pending_count +
      handoffIndex.returned_unposted_count +
      handoffIndex.template_return_blocked_count;
  if (pending > 0) return { label: `PENDING / ${pending} open / ${handoffIndex.count} bundles`, state: "PENDING" };
  return { label: `POSTED / ${handoffIndex.posted_count} of ${handoffIndex.count}`, state: "POSTED" };
}

function buildReceiverHandoffLatestPosted(lanes: ReceiverHandoffLane[]): ReceiverHandoffLatestPosted {
  return lanes.find((lane) => lane.state === "posted" && lane.contractEventJoined)
    || lanes.find((lane) => lane.state === "posted")
    || null;
}

async function loadReceiptPickupState(): Promise<ReceiptPickupState> {
  try {
    const stream = await readTinkerdenReceiptStream(25);
    if (stream.missing) {
      return { found: false, sourcePath: stream.source_path, receipts: [] };
    }
    return {
      found: true,
      sourcePath: stream.source_path,
      receipts: stream.receipts.map(normalizeReceiptPickup)
    };
  } catch {
    return { found: false, sourcePath: "data/organism/receipt_pickup.jsonl", receipts: [] };
  }
}

async function loadBridgeState(): Promise<BridgeState> {
  const sourcePath = RECOMMENDATION_PATH.replaceAll("\\\\", "/");
  const fullPath = path.join(process.cwd(), RECOMMENDATION_PATH);

  try {
    const [raw, fileStat] = await Promise.all([readFile(fullPath, "utf8"), stat(fullPath)]);
    const parsed = JSON.parse(raw) as RecommendationFile;
    const generatedAt = parsed.generated_at || fileStat.mtime.toISOString();
    const staleAfterMinutes = parsed.stale_after_minutes ?? DEFAULT_STALE_AFTER_MINUTES;
    const generatedMs = Date.parse(generatedAt);
    const ageMinutes = Number.isFinite(generatedMs) ? (Date.now() - generatedMs) / 60000 : Number.POSITIVE_INFINITY;
    const cards = (parsed.cards ?? []).slice(0, 3).map(normalizeCard);

    return {
      found: true,
      sourcePath,
      generatedAt,
      staleAfterMinutes,
      isStale: ageMinutes > staleAfterMinutes,
      currentFrontier: {
        title: parsed.current_frontier?.title || "No current frontier named.",
        summary: parsed.current_frontier?.summary || "Medulla has not supplied frontier context yet."
      },
      cards: cards.map((card) => ({ ...card, compositeScore: compositeScore(card) }))
    };
  } catch (error) {
    return { found: false, sourcePath };
  }
}

function scoreLabel(label: string, value: number) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}/10</dd>
    </div>
  );
}

function recommendationClass(recommendation: Recommendation) {
  return `td-bridge-rec td-bridge-rec--${recommendation.toLowerCase()}`;
}

export default async function TinkerDenBridgePage() {
  const [state, receiptPickup, packets, executions, relayEvents, commandDestinations, contractIndex, receiverHandoffIndex] = await Promise.all([
    loadBridgeState(),
    loadReceiptPickupState(),
    loadPacketState(),
    readCanonicalExecutionRecords(10),
    readPacketRelayReadyEvents(10),
    readTinkerdenCommandDestinations(),
    readOrganismContractIndex(25),
    readReceiverHandoffIndex(25)
  ]);
  const packetLifecycle = buildPacketLifecycle(packets);
  const aeyeLanes = buildAeyeLanes(packets);
  const relayStatusLanes = buildRelayStatusLanes(executions, relayEvents);
  const contractLanes = buildContractLanes(contractIndex);
  const contractFreshness = buildContractFreshness(contractIndex, contractLanes);
  const receiverHandoffLanes = buildReceiverHandoffLanes(receiverHandoffIndex);
  const receiverHandoffFreshness = buildReceiverHandoffFreshness(receiverHandoffIndex);
  const receiverHandoffLatestPosted = buildReceiverHandoffLatestPosted(receiverHandoffLanes);
  const receiverHandoffSyntheticCount = receiverHandoffLanes.filter((handoff) => handoff.syntheticProof).length;
  const receiverHandoffOperatorCount = receiverHandoffLanes.length - receiverHandoffSyntheticCount;

  return (
    <main className="td-bridge">
      <TinkerDenSurfaceSwitcher active="bridge" handoffSummary={receiverHandoffIndex} />

      {!state.found ? (
        <section className="td-bridge-empty" aria-label="Bridge empty state">
          <h2>No recommendation cards found. Medulla not feeding Bridge yet.</h2>
          <p>Expected source: <code>{state.sourcePath}</code></p>
        </section>
      ) : (
        <>
          <section className="td-command-section td-command-section--why" aria-label="WHY">
            <p className="td-bridge__eyebrow">WHY</p>
            <h1>Mission Control: {state.currentFrontier.title}</h1>
            <p>{state.currentFrontier.summary}</p>
          </section>

          <section className="td-command-section td-command-section--now" aria-label="NOW">
            <header className="td-command-section__header">
              <div>
                <p className="td-bridge__eyebrow">NOW</p>
                <h2>Top 3 Moves</h2>
              </div>
              <p>Choose KEEP / KILL / STEAL / MERGE, then EXECUTE.</p>
            </header>

            <section className="td-command-console" aria-label="TinkerDen command surface" data-command-surface>
              <header>
                <div>
                  <p className="td-bridge__eyebrow">Command Surface</p>
                  <h3>Issue a command and wait for ACK / BLOCKER / ARTIFACT.</h3>
                </div>
                <strong>Betsy local receiver proof</strong>
              </header>

              <form className="td-command-console__form" data-command-surface-form>
                <label>
                  <span>Operator command</span>
                  <textarea
                    data-command-input
                    name="command"
                    rows={4}
                    placeholder="Write the command here. The UI will create a file-backed packet and wait for a receiver hash read."
                  />
                </label>
                <label>
                  <span>Aeye@Machine destination</span>
                  <select data-command-destination name="destination_id" defaultValue={commandDestinations[0]?.id ?? ""}>
                    {commandDestinations.length === 0 ? (
                      <option value="">No verified destinations</option>
                    ) : (
                      commandDestinations.map((destination) => (
                        <option
                          key={destination.id}
                          value={destination.id}
                          data-aeye={destination.aeye}
                          data-machine={destination.machine}
                          data-destination-type={destination.destination_type}
                          data-internal-destination={destination.internal_destination}
                        >
                          {destination.label}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <button type="submit">RELAY TO AEYE</button>
              </form>

              <section className="td-command-console__packet-preview" aria-label="Packet preview">
                <header>
                  <span>Packet preview</span>
                  <code>not proof until written</code>
                </header>
                <pre data-command-packet-preview />
              </section>

              <p className="td-command-console__status" data-command-surface-status data-kind="idle">
                No command issued from this surface yet.
              </p>

              <div className="td-command-console__surfaces" aria-label="Required file-backed surfaces">
                <code>/tinkerden/inbox</code>
                <code>/tinkerden/receipts</code>
                <code>/foreman/messages/outbox</code>
                <code>/foreman/messages/inbox</code>
                <code>/foreman/messages/receipts</code>
                <code>/tinkerden/feedback/decision-ledger.jsonl</code>
              </div>

              <div className="td-command-console__receipt-panel" data-command-receipt-panel>
                <p data-warning="stale">No receipt returned yet. Stale/no-receipt until RELAY TO AEYE returns ACK / BLOCKER / ARTIFACT.</p>
              </div>
            </section>

            <section
              className="td-spawn-gate"
              aria-label="Intent-to-Anatomy Human Gate"
              data-spawn-gate-card
            >
              <header className="td-spawn-gate__header">
                <div>
                  <p className="td-bridge__eyebrow">Human Gate</p>
                  <h3>Intent-to-Anatomy Proposal</h3>
                </div>
                <strong>Before Action</strong>
              </header>

              <div className="td-spawn-gate__layout">
                <section className="td-spawn-gate__section" aria-label="Operator Intent">
                  <span>Operator Intent</span>
                  <p>{spawnGateProposal.operatorIntent}</p>
                </section>

                <section className="td-spawn-gate__section" aria-label="Proposed anatomy">
                  <span>Proposed anatomy</span>
                  <ul>
                    {spawnGateProposal.proposedAnatomy.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="td-spawn-gate__section" aria-label="Risk level">
                  <span>Risk level</span>
                  <p>{spawnGateProposal.riskLevel}</p>
                </section>

                <section className="td-spawn-gate__section" aria-label="Human Gates">
                  <span>Human Gates</span>
                  <ul>
                    {spawnGateProposal.humanGates.map((gate) => (
                      <li key={gate}>{gate}</li>
                    ))}
                  </ul>
                </section>

                <section className="td-spawn-gate__section td-spawn-gate__section--wide" aria-label="Termination condition">
                  <span>Termination condition</span>
                  <p>{spawnGateProposal.terminationCondition}</p>
                </section>
              </div>

              <div className="td-spawn-gate__actions" aria-label="Human Gate decision">
                {(["PROCEED", "DEFER", "KILL"] as const).map((choice) => (
                  <button key={choice} type="button" data-spawn-gate-choice={choice} data-selected="false">
                    {choice}
                  </button>
                ))}
              </div>

              <p className="td-spawn-gate__status" data-spawn-gate-status data-state="AWAITING_GATE">
                Awaiting explicit Human Gate. No action spawned.
              </p>
            </section>

            <div className="td-bridge-moves" aria-label="Top 3 Moves">
              {state.cards.map((card, index) => (
                <form
                  className="td-bridge-card"
                  data-bridge-card
                  data-card-id={card.card_id}
                  data-move={card.move}
                  data-recommendation={card.recommendation}
                  data-composite-score={card.compositeScore}
                  data-why-now={card.why_now}
                  data-recommended-because={card.recommended_because}
                  key={card.card_id}
                >
                  <header>
                    <p>Move {index + 1}</p>
                    <h2>{card.move}</h2>
                  </header>

                  <div className="td-bridge-card__reason">
                    <p><strong>Why now</strong>{card.why_now}</p>
                    <p><strong>Recommended because</strong>{card.recommended_because}</p>
                  </div>

                  <dl className="td-bridge-score-grid">
                    {scoreLabel("Momentum gain", card.scores.momentum_gain)}
                    {scoreLabel("Mule labor reduction", card.scores.mule_labor_reduction)}
                    {scoreLabel("Cooperation gain", card.scores.cooperation_gain)}
                    {scoreLabel("Continuity gain", card.scores.continuity_gain)}
                    {scoreLabel("Capacity gain", card.scores.capacity_gain)}
                  </dl>

                  <section className="td-human-gates" aria-label={`Human Gates for ${card.move}`}>
                    <p className="td-bridge__eyebrow">Human Gates</p>
                    <dl className="td-bridge-gates">
                      <div>
                        <dt>Reversibility gate</dt>
                        <dd>{card.reversibility_gate}</dd>
                      </div>
                      <div>
                        <dt>Risk / extraction flag</dt>
                        <dd>{card.risk_extraction_flag}</dd>
                      </div>
                      <div>
                        <dt>Composite score</dt>
                        <dd>{card.compositeScore}/100</dd>
                      </div>
                      <div>
                        <dt>Swateyes tier + confidence</dt>
                        <dd>{card.swateyes.tier} / {Math.round(card.swateyes.confidence * 100)}%</dd>
                      </div>
                    </dl>
                  </section>

                  <p className={recommendationClass(card.recommendation)}>
                    Recommendation: <strong>{card.recommendation}</strong>
                  </p>

                  <div className="td-bridge-relay-choice" aria-label={`Relay choice for ${card.move}`}>
                    <span>Action</span>
                    <button type="button" data-relay-choice="KEEP" data-selected="false">KEEP</button>
                    <button type="button" data-relay-choice="KILL" data-selected="false">KILL</button>
                    <button type="button" data-relay-choice="STEAL" data-selected="false">STEAL</button>
                    <button type="button" data-relay-choice="MERGE" data-selected="false">MERGE</button>
                  </div>

                  <div className="td-bridge-controls" aria-label={`Execute relay for ${card.move}`}>
                    <button type="button" data-workspace-relay="true">APPROVE + WORKSPACE RELAY</button>
                    <button type="button" data-packet-relay="true">APPROVE + PACKET RELAY</button>
                    <button type="button" data-execute="true">EXECUTE</button>
                  </div>

                  <div className="td-bridge-execute-state" aria-label="Card status">
                    <span>Card status</span>
                    <strong data-card-status data-state="READY">READY</strong>
                  </div>
                  <div className="td-bridge-execute-state" aria-label="Execution state">
                    <span>Execution state</span>
                    <strong data-execute-state data-state="READY">READY</strong>
                  </div>
                  <p className="td-bridge-decision-status" data-execute-status>
                    No packet dispatched from this browser session.
                  </p>
                </form>
              ))}
            </div>
          </section>

          <section className="td-command-section td-command-section--proof" aria-label="PROOF">
            <header className="td-command-section__header">
              <div>
                <p className="td-bridge__eyebrow">PROOF</p>
                <h2>Receipts, status, and lanes</h2>
              </div>
              <p>Receipt panel uses <code>/api/tinkerden/receipts</code>.</p>
            </header>

            <section
              className="td-receipt-pickup"
              aria-label="Receipt pickup stream"
              data-receipt-pickup-panel
              data-receipts-api="/api/tinkerden/receipts"
            >
              <header>
                <div>
                  <p className="td-bridge__eyebrow">Receipt Pickup</p>
                  <h2>Latest receipts visible in cockpit.</h2>
                </div>
                <code>{receiptPickup.sourcePath}</code>
              </header>

              <div className="td-receipt-pickup__list" data-receipt-pickup-list>
                {!receiptPickup.found ? (
                  <p className="td-receipt-pickup__empty">No receipt pickup stream found.</p>
                ) : receiptPickup.receipts.length === 0 ? (
                  <p className="td-receipt-pickup__empty">Receipt pickup stream found, but no receipts are present.</p>
                ) : (
                  receiptPickup.receipts.map((receipt, index) => (
                    <article className="td-receipt-pickup__card" key={`${receipt.timestamp}-${receipt.path}-${index}`}>
                      <header>
                        <span>{`#${index + 1}`}</span>
                        <strong>{receipt.statusGuess}</strong>
                      </header>
                      <dl>
                        <div>
                          <dt>Receipt ID</dt>
                          <dd>{receipt.receiptId}</dd>
                        </div>
                        <div>
                          <dt>Linked packet</dt>
                          <dd>{receipt.linkedPacketId}</dd>
                        </div>
                        <div>
                          <dt>Mission</dt>
                          <dd>{receipt.mission}</dd>
                        </div>
                        <div>
                          <dt>Producer</dt>
                          <dd>{receipt.producer}</dd>
                        </div>
                        <div>
                          <dt>Timestamp</dt>
                          <dd>{receipt.timestamp}</dd>
                        </div>
                        <div>
                          <dt>Status guess</dt>
                          <dd>{receipt.statusGuess}</dd>
                        </div>
                      </dl>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="td-proof-grid" aria-label="Status rail and Aeye lanes">
              <article
                className="td-proof-card"
                aria-label="Organism Contract Lane"
                data-contract-index-panel
                data-contract-index-api="/api/organism/contracts/index?limit=25"
              >
                <h3>Organism Contract Lane</h3>
                <strong data-contract-freshness data-state={contractFreshness.state}>{contractFreshness.label}</strong>
                <p><code>/api/organism/contracts/index</code></p>
                <dl data-contract-index-list>
                  <div>
                    <dt>Records</dt>
                    <dd>{contractLanes.length} / {contractIndex.packet_count} packets</dd>
                  </div>
                  <div>
                    <dt>Events</dt>
                    <dd>{contractIndex.event_count}</dd>
                  </div>
                  <div>
                    <dt>Invalid</dt>
                    <dd>{contractIndex.invalid_count + contractIndex.malformed_count}</dd>
                  </div>
                  {contractLanes.length === 0 ? (
                    <div>
                      <dt>Status</dt>
                      <dd>No TinkerDen contract mirrors found</dd>
                    </div>
                  ) : (
                    contractLanes.map((lane) => (
                      <div id={`contract-${lane.packetId}`} key={`contract-${lane.packetId}-${lane.receiptId}`}>
                        <dt>{lane.packetId}</dt>
                        <dd>
                          {lane.lane} / {lane.receiptStatus} / {lane.latestEventType} / joined {lane.joinedEventCount} / {lane.latestEventAt}
                          <br />
                          packet <code>{lane.packetPath}</code>
                          <br />
                          receipt <code>{lane.receiptPath}</code>
                          <br />
                          {lane.truthBoundary}
                          <br />
                          <button
                            type="button"
                            data-create-receiver-handoff
                            data-packet-id={lane.packetId}
                            data-receiver={lane.receiver}
                          >
                            CREATE HANDOFF
                          </button>
                          <span data-receiver-handoff-create-status />
                        </dd>
                      </div>
                    ))
                  )}
                </dl>
              </article>

              <article
                className="td-proof-card"
                aria-label="Receiver Handoff Lane"
                data-receiver-handoff-panel
                data-receiver-handoff-api="/api/organism/contracts/receiver-handoffs?limit=25"
              >
                <h3>Receiver Handoff Lane</h3>
                <strong data-receiver-handoff-freshness data-state={receiverHandoffFreshness.state}>
                  {receiverHandoffFreshness.label}
                </strong>
                <p><code>/api/organism/contracts/receiver-handoffs</code></p>
                <div
                  className="td-provenance-filter td-provenance-filter--compact"
                  aria-label="Receiver handoff provenance scope"
                  data-receiver-handoff-provenance-filter
                  data-total-count={receiverHandoffLanes.length}
                  data-operator-count={receiverHandoffOperatorCount}
                  data-synthetic-count={receiverHandoffSyntheticCount}
                  data-active-filter="all"
                >
                  <div className="td-provenance-filter__controls">
                    <button type="button" data-provenance-filter-mode="all" aria-pressed="true">
                      ALL {receiverHandoffLanes.length}
                    </button>
                    <button type="button" data-provenance-filter-mode="operator" aria-pressed="false">
                      OPERATOR {receiverHandoffOperatorCount}
                    </button>
                    <button type="button" data-provenance-filter-mode="synthetic" aria-pressed="false">
                      SYNTHETIC {receiverHandoffSyntheticCount}
                    </button>
                    <span data-receiver-handoff-provenance-visible-count>{receiverHandoffLanes.length} visible</span>
                  </div>
                </div>
                <p
                  data-receiver-handoff-latest-posted
                  data-state={receiverHandoffLatestPosted?.state ?? "EMPTY"}
                  data-bundle-id={receiverHandoffLatestPosted?.bundleId ?? ""}
                  data-receipt-id={receiverHandoffLatestPosted?.returnedReceiptId ?? ""}
                  data-contract-receipt-path={receiverHandoffLatestPosted?.contractReceiptPath ?? ""}
                >
                  {receiverHandoffLatestPosted ? (
                    <>
                      Latest posted <code>{receiverHandoffLatestPosted.bundleId}</code> / receipt{" "}
                      <code>{receiverHandoffLatestPosted.returnedReceiptId}</code> / contract{" "}
                      <code>{receiverHandoffLatestPosted.contractReceiptPath}</code> / joined{" "}
                      {receiverHandoffLatestPosted.contractEventJoined ? "YES" : "NO"}
                    </>
                  ) : (
                    "Latest posted NONE"
                  )}
                  {" "}
                  <Link
                    data-receiver-handoff-latest-posted-link
                    href={
                      receiverHandoffLatestPosted
                        ? `/tinkerden/receipts#receiver-handoff-posted-${receiverHandoffLatestPosted.bundleId}`
                        : "/tinkerden/receipts#receiver-handoff-posted"
                    }
                  >
                    Open posted receipts
                  </Link>
                </p>
                <dl data-receiver-handoff-list>
                  <div>
                    <dt>Bundles</dt>
                    <dd>{receiverHandoffIndex.count}</dd>
                  </div>
                  <div>
                    <dt>Posted</dt>
                    <dd>{receiverHandoffIndex.posted_count}</dd>
                  </div>
                  <div>
                    <dt>Pending</dt>
                    <dd>
                      {receiverHandoffIndex.pending_count +
                        receiverHandoffIndex.returned_unposted_count +
                        receiverHandoffIndex.template_return_blocked_count}
                    </dd>
                  </div>
                  <div>
                    <dt>Invalid</dt>
                    <dd>{receiverHandoffIndex.invalid_count + receiverHandoffIndex.malformed_count}</dd>
                  </div>
                  {receiverHandoffLanes.length === 0 ? (
                    <div>
                      <dt>Status</dt>
                      <dd>No receiver handoff bundles found</dd>
                    </div>
                  ) : (
                    receiverHandoffLanes.map((handoff) => (
                      <div
                        id={`handoff-${handoff.packetId}`}
                        key={`handoff-${handoff.bundleId}-${handoff.returnedReceiptPath}`}
                        data-receiver-handoff-provenance-item
                        data-receiver-handoff-bridge-card
                        data-bundle-id={handoff.bundleId}
                        data-synthetic-proof={handoff.syntheticProof ? "true" : "false"}
                        data-synthetic-reason={handoff.syntheticReason}
                      >
                        <dt>{handoff.packetId}</dt>
                        <dd>
                          {handoff.state} / {handoff.returnedStatus} / joined {handoff.contractEventJoined ? "YES" : "NO"} / {handoff.receiver}
                          {handoff.syntheticProof ? (
                            <>
                              <br />
                              <span
                                className="td-receipt-pickup__provenance td-receipt-pickup__provenance--synthetic"
                                data-receiver-handoff-provenance-badge
                                data-synthetic-proof="true"
                                data-synthetic-reason={handoff.syntheticReason}
                              >
                                SYNTHETIC PROOF
                              </span>
                            </>
                          ) : null}
                          <br />
                          handoff <code>{handoff.handoffPath}</code>
                          <br />
                          returned <code>{handoff.returnedReceiptPath}</code>
                          <br />
                          contract <code>{handoff.contractReceiptPath}</code>
                          <br />
                          return command <code>{handoff.postCommand}</code>
                          <br />
                          {handoff.truthBoundary}
                          <br />
                          <button type="button" data-copy-receiver-handoff-command data-command={handoff.postCommand}>
                            COPY RETURN COMMAND
                          </button>
                          <span data-copy-receiver-handoff-status />
                          <br />
                          <button
                            type="button"
                            data-post-receiver-handoff-return
                            data-bundle-id={handoff.bundleId}
                            disabled={handoff.state === "posted"}
                          >
                            {handoff.state === "posted" ? "RETURN POSTED" : "POST RETURNED RECEIPT"}
                          </button>
                          <span data-post-receiver-handoff-status />
                          {handoff.state === "pending_receiver" ? (
                            <>
                              <br />
                              <form
                                data-fill-receiver-handoff-return
                                data-bundle-id={handoff.bundleId}
                                data-receiver={handoff.receiver}
                              >
                                <select data-fill-return-status name="status" defaultValue="partial">
                                  <option value="partial">partial</option>
                                  <option value="completed">completed</option>
                                </select>
                                <input
                                  data-fill-return-attempted
                                  name="attempted"
                                  placeholder="receiver attempted"
                                />
                                <input
                                  data-fill-return-changed
                                  name="changed"
                                  placeholder="changed artifact path"
                                />
                                <textarea
                                  data-fill-return-proof
                                  name="proof_readbacks"
                                  placeholder="proof readback"
                                  rows={2}
                                  defaultValue=""
                                />
                                <button type="submit">FILL RETURN RECEIPT</button>
                                <span data-fill-receiver-handoff-status />
                              </form>
                            </>
                          ) : null}
                        </dd>
                      </div>
                    ))
                  )}
                </dl>
              </article>

              <article className="td-proof-card" aria-label="Canonical Packet Lane">
                <h3>Packet Lane</h3>
                <p><code>data/tinkerden/executions/&lt;packet_id&gt;.json</code></p>
                <dl>
                  <div>
                    <dt>Count</dt>
                    <dd>{executions.length}</dd>
                  </div>
                  {executions.length === 0 ? (
                    <div>
                      <dt>Status</dt>
                      <dd>No canonical executions found</dd>
                    </div>
                  ) : (
                    executions.map((execution) => (
                      <div id={`packet-${execution.packet_id}`} key={`packet-${execution.packet_id}`}>
                        <dt>{execution.packet_id}</dt>
                        <dd>
                          {execution.relay_status} / {execution.mission} /{" "}
                          {execution.relay_id !== "NO_RELAY" ? (
                            <>
                              <a href={`#relay-${execution.packet_id}`}>relay {execution.relay_id}</a>{" / "}
                            </>
                          ) : null}
                          <a href={`#receipt-${execution.packet_id}`}>receipt {execution.receipt_id}</a>
                        </dd>
                      </div>
                    ))
                  )}
                </dl>
              </article>

              <article className="td-proof-card" aria-label="Relay Status Lane">
                <h3>Relay Status Lane</h3>
                <p><code>packet_id {"->"} relay_id {"->"} receipt_id</code></p>
                <dl>
                  <div>
                    <dt>Count</dt>
                    <dd>{relayStatusLanes.length}</dd>
                  </div>
                  {relayStatusLanes.length === 0 ? (
                    <div>
                      <dt>Status</dt>
                      <dd>No relay custody events found</dd>
                    </div>
                  ) : (
                    relayStatusLanes.map((relay) => (
                      <div id={`relay-${relay.packetId}`} key={`relay-${relay.packetId}-${relay.relayId}`}>
                        <dt>{relay.relayId}</dt>
                        <dd>
                          {relay.relayStatus} /{" "}
                          <a href={`#packet-${relay.packetId}`}>packet {relay.packetId}</a>{" / "}
                          <a href={`#receipt-${relay.packetId}`}>receipt {relay.receiptId}</a>{" / "}
                          {relay.timestamp}
                        </dd>
                      </div>
                    ))
                  )}
                </dl>
              </article>

              <article className="td-proof-card" aria-label="Canonical Receipt Lane">
                <h3>Receipt Lane</h3>
                <p><code>data/tinkerden/executions/&lt;packet_id&gt;.json</code></p>
                <dl>
                  <div>
                    <dt>Count</dt>
                    <dd>{executions.length}</dd>
                  </div>
                  {executions.length === 0 ? (
                    <div>
                      <dt>Status</dt>
                      <dd>No canonical receipts found</dd>
                    </div>
                  ) : (
                    executions.map((execution) => (
                      <div id={`receipt-${execution.packet_id}`} key={`receipt-${execution.packet_id}`}>
                        <dt>{execution.receipt_id}</dt>
                        <dd>
                          {execution.receipt_status} / {execution.artifact_path || "NO_ARTIFACT"} /{" "}
                          {execution.relay_id !== "NO_RELAY" ? (
                            <>
                              <a href={`#relay-${execution.packet_id}`}>relay {execution.relay_id}</a>{" / "}
                            </>
                          ) : null}
                          <a href={`#packet-${execution.packet_id}`}>packet {execution.packet_id}</a>
                        </dd>
                      </div>
                    ))
                  )}
                 </dl>
              </article>

              <article className="td-proof-card">
                <h3>Packet Lifecycle / Status Rail</h3>
                <dl>
                  <div>
                    <dt>Active</dt>
                    <dd>{packetLifecycle.active}</dd>
                  </div>
                  <div>
                    <dt>Awaiting receipt</dt>
                    <dd>{packetLifecycle.awaitingReceipt}</dd>
                  </div>
                  <div>
                    <dt>Receipt returned</dt>
                    <dd>{packetLifecycle.receiptReturned}</dd>
                  </div>
                  <div>
                    <dt>Blocked</dt>
                    <dd>{packetLifecycle.blocked}</dd>
                  </div>
                  <div>
                    <dt>Archive</dt>
                    <dd>{packetLifecycle.archive}</dd>
                  </div>
                </dl>
              </article>

              <article className="td-proof-card">
                <h3>Aeye@Machine lanes</h3>
                <div className="td-lanes">
                  {aeyeLanes.map((lane) => (
                    <dl key={lane.lane}>
                      <div>
                        <dt>Lane</dt>
                        <dd>{lane.lane}</dd>
                      </div>
                      <div>
                        <dt>Active packets</dt>
                        <dd>{lane.activePackets}</dd>
                      </div>
                      <div>
                        <dt>Latest status</dt>
                        <dd>{lane.latestStatus}</dd>
                      </div>
                    </dl>
                  ))}
                </div>
              </article>
            </section>
          </section>
        </>
      )}

      <script dangerouslySetInnerHTML={{ __html: bridgeScript }} />
      <DriftLogFooter />
    </main>
  );
}
