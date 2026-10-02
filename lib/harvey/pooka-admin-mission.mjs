import {createHash,createPublicKey,verify} from 'node:crypto';
import {types} from 'node:util';
import {canonicalJson} from './station-crypto-core.mjs';
import {snapshotAeyemnesiaSourceInput as snapshot} from './aeyemnesia-authorized-source-reader.mjs';

const SHA=/^[a-f0-9]{64}$/;
const exact=(v,keys)=>v && !Array.isArray(v) && Object.keys(v).sort().join('|')===[...keys].sort().join('|');
const hash=v=>createHash('sha256').update(canonicalJson(v)).digest('hex');
const fail=code=>{throw Error(code);};
const templates=new Set(['ADMIN_CONSOLE_VERIFY','ADMIN_REGISTRY_PROBE']);
const processClaims=new Set();
function fields(raw,keys){
 if(!raw || types.isProxy(raw) || Object.getPrototypeOf(raw)!==Object.prototype)fail('ADMIN_MISSION_CONFIG_UNSAFE');
 const d=Object.getOwnPropertyDescriptors(raw);
 if(Reflect.ownKeys(d).some(k=>typeof k!=='string') || !exact(d,keys) || Object.values(d).some(v=>!v.enumerable || !Object.hasOwn(v,'value')))fail('ADMIN_MISSION_CONFIG_UNSAFE');
 return Object.fromEntries(Object.entries(d).map(([k,v])=>[k,v.value]));
}
/** Inactive signed mission execution seam. Backend construction, state reads and
 * executor are trusted integration prerequisites, not caller/provider input.
 * No shell strings, credentials, recurrence or Windows consent bypass.
 * Replay is shared by controllers in this loaded module instance only;
 * separate realms/module copies/restarts require durable backend claim-once.
 */
export function createPookaAdminMission(configuration){
 return buildMission(configuration,null);
}
/** Backend-only durable claim seam. The callback must atomically check canonical
 * work revision/revocation/expiry and persist an attempt before returning CLAIMED.
 * A caller declaration is not durable custody proof. No implicit retry/recovery.
 */
