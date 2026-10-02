import identityCanon from "./station-identity-canon-v2.json" with { type: "json" };

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const HOSTNAME = /^[A-Z][A-Z0-9-]{0,62}$/;
const CANON = structuredClone(identityCanon);

function validateIdentity(row, expectedLifecycle = null) {
  if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("STATION_IDENTITY_CANON_INVALID");
  const keys = Object.keys(row).sort();
  const expected = ["canonical_machine", "dink_address", "dink_nickname", "expected_physical_hostnames", "lifecycle", "station_id"].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) throw new Error("STATION_IDENTITY_CANON_INVALID");
  if (!ID.test(row.station_id) || typeof row.canonical_machine !== "string" || !row.canonical_machine.trim()) throw new Error("STATION_IDENTITY_CANON_INVALID");
  if (!Array.isArray(row.expected_physical_hostnames) || row.expected_physical_hostnames.some((value) => !HOSTNAME.test(value)) || new Set(row.expected_physical_hostnames).size !== row.expected_physical_hostnames.length) throw new Error("STATION_IDENTITY_CANON_INVALID");
  if (row.dink_address !== `Dink@${row.canonical_machine.replaceAll(" ", "")}` || (row.dink_nickname !== null && typeof row.dink_nickname !== "string")) throw new Error("STATION_IDENTITY_CANON_INVALID");
  if (expectedLifecycle !== null && row.lifecycle !== expectedLifecycle) throw new Error("STATION_IDENTITY_CANON_INVALID");
  if (!["ENROLLMENT_ELIGIBLE", "AWAITING_PHYSICAL_HOSTNAME_EVIDENCE", "RETIRED_HISTORICAL_COMPATIBILITY_ONLY"].includes(row.lifecycle)) throw new Error("STATION_IDENTITY_CANON_INVALID");
  if ((row.lifecycle === "AWAITING_PHYSICAL_HOSTNAME_EVIDENCE") !== (row.expected_physical_hostnames.length === 0)) throw new Error("STATION_IDENTITY_CANON_INVALID");
  return Object.freeze({ ...row, expected_physical_hostnames: Object.freeze([...row.expected_physical_hostnames]) });
}

if (CANON.schema !== "werkles.harvey-station-identity-canon/v2" || !Array.isArray(CANON.stations) || !Array.isArray(CANON.retired_stations) || CANON.canonical_station_count !== 6 || CANON.roles_per_station !== 7 || CANON.canonical_seat_count !== 42) throw new Error("STATION_IDENTITY_CANON_INVALID");
const currentIdentities = CANON.stations.map((row) => validateIdentity(row));
const retiredIdentities = CANON.retired_stations.map((row) => validateIdentity(row, "RETIRED_HISTORICAL_COMPATIBILITY_ONLY"));
const allIdentities = [...currentIdentities, ...retiredIdentities];
if (new Set(allIdentities.map((row) => row.station_id)).size !== allIdentities.length || currentIdentities.length !== CANON.canonical_station_count) throw new Error("STATION_IDENTITY_CANON_INVALID");
const STATION_IDENTITIES = new Map(allIdentities.map((row) => [row.station_id, row]));
const MACHINE_ALIASES = new Map(Object.entries(CANON.machine_aliases || {}));
for (const [alias, stationId] of MACHINE_ALIASES) {
  if (alias !== alias.trim().toLowerCase() || !currentIdentities.some((row) => row.station_id === stationId)) throw new Error("STATION_IDENTITY_CANON_INVALID");
}

function clone(identity) {
  return {
    ...identity,
    expected_physical_hostnames: [...identity.expected_physical_hostnames]
  };
}

export function canonicalStationIdentity(stationId) {
  const identity = STATION_IDENTITIES.get(String(stationId || "").trim().toLowerCase());
  if (!identity) throw new Error("STATION_ID_NOT_IN_CANONICAL_BODY");
  return clone(identity);
}

export function currentCanonicalStationIdentities() {
  return currentIdentities.map(clone);
}

export function stationIdentityLifecycle(stationId) {
  const identity = STATION_IDENTITIES.get(String(stationId || "").trim().toLowerCase());
  if (!identity) throw new Error("STATION_ID_NOT_IN_CANONICAL_BODY");
  return identity.lifecycle;
}

export function stationIdentityCanon() {
  return structuredClone(CANON);
}

export function canonicalizeMachineAlias(machine) {
  const stationId = MACHINE_ALIASES.get(String(machine || "").trim().toLowerCase());
  if (!stationId) throw new Error("MACHINE_ALIAS_NOT_IN_CANONICAL_BODY");
  return canonicalStationIdentity(stationId);
}

export function assertCanonicalPhysicalHostname(stationId, hostname) {
  const identity = canonicalStationIdentity(stationId);
  if (identity.expected_physical_hostnames.length === 0) {
    throw new Error("STATION_PHYSICAL_HOSTNAME_EVIDENCE_NOT_PROVISIONED");
  }
  const physicalHostname = String(hostname || "").trim().toUpperCase();
  if (!identity.expected_physical_hostnames.includes(physicalHostname)) {
    throw new Error("STATION_PHYSICAL_HOSTNAME_NOT_IN_CANONICAL_BODY");
  }
  return identity;
}

export function normalizeFabricStationIdentity(station) {
  const identity = assertCanonicalPhysicalHostname(station?.station_id, station?.hostname);
  if (station.machine !== identity.canonical_machine && station.machine !== station.hostname) {
    throw new Error("FABRIC_STATION_MACHINE_IDENTITY_CONFLICT");
  }
  return {
    ...station,
    machine: identity.canonical_machine
  };
}
