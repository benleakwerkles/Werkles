import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  applyNotice,
  assertRelayPath,
  birdDigest,
  initialRelayState,
  validateBird
} from './harvey-flock-core.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');
const birdRelativePath = 'docs/harvey-flock/birds/BIRD_HARVEY_MOBILE_ROADMAP_NEXT_MOVES_20260717.json';
const stateRelativePath = 'docs/harvey-flock/STATE.json';

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(projectRoot, relativePath), 'utf8'));
}

function withDigest(bird) {
  const next = { ...bird, bird_sha256: '' };
  next.bird_sha256 = birdDigest(next);
  return next;
}

function expectError(label, expected, action) {
  assert.throws(action, (error) => {
    assert.match(error.message, expected, `${label}: unexpected error`);
    return true;
  });
}

function makeNotice(boundBird, sequence, eventType, overrides = {}) {
  return {
    notice_id: `NOTICE_${sequence}_${eventType}`,
    bird_id: boundBird.bird_id,
    correlation_id: boundBird.correlation_id,
    project_id: boundBird.project_id,
    receiver_role: boundBird.target_role,
    receiver_instance_id: boundBird.target_instance_id,
    event_type: eventType,
    sequence,
    observed_at: `2026-07-18T16:00:${String(sequence).padStart(2, '0')}.000Z`,
    evidence_paths: [],
    ...overrides
  };
}

function childPathCheck() {
  const bird = readJson(birdRelativePath);
  const state = readJson(stateRelativePath);
  assertRelayPath(birdRelativePath, 'bird_path');
  validateBird(bird, {
    expectedProjectId: 'HARVEY_MOBILE',
    expectedTargetRole: 'MAKER_CURSOR_MEDULLINA',
    expectedTargetInstanceId: 'UNBOUND',
    now: new Date('2026-07-18T16:00:00.000Z')
  });
  assert.equal(state.active_bird_id, bird.bird_id);
  assert.equal(state.active_correlation_id, bird.correlation_id);
  assert.equal(state.target_instance_id, 'UNBOUND');
  assert.equal(state.relay_state, 'PREPARED_NOT_DELIVERED');
  bird.source_paths.forEach((sourcePath) => {
    assert.ok(existsSync(path.join(projectRoot, sourcePath)), `missing source path: ${sourcePath}`);
  });
}

if (process.argv.includes('--child-path-check')) {
  childPathCheck();
  process.exit(0);
}

const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'harvey-flock-proof-'));
const results = [];

function test(name, action) {
  action();
  results.push({ name, result: 'PASS' });
}

