import {createHash} from 'node:crypto';
import {canonicalJson} from './station-crypto-core.mjs';
import {snapshotAeyemnesiaSourceInput as snapshot} from './aeyemnesia-authorized-source-reader.mjs';
const digest=value=>createHash('sha256').update(canonicalJson(value)).digest('hex');
const exact=(value,keys)=>value && !Array.isArray(value) && Object.keys(value).sort().join('|')===[...keys].sort().join('|');
const fail=()=>{throw Error('ADMIN_CANONICAL_CLAIM_DENIED');};

/** Pure backend predicate for the future shared canonical transaction.
 * All state comes from trusted persisted records, never request declarations.
 * Store must invoke inside its EXISTING work/revocation transaction and persist
 * the returned identity before releasing custody. This function takes no lock,
 * creates no claim, verifies no signature and grants no execution authority.
 */
export function evaluatePookaAdminCanonicalClaim(raw){
 const input=snapshot(raw);
 if(!exact(input,['binding','mapping','mission_state','work_state','now_ms']))fail();
 const {binding:b,mapping:m,mission_state:s,work_state:w,now_ms:n}=input;
 if(!exact(b,['schema','grant_sha256','operator_key_sha256','mission_id','revision','host','receiver_ref','expires_at_ms','action'])
  || b.schema!=='werkles.pooka-admin-verified-claim/v1' || !exact(b.action,['action_id','template','resource_sha256'])
  || !['grant_sha256','operator_key_sha256'].every(k=>typeof b[k]==='string' && /^[a-f0-9]{64}$/.test(b[k]))
  || !/^[a-f0-9]{64}$/.test(b.action.resource_sha256) || !['ADMIN_CONSOLE_VERIFY','ADMIN_REGISTRY_PROBE'].includes(b.action.template)
  || !['mission_id','host','receiver_ref'].every(k=>typeof b[k]==='string' && b[k].length>0)
  || typeof b.action.action_id!=='string' || !b.action.action_id.length || !Number.isSafeInteger(b.revision) || b.revision<0)fail();
 if(!exact(m,['binding_sha256','project_id','work_object_id','expected_work_revision']) || m.binding_sha256!==digest(b)
  || !['project_id','work_object_id'].every(k=>typeof m[k]==='string' && /^[a-z0-9][a-z0-9-]{2,127}$/.test(m[k]))
  || !Number.isSafeInteger(m.expected_work_revision) || m.expected_work_revision<0)fail();
 if(!exact(s,['mission_id','revision','status','binding_sha256','project_id','work_object_id','work_revision'])
  || s.mission_id!==b.mission_id || s.revision!==b.revision || s.status!=='OPEN' || s.binding_sha256!==m.binding_sha256
  || s.project_id!==m.project_id || s.work_object_id!==m.work_object_id || s.work_revision!==m.expected_work_revision)fail();
 if(!exact(w,['project_id','work_object_id','revision','status']) || w.project_id!==m.project_id || w.work_object_id!==m.work_object_id
  || w.revision!==m.expected_work_revision || !['ACTIVE','WAITING_FOR_RECEIVER','WAITING_FOR_EXTERNAL_EVENT'].includes(w.status)
  || !Number.isSafeInteger(n) || n<0 || !Number.isSafeInteger(b.expires_at_ms) || n>=b.expires_at_ms)fail();
 const identity=digest({operator_key_sha256:b.operator_key_sha256,mission_id:b.mission_id,revision:b.revision,host:b.host,receiver_ref:b.receiver_ref,action_id:b.action.action_id});
 return Object.freeze({action_id:`admin-${identity}`,action_sha256:m.binding_sha256,expected_work_revision:m.expected_work_revision});
}
