import { createHash, createPublicKey, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import {
  canonicalJson,
  signDurableRecord,
  verifyDurableRecord,
  verifyEnvelope
} from "./station-crypto-core.mjs";
import {
  assertCanonicalPhysicalHostname,
  canonicalStationIdentity,
  normalizeFabricStationIdentity
} from "./station-identity-core.mjs";

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const THREAD_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const CANONICAL_ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const PROTOCOLS = new Set(["DIRECT", "VPGJ", "PG", "KNOCK", "PROJECT"]);
const TERMINAL = new Set(["COMPLETED", "BLOCKER"]);
const BASELINE_AEYE_ROLE_IDS = Object.freeze([
  "petra",
  "skybro",
  "thufir",
  "bean",
  "ender",
  "doozer",
]);
const BASELINE_ROLE_DISPLAY = Object.freeze({
  dink: "Dink",
  petra: "Petra",
  skybro: "Skybro",
  thufir: "Thufir",
  bean: "Bean",
  ender: "Ender",
  doozer: "Doozer",
});
const TRANSITIONS = {
  QUEUED: ["DELIVERED", "BLOCKER"],
  DELIVERED: ["THINKING", "BLOCKER"],
  THINKING: ["REPLIED", "BLOCKER"],
  REPLIED: ["COMPLETED", "BLOCKER"],
  COMPLETED: [],
  BLOCKER: [],
};

function text(value, label, maximum = 4096) {
  if (typeof value !== "string") throw new Error(`${label}_INVALID`);
  const bounded = value.trim();
  if (!bounded || Buffer.byteLength(bounded, "utf8") > maximum) throw new Error(`${label}_INVALID`);
  return bounded;
}

function exact(value, keys) {
  if (!value || Array.isArray(value) || typeof value !== "object") return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function baselineSeatIdentity(stationId, value, bindingRole) {
  if (typeof value !== "string") return null;
  if (value !== value.trim().toLowerCase()) return null;
  const seatId = value;
  const [roleId, seatStationId, ...extra] = seatId.split("@");
  if (
    extra.length > 0
    || seatStationId !== stationId
    || (bindingRole === "DINK"
      ? roleId !== "dink"
      : !BASELINE_AEYE_ROLE_IDS.includes(roleId))
  ) return null;
  const identity = canonicalStationIdentity(stationId);
  return {
    seat_id: seatId,
    role_id: roleId,
    address: `${BASELINE_ROLE_DISPLAY[roleId]}@${identity.dink_address.split("@")[1]}`,
  };
}

function hash(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hashBytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function validEd25519SignatureBase64(value) {
  if (typeof value !== "string") return false;
  const decoded = Buffer.from(value, "base64");
  return decoded.length === 64 && decoded.toString("base64") === value;
}

function canonicalHash(value) {
  return hash(canonicalJson(value));
}

function keyFingerprint(pem) {
  const key = createPublicKey(pem);
  if (key.asymmetricKeyType !== "ed25519") throw new Error("PUBLIC_KEY_ALGORITHM_INVALID");
  return createHash("sha256").update(key.export({ type: "spki", format: "der" })).digest("hex");
}

function hashEqual(left, right) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function classifyStationTerminalEvidence(state, stationTerminalAttestation) {
  if (state === "CANCELED") {
    return {
      status: "CONTROL_CANCELED",
      trusted_terminal_transport: false,
      blocker: "CONTROL_CANCELLATION_IS_NOT_A_STATION_SIGNED_TERMINAL_RECEIPT",
      attestation_id: null,
      station_envelope_sha256: null,
      coordinator_record_sha256: null
    };
  }
  if (!TERMINAL.has(state)) {
    return {
      status: "NOT_TERMINAL",
      trusted_terminal_transport: false,
      blocker: null,
      attestation_id: null,
      station_envelope_sha256: null,
      coordinator_record_sha256: null
    };
  }
  if (stationTerminalAttestation === undefined || stationTerminalAttestation === null) {
    return {
      status: "UNATTESTED_LEGACY",
      trusted_terminal_transport: false,
      blocker: "SIGNED_STATION_TERMINAL_ATTESTATION_NOT_PRESENT",
      attestation_id: null,
      station_envelope_sha256: null,
      coordinator_record_sha256: null
    };
  }
  return {
    status: "ATTESTATION_PRESENT_NOT_VERIFIED",
    trusted_terminal_transport: false,
    blocker: "SIGNED_STATION_TERMINAL_ATTESTATION_CONTROL_VERIFIER_NOT_WIRED",
    attestation_id: null,
    station_envelope_sha256: null,
    coordinator_record_sha256: null
  };
}

export function emptyFabricRegistry(now = new Date()) {
  return {
    schema: "werkles.harvey-station-fabric/v1",
    revision: 1,
    updated_at: now.toISOString(),
    stations: [],
    enrollments: [],
  };
}

export function validateFabricRegistry(value) {
  if (!exact(value, ["schema", "revision", "updated_at", "stations", "enrollments"])) throw new Error("FABRIC_REGISTRY_INVALID");
  if (value.schema !== "werkles.harvey-station-fabric/v1" || !Number.isSafeInteger(value.revision) || value.revision < 1 || !Number.isFinite(Date.parse(value.updated_at)) || !Array.isArray(value.stations) || !Array.isArray(value.enrollments)) throw new Error("FABRIC_REGISTRY_INVALID");
  const registry = structuredClone(value);
  const stationIds = new Set();
  const threadIds = new Set();
  const bindingIds = new Set();
  const seatIds = new Set();
  for (const unnormalizedStation of registry.stations) {
    const station = normalizeFabricStationIdentity(unnormalizedStation);
    Object.assign(unnormalizedStation, station);
    if (!exact(station, ["station_id", "hostname", "machine", "public_key_pem", "public_key_sha256", "state", "installed_at", "last_seen_at", "catalog_updated_at", "catalog", "bindings"])) throw new Error("FABRIC_STATION_INVALID");
    if (!ID.test(station.station_id) || !/^[A-Z][A-Z0-9-]{0,62}$/.test(station.hostname) || typeof station.public_key_pem !== "string" || !SHA256.test(station.public_key_sha256) || keyFingerprint(station.public_key_pem) !== station.public_key_sha256 || !["ACTIVE", "DISABLED", "REVOKED"].includes(station.state) || !Number.isFinite(Date.parse(station.installed_at)) || (station.last_seen_at !== null && !Number.isFinite(Date.parse(station.last_seen_at))) || (station.catalog_updated_at !== null && !Number.isFinite(Date.parse(station.catalog_updated_at))) || !Array.isArray(station.catalog) || !Array.isArray(station.bindings) || stationIds.has(station.station_id)) throw new Error("FABRIC_STATION_INVALID");
    for (const item of station.catalog) {
      if (!exact(item, ["thread_id", "title", "cwd", "status", "updated_at"]) || !THREAD_ID.test(item.thread_id) || (item.title !== null && typeof item.title !== "string") || typeof item.cwd !== "string" || typeof item.status !== "string" || !Number.isFinite(Date.parse(item.updated_at))) throw new Error("FABRIC_CATALOG_INVALID");
    }
    const catalogThreadIds = new Set(station.catalog.map((item) => item.thread_id));
    stationIds.add(station.station_id);
    const activeDinkProjects = new Set();
    for (const binding of station.bindings) {
      if (!Object.hasOwn(binding, "seat_id")) binding.seat_id = null;
      if (!exact(binding, ["binding_id", "thread_id", "seat_id", "dink", "project_id", "role", "parent_binding_id", "state"]) || !ID.test(binding.binding_id) || !THREAD_ID.test(binding.thread_id) || (binding.seat_id !== null && (typeof binding.seat_id !== "string" || !/^[a-z][a-z0-9-]{0,63}@[a-z0-9][a-z0-9-]{0,63}$/.test(binding.seat_id))) || !ID.test(binding.project_id) || !["DINK", "AEYE"].includes(binding.role) || (binding.parent_binding_id !== null && !ID.test(binding.parent_binding_id)) || !["ACTIVE", "DISABLED", "REVOKED"].includes(binding.state) || typeof binding.dink !== "string" || !binding.dink.trim() || Buffer.byteLength(binding.dink.trim(), "utf8") > 120 || threadIds.has(binding.thread_id) || bindingIds.has(binding.binding_id)) throw new Error("FABRIC_BINDING_INVALID");
      if (binding.seat_id !== null) {
        const seat = baselineSeatIdentity(station.station_id, binding.seat_id, binding.role);
        if (!seat || seat.address !== binding.dink || seatIds.has(seat.seat_id)) {
          throw new Error("FABRIC_BINDING_SEAT_IDENTITY_INVALID");
        }
        seatIds.add(seat.seat_id);
      }
      if (binding.role === "DINK" && binding.state === "ACTIVE") {
        if (activeDinkProjects.has(binding.project_id)) throw new Error("FABRIC_DINK_ROOT_DUPLICATE");
        activeDinkProjects.add(binding.project_id);
      }
      if (binding.state === "ACTIVE" && (
        station.catalog_updated_at === null
        || !catalogThreadIds.has(binding.thread_id)
      )) throw new Error("FABRIC_ACTIVE_BINDING_NOT_IN_CURRENT_CATALOG");
      threadIds.add(binding.thread_id);
      bindingIds.add(binding.binding_id);
    }
  }
  for (const station of registry.stations) {
    for (const binding of station.bindings) {
      if (binding.role === "DINK" && binding.parent_binding_id !== null) {
        throw new Error("FABRIC_DINK_PARENT_INVALID");
      }
      if (binding.role === "AEYE") {
        const parent = station.bindings.find((candidate) =>
          candidate.binding_id === binding.parent_binding_id
          && candidate.role === "DINK"
          && candidate.project_id === binding.project_id
        );
        if (!parent || (binding.state === "ACTIVE" && parent.state !== "ACTIVE")) {
          throw new Error("FABRIC_AEYE_PARENT_INVALID");
        }
      }
    }
  }
  const enrollmentIds = new Set();
  for (const enrollment of registry.enrollments) {
    if (!exact(enrollment, ["enrollment_id", "station_id", "hostnames", "token_sha256", "created_at", "expires_at", "consumed_at", "state"]) || !ID.test(enrollment.station_id) || !Array.isArray(enrollment.hostnames) || !enrollment.hostnames.length || enrollment.hostnames.some((hostname) => !/^[A-Z][A-Z0-9-]{0,62}$/.test(hostname)) || new Set(enrollment.hostnames).size !== enrollment.hostnames.length || !SHA256.test(enrollment.token_sha256) || !Number.isFinite(Date.parse(enrollment.created_at)) || !Number.isFinite(Date.parse(enrollment.expires_at)) || (enrollment.consumed_at !== null && !Number.isFinite(Date.parse(enrollment.consumed_at))) || !["PENDING", "CONSUMED", "EXPIRED", "REVOKED"].includes(enrollment.state) || enrollmentIds.has(enrollment.enrollment_id)) throw new Error("FABRIC_ENROLLMENT_INVALID");
    enrollmentIds.add(enrollment.enrollment_id);
  }
  return registry;
}

export function createEnrollment(registryValue, { stationId, hostname, hostnames, now = new Date(), lifetimeMinutes = 30 }) {
  const registry = validateFabricRegistry(registryValue);
  const boundedStation = text(stationId, "STATION_ID", 64);
  const boundedHostnames = [...new Set((hostnames || [hostname]).map((value) => text(value, "HOSTNAME", 64).toUpperCase()))];
  if (!ID.test(boundedStation) || !boundedHostnames.length || boundedHostnames.some((value) => !/^[A-Z][A-Z0-9-]{0,62}$/.test(value)) || !Number.isSafeInteger(lifetimeMinutes) || lifetimeMinutes < 5 || lifetimeMinutes > 43_200) throw new Error("ENROLLMENT_INPUT_INVALID");
  canonicalStationIdentity(boundedStation);
  for (const boundedHostname of boundedHostnames) {
    assertCanonicalPhysicalHostname(boundedStation, boundedHostname);
  }
  const token = randomBytes(32).toString("hex");
  const enrollment = {
    enrollment_id: `enroll-${randomUUID().replaceAll("-", "")}`,
    station_id: boundedStation,
    hostnames: boundedHostnames,
    token_sha256: hash(token),
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + lifetimeMinutes * 60_000).toISOString(),
    consumed_at: null,
    state: "PENDING",
  };
  registry.enrollments.push(enrollment);
  registry.revision += 1;
  registry.updated_at = now.toISOString();
  return { registry, enrollment, token };
}

export function revokeEnrollments(registryValue, { enrollmentId = null, stationId = null, now = new Date() }) {
  const registry = validateFabricRegistry(registryValue);
  if ((enrollmentId === null) === (stationId === null)) throw new Error("ENROLLMENT_REVOKE_SCOPE_REQUIRED");
  if (enrollmentId !== null && (typeof enrollmentId !== "string" || !/^enroll-[a-f0-9]{32}$/.test(enrollmentId))) throw new Error("ENROLLMENT_ID_INVALID");
  if (stationId !== null && (typeof stationId !== "string" || !ID.test(stationId))) throw new Error("STATION_ID_INVALID");
  const matches = registry.enrollments.filter((row) =>
    row.state === "PENDING" &&
    (enrollmentId !== null ? row.enrollment_id === enrollmentId : row.station_id === stationId)
  );
  if (!matches.length) throw new Error("PENDING_ENROLLMENT_NOT_FOUND");
  for (const enrollment of matches) enrollment.state = "REVOKED";
  registry.revision += 1;
  registry.updated_at = now.toISOString();
  return { registry, revoked: matches.map((row) => ({ enrollment_id: row.enrollment_id, station_id: row.station_id, state: row.state })) };
}

export function consumeEnrollment(registryValue, { enrollmentId, token, hostname, publicKeyPem, now = new Date() }) {
  const registry = validateFabricRegistry(registryValue);
  const enrollment = registry.enrollments.find((row) => row.enrollment_id === enrollmentId);
  if (!enrollment || enrollment.state !== "PENDING" || !enrollment.hostnames.includes(String(hostname).toUpperCase()) || Date.parse(enrollment.expires_at) <= now.getTime()) throw new Error("ENROLLMENT_NOT_AUTHORIZED");
  const key = text(publicKeyPem, "PUBLIC_KEY", 8192);
  const keyHash = keyFingerprint(key);
  if (!hashEqual(hash(text(token, "ENROLLMENT_TOKEN", 256)), enrollment.token_sha256)) throw new Error("ENROLLMENT_NOT_AUTHORIZED");
  let station = registry.stations.find((row) => row.station_id === enrollment.station_id);
  const physicalHostname = String(hostname).toUpperCase();
  const identity = assertCanonicalPhysicalHostname(enrollment.station_id, physicalHostname);
  if (station && station.hostname !== physicalHostname) throw new Error("STATION_HOSTNAME_CONFLICT");
  if (!station) {
    station = {
      station_id: enrollment.station_id,
      hostname: physicalHostname,
      machine: identity.canonical_machine,
      public_key_pem: key,
      public_key_sha256: keyHash,
      state: "ACTIVE",
      installed_at: now.toISOString(),
      last_seen_at: null,
      catalog_updated_at: null,
      catalog: [],
      bindings: [],
    };
    registry.stations.push(station);
  } else if (station.public_key_sha256 !== keyHash) throw new Error("STATION_KEY_ROTATION_REQUIRES_CEREMONY");
  else station.machine = identity.canonical_machine;
  enrollment.state = "CONSUMED";
  enrollment.consumed_at = now.toISOString();
  registry.revision += 1;
  registry.updated_at = now.toISOString();
  return { registry, station };
}

export function bindThread(registryValue, { stationId, threadId, dink, projectId, role = "DINK", parentBindingId = null, now = new Date() }) {
  const registry = validateFabricRegistry(registryValue);
  const station = registry.stations.find((row) => row.station_id === stationId && row.state === "ACTIVE");
  if (!station || !THREAD_ID.test(threadId) || !ID.test(projectId) || !["DINK", "AEYE"].includes(role) || (parentBindingId !== null && !ID.test(parentBindingId))) throw new Error("BINDING_INPUT_INVALID");
  if (role === "DINK" && parentBindingId !== null) throw new Error("DINK_PARENT_INVALID");
  if (role === "AEYE" && !station.bindings.some((row) => row.binding_id === parentBindingId && row.role === "DINK" && row.project_id === projectId && row.state === "ACTIVE")) throw new Error("AEYE_PARENT_INVALID");
  const owner = registry.stations.flatMap((row) => row.bindings.map((binding) => ({ station: row, binding }))).find((row) => row.binding.thread_id === threadId);
  if (owner && owner.station.station_id !== stationId) throw new Error("THREAD_ALREADY_BOUND_TO_OTHER_STATION");
  let binding = station.bindings.find((row) => row.thread_id === threadId);
  if (binding && (
    binding.project_id !== projectId
    || binding.role !== role
    || binding.parent_binding_id !== parentBindingId
  )) throw new Error("BINDING_IDENTITY_IMMUTABLE");
  if (binding && binding.state !== "ACTIVE") {
    throw new Error("BINDING_REACTIVATION_REQUIRES_CEREMONY");
  }
  if (role === "DINK" && station.bindings.some((row) =>
    row.binding_id !== binding?.binding_id
    && row.project_id === projectId
    && row.role === "DINK"
    && row.state === "ACTIVE"
  )) throw new Error("DINK_ROOT_ALREADY_BOUND");
  if (!binding) {
    binding = { binding_id: `binding-${randomUUID().replaceAll("-", "")}`, thread_id: threadId, seat_id: null, dink: text(dink, "DINK", 120), project_id: projectId, role, parent_binding_id: parentBindingId, state: "ACTIVE" };
    station.bindings.push(binding);
  } else {
    Object.assign(binding, { dink: text(dink, "DINK", 120), project_id: projectId, role, parent_binding_id: parentBindingId, state: "ACTIVE" });
  }
  registry.revision += 1;
  registry.updated_at = now.toISOString();
  return { registry, binding };
}

export function bindCatalogThread(registryValue, input) {
  const registry = validateFabricRegistry(registryValue);
  const station = registry.stations.find((row) =>
    row.station_id === input?.stationId
    && row.state === "ACTIVE"
  );
  if (!station) throw new Error("STATION_NOT_FOUND");
  if (!THREAD_ID.test(input?.threadId || "")) throw new Error("CATALOG_THREAD_ID_INVALID");
  if (!station.catalog.some((row) => row.thread_id === input.threadId)) {
    throw new Error("CATALOG_THREAD_NOT_FOUND");
  }
  return bindThread(registry, input);
}

export function applyStationRoutePlan(
  registryValue,
  planValue,
  now = new Date()
) {
  const registry = validateFabricRegistry(registryValue);
  if (
    !exact(planValue, [
      "schema",
      "station_id",
      "project_id",
      "catalog_updated_at",
      "catalog_sha256",
      "root",
      "siblings",
    ])
    || planValue.schema !== "werkles.harvey-station-route-plan/v1"
    || !ID.test(planValue.station_id)
    || !ID.test(planValue.project_id)
    || typeof planValue.catalog_updated_at !== "string"
    || !CANONICAL_ISO_INSTANT.test(planValue.catalog_updated_at)
    || typeof planValue.catalog_sha256 !== "string"
    || !SHA256.test(planValue.catalog_sha256)
    || !exact(planValue.root, ["seat_id", "thread_id"])
    || !Array.isArray(planValue.siblings)
    || planValue.siblings.length !== BASELINE_AEYE_ROLE_IDS.length
    || planValue.siblings.some((row) => !exact(row, ["seat_id", "thread_id"]))
    || !(now instanceof Date)
    || !Number.isFinite(now.getTime())
  ) throw new Error("ROUTE_PLAN_INVALID");
  const station = registry.stations.find((row) =>
    row.station_id === planValue.station_id
    && row.state === "ACTIVE"
  );
  if (!station) throw new Error("ROUTE_PLAN_STATION_NOT_FOUND");
  if (
    station.catalog_updated_at === null
    || station.catalog_updated_at !== planValue.catalog_updated_at
    || canonicalHash(station.catalog) !== planValue.catalog_sha256
  ) throw new Error("ROUTE_PLAN_CATALOG_REVISION_MISMATCH");

  const normalizeSeat = (row, role) => {
    if (!THREAD_ID.test(row.thread_id)) throw new Error("ROUTE_PLAN_THREAD_INVALID");
    const seat = baselineSeatIdentity(station.station_id, row.seat_id, role);
    if (!seat) throw new Error("ROUTE_PLAN_SEAT_ID_INVALID");
    return {
      seat_id: seat.seat_id,
      thread_id: row.thread_id,
      address: seat.address,
      project_id: planValue.project_id,
      role,
    };
  };
  const rootSeat = normalizeSeat(planValue.root, "DINK");
  const siblingSeats = planValue.siblings.map((row) => normalizeSeat(row, "AEYE"));
  const seats = [rootSeat, ...siblingSeats];
  if (
    new Set(seats.map((row) => row.thread_id)).size !== seats.length
    || new Set(seats.map((row) => row.seat_id)).size !== seats.length
    || new Set(siblingSeats.map((row) => row.seat_id.split("@")[0])).size !== BASELINE_AEYE_ROLE_IDS.length
  ) throw new Error("ROUTE_PLAN_DUPLICATE_SEAT");
  const catalogThreadIds = new Set(station.catalog.map((row) => row.thread_id));
  if (seats.some((row) => !catalogThreadIds.has(row.thread_id))) {
    throw new Error("ROUTE_PLAN_CATALOG_THREAD_NOT_FOUND");
  }
  const desiredThreadIds = new Set(seats.map((row) => row.thread_id));
  if (station.bindings.some((binding) =>
    binding.state === "ACTIVE"
    && binding.project_id === planValue.project_id
    && !desiredThreadIds.has(binding.thread_id)
  )) throw new Error("ROUTE_PLAN_ACTIVE_SET_CONFLICT");
  for (const seat of seats) {
    const owner = registry.stations
      .flatMap((candidate) =>
        candidate.bindings.map((binding) => ({ station: candidate, binding }))
      )
      .find(({ binding }) => binding.thread_id === seat.thread_id);
    if (owner && owner.station.station_id !== station.station_id) {
      throw new Error("ROUTE_PLAN_THREAD_BOUND_TO_OTHER_STATION");
    }
  }

  const deterministicBindingId = (seatId, threadId) =>
    `binding-${hash(`${station.station_id}\n${planValue.project_id}\n${seatId}\n${threadId}`).slice(0, 32)}`;
  const existingRoot = station.bindings.find((row) => row.thread_id === rootSeat.thread_id);
  const rootBindingId = existingRoot?.binding_id
    || deterministicBindingId(rootSeat.seat_id, rootSeat.thread_id);
  if (station.bindings.some((row) =>
    row.binding_id === rootBindingId
    && row.thread_id !== rootSeat.thread_id
  )) throw new Error("ROUTE_PLAN_BINDING_ID_COLLISION");
  if (existingRoot && (
    existingRoot.project_id !== planValue.project_id
    || existingRoot.role !== "DINK"
    || existingRoot.parent_binding_id !== null
    || existingRoot.state !== "ACTIVE"
    || existingRoot.seat_id !== rootSeat.seat_id
    || existingRoot.dink !== rootSeat.address
  )) throw new Error("ROUTE_PLAN_EXISTING_BINDING_CONFLICT");
  if (!existingRoot && station.bindings.some((row) =>
    row.project_id === planValue.project_id
    && row.role === "DINK"
    && row.state === "ACTIVE"
  )) throw new Error("ROUTE_PLAN_DINK_ROOT_CONFLICT");

  const desiredBindings = [{
    binding_id: rootBindingId,
    thread_id: rootSeat.thread_id,
    seat_id: rootSeat.seat_id,
    dink: rootSeat.address,
    project_id: planValue.project_id,
    role: "DINK",
    parent_binding_id: null,
    state: "ACTIVE",
  }];
  for (const seat of siblingSeats) {
    const existing = station.bindings.find((row) => row.thread_id === seat.thread_id);
    const bindingId = existing?.binding_id || deterministicBindingId(seat.seat_id, seat.thread_id);
    if (station.bindings.some((row) =>
      row.binding_id === bindingId
      && row.thread_id !== seat.thread_id
    )) throw new Error("ROUTE_PLAN_BINDING_ID_COLLISION");
    const desired = {
      binding_id: bindingId,
      thread_id: seat.thread_id,
      seat_id: seat.seat_id,
      dink: seat.address,
      project_id: planValue.project_id,
      role: "AEYE",
      parent_binding_id: rootBindingId,
      state: "ACTIVE",
    };
    if (existing && [
      "project_id",
      "role",
      "parent_binding_id",
      "state",
      "seat_id",
      "dink",
    ].some((key) => existing[key] !== desired[key])) {
      throw new Error("ROUTE_PLAN_EXISTING_BINDING_CONFLICT");
    }
    desiredBindings.push(desired);
  }

  const created = [];
  for (const desired of desiredBindings) {
    if (!station.bindings.some((row) => row.thread_id === desired.thread_id)) {
      station.bindings.push(desired);
      created.push(desired.binding_id);
    }
  }
  const normalizedPlan = {
    schema: planValue.schema,
    station_id: station.station_id,
    project_id: planValue.project_id,
    catalog_updated_at: planValue.catalog_updated_at,
    catalog_sha256: planValue.catalog_sha256,
    root: {
      seat_id: rootSeat.seat_id,
      thread_id: rootSeat.thread_id,
    },
    siblings: siblingSeats
      .map((row) => ({ seat_id: row.seat_id, thread_id: row.thread_id }))
      .sort((left, right) => left.seat_id.localeCompare(right.seat_id)),
  };
  if (created.length > 0) {
    registry.revision += 1;
    registry.updated_at = now.toISOString();
  }
  const validated = validateFabricRegistry(registry);
  return {
    registry: validated,
    application: {
      schema: "werkles.harvey-station-route-plan-application/v1",
      route_plan_sha256: canonicalHash(normalizedPlan),
      station_id: station.station_id,
      machine: station.machine,
      hostname: station.hostname,
      project_id: planValue.project_id,
      catalog_updated_at: station.catalog_updated_at,
      catalog_sha256: planValue.catalog_sha256,
      root_binding_id: rootBindingId,
      registry_revision: validated.revision,
      result: created.length > 0 ? "APPLIED" : "EXACT_REPLAY",
      changed: created.length > 0,
      created_binding_ids: created,
      proof_boundary: "BOUND_CATALOG_PROVED_NOT_CALLED",
      bindings: desiredBindings
        .map((binding) => structuredClone(binding))
        .sort((left, right) =>
          left.role === right.role
            ? left.thread_id.localeCompare(right.thread_id)
            : left.role === "DINK" ? -1 : 1
        ),
    }
  };
}

export function replaceStationCatalog(registryValue, { stationId, catalog, now = new Date() }) {
  const registry = validateFabricRegistry(registryValue);
  const station = registry.stations.find((row) =>
    row.station_id === stationId
    && row.state === "ACTIVE"
  );
  if (!station || !Array.isArray(catalog) || catalog.length > 500) {
    throw new Error("CATALOG_REPLACEMENT_INVALID");
  }
  station.catalog = structuredClone(catalog);
  station.catalog_updated_at = now.toISOString();
  station.last_seen_at = now.toISOString();
  const currentThreadIds = new Set(station.catalog.map((item) => item.thread_id));
  const disabled = [];
  for (const binding of station.bindings) {
    if (binding.state === "ACTIVE" && !currentThreadIds.has(binding.thread_id)) {
      binding.state = "DISABLED";
      disabled.push(binding.binding_id);
    }
  }
  const activeBindingIds = new Set(
    station.bindings
      .filter((binding) => binding.state === "ACTIVE")
      .map((binding) => binding.binding_id)
  );
  for (const binding of station.bindings) {
    if (
      binding.state === "ACTIVE"
      && binding.role === "AEYE"
      && !activeBindingIds.has(binding.parent_binding_id)
    ) {
      binding.state = "DISABLED";
      disabled.push(binding.binding_id);
    }
  }
  registry.revision += 1;
  registry.updated_at = now.toISOString();
  return {
    registry: validateFabricRegistry(registry),
    disabled_binding_ids: [...new Set(disabled)]
  };
}

export function createFanout(registryValue, { protocol, body, target = {}, authority = null, request_sha256 = null, now = new Date() }) {
  const registry = validateFabricRegistry(registryValue);
  if (!PROTOCOLS.has(protocol)) throw new Error("PROTOCOL_NOT_ALLOWLISTED");
  const boundedBody = text(body, "BODY", 12 * 1024);
  const targetKeys = Object.keys(target).sort();
  const allowedTargetKeys = new Set(["station_id", "project_id", "role", "thread_id", "binding_id", "global", "cascade"]);
  if (targetKeys.some((key) => !allowedTargetKeys.has(key))) throw new Error("FANOUT_TARGET_INVALID");
  if (target.global !== true && !["station_id", "project_id", "thread_id", "binding_id"].some((key) => typeof target[key] === "string")) throw new Error("FANOUT_EXPLICIT_SCOPE_REQUIRED");
  if (target.global === true && targetKeys.some((key) => !["global", "role"].includes(key))) throw new Error("FANOUT_TARGET_INVALID");
  const candidates = registry.stations.flatMap((station) => station.state === "ACTIVE"
    ? station.bindings
      .filter((binding) =>
        binding.state === "ACTIVE"
        && station.catalog.some((item) => item.thread_id === binding.thread_id)
      )
      .map((binding) => ({ station, binding }))
    : []);
  if (authority && target.cascade === true) {
    const root = candidates.find(({ binding }) => binding.binding_id === target.binding_id);
    const children = candidates.filter(({ station, binding }) =>
      root
      && station.station_id === root.station.station_id
      && binding.project_id === root.binding.project_id
      && binding.parent_binding_id === root.binding.binding_id
    );
    const expectedSeats = root
      ? ["petra", "skybro", "thufir", "bean", "ender", "doozer"].map((role) => `${role}@${root.station.station_id}`).sort()
      : [];
    if (!root || root.binding.role !== "DINK" || root.binding.seat_id !== `dink@${root.station.station_id}`
      || children.length !== 6
      || JSON.stringify(children.map(({ binding }) => binding.seat_id).sort()) !== JSON.stringify(expectedSeats)) {
      throw new Error("FANOUT_CASCADE_SEVEN_SEAT_CLOSURE_REQUIRED");
    }
  }
  const selected = candidates.filter(({ station, binding }) => {
    if (target.station_id && station.station_id !== target.station_id) return false;
    if (target.project_id && binding.project_id !== target.project_id) return false;
    if (target.role && binding.role !== target.role) return false;
    if (target.cascade === true && target.binding_id) {
      return binding.binding_id === target.binding_id || binding.parent_binding_id === target.binding_id;
    }
    if (target.thread_id && binding.thread_id !== target.thread_id) return false;
    if (target.binding_id && binding.binding_id !== target.binding_id) return false;
    return true;
  });
  if (!selected.length) throw new Error("NO_ELIGIBLE_BINDINGS");
  const fanoutId = `fanout-${randomUUID().replaceAll("-", "")}`;
  return {
    schema: "werkles.harvey-fanout/v1",
    fanout_id: fanoutId,
    protocol,
    created_at: now.toISOString(),
    body_sha256: hash(boundedBody),
    request_sha256,
    authority,
    dispatches: selected.map(({ station, binding }) => ({
      dispatch_id: `dispatch-${randomUUID().replaceAll("-", "")}`,
      fanout_id: fanoutId,
      station_id: station.station_id,
      hostname: station.hostname,
      binding_id: binding.binding_id,
      seat_id: binding.seat_id,
      thread_id: binding.thread_id,
      project_id: binding.project_id,
      role: binding.role,
      parent_binding_id: binding.parent_binding_id,
      authority,
      request_sha256,
      protocol,
      body: boundedBody,
      state: "QUEUED",
      reply: null,
      blocker: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    })),
  };
}

export function advanceDispatch(dispatchValue, event, now = new Date()) {
  const dispatch = structuredClone(dispatchValue);
  if (!TRANSITIONS[dispatch.state] || !exact(event, ["type", "thread_id", "text"]) || event.thread_id !== dispatch.thread_id) throw new Error("DISPATCH_EVENT_INVALID");
  const next = event.type === "thread.started" ? "DELIVERED"
    : event.type === "turn.started" ? "THINKING"
      : event.type === "item.completed" ? "REPLIED"
        : event.type === "turn.completed" ? "COMPLETED"
          : event.type === "turn.failed" ? "BLOCKER"
            : null;
  if (!next || !TRANSITIONS[dispatch.state].includes(next)) throw new Error("DISPATCH_EVENT_ORDER_INVALID");
  dispatch.state = next;
  dispatch.updated_at = now.toISOString();
  if (next === "REPLIED") dispatch.reply = text(event.text, "REPLY", 8 * 1024);
  if (next === "BLOCKER") dispatch.blocker = text(event.text, "BLOCKER", 1024);
  return dispatch;
}

export function cancelDispatchControl(dispatchValue, input, now = new Date()) {
  if (!exact(input, ["dispatch_id", "expected_state", "expected_sequence", "expected_request_sha256", "reason"])) {
    throw new Error("DISPATCH_CANCELLATION_INPUT_INVALID");
  }
  if (
    !/^dispatch-[a-f0-9]{32}$/.test(input.dispatch_id)
    || !["QUEUED", "DELIVERED", "THINKING", "REPLIED"].includes(input.expected_state)
    || !Number.isSafeInteger(input.expected_sequence)
    || input.expected_sequence < 1
    || !SHA256.test(input.expected_request_sha256)
    || !["HEAD_OF_LINE_RECOVERY", "OPERATOR_STOP", "STALE_DISPATCH"].includes(input.reason)
  ) throw new Error("DISPATCH_CANCELLATION_INPUT_INVALID");
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error("DISPATCH_CANCELLATION_NOW_INVALID");

  const cancellationRequestSha256 = canonicalHash(input);
  const blocker = `CONTROL_CANCELED:${input.reason}:${cancellationRequestSha256}`;
  if (dispatchValue?.state === "CANCELED") {
    if (dispatchValue.blocker !== blocker) throw new Error("DISPATCH_CANCELLATION_REPLAY_CONFLICT");
    return { state: "REPLAY_SAME_REQUEST", dispatch: structuredClone(dispatchValue) };
  }
  if (!dispatchValue || typeof dispatchValue !== "object") throw new Error("DISPATCH_NOT_FOUND");
  if (TERMINAL.has(dispatchValue.state)) throw new Error("DISPATCH_ALREADY_TERMINAL");
  if (
    dispatchValue.dispatch_id !== input.dispatch_id
    || dispatchValue.state !== input.expected_state
    || dispatchValue.sequence !== input.expected_sequence
    || dispatchValue.request_sha256 !== input.expected_request_sha256
  ) throw new Error("DISPATCH_CANCELLATION_PRECONDITION_FAILED");

  const dispatch = structuredClone(dispatchValue);
  dispatch.state = "CANCELED";
  dispatch.blocker = blocker;
  dispatch.updated_at = now.toISOString();
  return { state: "CANCELED", dispatch };
}

export function cancelDispatchBatchControl(dispatchValues, input, now = new Date()) {
  if (!Array.isArray(dispatchValues) || !exact(input, ["operations"]) || !Array.isArray(input.operations)
    || input.operations.length < 1 || input.operations.length > 8) {
    throw new Error("DISPATCH_CANCELLATION_BATCH_INPUT_INVALID");
  }
  const ids = input.operations.map((operation) => operation?.dispatch_id);
  if (ids.some((id) => typeof id !== "string") || new Set(ids).size !== ids.length) {
    throw new Error("DISPATCH_CANCELLATION_BATCH_INPUT_INVALID");
  }
  const candidates = input.operations.map((operation) => {
    const matches = dispatchValues.filter((dispatch) => dispatch?.dispatch_id === operation.dispatch_id);
    if (matches.length !== 1) throw new Error("DISPATCH_CANCELLATION_BATCH_TARGET_INVALID");
    return cancelDispatchControl(matches[0], operation, now);
  });
  const resultStates = new Set(candidates.map((candidate) => candidate.state));
  if (resultStates.size !== 1) throw new Error("DISPATCH_CANCELLATION_BATCH_PARTIAL_STATE");
  const replacements = new Map(candidates.map((candidate) => [candidate.dispatch.dispatch_id, candidate.dispatch]));
  return {
    state: candidates[0].state === "REPLAY_SAME_REQUEST" ? "REPLAY_SAME_BATCH" : "CANCELED_ALL_OR_ZERO",
    dispatches: dispatchValues.map((dispatch) => replacements.get(dispatch.dispatch_id) ?? structuredClone(dispatch)),
    canceled: candidates.map((candidate) => structuredClone(candidate.dispatch)),
  };
}

export function fanoutTerminal(fanout) {
  return fanout.dispatches.length > 0
    && fanout.dispatches.every((dispatch) => TERMINAL.has(dispatch.state));
}

const TERMINAL_ATTESTATION_KEYS = [
  "attestation_id",
  "binding_id",
  "seat_id",
  "authority_profile_sha256",
  "boot_revision",
  "release_sha256",
  "request_sha256",
  "blocker_sha256",
  "body_sha256",
  "coordinator_public_key_sha256",
  "disclaimer",
  "dispatch_id",
  "dispatch_context_sha256",
  "dispatch_sequence",
  "envelope_audience",
  "envelope_expires_at",
  "envelope_issued_at",
  "envelope_issuer",
  "envelope_nonce",
  "event_batch_sha256",
  "fanout_id",
  "final_event_sequence",
  "hostname",
  "parent_binding_id",
  "project_id",
  "protocol",
  "recorded_at",
  "replay_protection",
  "reply_sha256",
  "result",
  "schema",
  "store_persistence",
  "station_envelope_sha256",
  "station_envelope_signature_sha256",
  "station_id",
  "station_payload_sha256",
  "station_public_key_sha256",
  "terminal_event_sha256",
  "terminal_event_type",
  "thread_id",
  "role",
  "control_projection",
].sort();

const TERMINAL_DISCLAIMER = "Station-signed terminal transport observed; this does not prove Work completion, Delivery effect, Acceptance, incorporation, or returned human time.";

function validateTerminalEventBatch(events, dispatch) {
  if (!Array.isArray(events) || events.length < 1 || events.length > 64) {
    throw new Error("TERMINAL_EVENT_BATCH_INVALID");
  }
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const keys = Object.keys(event || {}).sort();
    const allowed = event?.type === "turn.completed"
      ? ["sequence", "text", "type", ...(event.usage === undefined ? [] : ["usage"])].sort()
      : ["sequence", "text", "type"].sort();
    if (
      !exact(event, allowed)
      || event.sequence !== index + 1
      || typeof event.type !== "string"
      || !["dispatch.acknowledged", "turn.started", "item.completed", "turn.completed", "turn.failed"].includes(event.type)
      || typeof event.text !== "string"
      || Buffer.byteLength(event.text, "utf8") > 8 * 1024
      || keys.join("|") !== allowed.join("|")
    ) throw new Error("TERMINAL_EVENT_BATCH_INVALID");
    if (event.usage !== undefined && (
      !exact(event.usage, ["input_tokens", "cached_input_tokens", "output_tokens"])
      || Object.values(event.usage).some((value) =>
        !Number.isSafeInteger(value) || value < 0 || value > 1_000_000_000
      )
    )) throw new Error("TERMINAL_EVENT_USAGE_INVALID");
  }
  const terminal = events.at(-1);
  if (terminal.sequence !== dispatch.event_sequence) {
    throw new Error("TERMINAL_EVENT_SEQUENCE_MISMATCH");
  }
  if (dispatch.state === "COMPLETED") {
    if (
      terminal.type !== "turn.completed"
      || events[0].type !== "dispatch.acknowledged"
      || events[1]?.type !== "turn.started"
      || events.slice(2, -1).length < 1
      || events.slice(2, -1).some((event) => event.type !== "item.completed")
    ) throw new Error("TERMINAL_COMPLETION_ORDER_INVALID");
  } else if (dispatch.state === "BLOCKER") {
    const prefix = events.slice(0, -1);
    if (
      terminal.type !== "turn.failed"
      || (prefix.length > 0 && prefix[0].type !== "dispatch.acknowledged")
      || (prefix.length > 1 && prefix[1].type !== "turn.started")
      || prefix.slice(2).some((event) => event.type !== "item.completed")
    ) throw new Error("TERMINAL_BLOCKER_ORDER_INVALID");
  } else {
    throw new Error("TERMINAL_DISPATCH_STATE_INVALID");
  }
  return terminal;
}

export function createStationTerminalAttestationPayload({
  dispatch,
  fanout,
  station,
  coordinatorPublicKeyPem,
  envelope,
  events,
  recordedAt,
  storePersistence = "NOT_PERSISTED_BY_THIS_PREPARATION",
  controlProjection = "NOT_WIRED",
  replayProtection = storePersistence === "PERSISTED_WITH_DISPATCH"
    ? "NONCE_ATOMIC_WITHIN_BROKER_LEASE_ONLY"
    : "NONCE_OBSERVED_NOT_ATOMICALLY_BOUND",
}) {
  if (typeof coordinatorPublicKeyPem !== "string") {
    throw new Error("TERMINAL_ATTESTATION_INPUT_INVALID");
  }
  const coordinatorPublicKeySha256 = keyFingerprint(coordinatorPublicKeyPem);
  const dispatchContext = {
    dispatch_id: dispatch?.dispatch_id,
    fanout_id: dispatch?.fanout_id,
    binding_id: dispatch?.binding_id,
    seat_id: dispatch?.seat_id,
    thread_id: dispatch?.thread_id,
    project_id: dispatch?.project_id,
    protocol: dispatch?.protocol,
    role: dispatch?.role,
    parent_binding_id: dispatch?.parent_binding_id,
    authority_profile_sha256: dispatch?.authority?.authority_profile_sha256,
    boot_revision: dispatch?.authority?.boot_revision,
    release_sha256: dispatch?.authority?.release_sha256,
    request_sha256: dispatch?.request_sha256,
    dispatch_sequence: dispatch?.sequence,
    body_sha256: typeof dispatch?.body === "string" ? hash(dispatch.body) : null,
  };
  const dispatchContextSha256 = canonicalHash(dispatchContext);
  if (
    !dispatch
    || !fanout
    || !station
    || typeof recordedAt !== "string"
    || !CANONICAL_ISO_INSTANT.test(recordedAt)
    || !Number.isFinite(Date.parse(recordedAt))
    || !exact(envelope, [
      "schema",
      "issuer",
      "audience",
      "nonce",
      "issued_at",
      "expires_at",
      "payload",
      "signature_ed25519",
    ])
    || envelope.schema !== "werkles.harvey-signed-envelope/v1"
    || envelope.issuer !== station.station_id
    || envelope.audience !== "harvey-coordinator"
    || !/^[a-f0-9]{32}$/.test(envelope.nonce)
    || !Number.isFinite(Date.parse(envelope.issued_at))
    || !Number.isFinite(Date.parse(envelope.expires_at))
    || !CANONICAL_ISO_INSTANT.test(envelope.issued_at)
    || !CANONICAL_ISO_INSTANT.test(envelope.expires_at)
    || Date.parse(envelope.expires_at) - Date.parse(envelope.issued_at) > 900_000
    || Date.parse(recordedAt) < Date.parse(envelope.issued_at)
    || Date.parse(recordedAt) > Date.parse(envelope.expires_at) + 30_000
    || !validEd25519SignatureBase64(envelope.signature_ed25519)
    || !exact(envelope.payload, [
      "kind",
      "dispatch_id",
      "dispatch_context_sha256",
      "events",
    ])
    || envelope.payload.kind !== "events"
    || envelope.payload.dispatch_id !== dispatch.dispatch_id
    || envelope.payload.dispatch_context_sha256 !== dispatchContextSha256
    || canonicalJson(envelope.payload.events) !== canonicalJson(events)
    || dispatch.station_id !== station.station_id
    || dispatch.hostname !== station.hostname
    || station.state !== "ACTIVE"
    || typeof station.public_key_pem !== "string"
    || keyFingerprint(station.public_key_pem) !== station.public_key_sha256
    || !Array.isArray(station.bindings)
    || !station.bindings.some((binding) =>
      binding.binding_id === dispatch.binding_id
      && binding.thread_id === dispatch.thread_id
      && binding.project_id === dispatch.project_id
      && binding.role === dispatch.role
      && binding.parent_binding_id === dispatch.parent_binding_id
      && binding.state === "ACTIVE"
    )
    || dispatch.fanout_id !== fanout.fanout_id
    || !Number.isSafeInteger(dispatch.sequence)
    || dispatch.sequence < 1
    || !Number.isSafeInteger(dispatch.event_sequence)
    || dispatch.event_sequence < 1
    || typeof dispatch.body !== "string"
    || Buffer.byteLength(dispatch.body, "utf8") > 12 * 1024
    || fanout.body_sha256 !== hash(dispatch.body)
    || !SHA256.test(station.public_key_sha256)
  ) throw new Error("TERMINAL_ATTESTATION_INPUT_INVALID");

  const verifiedEnvelopePayload = verifyEnvelope(
    station.public_key_pem,
    envelope,
    {
      issuer: station.station_id,
      audience: "harvey-coordinator",
      now: new Date(recordedAt),
      maximumClockSkewSeconds: 30,
    }
  );
  if (canonicalJson(verifiedEnvelopePayload) !== canonicalJson(envelope.payload)) {
    throw new Error("TERMINAL_ATTESTATION_ENVELOPE_INVALID");
  }
  const terminal = validateTerminalEventBatch(events, dispatch);
  const replyItems = events
    .filter((event) => event.type === "item.completed")
    .map((event) => event.text.trim());
  const derivedReply = replyItems.filter(Boolean).join("\n");
  const expectedStoredReply = replyItems.length > 0 ? derivedReply : null;
  const derivedBlocker = terminal.type === "turn.failed"
    ? String(terminal.text || "STATION_TURN_FAILED").slice(0, 1024)
    : null;
  if (
    dispatch.state === "COMPLETED"
    && (
      typeof dispatch.reply !== "string"
      || !derivedReply
      || dispatch.reply !== derivedReply
      || Buffer.byteLength(dispatch.reply, "utf8") > 8 * 1024
      || dispatch.blocker !== null
    )
  ) throw new Error("TERMINAL_COMPLETION_CONTENT_INVALID");
  if (
    dispatch.state === "BLOCKER"
    && (
      dispatch.reply !== expectedStoredReply
      || (typeof dispatch.reply === "string" && Buffer.byteLength(dispatch.reply, "utf8") > 8 * 1024)
      || typeof dispatch.blocker !== "string"
      || dispatch.blocker !== derivedBlocker
      || Buffer.byteLength(dispatch.blocker, "utf8") > 1024
    )
  ) throw new Error("TERMINAL_BLOCKER_CONTENT_INVALID");

  const unsigned = {
    schema: "werkles.harvey-station-terminal-attestation/v1",
    result: dispatch.state === "COMPLETED"
      ? "TURN_TERMINAL_COMPLETED"
      : "TURN_TERMINAL_BLOCKER",
    recorded_at: recordedAt,
    disclaimer: TERMINAL_DISCLAIMER,
    replay_protection: replayProtection,
    store_persistence: storePersistence,
    control_projection: controlProjection,
    dispatch_id: dispatch.dispatch_id,
    dispatch_context_sha256: dispatchContextSha256,
    fanout_id: dispatch.fanout_id,
    binding_id: dispatch.binding_id,
    seat_id: dispatch.seat_id,
    thread_id: dispatch.thread_id,
    project_id: dispatch.project_id,
    protocol: dispatch.protocol,
    role: dispatch.role,
    parent_binding_id: dispatch.parent_binding_id,
    authority_profile_sha256: dispatch.authority.authority_profile_sha256,
    boot_revision: dispatch.authority.boot_revision,
    release_sha256: dispatch.authority.release_sha256,
    request_sha256: dispatch.request_sha256,
    dispatch_sequence: dispatch.sequence,
    final_event_sequence: dispatch.event_sequence,
    terminal_event_type: terminal.type,
    station_id: station.station_id,
    hostname: station.hostname,
    station_public_key_sha256: station.public_key_sha256,
    coordinator_public_key_sha256: coordinatorPublicKeySha256,
    envelope_issuer: envelope.issuer,
    envelope_audience: envelope.audience,
    envelope_nonce: envelope.nonce,
    envelope_issued_at: envelope.issued_at,
    envelope_expires_at: envelope.expires_at,
    station_envelope_sha256: canonicalHash(envelope),
    station_envelope_signature_sha256: hashBytes(
      Buffer.from(envelope.signature_ed25519, "base64")
    ),
    station_payload_sha256: canonicalHash(envelope.payload),
    event_batch_sha256: canonicalHash(events),
    terminal_event_sha256: canonicalHash(terminal),
    body_sha256: hash(dispatch.body),
    reply_sha256: dispatch.reply === null ? null : hash(dispatch.reply),
    blocker_sha256: dispatch.blocker === null ? null : hash(dispatch.blocker),
  };
  const attestationId = `station-attest-${canonicalHash(unsigned)}`;
  return validateStationTerminalAttestationPayload({
    ...unsigned,
    attestation_id: attestationId,
  });
}

export function validateStationTerminalAttestationPayload(value) {
  if (!exact(value, TERMINAL_ATTESTATION_KEYS)) {
    throw new Error("TERMINAL_ATTESTATION_SCHEMA_INVALID");
  }
  const { attestation_id: attestationId, ...unsigned } = value;
  if (
    value.schema !== "werkles.harvey-station-terminal-attestation/v1"
    || !/^station-attest-[a-f0-9]{64}$/.test(attestationId)
    || attestationId !== `station-attest-${canonicalHash(unsigned)}`
    || !["TURN_TERMINAL_COMPLETED", "TURN_TERMINAL_BLOCKER"].includes(value.result)
    || !Number.isFinite(Date.parse(value.recorded_at))
    || typeof value.recorded_at !== "string"
    || !CANONICAL_ISO_INSTANT.test(value.recorded_at)
    || value.disclaimer !== TERMINAL_DISCLAIMER
    || !(
      (
        value.replay_protection === "NONCE_OBSERVED_NOT_ATOMICALLY_BOUND"
        &&
        value.store_persistence === "NOT_PERSISTED_BY_THIS_PREPARATION"
        && value.control_projection === "NOT_WIRED"
      )
      || (
        value.replay_protection === "NONCE_ATOMIC_WITHIN_BROKER_LEASE_ONLY"
        &&
        value.store_persistence === "PERSISTED_WITH_DISPATCH"
        && value.control_projection === "AVAILABLE_TO_CONTROL_VERIFIER"
      )
    )
    || !/^dispatch-[a-f0-9]{32}$/.test(value.dispatch_id)
    || !/^fanout-[a-f0-9]{32}$/.test(value.fanout_id)
    || !ID.test(value.binding_id)
    || (value.seat_id !== null && !/^[a-z][a-z0-9-]{0,63}@[a-z0-9][a-z0-9-]{0,63}$/.test(value.seat_id))
    || !SHA256.test(value.authority_profile_sha256)
    || !SHA256.test(value.boot_revision)
    || !SHA256.test(value.release_sha256)
    || !SHA256.test(value.request_sha256)
    || !THREAD_ID.test(value.thread_id)
    || !ID.test(value.project_id)
    || !PROTOCOLS.has(value.protocol)
    || !["DINK", "AEYE"].includes(value.role)
    || (
      value.role === "DINK"
        ? value.parent_binding_id !== null
        : !/^binding-[a-f0-9]{32}$/.test(value.parent_binding_id)
    )
    || !Number.isSafeInteger(value.dispatch_sequence)
    || value.dispatch_sequence < 1
    || !Number.isSafeInteger(value.final_event_sequence)
    || value.final_event_sequence < 1
    || (value.result === "TURN_TERMINAL_COMPLETED" && value.terminal_event_type !== "turn.completed")
    || (value.result === "TURN_TERMINAL_BLOCKER" && value.terminal_event_type !== "turn.failed")
    || !ID.test(value.station_id)
    || !/^[A-Z][A-Z0-9-]{0,62}$/.test(value.hostname)
    || value.envelope_issuer !== value.station_id
    || value.envelope_audience !== "harvey-coordinator"
    || !/^[a-f0-9]{32}$/.test(value.envelope_nonce)
    || !Number.isFinite(Date.parse(value.envelope_issued_at))
    || !Number.isFinite(Date.parse(value.envelope_expires_at))
    || typeof value.envelope_issued_at !== "string"
    || typeof value.envelope_expires_at !== "string"
    || !CANONICAL_ISO_INSTANT.test(value.envelope_issued_at)
    || !CANONICAL_ISO_INSTANT.test(value.envelope_expires_at)
    || Date.parse(value.envelope_expires_at) <= Date.parse(value.envelope_issued_at)
    || Date.parse(value.envelope_expires_at) - Date.parse(value.envelope_issued_at) > 900_000
    || Date.parse(value.recorded_at) < Date.parse(value.envelope_issued_at)
    || Date.parse(value.recorded_at) > Date.parse(value.envelope_expires_at) + 30_000
    || [
      "station_public_key_sha256",
      "coordinator_public_key_sha256",
      "station_envelope_sha256",
      "station_envelope_signature_sha256",
      "station_payload_sha256",
      "event_batch_sha256",
      "terminal_event_sha256",
      "body_sha256",
      "dispatch_context_sha256",
    ].some((key) => !SHA256.test(value[key]))
    || (value.reply_sha256 !== null && !SHA256.test(value.reply_sha256))
    || (value.blocker_sha256 !== null && !SHA256.test(value.blocker_sha256))
    || (value.result === "TURN_TERMINAL_COMPLETED" && (
      value.reply_sha256 === null || value.blocker_sha256 !== null
    ))
    || (value.result === "TURN_TERMINAL_BLOCKER" && value.blocker_sha256 === null)
  ) throw new Error("TERMINAL_ATTESTATION_INVALID");
  const expectedDispatchContextSha256 = canonicalHash({
    dispatch_id: value.dispatch_id,
    fanout_id: value.fanout_id,
    binding_id: value.binding_id,
    seat_id: value.seat_id,
    thread_id: value.thread_id,
    project_id: value.project_id,
    protocol: value.protocol,
    role: value.role,
    parent_binding_id: value.parent_binding_id,
    authority_profile_sha256: value.authority_profile_sha256,
    boot_revision: value.boot_revision,
    release_sha256: value.release_sha256,
    request_sha256: value.request_sha256,
    dispatch_sequence: value.dispatch_sequence,
    body_sha256: value.body_sha256,
  });
  if (value.dispatch_context_sha256 !== expectedDispatchContextSha256) {
    throw new Error("TERMINAL_ATTESTATION_DISPATCH_CONTEXT_INVALID");
  }
  return structuredClone(value);
}

export function signStationTerminalAttestation(privateKeyPem, payload) {
  const validated = validateStationTerminalAttestationPayload(payload);
  const record = signDurableRecord(privateKeyPem, validated, {
    issuer: "harvey-coordinator",
    audience: "harvey-station-terminal-attestation"
  });
  if (record.signer_public_key_sha256 !== validated.coordinator_public_key_sha256) {
    throw new Error("TERMINAL_ATTESTATION_COORDINATOR_KEY_MISMATCH");
  }
  return record;
}

export function verifyStationTerminalAttestation(publicKeyPem, record) {
  const payload = validateStationTerminalAttestationPayload(
    verifyDurableRecord(publicKeyPem, record, {
      issuer: "harvey-coordinator",
      audience: "harvey-station-terminal-attestation"
    })
  );
  if (record.signer_public_key_sha256 !== payload.coordinator_public_key_sha256) {
    throw new Error("TERMINAL_ATTESTATION_COORDINATOR_KEY_MISMATCH");
  }
  return payload;
}

export function verifyStationTerminalEvidence({
  state,
  stationTerminalAttestation,
  coordinatorPublicKeyPem,
  dispatch,
  allowUnseatedFirstContact = false,
}) {
  const classification = classifyStationTerminalEvidence(
    state,
    stationTerminalAttestation
  );
  if (classification.status !== "ATTESTATION_PRESENT_NOT_VERIFIED") {
    return classification;
  }
  try {
    const payload = verifyStationTerminalAttestation(
      coordinatorPublicKeyPem,
      stationTerminalAttestation
    );
    const expectedResult = state === "COMPLETED"
      ? "TURN_TERMINAL_COMPLETED"
      : state === "BLOCKER"
        ? "TURN_TERMINAL_BLOCKER"
        : null;
    if (
      expectedResult === null
      || payload.result !== expectedResult
      || payload.store_persistence !== "PERSISTED_WITH_DISPATCH"
      || payload.control_projection !== "AVAILABLE_TO_CONTROL_VERIFIER"
      || payload.replay_protection !== "NONCE_ATOMIC_WITHIN_BROKER_LEASE_ONLY"
      || payload.dispatch_id !== dispatch?.dispatch_id
      || payload.fanout_id !== dispatch?.fanout_id
      || payload.binding_id !== dispatch?.binding_id
      || payload.seat_id !== dispatch?.seat_id
      || (payload.seat_id === null && !(allowUnseatedFirstContact === true && dispatch?.role === "DINK"))
      || payload.thread_id !== dispatch?.thread_id
      || payload.project_id !== dispatch?.project_id
      || payload.protocol !== dispatch?.protocol
      || payload.role !== dispatch?.role
      || payload.parent_binding_id !== dispatch?.parent_binding_id
      || payload.authority_profile_sha256 !== dispatch?.authority?.authority_profile_sha256
      || payload.boot_revision !== dispatch?.authority?.boot_revision
      || payload.release_sha256 !== dispatch?.authority?.release_sha256
      || payload.request_sha256 !== dispatch?.request_sha256
      || payload.station_id !== dispatch?.station_id
      || payload.hostname !== dispatch?.hostname
      || payload.dispatch_sequence !== dispatch?.sequence
      || payload.final_event_sequence !== dispatch?.event_sequence
      || payload.body_sha256 !== dispatch?.body_sha256
      || payload.reply_sha256 !== dispatch?.reply_sha256
      || payload.blocker_sha256 !== dispatch?.blocker_sha256
    ) throw new Error("TERMINAL_ATTESTATION_DISPATCH_MISMATCH");
    const unseated = payload.seat_id === null;
    return {
      status: unseated ? "VERIFIED_UNSEATED_FIRST_CONTACT_TRANSPORT" : "VERIFIED",
      trusted_terminal_transport: true,
      ...(unseated ? { canonical_seat_proved: false } : {}),
      blocker: null,
      attestation_id: payload.attestation_id,
      recorded_at: payload.recorded_at,
      station_public_key_sha256: payload.station_public_key_sha256,
      coordinator_public_key_sha256: payload.coordinator_public_key_sha256,
      dispatch_sequence: payload.dispatch_sequence,
      final_event_sequence: payload.final_event_sequence,
      station_envelope_sha256: payload.station_envelope_sha256,
      coordinator_record_sha256: canonicalHash(stationTerminalAttestation)
    };
  } catch {
    return {
      status: "ATTESTATION_PRESENT_NOT_VERIFIED",
      trusted_terminal_transport: false,
      blocker: "SIGNED_STATION_TERMINAL_ATTESTATION_INVALID_OR_MISBOUND",
      attestation_id: null,
      station_envelope_sha256: null,
      coordinator_record_sha256: null
    };
  }
}

export function preserveFirstStationTerminalAttestation(
  existingRecord,
  candidateRecord,
  coordinatorPublicKeyPem
) {
  if (existingRecord === undefined || existingRecord === null) {
    verifyStationTerminalAttestation(coordinatorPublicKeyPem, candidateRecord);
    return structuredClone(candidateRecord);
  }
  const existing = verifyStationTerminalAttestation(
    coordinatorPublicKeyPem,
    existingRecord
  );
  const candidate = verifyStationTerminalAttestation(
    coordinatorPublicKeyPem,
    candidateRecord
  );
  const immutableSemanticKeys = [
    "schema",
    "disclaimer",
    "replay_protection",
    "dispatch_id",
    "dispatch_context_sha256",
    "fanout_id",
    "binding_id",
    "thread_id",
    "project_id",
    "protocol",
    "role",
    "parent_binding_id",
    "dispatch_sequence",
    "terminal_event_type",
    "event_batch_sha256",
    "terminal_event_sha256",
    "result",
    "final_event_sequence",
    "body_sha256",
    "reply_sha256",
    "blocker_sha256",
    "station_id",
    "hostname",
    "station_public_key_sha256",
    "coordinator_public_key_sha256",
    "envelope_issuer",
    "envelope_audience",
    "station_payload_sha256",
    "store_persistence",
    "control_projection",
  ];
  if (immutableSemanticKeys.some((key) =>
    canonicalJson(existing[key]) !== canonicalJson(candidate[key])
  )) {
    throw new Error("TERMINAL_ATTESTATION_IMMUTABLE");
  }
  return structuredClone(existingRecord);
}