try {
  const preparedBird = readJson(birdRelativePath);
  const committedState = readJson(stateRelativePath);
  validateBird(preparedBird, {
    expectedProjectId: 'HARVEY_MOBILE',
    expectedTargetRole: 'MAKER_CURSOR_MEDULLINA',
    expectedTargetInstanceId: 'UNBOUND',
    now: new Date('2026-07-18T16:00:00.000Z')
  });
  assert.deepEqual(
    {
      ...initialRelayState(preparedBird),
      proof_boundary: committedState.proof_boundary
    },
    committedState,
    'committed state must match the prepared Bird and contain no manufactured receipt'
  );

  const boundBird = withDigest({
    ...preparedBird,
    bird_id: 'BIRD_HARVEY_MOBILE_MAKER_ROADMAP_TEST_001',
    correlation_id: 'CORR_HARVEY_MOBILE_ROADMAP_TEST_001',
    target_instance_id: 'CURSOR_MEDULLINA_01'
  });
  const cleanState = () => initialRelayState(boundBird);
  writeFileSync(path.join(fixtureRoot, 'bird.json'), `${JSON.stringify(boundBird, null, 2)}\n`);

  test('exact target acceptance', () => {
    const result = applyNotice(cleanState(), boundBird, makeNotice(boundBird, 1, 'RECEIVED'), {
      now: new Date('2026-07-18T16:00:01.000Z')
    });
    assert.equal(result.accepted, true);
    assert.equal(result.state.relay_state, 'RECEIVED');
  });

  test('wrong role and instance rejection', () => {
    expectError('wrong role', /TARGET_ROLE_MISMATCH/, () =>
      applyNotice(cleanState(), boundBird, makeNotice(boundBird, 1, 'RECEIVED', { receiver_role: 'DOOZER' }))
    );
    expectError('wrong instance', /TARGET_INSTANCE_MISMATCH/, () =>
      applyNotice(cleanState(), boundBird, makeNotice(boundBird, 1, 'RECEIVED', { receiver_instance_id: 'OTHER' }))
    );
  });

  test('duplicate ID idempotency', () => {
    const notice = makeNotice(boundBird, 1, 'RECEIVED');
    const first = applyNotice(cleanState(), boundBird, notice);
    const replay = applyNotice(first.state, boundBird, notice);
    assert.equal(replay.idempotent, true);
    assert.strictEqual(replay.state, first.state);
  });

  test('same ID mutated-content conflict', () => {
    const notice = makeNotice(boundBird, 1, 'RECEIVED');
    const first = applyNotice(cleanState(), boundBird, notice);
    expectError('mutated duplicate', /NOTICE_ID_CONFLICT/, () =>
      applyNotice(first.state, boundBird, { ...notice, observed_at: '2026-07-18T17:00:00.000Z' })
    );
  });

  test('sequence regression rejection', () => {
    const first = applyNotice(cleanState(), boundBird, makeNotice(boundBird, 2, 'WORKING'));
    expectError('sequence regression', /NON_MONOTONIC_SEQUENCE/, () =>
      applyNotice(first.state, boundBird, makeNotice(boundBird, 1, 'ARTIFACT_WRITTEN'))
    );
  });

  test('expired Bird rejection', () => {
    const expiredBird = withDigest({
      ...boundBird,
      created_at: '2026-07-01T00:00:00.000Z',
      expires_at: '2026-07-02T00:00:00.000Z'
    });
    expectError('expired validation', /BIRD_EXPIRED/, () =>
      validateBird(expiredBird, { now: new Date('2026-07-18T00:00:00.000Z') })
    );
    expectError('expired notice', /BIRD_EXPIRED/, () =>
      applyNotice(initialRelayState(expiredBird), expiredBird, makeNotice(expiredBird, 1, 'RECEIVED'), {
        now: new Date('2026-07-18T00:00:00.000Z')
      })
    );
  });

  test('path traversal rejection', () => {
    expectError('path traversal', /PATH_ESCAPE/, () =>
      applyNotice(
        cleanState(),
        boundBird,
        makeNotice(boundBird, 1, 'ARTIFACT_WRITTEN', {
          evidence_paths: ['docs/harvey-flock/receipts/../../outside.txt']
        })
      )
    );
  });

  test('secret-shaped payload rejection', () => {
    expectError('secret key', /SECRET_SHAPED_KEY/, () =>
      applyNotice(cleanState(), boundBird, makeNotice(boundBird, 1, 'RECEIVED', { auth_token: 'redacted' }))
    );
    expectError('embedded credential', /EMBEDDED_CREDENTIAL_SHAPE/, () =>
      validateBird(withDigest({ ...boundBird, instruction: 'Use https://person:pass@example.invalid' }))
    );
  });

  test('SENT remains nonterminal', () => {
    const result = applyNotice(
      cleanState(),
      boundBird,
      makeNotice(boundBird, 1, 'QUEUED', { transport_event: 'SENT' })
    );
    assert.equal(result.state.relay_state, 'QUEUED_NOT_DELIVERED');
    assert.equal(result.state.terminal_event, null);
  });

  test('repo-relative source paths survive a fresh process', () => {
    const child = spawnSync(process.execPath, [scriptPath, '--child-path-check'], {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 10_000
    });
    assert.equal(child.status, 0, child.stderr || child.stdout);
  });

  console.log(`Harvey Flock passive relay: ${results.length}/${results.length} checks passed`);
  results.forEach(({ name, result }) => console.log(`${result}  ${name}`));
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}
