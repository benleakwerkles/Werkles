import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {canonicalJson} from '../../../lib/harvey/station-crypto-core.mjs';
import {createGimpireActiveWorkLedger} from '../../../lib/harvey/gimpire-active-work-store.ts';
const digest=v=>createHash('sha256').update(canonicalJson(v)).digest('hex');
const integrationUrl=new URL('../../../lib/harvey/stewart-swat-admin-integration.mjs',import.meta.url).href;
const source=`
 import {promises as fs} from 'node:fs';import path from 'node:path';
 const {createStewartSwatCanonicalAdminIntegration}=await import(${JSON.stringify(integrationUrl)});
 let text='';for await(const chunk of process.stdin)text+=chunk;const f=JSON.parse(text);
 let effects=0,time=100;const rename=fs.rename;
 const bridge=createStewartSwatCanonicalAdminIntegration({mission_configuration:{...f.mission,now:()=>time,read_state:async()=>({revision:1,status:'OPEN'}),execute:async a=>{effects++;return {status:'EXECUTED',mission_id:a.mission_id,action_id:a.action_id,resource_sha256:a.resource_sha256,evidence_sha256:'a'.repeat(64)};}},admission_configuration:{...f.admission,now:()=>time},read_execution_context:async()=>({host:f.grant.host,receiver_ref:f.grant.receiver_ref,is_elevated:true})});
 const token=bridge.admit({grant:f.grant,signature_base64:f.signature});
 try{
  let result;
  if(f.operation==='register')result=await bridge.registerAdmittedActionOnce(token,f.grant.actions[0],0);
  else if(f.operation==='revoke')result=await bridge.revokeVerifiedBindingOnce(f.binding);
  else{
   if(f.operation==='expire')fs.rename=async(from,to)=>{if(String(to).startsWith(f.admission.attempt_root+path.sep))time=1000;return rename(from,to);};
   result=await bridge.reactOnce(token,{surface:'POOKAKIND_INTERNAL',kind:'REDUNDANT_MISSION_APPROVAL',action:f.grant.actions[0]});
  }
  process.stdout.write(JSON.stringify({pid:process.pid,effects,result}));
 }catch(error){process.stdout.write(JSON.stringify({pid:process.pid,effects,error:error.message}));}
 finally{fs.rename=rename;}
`;
function child(input,operation){return new Promise((resolve,reject)=>{
 const p=spawn(process.execPath,['--experimental-strip-types','--input-type=module','--eval',source],{stdio:['pipe','pipe','pipe'],windowsHide:true});let out='',err='';
 p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('error',reject);p.on('close',code=>{if(code)return reject(Error(err));try{resolve(JSON.parse(out));}catch(e){reject(e);}});p.stdin.end(JSON.stringify({...input,operation}));
});}
async function fixture(){
 const root=await mkdtemp(path.join(tmpdir(),'canonical-process-review-')),sha='a'.repeat(64),{publicKey,privateKey}=generateKeyPairSync('ed25519');
 const keyHash=createHash('sha256').update(publicKey.export({type:'spki',format:'der'})).digest('hex');
 const action={action_id:'verify-console',template:'ADMIN_CONSOLE_VERIFY',resource_sha256:sha};
 const grant={schema:'werkles.pooka-admin-mission/v1',mission_id:'canonical-process',revision:1,host:'SYNTHETIC',receiver_ref:'synthetic-process',issued_at_ms:0,expires_at_ms:1000,actions:[action]};
 const admission={work_root:path.join(root,'work'),attempt_root:path.join(root,'attempts'),project_id:'pookakind',work_object_id:'canonical-process'};
 await createGimpireActiveWorkLedger({root:admission.work_root,initial_state:{schema:'werkles.gimpire-active-work-state/v1',project_id:admission.project_id,work_object_id:admission.work_object_id,work_id:'canonical-process',lane_id:'canonical-process',revision:0,status:'ACTIVE',objective:'Synthetic canonical process proof.',terminal_predicate:{description:'Synthetic receipt.',state:'UNSATISFIED',evidence_sha256:null},quantum:{quantum_id:'quantum-001',ideas_used:0},last_event_sha256:null,next_safe_actions:['Inspect.'],materially_different_routes_remaining:true,wait:null,human_gate:null,operator_pause:null,exhaustion:null,continuity:{capsule_sha256:sha,predecessor_revision:null}}});
 const input={grant,signature:sign(null,Buffer.from(canonicalJson(grant)),privateKey).toString('base64'),mission:{operator_public_key_pem:publicKey.export({type:'spki',format:'pem'}),operator_key_sha256:keyHash,host:grant.host,receiver_ref:grant.receiver_ref},admission,binding:{schema:'werkles.pooka-admin-verified-claim/v1',grant_sha256:digest(grant),operator_key_sha256:keyHash,mission_id:grant.mission_id,revision:1,host:grant.host,receiver_ref:grant.receiver_ref,expires_at_ms:1000,action}};
 const registered=await child(input,'register');assert.equal(registered.result.state,'REGISTERED_NOT_EXECUTED');assert.equal(registered.effects,0);
 return {input,close:()=>rm(root,{recursive:true,force:true})};
}
test('canonical restart replay is refused after first synthetic effect',async()=>{
 const f=await fixture();try{const first=await child(f.input,'run'),second=await child(f.input,'run');assert.notEqual(first.pid,second.pid);assert.equal(first.effects,1);assert.equal(second.effects,0);assert.match(second.error,/DURABLE_CLAIM_REFUSED/);}finally{await f.close();}
});
test('separate-process revoke-before-claim denies; claim-before-revoke cannot claim cancellation',async()=>{
 for(const order of ['revoke-first','claim-first']){const f=await fixture();try{
  if(order==='revoke-first'){const revoked=await child(f.input,'revoke');assert.equal(revoked.result.state,'REVOKED');const run=await child(f.input,'run');assert.equal(run.effects,0);assert.match(run.error,/DENIED/);}
  else{assert.equal((await child(f.input,'run')).effects,1);const revoked=await child(f.input,'revoke');assert.equal(revoked.result.in_flight_cancellation_proved,false);assert.equal((await child(f.input,'run')).effects,0);}
 }finally{await f.close();}}
});
test('two processes contend on existing canonical work lock and produce zero effects',async()=>{
 const f=await fixture();try{const lock=path.join(f.input.admission.work_root,'pookakind','canonical-process.lock');await mkdir(lock);
  const results=await Promise.all([child(f.input,'run'),child(f.input,'revoke')]);assert.notEqual(results[0].pid,results[1].pid);for(const r of results){assert.equal(r.effects,0);assert.match(r.error,/BUSY/);}
  await rm(lock,{recursive:true});assert.equal((await child(f.input,'run')).effects,1);
 }finally{await f.close();}
});
test('expiry during persistence in one process burns claim for fresh reconstructed process',async()=>{
 const f=await fixture();try{const expired=await child(f.input,'expire');assert.equal(expired.effects,0);assert.match(expired.error,/EXPIRED_AFTER_PERSISTENCE/);const next=await child(f.input,'run');assert.notEqual(expired.pid,next.pid);assert.equal(next.effects,0);assert.match(next.error,/DURABLE_CLAIM_REFUSED/);}finally{await f.close();}
});
