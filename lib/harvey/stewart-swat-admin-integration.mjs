import {types} from 'node:util';
import {createPookaAdminApprovalComboWithClaim} from './pooka-admin-approval-combo.mjs';
import {createPookaAdminDurableClaimAdapter} from './pooka-admin-durable-claim-adapter.mjs';
import {createGimpireAdminAdmissionStore} from './gimpire-active-work-store.ts';

function config(raw,keys){
 if(!raw || types.isProxy(raw) || Object.getPrototypeOf(raw)!==Object.prototype)throw Error('STEWART_SWAT_CONFIG_INVALID');
 const d=Object.getOwnPropertyDescriptors(raw);
 if(Reflect.ownKeys(d).some(k=>typeof k!=='string') || Object.keys(d).sort().join('|')!==keys.sort().join('|')
  || Object.values(d).some(v=>!v.enumerable || !Object.hasOwn(v,'value')))throw Error('STEWART_SWAT_CONFIG_INVALID');
 return Object.fromEntries(Object.entries(d).map(([k,v])=>[k,v.value]));
}
/** Inactive backend integration for Stewart's non-credential admin lane and
 * Swat's redundant internal approvals. Not the credential browser host.
 * No watcher, native token inspector, elevated process, provider prompt control
 * or independently validated effect is supplied by this source composition.
 */
export function createStewartSwatAdminIntegration(configuration){
 const c=config(configuration,['mission_configuration','claim_configuration','read_execution_context']);
 const m=config(c.mission_configuration,['operator_public_key_pem','operator_key_sha256','host','receiver_ref','now','read_state','execute']);
 const adapter=createPookaAdminDurableClaimAdapter(c.claim_configuration);
 return createPookaAdminApprovalComboWithClaim({mission_configuration:{...m,
  claim_verified_action:binding=>adapter.claimVerifiedActionOnce(binding)},read_execution_context:c.read_execution_context});
}
/** Backend-only shared canonical admission variant. Registration still requires
 * signature-verified, backend-owned bindings. All live native prerequisites and
 * execution/effect evidence limitations remain. No service is activated.
 */
export function createStewartSwatCanonicalAdminIntegration(configuration){
 const c=config(configuration,['mission_configuration','admission_configuration','read_execution_context']);
 const m=config(c.mission_configuration,['operator_public_key_pem','operator_key_sha256','host','receiver_ref','now','read_state','execute']);
 const store=createGimpireAdminAdmissionStore(c.admission_configuration);
 const combo=createPookaAdminApprovalComboWithClaim({mission_configuration:{...m,
  claim_verified_action:binding=>store.claimVerifiedActionOnce(binding)},read_execution_context:c.read_execution_context});
 return Object.freeze({admit:combo.admit,reactOnce:combo.reactOnce,
  registerAdmittedActionOnce:(token,action,expected_work_revision)=>store.registerVerifiedBindingOnce({
   binding:combo.verifiedClaimBinding(token,action),expected_work_revision}),
  // Revocation is a trusted backend operation; it may need to revoke expired
  // grants, so it cannot depend on the fresh-token preflight.
  revokeVerifiedBindingOnce:raw=>store.revokeVerifiedBindingOnce(raw)});
}
