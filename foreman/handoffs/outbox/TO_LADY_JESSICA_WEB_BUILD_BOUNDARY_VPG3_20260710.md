# TO LADY JESSICA — Web Build Boundary V/P/G Cycle 3

Packet: `TO_LADY_JESSICA_WEB_BUILD_BOUNDARY_VPG3_20260710`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Lane: Werkles.com G web build only

## Mission

Make the root Next.js typecheck/build own the web application without typechecking the separately packaged Harvey Expo/React Native application.

## Evidence

Root `tsconfig.json` includes `**/*.ts` and `**/*.tsx`, which currently pulls in `Harvey/Werkles Mobile/mobile-app/**`. Root typecheck fails only on that mobile app's separately managed dependencies: `expo-status-bar`, `react-native`, and `@expo/vector-icons`.

## Allowed change

Add the Harvey mobile application path to root `tsconfig.json` exclusions. Do not edit, delete, install, or reconfigure anything inside Harvey.

## Verification

1. Stop/restart the local Next dev server only as needed to avoid `.next` build collisions.
2. Run `npm.cmd run typecheck` sequentially.
3. Run `npm.cmd run build` sequentially.
4. Verify `/operator/matching/shadow` exists in the completed route manifest.
5. Restore localhost:3000 and rerun the seven-check semantic matching smoke.

## Forbidden

No Harvey edits, package install, deploy, push, merge, schema work, secrets, production mutation, public flip, or LLM enable.

