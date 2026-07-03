"use client";

import { useEffect, useRef, useState } from "react";

import type { DecisionButton, Proposal } from "@/protocol/index";

import { AdvancedDetails } from "@/components/soledash/advanced-details";
import { AgentInventoryRoster } from "@/components/soledash/agent-inventory-roster";
import { CommandActionsPanel } from "@/components/soledash/command-actions";
import { OperatorSurfaceLines } from "@/components/soledash/operator-surface-lines";
import { ProvenanceLabel } from "@/components/soledash/provenance-label";
import { machineLabelForGroup, rosterEntryId } from "@/lib/soledash/agent-inventory/types";
import { useAgentInventory } from "@/lib/soledash/agent-inventory/use-agent-inventory";
import type { AgentRosterEntry } from "@/lib/soledash/agent-inventory/types";
import type { GateResolution } from "@/lib/soledash/human-gate/types";
import { useNextStep } from "@/lib/soledash/next-step/use-next-step";
import { provenanceFromNextStep } from "@/lib/soledash/provenance/compute";
import type { NextStepOwner } from "@/lib/soledash/next-step/types";
import type { Provenance } from "@/lib/soledash/provenance/types";
import { COUSIN_TARGETS, type OperatorCousinTarget } from "@/lib/soledash/options-deck/cousins";

function defaultOwner(proposal: Proposal | null, payloadOwner: string | null): NextStepOwner {
  const hint = (payloadOwner ?? proposal?.summary ?? "").toLowerCase();
  if (hint.includes("dink")) return "DINK";
  if (hint.includes("petra")) return "PETRA";
  if (hint.includes("ender")) return "ENDER";
  if (hint.includes("maker")) return "MAKER";
  return "DINK";
}

function cousinIdForOwner(owner: NextStepOwner): string {
  if (owner === "BEN") return "MAKER";
  return owner;
}

