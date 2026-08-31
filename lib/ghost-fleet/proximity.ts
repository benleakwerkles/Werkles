export const GHOST_WORK_PREFERENCES = [
  "Local Only",
  "Remote Only",
  "Open to Travel",
  "Willing to Relocate"
] as const;

export type GhostWorkPreference = (typeof GHOST_WORK_PREFERENCES)[number];
export type GhostProximityBand = "same_city" | "same_state" | "neighboring_state" | "farther_away" | "unknown";

export type GhostSeekerLocation = Readonly<{
  city: string;
  state: string;
  workPreference: GhostWorkPreference;
}>;

export type GhostProximity = Readonly<{
  band: GhostProximityBand;
  label: string;
  rankingAdjustment: number;
}>;

const STATE_NEIGHBORS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  AL: ["FL", "GA", "MS", "TN"], AK: [], AZ: ["CA", "CO", "NM", "NV", "UT"], AR: ["LA", "MO", "MS", "OK", "TN", "TX"],
  CA: ["AZ", "NV", "OR"], CO: ["AZ", "KS", "NE", "NM", "OK", "UT", "WY"], CT: ["MA", "NY", "RI"], DE: ["MD", "NJ", "PA"],
  FL: ["AL", "GA"], GA: ["AL", "FL", "NC", "SC", "TN"], HI: [], ID: ["MT", "NV", "OR", "UT", "WA", "WY"],
  IL: ["IA", "IN", "KY", "MO", "WI"], IN: ["IL", "KY", "MI", "OH"], IA: ["IL", "MN", "MO", "NE", "SD", "WI"],
  KS: ["CO", "MO", "NE", "OK"], KY: ["IL", "IN", "MO", "OH", "TN", "VA", "WV"], LA: ["AR", "MS", "TX"],
  ME: ["NH"], MD: ["DE", "PA", "VA", "WV", "DC"], MA: ["CT", "NH", "NY", "RI", "VT"], MI: ["IN", "OH", "WI"],
  MN: ["IA", "ND", "SD", "WI"], MS: ["AL", "AR", "LA", "TN"], MO: ["AR", "IA", "IL", "KS", "KY", "NE", "OK", "TN"],
  MT: ["ID", "ND", "SD", "WY"], NE: ["CO", "IA", "KS", "MO", "SD", "WY"], NV: ["AZ", "CA", "ID", "OR", "UT"],
  NH: ["ME", "MA", "VT"], NJ: ["DE", "NY", "PA"], NM: ["AZ", "CO", "OK", "TX", "UT"], NY: ["CT", "MA", "NJ", "PA", "VT"],
  NC: ["GA", "SC", "TN", "VA"], ND: ["MN", "MT", "SD"], OH: ["IN", "KY", "MI", "PA", "WV"],
  OK: ["AR", "CO", "KS", "MO", "NM", "TX"], OR: ["CA", "ID", "NV", "WA"], PA: ["DE", "MD", "NJ", "NY", "OH", "WV"],
  RI: ["CT", "MA"], SC: ["GA", "NC"], SD: ["IA", "MN", "MT", "ND", "NE", "WY"], TN: ["AL", "AR", "GA", "KY", "MO", "MS", "NC", "VA"],
  TX: ["AR", "LA", "NM", "OK"], UT: ["AZ", "CO", "ID", "NM", "NV", "WY"], VT: ["MA", "NH", "NY"],
  VA: ["KY", "MD", "NC", "TN", "WV", "DC"], WA: ["ID", "OR"], WV: ["KY", "MD", "OH", "PA", "VA"],
  WI: ["IA", "IL", "MI", "MN"], WY: ["CO", "ID", "MT", "NE", "SD", "UT"], DC: ["MD", "VA"]
});

function normalized(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function parseGhostWorkPreference(value: unknown): GhostWorkPreference | null {
  return GHOST_WORK_PREFERENCES.includes(value as GhostWorkPreference)
    ? value as GhostWorkPreference
    : null;
}

export function parseGhostSeekerLocation(value: unknown): GhostSeekerLocation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.city !== "string" || typeof row.state !== "string") return null;
  const city = row.city.trim();
  const state = row.state.trim().toUpperCase();
  if (!city || !/^[A-Z]{2}$/.test(state) || !(state in STATE_NEIGHBORS)) return null;
  const workPreference = parseGhostWorkPreference(row.workPreference);
  if (!workPreference) return null;
  return Object.freeze({ city, state, workPreference });
}

export function ghostProximityFor(
  seeker: GhostSeekerLocation | null | undefined,
  candidate: Readonly<{ city: string; state: string }>
): GhostProximity {
  if (!seeker) return Object.freeze({ band: "unknown", label: "Location preference not on file", rankingAdjustment: 0 });
  const candidateState = candidate.state.trim().toUpperCase();
  let band: GhostProximityBand;
  if (candidateState === seeker.state && normalized(candidate.city) === normalized(seeker.city)) band = "same_city";
  else if (candidateState === seeker.state) band = "same_state";
  else if (STATE_NEIGHBORS[seeker.state]?.includes(candidateState)) band = "neighboring_state";
  else band = "farther_away";

  const labels: Record<GhostProximityBand, string> = {
    same_city: "Same city",
    same_state: "Same state",
    neighboring_state: "Neighboring state",
    farther_away: "Farther away",
    unknown: "Location preference not on file"
  };
  const adjustments = seeker.workPreference === "Remote Only"
    ? { same_city: 0, same_state: 0, neighboring_state: 0, farther_away: 0, unknown: 0 }
    : seeker.workPreference === "Local Only"
      ? { same_city: 28, same_state: 22, neighboring_state: 12, farther_away: -18, unknown: 0 }
      : { same_city: 12, same_state: 9, neighboring_state: 5, farther_away: 0, unknown: 0 };
  return Object.freeze({ band, label: labels[band], rankingAdjustment: adjustments[band] });
}