export function createPookaAdminMissionWithClaim(configuration){
 const all=fields(configuration,['operator_public_key_pem','operator_key_sha256','host','receiver_ref','now','read_state','execute','claim_verified_action']);
 const {claim_verified_action,...base}=all;
 if(typeof claim_verified_action!=='function' || types.isProxy(claim_verified_action))fail('ADMIN_MISSION_CLAIM_BACKEND_INVALID');
 return buildMission(base,claim_verified_action);
}
function buildMission(configuration,claim){
 const c=fields(configuration,['operator_public_key_pem','operator_key_sha256','host','receiver_ref','now','read_state','execute']);
 if(![c.now,c.read_state,c.execute].every(f=>typeof f==='function' && !types.isProxy(f)) || typeof c.host!=='string' || typeof c.receiver_ref!=='string')fail('ADMIN_MISSION_BACKEND_INVALID');
 const key=createPublicKey(c.operator_public_key_pem);
 if(key.asymmetricKeyType!=='ed25519' || !SHA.test(c.operator_key_sha256) || createHash('sha256').update(key.export({type:'spki',format:'der'})).digest('hex')!==c.operator_key_sha256)fail('ADMIN_MISSION_KEY_INVALID');
 const grants=new WeakMap();
 const clock=()=>{const n=c.now();if(!Number.isSafeInteger(n))fail('ADMIN_MISSION_CLOCK_INVALID');return n;};
 function fresh(g){const n=clock();if(n<g.issued_at_ms || n>=g.expires_at_ms)fail('ADMIN_MISSION_EXPIRED');}
 function scopedRequest(token,raw){
  const g=grants.get(token);if(!g)fail('ADMIN_MISSION_TOKEN_INVALID');
  const request=snapshot(raw);
  if(!exact(request,['action_id','template','resource_sha256']))fail('ADMIN_MISSION_REQUEST_INVALID');
  const a=g.actions.find(x=>x.action_id===request.action_id);
  if(!a || canonicalJson(a)!==canonicalJson(request))fail('ADMIN_MISSION_SUPPLEMENTAL_APPROVAL_REQUIRED');
  fresh(g);return {g,a};
 }
 function verifiedBinding(g,a){return Object.freeze({schema:'werkles.pooka-admin-verified-claim/v1',grant_sha256:hash(g),
  operator_key_sha256:c.operator_key_sha256,mission_id:g.mission_id,revision:g.revision,
  host:g.host,receiver_ref:g.receiver_ref,expires_at_ms:g.expires_at_ms,action:Object.freeze({...a})});}
 return Object.freeze({
  // Macros counter-review: early scope/time check must precede native inspection.
  // It reads no backend state, claims nothing, and never replaces final checks.
  preflight(token,raw){scopedRequest(token,raw);},
  verifiedClaimBinding(token,raw){const {g,a}=scopedRequest(token,raw);return verifiedBinding(g,a);},
  admit(raw){
   const input=snapshot(raw);
   if(!exact(input,['grant','signature_base64']))fail('ADMIN_MISSION_INPUT_INVALID');
   const g=input.grant;
   if(!exact(g,['schema','mission_id','revision','host','receiver_ref','issued_at_ms','expires_at_ms','actions']) || g.schema!=='werkles.pooka-admin-mission/v1'
    || typeof g.mission_id!=='string' || !/^[a-z0-9-]{3,128}$/.test(g.mission_id) || !Number.isSafeInteger(g.revision) || g.revision<0
    || !Number.isSafeInteger(g.issued_at_ms) || !Number.isSafeInteger(g.expires_at_ms) || g.issued_at_ms>=g.expires_at_ms
    || !Array.isArray(g.actions) || !g.actions.length || g.actions.length>16)fail('ADMIN_MISSION_GRANT_INVALID');
   if(g.host!==c.host || g.receiver_ref!==c.receiver_ref)fail('ADMIN_MISSION_SEAT_MISMATCH');
   const ids=new Set();
   for(const a of g.actions){
    if(!exact(a,['action_id','template','resource_sha256']) || typeof a.action_id!=='string' || !/^[a-z0-9-]{3,128}$/.test(a.action_id) || !templates.has(a.template) || typeof a.resource_sha256!=='string' || !SHA.test(a.resource_sha256) || ids.has(a.action_id))fail('ADMIN_MISSION_ACTION_INVALID');
    ids.add(a.action_id);
   }
   if(typeof input.signature_base64!=='string' || !/^[A-Za-z0-9+/]{86}==$/.test(input.signature_base64) || !verify(null,Buffer.from(canonicalJson(g)),key,Buffer.from(input.signature_base64,'base64')))fail('ADMIN_MISSION_SIGNATURE_INVALID');
   fresh(g);
   const token=Object.freeze(Object.create(null));grants.set(token,g);return token;
  },
  async executeOnce(token,raw){
   const {g,a}=scopedRequest(token,raw);
   const state=snapshot(await c.read_state(g.mission_id));
   if(!exact(state,['revision','status']) || state.revision!==g.revision || state.status!=='OPEN')fail('ADMIN_MISSION_REVOKED_CLOSED_OR_SUPERSEDED');
   fresh(g);
   const identity=hash({key:c.operator_key_sha256,host:g.host,receiver:g.receiver_ref,mission:g.mission_id,revision:g.revision,action:a.action_id});
   if(processClaims.has(identity))fail('ADMIN_MISSION_ALREADY_CLAIMED');
   processClaims.add(identity); // A failure must not silently retry an administrative effect.
   if(claim){
    const binding=verifiedBinding(g,a);
    const claimed=snapshot(await claim(binding));
    if(!exact(claimed,['state','binding_sha256']) || claimed.state!=='CLAIMED' || claimed.binding_sha256!==hash(binding))fail('ADMIN_MISSION_DURABLE_CLAIM_REFUSED');
    // Catch expiry/revocation during the callback. Atomic synchronization with
    // actual execution remains the canonical backend's responsibility.
    const latest=snapshot(await c.read_state(g.mission_id));
    if(!exact(latest,['revision','status']) || latest.revision!==g.revision || latest.status!=='OPEN')fail('ADMIN_MISSION_REVOKED_CLOSED_OR_SUPERSEDED');
    fresh(g);
   }
   const result=await c.execute(Object.freeze({...a,mission_id:g.mission_id,host:g.host,receiver_ref:g.receiver_ref}));
   const receipt=snapshot(result);
   if(!exact(receipt,['status','mission_id','action_id','resource_sha256','evidence_sha256'])
    || !['EXECUTED','REFUSED','FAILED'].includes(receipt.status) || receipt.mission_id!==g.mission_id
    || receipt.action_id!==a.action_id || receipt.resource_sha256!==a.resource_sha256
    || typeof receipt.evidence_sha256!=='string' || !SHA.test(receipt.evidence_sha256))fail('ADMIN_MISSION_EXECUTOR_RECEIPT_INVALID');
   return Object.freeze({state:'ADMIN_MISSION_EXECUTOR_RETURNED',mission_id:g.mission_id,action_id:a.action_id,
    redundant_pk_approval_required:false,windows_consent_bypassed:false,backend_custody_proved:false,
    durable_replay_proved:false,product_completed:false,result:receipt});
  }
 });
}