export function NextStepPanel({
  proposal,
  stepCode,
  stepTitle,
  payloadOwner,
  unavailable,
  busy: actionsBusy,
  activeAction,
  gate,
  routeButtons,
  compact,
  composerOnly,
  onRefresh,
  surfaceProvenance,
  onYea,
  onNay,
  onRouteAction
}: {
  proposal: Proposal | null;
  stepCode: string;
  stepTitle: string;
  payloadOwner: string | null;
  unavailable: boolean;
  busy: boolean;
  activeAction: string | null;
  gate: GateResolution;
  routeButtons: DecisionButton[];
  compact?: boolean;
  composerOnly?: boolean;
  onRefresh?: () => void | Promise<void>;
  surfaceProvenance?: Provenance;
  onYea: () => void;
  onNay: () => void;
  onRouteAction: (actionId: string) => void;
}) {
  const { override, busy, status, save, reload } = useNextStep(onRefresh);
  const { roster, loading: rosterLoading } = useAgentInventory();
  const [owner, setOwner] = useState<NextStepOwner>("DINK");
  const [machine, setMachine] = useState("Betsy");
  const [note, setNote] = useState("");
  const [chat, setChat] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatStatus, setChatStatus] = useState<string | null>(null);
  const chatRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (override) {
      setOwner(override.owner);
      setMachine(override.machine);
      setNote(override.note ?? "");
      return;
    }
    setOwner(defaultOwner(proposal, payloadOwner));
    setMachine("Betsy");
  }, [override, proposal, payloadOwner]);

  async function handleSave(dispatch: boolean) {
    await save({ owner, machine, note: note.trim() || null, dispatch });
  }

  async function handleChatSend() {
    const text = (chatRef.current?.value ?? chat).trim();
    if (!text) return;
    setChat(text);
    setChatBusy(true);
    setChatStatus(null);
    try {
      const cousin = cousinIdForOwner(owner);
      const res = await fetch("/api/soledash/v1/cousin-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, cousin })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setChatStatus(data.error ?? data.message ?? "Send failed");
        return;
      }
      setChat("");
      setChatStatus(data.build?.outboxFilename ?? data.message ?? `Sent to ${cousin}`);
      await reload();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setChatStatus(err instanceof Error ? err.message : "Send failed");
    } finally {
      setChatBusy(false);
    }
  }

  const routeLabel = `${owner} @ ${machine}`;
  const selectedEntryId = rosterEntryId(owner, machine);
  const title = stepTitle || proposal?.title || "No next step loaded";
  const summary = proposal?.summary ?? null;

  function handleRosterSelect(entry: AgentRosterEntry) {
    setOwner(entry.aeyeId);
    setMachine(machineLabelForGroup(entry.machineGroup));
  }

  const statusLine = gate.redCard
    ? "Needs your decision"
    : override
      ? "Route saved — ready to send"
      : actionsBusy
        ? "Working…"
        : "Ready";

  const receiptLine = chatStatus ?? status ?? (override ? "Route correction on file" : "Proof lands in Receipt Drawer");

  const chatBlock = (
    <div className="sd-nstep__chat">
      <label className="sd-nstep__label" htmlFor="nstep-chat">
        Task
      </label>
      <textarea
        ref={chatRef}
        id="nstep-chat"
        className="sd-nstep__textarea sd-nstep__textarea--chat"
        rows={composerOnly ? 5 : compact ? 3 : 4}
        placeholder="Type the task — plain language, no routing jargon"
        value={chat}
        disabled={unavailable || chatBusy || busy}
        onChange={(e) => setChat(e.target.value)}
        onInput={(e) => setChat(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleChatSend();
          }
        }}
      />
      <div className="sd-nstep__chat-actions">
        <button
          type="button"
          className="sd-nstep__btn sd-nstep__btn--chat"
          disabled={unavailable || chatBusy || busy}
          onClick={() => void handleChatSend()}
        >
          {chatBusy ? "Sending…" : "Send task"}
        </button>
        <AdvancedDetails summary="Route task to…" className="sd-nstep__quick-advanced">
          <div className="sd-nstep__quick">
            {COUSIN_TARGETS.slice(0, 4).map((c) => (
              <button
                key={c.id}
                type="button"
                className="sd-nstep__quick-btn"
                disabled={unavailable || chatBusy || busy}
                onClick={() => {
                  const text = (chatRef.current?.value ?? chat).trim();
                  if (!text) return;
                  setOwner(c.id === "THUFIR" ? "DINK" : (c.id as NextStepOwner));
                  void (async () => {
                    setChatBusy(true);
                    try {
                      const res = await fetch("/api/soledash/v1/cousin-dispatch", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text, cousin: c.id })
                      });
                      const data = await res.json();
                      setChatStatus(data.build?.outboxFilename ?? data.message ?? `Sent to ${c.id}`);
                      if (data.ok) setChat("");
                    } finally {
                      setChatBusy(false);
                    }
                  })();
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </AdvancedDetails>
      </div>
    </div>
  );

  if (composerOnly) {
    return (
      <section className="sd-task-composer" aria-label="Task composer">
        <p className="sd-task-composer__lead">Type task, send task, watch packet status, then receipt.</p>
        <p className="sd-task-composer__route">
          Current route: <strong>{routeLabel}</strong>
        </p>
        {receiptLine ? <p className="sd-task-composer__status">{receiptLine}</p> : null}
        {chatBlock}
        {!unavailable && proposal && gate.tier !== "red" ? (
          <CommandActionsPanel
            busy={actionsBusy}
            activeAction={activeAction}
            gateTier={gate.tier}
            routeButtons={routeButtons}
            unavailable={unavailable}
            onYeaClick={onYea}
            onNay={onNay}
            onRouteAction={(id) => onRouteAction(id)}
            onSendPacket={() => {}}
            hidePacket
            provenance={surfaceProvenance}
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className={`sd-nstep ${compact ? "sd-nstep--compact" : ""}`} aria-label="Next step">
      <div className="sd-nstep__head">
        <h2 className="sd-nstep__title">Next Step</h2>
        <p className="sd-nstep__hint">What moves next — command or approve below.</p>
      </div>

      {stepCode && stepCode !== "—" ? <p className="sd-nstep__code">{stepCode}</p> : null}

      <OperatorSurfaceLines
        intent={
          <>
            <strong className="sd-op-surface__intent-title">{title}</strong>
            {summary ? <p className="sd-op-surface__intent-body">{summary}</p> : null}
          </>
        }
        status={statusLine}
        receipt={receiptLine}
      />

      <AdvancedDetails className="sd-nstep__advanced">
        {surfaceProvenance ? (
          <ProvenanceLabel provenance={surfaceProvenance} compact className="sd-nstep__prov" />
        ) : null}
        {override ? (
          <ProvenanceLabel
            provenance={provenanceFromNextStep(override.updated_at)}
            compact
            className="sd-nstep__prov"
          />
        ) : null}

        <AgentInventoryRoster
          roster={roster}
          loading={rosterLoading}
          selectedEntryId={selectedEntryId}
          disabled={busy || chatBusy}
          onSelect={handleRosterSelect}
        />
        <p className="sd-nstep__route-live">
          Current route: <strong>{routeLabel}</strong>
          {override ? (
            <span className="sd-nstep__saved"> · saved {new Date(override.updated_at).toLocaleTimeString()}</span>
          ) : null}
        </p>

        <label className="sd-nstep__label" htmlFor="nstep-note">
          Correction note
        </label>
        <textarea
          id="nstep-note"
          className="sd-nstep__textarea"
          rows={compact ? 2 : 3}
          placeholder="e.g. This should go to Dink on Betsy — fix routing"
          value={note}
          disabled={busy || chatBusy}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="sd-nstep__actions">
          <button
            type="button"
            className="sd-nstep__btn sd-nstep__btn--save"
            disabled={unavailable || busy || chatBusy}
            onClick={() => void handleSave(false)}
          >
            {busy ? "Saving…" : "Save route"}
          </button>
          <button
            type="button"
            className="sd-nstep__btn sd-nstep__btn--dispatch"
            disabled={unavailable || busy || chatBusy}
            onClick={() => void handleSave(true)}
          >
            {busy ? "Sending…" : `Save + send to ${owner}`}
          </button>
        </div>
      </AdvancedDetails>

      {!unavailable && proposal && gate.tier !== "red" ? (
        <CommandActionsPanel
          busy={actionsBusy}
          activeAction={activeAction}
          gateTier={gate.tier}
          routeButtons={routeButtons}
          unavailable={unavailable}
          onYeaClick={onYea}
          onNay={onNay}
          onRouteAction={(id) => onRouteAction(id)}
          onSendPacket={() => {}}
          hidePacket
          provenance={surfaceProvenance}
        />
      ) : null}

      {chatBlock}
    </section>
  );
}
