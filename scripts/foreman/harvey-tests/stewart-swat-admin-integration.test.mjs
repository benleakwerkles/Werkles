import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {canonicalJson} from '../../../lib/harvey/station-crypto-core.mjs';
import {createGimpireActiveWorkLedger} from '../../../lib/harvey/gimpire-active-work-store.ts';
import {createStewartSwatCanonicalAdminIntegration} from '../../../lib/harvey/stewart-swat-admin-integration.mjs';
const digest=v=>createHash('sha256').update(canonicalJson(v)).digest('hex');
test('signed mission, internal Swat request and real filesystem claim compose without credentials',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'stewart-swat-'));try{
 const sha='a'.repeat(64),{publicKey,privateKey}=generateKeyPairSync('ed25519');let effects=0;
 const keyHash=createHash('sha256').update(publicKey.export({type:'spki',format:'der'})).digest('hex');
 const action={action_id:'verify-console',template:'ADMIN_CONSOLE_VERIFY',resource_sha256:sha};
 const grant={schema:'werkles.pooka-admin-mission/v1',mission_id:'integration-test',revision:1,host:'SYNTHETIC',receiver_ref:'exact-test-task',issued_at_ms:0,expires_at_ms:1000,actions:[action]};
 const binding={schema:'werkles.pooka-admin-verified-claim/v1',grant_sha256:digest(grant),operator_key_sha256:keyHash,mission_id:grant.mission_id,revision:1,host:grant.host,receiver_ref:grant.receiver_ref,expires_at_ms:1000,action};
 await createGimpireActiveWorkLedger({root:path.join(root,'work'),initial_state:{schema:'werkles.gimpire-active-work-state/v1',project_id:'pookakind',work_object_id:'integration-test',work_id:'integration-test',lane_id:'integration-test',revision:0,status:'ACTIVE',objective:'Synthetic integration only.',terminal_predicate:{description:'Synthetic receipt.',state:'UNSATISFIED',evidence_sha256:null},quantum:{quantum_id:'quantum-001',ideas_used:0},last_event_sha256:null,next_safe_actions:['Inspect synthetic claim.'],materially_different_routes_remaining:true,wait:null,human_gate:null,operator_pause:null,exhaustion:null,continuity:{capsule_sha256:sha,predecessor_revision:null}}});
 const c={mission_configuration:{operator_public_key_pem:publicKey.export({type:'spki',format:'pem'}),operator_key_sha256:keyHash,host:grant.host,receiver_ref:grant.receiver_ref,now:()=>100,read_state:async()=>({revision:1,status:'OPEN'}),execute:async a=>{effects++;return {status:'EXECUTED',mission_id:a.mission_id,action_id:a.action_id,resource_sha256:a.resource_sha256,evidence_sha256:sha};}},claim_configuration:{mapping:{binding_sha256:digest(binding),work_root:path.join(root,'work'),attempt_root:path.join(root,'attempts'),project_id:'pookakind',work_object_id:'integration-test',expected_work_revision:0},now:()=>100},read_execution_context:async()=>({host:grant.host,receiver_ref:grant.receiver_ref,is_elevated:true})};
 const bridge=createStewartSwatCanonicalAdminIntegration({mission_configuration:c.mission_configuration,read_execution_context:c.read_execution_context,
  admission_configuration:{work_root:path.join(root,'work'),attempt_root:path.join(root,'attempts'),project_id:'pookakind',work_object_id:'integration-test',now:()=>100}});
 const token=bridge.admit({grant,signature_base64:sign(null,Buffer.from(canonicalJson(grant)),privateKey).toString('base64')});
 await assert.rejects(async()=>bridge.registerAdmittedActionOnce({},action,0),/TOKEN_INVALID/);
 await assert.rejects(async()=>bridge.registerAdmittedActionOnce(token,{...action,resource_sha256:'c'.repeat(64)},0),/SUPPLEMENTAL/);
 await bridge.registerAdmittedActionOnce(token,action,0);
 const prompt={surface:'POOKAKIND_INTERNAL',kind:'REDUNDANT_MISSION_APPROVAL',action};
 assert.equal((await bridge.reactOnce(token,{...prompt,kind:'UAC'})).state,'HUMAN_GATE');assert.equal(effects,0);
 const r=await bridge.reactOnce(token,prompt);assert.equal(effects,1);assert.equal(r.credentials_accessed,false);assert.equal(r.successful_swat,false);assert.equal(r.product_completed,false);
 await assert.rejects(bridge.reactOnce(token,prompt),/ALREADY_CLAIMED/);assert.equal(effects,1);
 const revoked=await bridge.revokeVerifiedBindingOnce(binding);assert.equal(revoked.in_flight_cancellation_proved,false);
 await assert.rejects(bridge.registerAdmittedActionOnce(token,action,0),/REVOKED/);
 }finally{await rm(root,{recursive:true,force:true});}
});
