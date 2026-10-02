import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {canonicalJson} from '../../../lib/harvey/station-crypto-core.mjs';
import {createPookaAdminApprovalComboWithClaim} from '../../../lib/harvey/pooka-admin-approval-combo.mjs';
function fixture(inspect){
 const {publicKey,privateKey}=generateKeyPairSync('ed25519');let time=100,reads=0,claims=0,effects=0,inspections=0;
 const action={action_id:'verify-console',template:'ADMIN_CONSOLE_VERIFY',resource_sha256:'a'.repeat(64)};
 const grant={schema:'werkles.pooka-admin-mission/v1',mission_id:'ordering-review',revision:1,host:'SYNTHETIC',receiver_ref:'synthetic-ordering',issued_at_ms:0,expires_at_ms:1000,actions:[action]};
 const bridge=createPookaAdminApprovalComboWithClaim({mission_configuration:{operator_public_key_pem:publicKey.export({type:'spki',format:'pem'}),operator_key_sha256:createHash('sha256').update(publicKey.export({type:'spki',format:'der'})).digest('hex'),host:grant.host,receiver_ref:grant.receiver_ref,now:()=>time,read_state:async()=>{reads++;return {revision:1,status:'OPEN'};},claim_verified_action:async binding=>{claims++;return {state:'CLAIMED',binding_sha256:createHash('sha256').update(canonicalJson(binding)).digest('hex')};},execute:async a=>{effects++;return {status:'EXECUTED',mission_id:a.mission_id,action_id:a.action_id,resource_sha256:a.resource_sha256,evidence_sha256:'b'.repeat(64)};}},read_execution_context:async()=>{inspections++;if(inspect)await inspect(()=>{time=1000;});return {host:grant.host,receiver_ref:grant.receiver_ref,is_elevated:true};}});
 const token=bridge.admit({grant,signature_base64:sign(null,Buffer.from(canonicalJson(grant)),privateKey).toString('base64')});
 return {bridge,token,prompt:{surface:'POOKAKIND_INTERNAL',kind:'REDUNDANT_MISSION_APPROVAL',action},expire:()=>{time=1000;},counts:()=>({reads,claims,effects,inspections})};
}
test('foreign token, changed action and expired token fail before native inspection or backend reads',async()=>{
 for(const kind of ['foreign','changed','expired']){
  const f=fixture();if(kind==='expired')f.expire();
  await assert.rejects(f.bridge.reactOnce(kind==='foreign'?Object.freeze({}):f.token,kind==='changed'?{...f.prompt,action:{...f.prompt.action,resource_sha256:'c'.repeat(64)}}:f.prompt));
  assert.deepEqual(f.counts(),{reads:0,claims:0,effects:0,inspections:0});
 }
});
test('expiry during native inspection is checked again before claim and effect',async()=>{
 const f=fixture(async expire=>{await Promise.resolve();expire();});
 await assert.rejects(f.bridge.reactOnce(f.token,f.prompt),/EXPIRED/);
 assert.deepEqual(f.counts(),{reads:0,claims:0,effects:0,inspections:1});
});
test('credential and provider controls never inspect context or claim',async()=>{
 const f=fixture();for(const kind of ['UAC','PASSWORD','PIN','OTP','OAUTH','PROVIDER_SIGN_IN'])assert.equal((await f.bridge.reactOnce(f.token,{...f.prompt,kind})).state,'HUMAN_GATE');
 assert.equal((await f.bridge.reactOnce(f.token,{...f.prompt,surface:'FOREIGN'})).state,'PROVIDER_CONTROL_UNBYPASSABLE');
 assert.deepEqual(f.counts(),{reads:0,claims:0,effects:0,inspections:0});
});
