import { createHash } from 'node:crypto';
import path from 'node:path';

export const RELAY_ROOT = 'docs/harvey-flock';
export const EVENT_TYPES = Object.freeze([
  'QUEUED',
  'RECEIVER_READABLE',
  'RECEIVED',
  'WORKING',
  'ARTIFACT_WRITTEN',
  'RECEIPTED',
  'BLOCKED'
]);

const requiredBirdFields = Object.freeze([
  'schema_version',
  'bird_id',
  'correlation_id',
  'project_id',
  'sender_role',
  'sender_instance_id',
  'target_role',
  'target_instance_id',
  'created_at',
  'expires_at',
  'instruction',
  'acceptance_tests',
  'source_paths',
  'bird_sha256'
]);

const secretKeyPattern = /(?:^|_)(?:password|passwd|token|secret|api_?key|authorization|cookie|private_?key|credential)(?:$|_)/i;
const secretValuePatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/i,
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{12,}\b/,
  /\bsk-[A-Za-z0-9_-]{16,}\b/,
  /https?:\/\/[^\s/:]+:[^\s/@]+@/i
];

export function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

export function sha256(value) {
  const input = typeof value === 'string' ? value : canonicalJson(value);
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function birdDigest(bird) {
  const unsigned = { ...bird };
  delete unsigned.bird_sha256;
  return sha256(unsigned);
}

export function assertNoSecretShape(value, at = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSecretShape(item, `${at}[${index}]`));
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (secretKeyPattern.test(key)) {
        throw new Error(`SECRET_SHAPED_KEY:${at}.${key}`);
      }
      assertNoSecretShape(child, `${at}.${key}`);
    }
    return;
  }

  if (typeof value === 'string' && secretValuePatterns.some((pattern) => pattern.test(value))) {
    throw new Error(`EMBEDDED_CREDENTIAL_SHAPE:${at}`);
  }
}

export function assertRepoRelative(candidate, label = 'path') {
  if (typeof candidate !== 'string' || candidate.trim() === '') {
    throw new Error(`INVALID_${label.toUpperCase()}`);
  }

  const posix = candidate.replaceAll('\\', '/');
  const normalized = path.posix.normalize(posix);
  if (
    path.posix.isAbsolute(posix) ||
    /^[A-Za-z]:/.test(posix) ||
    posix.split('/').includes('..') ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../')
  ) {
    throw new Error(`PATH_ESCAPE:${label}:${candidate}`);
  }

  return normalized.replace(/^\.\//, '');
}

export function assertRelayPath(candidate, label = 'evidence_path') {
  const normalized = assertRepoRelative(candidate, label);
  if (normalized !== RELAY_ROOT && !normalized.startsWith(`${RELAY_ROOT}/`)) {
    throw new Error(`OUTSIDE_RELAY_ROOT:${label}:${candidate}`);
  }
  return normalized;
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`INVALID_${label.toUpperCase()}`);
  }
}

function requireStringArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`INVALID_${label.toUpperCase()}`);
  }
  value.forEach((item) => requireString(item, label));
}

export function validateBird(
  bird,
  { expectedProjectId, expectedTargetRole, expectedTargetInstanceId, now = new Date() } = {}
) {
  assertNoSecretShape(bird);
  for (const field of requiredBirdFields) {
    if (!(field in bird)) throw new Error(`MISSING_BIRD_FIELD:${field}`);
  }

  if (bird.schema_version !== 1) throw new Error('UNSUPPORTED_BIRD_SCHEMA');
  [
    'bird_id',
    'correlation_id',
    'project_id',
    'sender_role',
    'sender_instance_id',
    'target_role',
    'target_instance_id',
    'created_at',
    'expires_at',
    'instruction',
    'bird_sha256'
  ].forEach((field) => requireString(bird[field], field));
  requireStringArray(bird.acceptance_tests, 'acceptance_tests');
  requireStringArray(bird.source_paths, 'source_paths');
  bird.source_paths.forEach((candidate) => assertRepoRelative(candidate, 'source_path'));

  if (expectedProjectId && bird.project_id !== expectedProjectId) {
    throw new Error('PROJECT_MISMATCH');
  }
  if (expectedTargetRole && bird.target_role !== expectedTargetRole) {
    throw new Error('TARGET_ROLE_MISMATCH');
  }
  if (expectedTargetInstanceId && bird.target_instance_id !== expectedTargetInstanceId) {
    throw new Error('TARGET_INSTANCE_MISMATCH');
  }
  if (!Number.isFinite(Date.parse(bird.created_at)) || !Number.isFinite(Date.parse(bird.expires_at))) {
    throw new Error('INVALID_BIRD_TIME');
  }
  if (Date.parse(bird.expires_at) <= Date.parse(bird.created_at)) {
    throw new Error('INVALID_BIRD_EXPIRY_ORDER');
  }
  if (Date.parse(bird.expires_at) <= now.getTime()) {
    throw new Error('BIRD_EXPIRED');
  }

  const digest = birdDigest(bird);
  if (bird.bird_sha256 !== digest) throw new Error('BIRD_HASH_MISMATCH');
  return Object.freeze({ ok: true, digest });
}

