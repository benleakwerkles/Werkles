import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalJson} from '../../../lib/harvey/station-crypto-core.mjs';
import {createGimpireActiveWorkLedger} from '../../../lib/harvey/gimpire-active-work-store.ts';
const digest=v=>createHash('sha256').update(canonicalJson(v)).digest('hex');
const integrationUrl=new URL('../../../lib/harvey/stewart-swat-admin-integration.mjs',import.meta.url).href;
const childSource=`
 const {createStewartSwatAdminIntegration}=await import(${JSON.stringify(integrationUrl)});
 let text='';for await(const chunk of process.stdin)text+=chunk;
 const f=JSON.parse(text);let effects=0;
 const bridge=createStewartSwatAdminIntegration({
  mission_configuration:{...f.mission,now:()=>100,read_state:async()=>({revision:1,status:'OPEN'}),execute:async a=>{effects++;return {status:'EXECUTED',mission_id:a.mission_id,action_id:a.action_id,resource_sha256:a.resource_sha256,evidence_sha256:'a'.repeat(64)};}},
  claim_configuration:{mapping:f.mapping,now:()=>100},
  read_execution_context:async()=>({host:f.grant.host,receiver_ref:f.grant.receiver_ref,is_elevated:true})
 });
 const token=bridge.admit({grant:f.grant,signature_base64:f.signature});
 try{const result=await bridge.reactOnce(token,{surface:'POOKAKIND_INTERNAL',kind:'REDUNDANT_MISSION_APPROVAL',action:f.grant.actions[0]});process.stdout.write(JSON.stringify({pid:process.pid,effects,state:result.state}));}
 catch(error){process.stdout.write(JSON.stringify({pid:process.pid,effects,error:error.message}));}
`;
function runChild(input){return new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['--experimental-strip-types','--input-type=module','--eval',childSource],{cwd:fileURLToPath(new URL('../../../',import.meta.url)),stdio:['pipe','pipe','pipe'],windowsHide:true});
 let output='',errors='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>errors+=b);child.on('error',reject);
 child.on('close',code=>{if(code!==0)return reject(Error(`CHILD_EXIT_${code}: ${errors}`));try{resolve(JSON.parse(output));}catch(error){reject(error);}});
 child.stdin.end(JSON.stringify(input));
});}
test('independent processes reconstruct signed integration but only first executes synthetic effect',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'stewart-process-replay-'));try{
  const sha='a'.repeat(64),{publicKey,privateKey}=generateKeyPairSync('ed25519');
  const keyHash=createHash('sha256').update(publicKey.export({type:'spki',format:'der'})).digest('hex');
  const action={action_id:'verify-console',template:'ADMIN_CONSOLE_VERIFY',resource_sha256:sha};
  const grant={schema:'werkles.pooka-admin-mission/v1',mission_id:'process-review',revision:1,host:'SYNTHETIC',receiver_ref:'synthetic-process',issued_at_ms:0,expires_at_ms:1000,actions:[action]};
  const binding={schema:'werkles.pooka-admin-verified-claim/v1',grant_sha256:digest(grant),operator_key_sha256:keyHash,mission_id:grant.mission_id,revision:1,host:grant.host,receiver_ref:grant.receiver_ref,expires_at_ms:1000,action};
  await createGimpireActiveWorkLedger({root:path.join(root,'work'),initial_state:{schema:'werkles.gimpire-active-work-state/v1',project_id:'pookakind',work_object_id:'process-review',work_id:'process-review',lane_id:'process-review',revision:0,status:'ACTIVE',objective:'Synthetic distinct process test.',terminal_predicate:{description:'Synthetic receipt.',state:'UNSATISFIED',evidence_sha256:null},quantum:{quantum_id:'quantum-001',ideas_used:0},last_event_sha256:null,next_safe_actions:['Inspect synthetic claim.'],materially_different_routes_remaining:true,wait:null,human_gate:null,operator_pause:null,exhaustion:null,continuity:{capsule_sha256:sha,predecessor_revision:null}}});
  const input={grant,signature:sign(null,Buffer.from(canonicalJson(grant)),privateKey).toString('base64'),mission:{operator_public_key_pem:publicKey.export({type:'spki',format:'pem'}),operator_key_sha256:keyHash,host:grant.host,receiver_ref:grant.receiver_ref},mapping:{binding_sha256:digest(binding),work_root:path.join(root,'work'),attempt_root:path.join(root,'attempts'),project_id:'pookakind',work_object_id:'process-review',expected_work_revision:0}};
  const first=await runChild(input),second=await runChild(input);
  assert.notEqual(first.pid,second.pid);assert.notEqual(first.pid,process.pid);
  assert.equal(first.effects,1);assert.equal(first.state,'EXECUTOR_RECEIPT_RETURNED');
  assert.equal(second.effects,0);assert.equal(second.error,'ADMIN_MISSION_DURABLE_CLAIM_REFUSED');
 }finally{await rm(root,{recursive:true,force:true});}
});
