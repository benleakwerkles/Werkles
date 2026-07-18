"use client";

import { useMemo } from "react";

import { designTokens } from "@/lib/design-tokens";
import { buildHarveyProjectFlockBrief } from "@/lib/harvey/project-flock";
import { buildHarveyWatchtower, type HarveyWatchtowerContract, type HarveyWatchtowerDecision } from "@/lib/harvey/watchtower";
import { useHarveySnapshotState } from "./HarveyLiveCockpit";

const colors = designTokens.colors;
const readablePrimary = "#FFF4D6";
const readableSecondary = "#E7E3D8";
const readableMuted = "#C8D0CB";
const readableAmber = "#FFD98A";
const controlTeal = "#42D7C2";

const decisionMeta: Record<HarveyWatchtowerDecision, { label: string; color: string }> = {
  KEEP_GOING: { label: "KEEP MOVING", color: "#8EF0AE" },
  REVIEW_WITHIN_LANE: { label: "REVIEW IN LANE", color: readableAmber },
  TRUE_HUMAN_GATE: { label: "BEN NEEDED", color: "#C6B3FF" },
  PROVED_BLOCKER: { label: "PROVED BLOCKER", color: "#FFB39F" }
};

const panel = {
  border: `1px solid ${colors.copper}`,
  borderRadius: 12,
  background: colors.workshopNight,
  boxSizing: "border-box" as const
};

const projectActionStyle = {
  border: `1px solid ${controlTeal}`,
  borderRadius: 8,
  padding: "9px 12px",
  background: "#102522",
  color: readablePrimary,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12
} as const;

function humanLoopState(routeState: string) {
  if (routeState === "LOCAL_OPERATOR_ROUTE") return "READY ON DOSS · LOCAL QUEUE IS NOT DELIVERY";
  if (routeState === "ROUTE_UNBOUND_OPERATOR_REPORTED") return "NEEDS A REAL RECEIVER ROUTE";
  return "DRAFT READY · RECEIVER PROOF MISSING";
}

function addressProject(target: string, instruction?: string) {
  window.dispatchEvent(new CustomEvent("harvey:command-project", { detail: { target, instruction } }));
}

function nextMoveDraft(target: string, moves: [string, string]) {
  return `For ${target}, execute these two project moves inside its recorded authority:\n1. ${moves[0]}\n2. ${moves[1]}\nReturn tests, artifacts, a terminal receipt, and the next two bounded moves. Do not claim delivery without receiver proof.`;
}

