import {createHash} from 'node:crypto';
import {types} from 'node:util';
import path from 'node:path';
import {canonicalJson} from './station-crypto-core.mjs';
import {snapshotAeyemnesiaSourceInput as snapshot} from './aeyemnesia-authorized-source-reader.mjs';
import {claimGimpireActionAgainstCurrentWorkOnce} from './gimpire-active-work-store.ts';

const digest = value => createHash('sha256').update(canonicalJson(value)).digest('hex');
const exact = (value, keys) => value && Object.keys(value).sort().join('|') === [...keys].sort().join('|');

/** Inactive backend-owned mapping prototype, NOT a production activation gate.
 * Input must come from the signed mission's verified claim hook. Mapping pins
 * the entire binding, not a caller-supplied project/path or LOCAL_TEST authority.
 * Canonical work revision/status and durable attempt creation share a work lock.
 * Mission revocation synchronization, atomic expiry, root ACL/reparse custody,
 * power-loss durability and executor result writeback remain UNPROVED.
 * Claims remain IN_FLIGHT on interruption/refusal; no automatic retry/release.
 */
export function createPookaAdminDurableClaimAdapter(configuration) {
  if (!configuration || types.isProxy(configuration) || Object.getPrototypeOf(configuration) !== Object.prototype) throw Error('ADMIN_CLAIM_CONFIG_INVALID');
  const descriptors = Object.getOwnPropertyDescriptors(configuration);
  if (Reflect.ownKeys(descriptors).some(k => typeof k !== 'string') || !exact(descriptors, ['mapping', 'now']) || Object.values(descriptors).some(d => !d.enumerable || !Object.hasOwn(d, 'value'))) throw Error('ADMIN_CLAIM_CONFIG_INVALID');
  const now = descriptors.now.value;
  const mapping = snapshot(descriptors.mapping.value);
  if (typeof now !== 'function' || types.isProxy(now) || !exact(mapping, ['binding_sha256', 'work_root', 'attempt_root', 'project_id', 'work_object_id', 'expected_work_revision'])
    || !/^[a-f0-9]{64}$/.test(mapping.binding_sha256) || !Number.isSafeInteger(mapping.expected_work_revision) || mapping.expected_work_revision < 0
    || !['work_root', 'attempt_root'].every(k => typeof mapping[k] === 'string' && path.isAbsolute(mapping[k]))
    || !['project_id', 'work_object_id'].every(k => typeof mapping[k] === 'string' && /^[a-z0-9][a-z0-9-]{2,127}$/.test(mapping[k]))) throw Error('ADMIN_CLAIM_MAPPING_INVALID');
  return Object.freeze({
    async claimVerifiedActionOnce(raw) {
      const binding = snapshot(raw);
      if (!exact(binding, ['schema', 'grant_sha256', 'operator_key_sha256', 'mission_id', 'revision', 'host', 'receiver_ref', 'expires_at_ms', 'action'])
        || binding.schema !== 'werkles.pooka-admin-verified-claim/v1' || digest(binding) !== mapping.binding_sha256) throw Error('ADMIN_CLAIM_BINDING_MISMATCH');
      if (!exact(binding.action,['action_id','template','resource_sha256'])
        || !['mission_id','host','receiver_ref'].every(k=>typeof binding[k]==='string' && binding[k].length>0)
        || typeof binding.action.action_id!=='string' || !binding.action.action_id.length
        || !Number.isSafeInteger(binding.revision) || binding.revision<0
        || !/^[a-f0-9]{64}$/.test(binding.operator_key_sha256)) throw Error('ADMIN_CLAIM_BINDING_INVALID');
      // Stable replay identity excludes mutable grant/resource/template bytes.
      // Rebinding the SAME seat/mission revision/action must conflict, not mint
      // a second execution namespace. Backend roots remain trusted custody.
      const actionIdentity=digest({operator_key_sha256:binding.operator_key_sha256,
        mission_id:binding.mission_id,revision:binding.revision,host:binding.host,
        receiver_ref:binding.receiver_ref,action_id:binding.action.action_id});
      const time = now();
      if (!Number.isSafeInteger(time) || !Number.isSafeInteger(binding.expires_at_ms) || time >= binding.expires_at_ms) throw Error('ADMIN_CLAIM_EXPIRED_OR_CLOCK_INVALID');
      const claim = await claimGimpireActionAgainstCurrentWorkOnce({
        work_root: mapping.work_root, attempt_root: mapping.attempt_root,
        project_id: mapping.project_id, work_object_id: mapping.work_object_id,
        expected_work_revision: mapping.expected_work_revision,
        action_id: `admin-${actionIdentity}`, action_sha256: mapping.binding_sha256,
        claimed_at: new Date(time).toISOString()
      });
      // Expiry after persistence burns the claim but never authorizes execution.
      const after = now();
      if (!Number.isSafeInteger(after) || after < time || after >= binding.expires_at_ms) throw Error('ADMIN_CLAIM_EXPIRED_OR_CLOCK_INVALID');
      return Object.freeze({state: claim.decision === 'EXECUTE_ONCE' ? 'CLAIMED' : 'REFUSED', binding_sha256: mapping.binding_sha256});
    }
  });
}
