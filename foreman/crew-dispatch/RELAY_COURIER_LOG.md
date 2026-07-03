# Relay Courier Log

Append-only log for Relay Courier load/send/failure events.

Doctrine: **Relay Courier is not an AI cousin.** It reads packet metadata, verifies policy, loads Edge tabs, and **stops before Send** unless dispatch class AUTO_SEND explicitly permits (Send still manual per current doctrine).

See `RELAY_COURIER.md` and `scripts/foreman/relay-courier.mjs`.

## 2026-05-31T15:07:58.553Z
- SELF-TEST PASS channel=msedge — NO SEND

## 2026-05-31T17:07:32.001Z
- FORCE UNLOCK — Reset by operator

## 2026-05-31T22:02:19.314Z
- FAIL PETRA: Stop-Job : A parameter cannot be found that matches parameter name 'Force'.
At C:\Users\benle\Desktop\github\Werkles\foreman\crew-dispatch\crew-edge-courier.ps1:77 char:19
+     Stop-Job $job -Force -ErrorAction SilentlyContinue
+                   ~~~~~~
    + CategoryInfo          : InvalidArgument: (:) [Stop-Job], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : NamedParameterNotFound,Microsoft.PowerShell.Commands.StopJobCommand

## 2026-06-01T04:27:16.855Z
- LOAD OK PETRA tab 1 class=AUTO_SEND engine=powershell

## 2026-06-01T22:34:01.132Z
- LOAD OK SKYBRO tab 2 class=AUTO_SEND engine=powershell

## 2026-06-01T22:34:25.065Z
- LOAD OK ENDER tab 3 class=AUTO_SEND engine=powershell

## 2026-06-01T22:34:36.840Z
- LOAD OK BEAN tab 4 class=AUTO_SEND engine=powershell

## 2026-06-01T22:34:58.022Z
- LOAD OK COMPUTER tab 5 class=AUTO_SEND engine=powershell

## 2026-06-01T22:37:29.530Z
- LOAD OK PETRA tab 1 class=AUTO_SEND engine=powershell

## 2026-06-01T22:37:50.225Z
- LOAD OK PETRA tab 1 class=AUTO_SEND engine=powershell

## 2026-06-01T22:38:05.841Z
- LOAD OK SKYBRO tab 2 class=AUTO_SEND engine=powershell

## 2026-06-01T22:38:14.803Z
- LOAD OK ENDER tab 3 class=AUTO_SEND engine=powershell

## 2026-06-01T22:38:26.218Z
- LOAD OK BEAN tab 4 class=AUTO_SEND engine=powershell

## 2026-06-01T22:38:33.986Z
- LOAD OK COMPUTER tab 5 class=AUTO_SEND engine=powershell

## 2026-06-06T03:43:13.177Z
- AUTONOMOUS_ROUND_TRIP_TEST START — ENDER Playwright send (explicit flag)

## 2026-06-06T03:43:28.763Z
- AUTONOMOUS_ROUND_TRIP_TEST SEND clicked via Enter

## 2026-06-06T03:44:06.732Z
- AUTONOMOUS_ROUND_TRIP_TEST START — ENDER Playwright send (explicit flag)

## 2026-06-06T03:44:18.604Z
- AUTONOMOUS_ROUND_TRIP_TEST SEND via button:has(svg) (baseline messages=0)

## 2026-06-06T03:50:10.288Z
- FORCE UNLOCK — CLI unlock

## 2026-06-06T03:50:19.347Z
- AUTONOMOUS_ROUND_TRIP_TEST FAIL: Timed out waiting for Claude reply (180000ms)

## 2026-06-06T03:50:23.713Z
- AUTONOMOUS_ROUND_TRIP_TEST START — ENDER Playwright send (explicit flag)

## 2026-06-06T03:50:34.879Z
- AUTONOMOUS_ROUND_TRIP_TEST SEND via button:has(svg) (baseline messages=0)

## 2026-06-06T03:50:37.431Z
- AUTONOMOUS_ROUND_TRIP_TEST WARN — composer still has text; retrying send

## 2026-06-06T03:53:03.210Z
- FORCE UNLOCK — CLI unlock

## 2026-06-06T03:53:04.356Z
- AUTONOMOUS_ROUND_TRIP_TEST START — ENDER Playwright send (explicit flag)

## 2026-06-06T03:53:08.895Z
- AUTONOMOUS_ROUND_TRIP_TEST FAIL: browserType.launchPersistentContext: Opening in existing browser session. This usually means that the profile is already in use by another instance of Chromium.
Call log:
  - <launching> C:\Users\benle\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --user-data-dir=C:\Users\benle\Desktop\github\Werkles\foreman\.edge-aeye-crew-profile --remote-debugging-pipe about:blank
  - <launched> pid=16156
  - [pid=16156][err] [0605/235307.438:ERROR:third_party\crashpad\crashpad\client\settings.cc:231] Settings version is not 1
  - [pid=16156][out] Opening in existing browser session.
  - [pid=16156] <gracefully close start>
  - [pid=16156] <kill>
  - [pid=16156] <will force kill>
  - [pid=16156] taskkill stderr: ERROR: The process "16156" not found.
  - [pid=16156] <process did exit: exitCode=0, signal=null>
  - [pid=16156] starting temporary directories cleanup
  - [pid=16156] finished temporary directories cleanup
  - [pid=16156] <gracefully close end>


