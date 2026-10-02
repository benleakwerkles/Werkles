import {types} from 'node:util';
import {createPookaAdminMission,createPookaAdminMissionWithClaim} from './pooka-admin-mission.mjs';
import {snapshotAeyemnesiaSourceInput as snapshot} from './aeyemnesia-authorized-source-reader.mjs';

const exact=(v,keys)=>v && !Array.isArray(v) && Object.keys(v).sort().join('|')===[...keys].sort().join('|');
function data(raw,keys){
 if(!raw || types.isProxy(raw) || Object.getPrototypeOf(raw)!==Object.prototype)throw Error('COMBO_CONFIG_INVALID');
 const descriptors=Object.getOwnPropertyDescriptors(raw);
 if(Reflect.ownKeys(descriptors).some(k=>typeof k!=='string') || !exact(descriptors,keys)
  || Object.values(descriptors).some(d=>!d.enumerable || !Object.hasOwn(d,'value')))throw Error('COMBO_CONFIG_INVALID');
 return Object.fromEntries(Object.entries(descriptors).map(([k,d])=>[k,d.value]));
}
/** One-shot backend composition, NOT a prompt watcher or credential broker.
 * Configuration and native token inspection must be constructed by a trusted
 * backend. Provider prompt contents can request an action, never grant it.
 * The underlying signed mission owns scope, expiry, revocation and claim-once.
 * No UAC interaction, password access, auto-click, elevation or activation.
 */
export function createPookaAdminApprovalCombo(configuration){
 return buildCombo(configuration,false);
}
export function createPookaAdminApprovalComboWithClaim(configuration){
 return buildCombo(configuration,true);
}
function buildCombo(configuration,durable){
 const c=data(configuration,['mission_configuration','read_execution_context']);
 if(typeof c.read_execution_context!=='function' || types.isProxy(c.read_execution_context))throw Error('COMBO_CONFIG_INVALID');
 const m=data(c.mission_configuration,['operator_public_key_pem','operator_key_sha256','host','receiver_ref','now','read_state','execute',...(durable?['claim_verified_action']:[])]);
 if(typeof m.execute!=='function' || types.isProxy(m.execute))throw Error('COMBO_CONFIG_INVALID');
 const mission=durable?createPookaAdminMissionWithClaim(m):createPookaAdminMission(m);
 const boundary={windows_consent_bypassed:false,credentials_accessed:false,desktop_input_used:false,
  recurring_operation_created:false,product_completed:false};
 return Object.freeze({
  admit:raw=>mission.admit(raw),
  verifiedClaimBinding:(token,raw)=>mission.verifiedClaimBinding(token,raw),
  async reactOnce(token,raw){
   const p=snapshot(raw);
   if(!exact(p,['surface','kind','action']))throw Error('COMBO_PROMPT_INVALID');
   if(['UAC','PASSWORD','PIN','OTP','OAUTH','PROVIDER_SIGN_IN'].includes(p.kind))
    return Object.freeze({...boundary,state:'HUMAN_GATE',execution_attempted:false,successful_swat:false});
   if(p.surface!=='POOKAKIND_INTERNAL' || p.kind!=='REDUNDANT_MISSION_APPROVAL')
    return Object.freeze({...boundary,state:'PROVIDER_CONTROL_UNBYPASSABLE',execution_attempted:false,successful_swat:false});
   mission.preflight(token,p.action);
   // Await token inspection BEFORE the mission's final state/time/claim checks.
   // Native execution must still bind the inspected token to the actual effect;
   // this source adapter cannot prove OS token custody or atomic revocation.
   const context=snapshot(await c.read_execution_context());
   if(!exact(context,['host','receiver_ref','is_elevated']) || context.host!==m.host
    || context.receiver_ref!==m.receiver_ref || context.is_elevated!==true)throw Error('COMBO_LEGITIMATE_ELEVATED_EXECUTOR_REQUIRED');
   const result=await mission.executeOnce(token,p.action);
   return Object.freeze({...boundary,state:'EXECUTOR_RECEIPT_RETURNED',execution_attempted:true,
    redundant_approval_removed:true,successful_swat:false,receipt_validation_required:true,
    durable_replay_proved:false,backend_custody_proved:false,result});
  }
 });
}