export function initialRelayState(bird) {
  return {
    schema_version: 1,
    project_id: bird.project_id,
    relay_state: 'PREPARED_NOT_DELIVERED',
    active_bird_id: bird.bird_id,
    active_correlation_id: bird.correlation_id,
    target_role: bird.target_role,
    target_instance_id: bird.target_instance_id,
    last_sequence: 0,
    terminal_event: null,
    notice_digests: {},
    accepted_notices: []
  };
}

function nextRelayState(eventType) {
  switch (eventType) {
    case 'QUEUED':
      return 'QUEUED_NOT_DELIVERED';
    case 'RECEIVER_READABLE':
      return 'RECEIVER_READABLE';
    case 'RECEIVED':
      return 'RECEIVED';
    case 'WORKING':
    case 'ARTIFACT_WRITTEN':
      return 'ACTIVE';
    case 'RECEIPTED':
    case 'BLOCKED':
      return 'TERMINAL';
    default:
      throw new Error(`UNSUPPORTED_EVENT:${eventType}`);
  }
}

export function applyNotice(state, bird, notice, { now = new Date() } = {}) {
  assertNoSecretShape(notice);
  for (const field of [
    'notice_id',
    'bird_id',
    'correlation_id',
    'project_id',
    'receiver_role',
    'receiver_instance_id',
    'event_type',
    'sequence',
    'observed_at',
    'evidence_paths'
  ]) {
    if (!(field in notice)) throw new Error(`MISSING_NOTICE_FIELD:${field}`);
  }

  ['notice_id', 'bird_id', 'correlation_id', 'project_id', 'receiver_role', 'receiver_instance_id', 'event_type', 'observed_at']
    .forEach((field) => requireString(notice[field], field));
  if (!Number.isSafeInteger(notice.sequence) || notice.sequence < 1) {
    throw new Error('INVALID_SEQUENCE');
  }
  if (!EVENT_TYPES.includes(notice.event_type)) throw new Error('INVALID_EVENT_TYPE');
  if (notice.transport_event !== undefined && notice.transport_event !== 'SENT') {
    throw new Error('INVALID_TRANSPORT_EVENT');
  }
  if (!Array.isArray(notice.evidence_paths)) throw new Error('INVALID_EVIDENCE_PATHS');
  notice.evidence_paths.forEach((candidate) => assertRelayPath(candidate));
  if (!Number.isFinite(Date.parse(notice.observed_at))) throw new Error('INVALID_NOTICE_TIME');

  const digest = sha256(notice);
  const priorDigest = state.notice_digests[notice.notice_id];
  if (priorDigest) {
    if (priorDigest !== digest) throw new Error('NOTICE_ID_CONFLICT');
    return Object.freeze({ state, accepted: false, idempotent: true, reason: 'IDENTICAL_REPLAY' });
  }
  if (state.terminal_event !== null) throw new Error('TERMINAL_STATE_IMMUTABLE');
  if (notice.bird_id !== state.active_bird_id || notice.bird_id !== bird.bird_id) {
    throw new Error('BIRD_MISMATCH');
  }
  if (notice.correlation_id !== state.active_correlation_id || notice.correlation_id !== bird.correlation_id) {
    throw new Error('CORRELATION_MISMATCH');
  }
  if (notice.project_id !== state.project_id || notice.project_id !== bird.project_id) {
    throw new Error('PROJECT_MISMATCH');
  }
  if (notice.receiver_role !== state.target_role || notice.receiver_role !== bird.target_role) {
    throw new Error('TARGET_ROLE_MISMATCH');
  }
  if (
    notice.receiver_instance_id !== state.target_instance_id ||
    notice.receiver_instance_id !== bird.target_instance_id
  ) {
    throw new Error('TARGET_INSTANCE_MISMATCH');
  }
  if (notice.sequence <= state.last_sequence) throw new Error('NON_MONOTONIC_SEQUENCE');
  if (Date.parse(bird.expires_at) <= now.getTime()) throw new Error('BIRD_EXPIRED');

  const terminal = notice.event_type === 'RECEIPTED' || notice.event_type === 'BLOCKED';
  const next = {
    ...state,
    relay_state: nextRelayState(notice.event_type),
    last_sequence: notice.sequence,
    terminal_event: terminal ? notice.event_type : null,
    notice_digests: { ...state.notice_digests, [notice.notice_id]: digest },
    accepted_notices: [
      ...state.accepted_notices,
      {
        notice_id: notice.notice_id,
        event_type: notice.event_type,
        sequence: notice.sequence,
        transport_event: notice.transport_event ?? null,
        observed_at: notice.observed_at,
        evidence_paths: [...notice.evidence_paths]
      }
    ]
  };

  return Object.freeze({ state: Object.freeze(next), accepted: true, idempotent: false, reason: 'ADVANCED' });
}
