# Matching Pre-Deploy Readiness — V/P/G Cycle 3

Machine: BETSY  
Execution context: `LOCAL_SALLY_WINDOWS`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
HEAD at cycle start: `22e455c`

## Packets executed

- `foreman/handoffs/outbox/TO_LADY_JESSICA_WEB_BUILD_BOUNDARY_VPG3_20260710.md`
- `foreman/handoffs/outbox/TO_HEIMERDINKER_MATCHING_PREDEPLOY_READINESS_VPG3_20260710.md`

## Web build boundary

Root `tsconfig.json` now excludes `Harvey/Werkles Mobile/mobile-app` from the Next.js web project.

Reason: the root config's broad `**/*.ts` and `**/*.tsx` include was pulling the separately packaged Expo/React Native app into the web typecheck. This caused missing `expo-status-bar`, `react-native`, and `@expo/vector-icons` errors even though the matching/web code compiled.

No Harvey source, package, or configuration file was modified.

## Mechanical proof

### Root typecheck

Command: `npm.cmd run typecheck`  
Result: `PASS`  
Exit code: `0`

### Production build

Command: `npm.cmd run build`  
Result: `PASS`  
Exit code: `0`

Observed stages:

- optimized production compilation: PASS
- lint/type validity: PASS
- page data collection: PASS
- static generation: 84/84 PASS
- build traces: PASS

### Matching route

Final route table includes:

```text
/operator/matching/shadow
```

Final manifest includes:

```text
"/operator/matching/shadow/page": "app/operator/matching/shadow/page.js"
```

### Vercel writable-root check

With `VERCEL=1`:

```text
root: C:\Users\BENLEA~1\AppData\Local\Temp\werkles-data
underTmp: true
underRepo: false
containsVarTask: false
```

Result: `PASS` for crash prevention. This proves the code avoids the read-only `/var/task` deployment directory.

### Post-build localhost semantic smoke

Localhost was restored on port 3000 after the clean build.

Result: `PASS — 7/7`

| Check | Evidence |
|---|---|
| Capital intake | `shadow_20260710201518_bbd73cd7` |
| Job intake | `shadow_20260710201518_cd794d0a` |
| Training intake | `shadow_20260710201518_407c4272` |
| Capital semantic | top path `verify_proof` |
| Job semantic | top path `find_better_job` |
| Training semantic | top path `get_training`; partner suppressed; disqualifications deduplicated |
| Operator page | HTTP 200 and expected copy |

Machine-readable receipt: `foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260710.json`

## Readiness verdict

`READY_FOR_PUSH/DEPLOY GATE REVIEW — NOT DEPLOYED.`

The local web artifact is mechanically healthy. Matching transport, ranking semantics, operator route, and serverless writable-root selection all pass locally.

## Unproven and unresolved

1. These dirty local changes are not proven to exist in the deployed production artifact.
2. `/tmp` is writable but ephemeral and instance-local. It is not durable production persistence.
3. A POST may execute on one serverless instance while the operator page reads another; live visibility is therefore not guaranteed by this patch.
4. Production 500/404 resolution remains unproven until an approved push/deploy and live smoke.
5. Public matching and LLM matching remain OFF and must stay OFF.

## Human gate

Push and deploy require Ben's explicit approval. No push, merge, deploy, production request, public flip, schema action, or secret handling occurred in this cycle.

Recommended next decision: choose whether to deploy the crash-prevention patch for shadow-only validation while explicitly accepting ephemeral receipts, or require durable shared persistence before any production redeploy.
