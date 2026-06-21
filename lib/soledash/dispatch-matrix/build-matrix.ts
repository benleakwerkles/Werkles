import { aeyeBlocksDispatch, aeyeIsFree, loadAeyeResources } from "./aeye-availability";
import { DISPATCH_PROJECTS } from "./projects";
import type {
  AeyeId,
  AeyeResourceView,
  DispatchMatrixRow,
  DispatchMatrixView,
  DispatchProjectDef
} from "./types";

function resourceMap(resources: AeyeResourceView[]): Map<AeyeId, AeyeResourceView> {
  return new Map(resources.map((r) => [r.id, r]));
}

function buildRow(
  project: DispatchProjectDef,
  resources: Map<AeyeId, AeyeResourceView>,
  selectedIds: string[]
): DispatchMatrixRow {
  const available_aeyes = project.required_aeyes.filter((id) => {
    const r = resources.get(id);
    return r && aeyeIsFree(r);
  });

  const missing_aeyes = project.required_aeyes.filter((id) => {
    const r = resources.get(id);
    return !r || !aeyeIsFree(r);
  });

  const delayed_if_dispatched: string[] = [];
  for (const aeyeId of missing_aeyes) {
    const r = resources.get(aeyeId);
    if (r?.busy_on) delayed_if_dispatched.push(`${r.label} busy on ${r.busy_on}`);
  }

  // Cross-project contention among selected rows
  const otherSelected = selectedIds.filter((id) => id !== project.id);
  for (const otherId of otherSelected) {
    const other = DISPATCH_PROJECTS.find((p) => p.id === otherId);
    if (!other) continue;
    const overlap = project.required_aeyes.filter((a) => other.required_aeyes.includes(a));
    for (const aeyeId of overlap) {
      delayed_if_dispatched.push(`${other.project} also needs ${resources.get(aeyeId)?.label ?? aeyeId}`);
    }
  }

  let contention_warning: string | null = null;
  if (project.branch_status === "PARKED") {
    contention_warning = null;
  } else if (missing_aeyes.length > 0) {
    const labels = missing_aeyes.map((id) => resources.get(id)?.label ?? id).join(", ");
    contention_warning = `Required Aeyes not free: ${labels}`;
  } else if (otherSelected.length > 0) {
    const overlaps = otherSelected.flatMap((oid) => {
      const other = DISPATCH_PROJECTS.find((p) => p.id === oid);
      if (!other) return [];
      return project.required_aeyes.filter((a) => other.required_aeyes.includes(a));
    });
    if (overlaps.length > 0) {
      const uniq = [...new Set(overlaps)];
      contention_warning = `Shares ${uniq.map((id) => resources.get(id)?.label ?? id).join(", ")} with other selected project(s)`;
    }
  }

  let dispatch_recommendation: string;
  switch (project.branch_status) {
    case "PARKED":
      dispatch_recommendation = "Parked — do not dispatch until unparked.";
      break;
    case "CONDITIONAL GO":
      if (missing_aeyes.length > 0) {
        dispatch_recommendation = `Conditional — resolve ${missing_aeyes.map((id) => resources.get(id)?.label ?? id).join(", ")} first.`;
      } else if (contention_warning) {
        dispatch_recommendation = "Conditional — clear selection contention before dispatch.";
      } else {
        dispatch_recommendation = "Conditional GO — gate check passed; dispatch when operator confirms.";
      }
      break;
    default:
      if (missing_aeyes.length > 0) {
        const delays = missing_aeyes
          .map((id) => {
            const r = resources.get(id);
            return r?.busy_on ? `${r.label} delays ${r.busy_on}` : r?.label ?? id;
          })
          .join("; ");
        dispatch_recommendation = `Hold — ${delays}`;
      } else if (contention_warning) {
        dispatch_recommendation = "Stagger — deselect conflicting project or wait for Aeye release.";
      } else {
        dispatch_recommendation = "Dispatch now — required Aeyes available.";
      }
  }

  return {
    ...project,
    available_aeyes,
    missing_aeyes,
    contention_warning,
    delayed_if_dispatched: [...new Set(delayed_if_dispatched)],
    dispatch_recommendation,
    selectable: project.branch_status !== "PARKED"
  };
}

export function buildDispatchMatrix(selectedProjectIds: string[] = []): DispatchMatrixView {
  const { resources, fleetStateLoaded } = loadAeyeResources();
  const map = resourceMap(resources);

  return {
    aeye_resources: resources,
    rows: DISPATCH_PROJECTS.map((p) => buildRow(p, map, selectedProjectIds)),
    generated_at: new Date().toISOString(),
    fleet_state_loaded: fleetStateLoaded
  };
}

export { aeyeBlocksDispatch, aeyeIsFree };
