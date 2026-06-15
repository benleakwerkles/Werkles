export type LeavePointReason =
  | "done_for_now"
  | "too_busy"
  | "needed_cousin"
  | "unclear_frontier"
  | "fatigue"
  | "other";

export type LeavePointEntry = {
  id: string;
  reason: LeavePointReason;
  note: string | null;
  at: string;
};

const STORAGE_KEY = "soledash_leave_points_v1";
const MAX_ENTRIES = 12;

export const LEAVE_REASON_LABELS: Record<LeavePointReason, string> = {
  done_for_now: "Done for now",
  too_busy: "Too many panels / noise",
  needed_cousin: "Needed a cousin surface",
  unclear_frontier: "Unclear what frontier is",
  fatigue: "Fatigue — 60% capacity",
  other: "Other"
};

export function loadLeavePoints(): LeavePointEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LeavePointEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

export function saveLeavePoint(reason: LeavePointReason, note: string | null): LeavePointEntry[] {
  const entry: LeavePointEntry = {
    id: `leave_${Date.now()}`,
    reason,
    note: note?.trim() || null,
    at: new Date().toISOString()
  };
  const next = [entry, ...loadLeavePoints()].slice(0, MAX_ENTRIES);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