## 2026-06-06T03:53:23.971Z
- AUTONOMOUS_ROUND_TRIP_TEST START — ENDER Playwright send (explicit flag)

## 2026-06-06T03:53:46.412Z
- AUTONOMOUS_ROUND_TRIP_TEST sandbox copy failed: EBUSY: resource busy or locked, copyfile 'C:\Users\benle\Desktop\github\Werkles\foreman\.edge-aeye-crew-profile\Default\Network\Cookies' -> 'C:\Users\benle\Desktop\github\Werkles\foreman\.edge-playwright-autonomous-sandbox\Default\Network\Cookies'

## 2026-06-06T03:53:46.419Z
- AUTONOMOUS_ROUND_TRIP_TEST FAIL: Edge profile locked by Aeye Crew Bay — close Edge or retry after crew bay closes

## 2026-06-06T03:54:29.891Z
- AUTONOMOUS_ROUND_TRIP_TEST START — ENDER Playwright send (explicit flag)

## 2026-06-06T03:54:32.391Z
- AUTONOMOUS_ROUND_TRIP_TEST profile locked — launching sandbox: C:\Users\benle\Desktop\github\Werkles\foreman\.edge-playwright-autonomous-sandbox

## 2026-06-06T03:54:43.486Z
- AUTONOMOUS_ROUND_TRIP_TEST FAIL: Claude composer not found — log into claude.ai in Edge profile first

## 2026-06-06T03:54:45.570Z
- AUTONOMOUS_ROUND_TRIP_TEST FAIL: Timed out waiting for Claude reply (120000ms)

## 2026-06-06T04:21:36.406Z
- AUTONOMOUS_ROUND_TRIP_TEST START — ENDER Playwright send (explicit flag)

## 2026-06-06T04:21:46.004Z
- AUTONOMOUS_ROUND_TRIP_TEST ENDER SEND via button[aria-label="Send message"] (baseline=0 mode=profile)

## 2026-06-06T04:23:49.806Z
- AUTONOMOUS_ROUND_TRIP_TEST ENDER PASS inbox=FROM_ENDER_AUTONOMOUS_ROUND_TRIP_TEST_20260606-042349.md

## 2026-06-06T04:23:57.882Z
- AUTONOMOUS_ROUND_TRIP_TEST START — ENDER Playwright send (explicit flag)

## 2026-06-06T04:24:07.488Z
- AUTONOMOUS_ROUND_TRIP_TEST ENDER SEND via button[aria-label="Send message"] (baseline=0 mode=profile)

## 2026-06-06T04:26:12.022Z
- AUTONOMOUS_ROUND_TRIP_TEST ENDER PASS inbox=FROM_ENDER_AUTONOMOUS_ROUND_TRIP_TEST_20260606-042611.md

## 2026-06-06T04:26:20.084Z
- AUTONOMOUS_ROUND_TRIP_TEST START — ENDER Playwright send (explicit flag)

## 2026-06-06T04:26:28.611Z
- AUTONOMOUS_ROUND_TRIP_TEST ENDER SEND via button[aria-label="Send message"] (baseline=0 mode=profile)

## 2026-06-06T04:28:33.526Z
- AUTONOMOUS_ROUND_TRIP_TEST ENDER PASS inbox=FROM_ENDER_AUTONOMOUS_ROUND_TRIP_TEST_20260606-042833.md

## 2026-06-06T04:28:41.596Z
- AUTONOMOUS_ROUND_TRIP_TEST START — ENDER Playwright send (explicit flag)

## 2026-06-06T04:28:49.489Z
- AUTONOMOUS_ROUND_TRIP_TEST ENDER SEND via button[aria-label="Send message"] (baseline=0 mode=profile)

## 2026-06-06T04:30:54.402Z
- AUTONOMOUS_ROUND_TRIP_TEST ENDER PASS inbox=FROM_ENDER_AUTONOMOUS_ROUND_TRIP_TEST_20260606-043054.md

## 2026-06-06T04:31:02.457Z
- AUTONOMOUS_ROUND_TRIP_TEST START — ENDER Playwright send (explicit flag)

## 2026-06-06T04:31:10.848Z
- AUTONOMOUS_ROUND_TRIP_TEST ENDER SEND via button[aria-label="Send message"] (baseline=0 mode=profile)

## 2026-06-06T04:33:15.916Z
- AUTONOMOUS_ROUND_TRIP_TEST ENDER PASS inbox=FROM_ENDER_AUTONOMOUS_ROUND_TRIP_TEST_20260606-043315.md

## 2026-06-06T04:33:29.957Z
- AUTONOMOUS_ROUND_TRIP_TEST_SKYBRO START — SKYBRO Playwright send (explicit flag)