export default function HarveyWatchtowerBrief({ contract, projectIndex }: { contract: HarveyWatchtowerContract; projectIndex: unknown }) {
  const { snapshot, transport } = useHarveySnapshotState();
  const brief = useMemo(() => buildHarveyWatchtower(snapshot, contract), [snapshot, contract]);
  const projectFlock = useMemo(() => buildHarveyProjectFlockBrief(projectIndex), [projectIndex]);
  const announcement = `${brief.summary.needs_ben_now} need Ben. ${brief.summary.can_keep_moving} can keep moving. ${brief.summary.proved_blockers} proved blockers. ${brief.inventions.ready_to_carry.length} inventions ready to carry.`;

  return (
    <section data-testid="harvey-watchtower" aria-labelledby="harvey-watchtower-title" style={{ ...panel, maxWidth: 1200, margin: "0 auto 20px", padding: "clamp(16px, 3vw, 26px)", borderWidth: 2 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "end", gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: readableAmber, letterSpacing: 2, fontWeight: 900, margin: 0 }}>HARVEY WATCHTOWER · ADVISORY ONLY</p>
          <h2 id="harvey-watchtower-title" style={{ color: readablePrimary, fontSize: "clamp(26px, 4vw, 42px)", lineHeight: 1.08, margin: "7px 0" }}>Projects stay independent. Harvey watches the seams.</h2>
          <p style={{ color: readableSecondary, maxWidth: 900, margin: 0, lineHeight: 1.55 }}>
            Harvey compares accepted evidence, challenges fake stops, and carries proved inventions home. It cannot approve gates, stop a crew, edit another project, or adopt an invention by itself.
          </p>
        </div>
        <div style={{ color: readableMuted, fontSize: 13, textAlign: "right" }}>
          <strong>{transport}</strong><br />rule {brief.rules.version}
        </div>
      </div>

      <p role="status" aria-live="polite" aria-atomic="true" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>{announcement}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(210px,100%),1fr))", gap: 10, margin: "20px 0 12px" }}>
        {[
          { id: "needs-ben", label: "NEEDS BEN NOW", value: brief.summary.needs_ben_now, copy: brief.summary.needs_ben_now ? "Named human-only gates are open." : "Nothing proven needs you now.", color: colors.violetBright },
          { id: "keep-moving", label: "CAN KEEP MOVING", value: brief.summary.can_keep_moving, copy: "Crews stay inside their approved lanes.", color: colors.owlEyeGreen },
          { id: "blocked", label: "ACTUALLY BLOCKED", value: brief.summary.proved_blockers, copy: brief.summary.proved_blockers ? "Typed receiver blockers are attached." : "No project blocker is proved.", color: colors.forgeOrange },
          { id: "inventions", label: "INVENTION WORTH CARRYING", value: brief.inventions.ready_to_carry.length, copy: brief.inventions.ready_to_carry.length ? "Source proof is attached; adoption is still separate." : "No source-proved invention is ready.", color: colors.tealBright }
        ].map((rail) => (
          <article key={rail.id} style={{ ...panel, padding: 15, borderColor: rail.color }}>
            <small style={{ color: rail.color, fontWeight: 900 }}>{rail.label}</small>
            <div data-testid={`watchtower-${rail.id}-count`} style={{ color: readablePrimary, fontWeight: 900, fontSize: 34, lineHeight: 1.1, marginTop: 5 }}>{rail.value}</div>
            <p style={{ color: readableSecondary, fontSize: 13, lineHeight: 1.45, margin: "6px 0 0" }}>{rail.copy}</p>
          </article>
        ))}
      </div>

      <div data-testid="watchtower-feed-state" style={{ border: `1px solid ${brief.feed.state === "DEGRADED" ? colors.ember : colors.teal}`, borderRadius: 9, padding: "10px 12px", color: readableSecondary, background: colors.smoke, lineHeight: 1.45 }}>
        <strong>{brief.feed.state === "DEGRADED" ? "PROOF FEED NEEDS CLEANUP" : "PROOF FEED CURRENT"}</strong> · {brief.feed.message}
      </div>

      <article data-testid="harvey-project-flock" style={{ ...panel, marginTop: 12, padding: 15, borderColor: projectFlock.valid ? colors.teal : colors.forgeOrange }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <div>
            <h3 style={{ color: readablePrimary, margin: 0, fontSize: 20 }}>Project V / P / G loops</h3>
            <p style={{ color: readableSecondary, margin: "5px 0 0", lineHeight: 1.45 }}>V is the durable project packet. P is the shared packet, ledger, and receipts. G is the next two tested moves and a terminal return.</p>
          </div>
          <strong data-testid="project-flock-manifesto-state" style={{ color: readableAmber }}>MANIFESTO: {projectFlock.manifesto_status.replaceAll("_", " ")}</strong>
        </div>
        {projectFlock.valid ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <span style={{ color: readableSecondary }}><strong data-testid="project-flock-total">{projectFlock.summary.project_loops}</strong> project loops</span>
            <span style={{ color: "#8EF0AE" }}><strong data-testid="project-flock-local">{projectFlock.summary.active_local}</strong> active locally</span>
            <span style={{ color: readableAmber }}><strong data-testid="project-flock-prepared">{projectFlock.summary.prepared_not_delivered}</strong> prepared, not delivered</span>
            <span style={{ color: readableMuted }}><strong>{projectFlock.summary.receiver_proven_external}</strong> external receiver routes proven</span>
          </div>
        ) : (
          <p style={{ color: colors.forgeOrange, marginBottom: 0 }}>Project index failed closed: {projectFlock.errors.join(", ") || "unknown contract error"}.</p>
        )}
      </article>

      <div style={{ marginTop: 20 }}>
        <h3 style={{ color: readablePrimary, fontSize: 23, margin: "0 0 5px" }}>Project pulse</h3>
        <p style={{ color: readableSecondary, margin: "0 0 12px", lineHeight: 1.5 }}>Missing or stale proof is a visibility gap—not a reason to stop the project or summon Ben. Use a project button to move the work into the universal command deck.</p>
        <div style={{ display: "grid", gap: 8 }}>
          {brief.projects.map((project) => {
            const status = decisionMeta[project.decision];
            const projectLoop = projectFlock.projects.find((candidate) => candidate.project_id === project.workstream_id);
            return (
              <article key={project.workstream_id} data-testid={`watchtower-project-${project.workstream_id}`} style={{ ...panel, padding: 14, borderLeft: `4px solid ${status.color}`, minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ color: readablePrimary, fontSize: 18, overflowWrap: "anywhere" }}>{project.name}</strong>
                    <span data-testid={`watchtower-project-subline-${project.workstream_id}`} style={{ color: readableMuted, display: "block", fontSize: 13 }}>{project.machine} · {project.owner_role} · {project.flock_route_state.replaceAll("_", " ")}</span>
                  </div>
                  <strong style={{ color: status.color, fontSize: 13 }}>{status.label}</strong>
                </div>
                <p style={{ color: readableSecondary, lineHeight: 1.5, margin: "9px 0" }}>{project.reason}</p>
                <p style={{ color: readableMuted, fontSize: 13, lineHeight: 1.45, margin: 0 }}><strong style={{ color: readablePrimary }}>Next proof:</strong> {project.next_proof_action}</p>
                {projectLoop && <div data-testid={`project-loop-${project.workstream_id}`} style={{ marginTop: 9, padding: "10px", borderRadius: 8, background: colors.smoke, color: readableSecondary, fontSize: 13, lineHeight: 1.45 }}>
                  <strong style={{ color: readablePrimary }}>What you can do here:</strong> {humanLoopState(projectLoop.route_state)}
                  <ol style={{ margin: "5px 0 0", paddingLeft: 20 }}>{projectLoop.next_two_moves.map((move) => <li key={move}>{move}</li>)}</ol>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                    <button type="button" data-testid={`project-command-${project.workstream_id}`} onClick={() => addressProject(project.name)} style={projectActionStyle}>ADDRESS IN COMMAND DECK</button>
                    <button type="button" data-testid={`project-draft-next-${project.workstream_id}`} onClick={() => addressProject(project.name, nextMoveDraft(project.name, projectLoop.next_two_moves))} style={projectActionStyle}>LOAD NEXT TWO MOVES</button>
                  </div>
                  <p style={{ color: readableMuted, margin: "8px 0 0" }}>These controls prepare your universal draft. They do not claim a courier, receipt, or completed delivery.</p>
                </div>}
                <details style={{ marginTop: 9 }}>
                  <summary style={{ color: readableAmber, cursor: "pointer", fontWeight: 800 }}>VIEW PROOF &amp; CURRENT PACKET</summary>
                  <div style={{ color: readableSecondary, fontSize: 13, lineHeight: 1.5, marginTop: 8, overflowWrap: "anywhere" }}>
                    <p style={{ margin: "0 0 7px" }}>{project.latest_command_result}</p>
                    {projectLoop && <p style={{ margin: "0 0 7px" }}>Raw route state: {projectLoop.autonomy_state.replaceAll("_", " ")} / {projectLoop.delivery_state.replaceAll("_", " ")}</p>}
                    {projectLoop && <p style={{ margin: "0 0 7px" }}>Current packet: {projectLoop.packet_id} / checkpoint: {projectLoop.checkpoint}</p>}
                    <p style={{ margin: "0 0 7px" }}>Receipt freshness: {project.receipt_freshness}{project.latest_receipt_at ? <> · <time dateTime={project.latest_receipt_at}>{project.latest_receipt_at}</time></> : " · none"}</p>
                    <ul style={{ paddingLeft: 19, margin: 0 }}>
                      {project.signals.map((signal) => <li key={`${signal.code}-${signal.source}`}><strong>{signal.code.replaceAll("_", " ")}</strong> · {signal.confidence.toLowerCase()} confidence · clear when {signal.clearing_condition}</li>)}
                    </ul>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(280px,100%),1fr))", gap: 10, marginTop: 18 }}>
        <article style={{ ...panel, padding: 15 }}>
          <h3 style={{ color: readablePrimary, margin: 0, fontSize: 19 }}>Invention return</h3>
          {brief.inventions.ready_to_carry.length === 0 && <p style={{ color: readableSecondary, lineHeight: 1.5 }}>No source-proved invention is ready to carry. {brief.inventions.waiting_for_source_proof.length} reported candidate{brief.inventions.waiting_for_source_proof.length === 1 ? " is" : "s are"} waiting for source proof.</p>}
          {brief.inventions.waiting_for_source_proof.map((item) => (
            <details key={item.capsule_id}>
              <summary style={{ color: readableAmber, cursor: "pointer", fontWeight: 800 }}>{item.candidate_pattern}</summary>
              <p style={{ color: readableSecondary, lineHeight: 1.5 }}>{item.problem_and_cause}</p>
              <p style={{ color: readableAmber, fontSize: 13 }}>Untested candidate · not sent · not adopted</p>
            </details>
          ))}
        </article>
        <article style={{ ...panel, padding: 15 }}>
          <h3 style={{ color: readablePrimary, margin: 0, fontSize: 19 }}>What Harvey cannot see yet</h3>
          <p style={{ color: readableSecondary, lineHeight: 1.5 }}>Aeye role overreach is not machine-proved yet. Current receipts bind machines and bounded commands, but not the acting cousin’s role plus authorized project scope.</p>
          <p style={{ color: readableMuted, fontSize: 13, marginBottom: 0 }}>{brief.coverage.projects_observed} projects observed · {brief.coverage.live_machine_heartbeats} live machine heartbeats · {brief.coverage.flock_routes_bound} bound Flock routes · no hidden score</p>
        </article>
      </div>
    </section>
  );
}