## 2026-06-06T04:33:38.660Z
- AUTONOMOUS_ROUND_TRIP_TEST_SKYBRO SKYBRO SEND via button[aria-label="Send message"] (baseline=0 mode=profile)

## 2026-06-06T04:35:43.242Z
- AUTONOMOUS_ROUND_TRIP_TEST_SKYBRO SKYBRO PASS inbox=FROM_SKYBRO_AUTONOMOUS_ROUND_TRIP_TEST_SKYBRO_20260606-043543.md

## 2026-06-06T04:35:50.493Z
- HOMEPAGE_REWRITE_DISCOVERY_SMOKE_TEST START — ENDER Playwright send (explicit flag)

## 2026-06-06T04:35:58.552Z
- HOMEPAGE_REWRITE_DISCOVERY_SMOKE_TEST ENDER SEND via button[aria-label="Send message"] (baseline=0 mode=profile)

## 2026-06-06T04:38:03.580Z
- HOMEPAGE_REWRITE_DISCOVERY_SMOKE_TEST ENDER PASS inbox=FROM_ENDER_HOMEPAGE_REWRITE_DISCOVERY_SMOKE_TEST_20260606-043803.md

## 2026-06-06T13:47:40.216Z
- WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW START — ENDER Playwright send (explicit flag)

## 2026-06-06T13:47:57.609Z
- WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW ENDER SEND via button[aria-label="Send message"] (baseline=0 mode=profile)

## 2026-06-06T13:50:02.754Z
- WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW ENDER PASS inbox=FROM_ENDER_WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW_20260606-135002.md

## 2026-06-06T13:50:02.918Z
- WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW START — SKYBRO Playwright send (explicit flag)

## 2026-06-06T13:50:12.118Z
- WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW SKYBRO SEND via button[aria-label="Send message"] (baseline=0 mode=profile)

## 2026-06-06T13:52:16.716Z
- WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW SKYBRO PASS inbox=FROM_SKYBRO_WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW_20260606-135216.md

## 2026-06-06T13:52:16.874Z
- WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW START — COMPUTER Playwright send (explicit flag)

## 2026-06-06T13:52:29.617Z
- WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW COMPUTER SEND via button[aria-label="Submit"] (baseline=0 mode=profile)

## 2026-06-06T13:54:35.154Z
- WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW COMPUTER PASS inbox=FROM_COMPUTER_WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW_20260606-135435.md

## 2026-06-07T17:48:07.600Z
- LOAD OK PETRA tab 1 class=AUTO_SEND engine=powershell

## 2026-06-15T17:39:11.470Z
- SOLEDASH PETRA playwright CDP :9222 skip: browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:9222
Call log:
  - <ws preparing> retrieving websocket url from http://127.0.0.1:9222


## 2026-06-15T17:39:11.476Z
- SOLEDASH PETRA playwright CDP :9223 skip: browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:9223
Call log:
  - <ws preparing> retrieving websocket url from http://127.0.0.1:9223


## 2026-06-15T17:39:11.478Z
- SOLEDASH PETRA playwright CDP :9333 skip: browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:9333
Call log:
  - <ws preparing> retrieving websocket url from http://127.0.0.1:9333


## 2026-06-15T17:39:35.701Z
- SOLEDASH PETRA playwright CDP :9222 skip: browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:9222
Call log:
  - <ws preparing> retrieving websocket url from http://127.0.0.1:9222


## 2026-06-15T17:39:35.705Z
- SOLEDASH PETRA playwright CDP :9223 skip: browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:9223
Call log:
  - <ws preparing> retrieving websocket url from http://127.0.0.1:9223


## 2026-06-15T17:39:35.707Z
- SOLEDASH PETRA playwright CDP :9333 skip: browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:9333
Call log:
  - <ws preparing> retrieving websocket url from http://127.0.0.1:9333


## 2026-06-15T17:40:18.847Z
- SOLEDASH PETRA playwright CDP :9222 skip: browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:9222
Call log:
  - <ws preparing> retrieving websocket url from http://127.0.0.1:9222


## 2026-06-15T17:40:18.852Z
- SOLEDASH PETRA playwright CDP :9223 skip: browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:9223
Call log:
  - <ws preparing> retrieving websocket url from http://127.0.0.1:9223


## 2026-06-15T17:40:18.853Z
- SOLEDASH PETRA playwright CDP :9333 skip: browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:9333
Call log:
  - <ws preparing> retrieving websocket url from http://127.0.0.1:9333


## 2026-06-16T00:20:55.704Z
- SOLEDASH PETRA playwright CDP :9222 skip: browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:9222
Call log:
  - <ws preparing> retrieving websocket url from http://127.0.0.1:9222


## 2026-06-16T00:20:55.709Z
- SOLEDASH PETRA playwright CDP :9223 skip: browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:9223
Call log:
  - <ws preparing> retrieving websocket url from http://127.0.0.1:9223


## 2026-06-16T00:20:55.710Z
- SOLEDASH PETRA playwright CDP :9333 skip: browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:9333
Call log:
  - <ws preparing> retrieving websocket url from http://127.0.0.1:9333

