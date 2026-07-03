# Google Drive Focus Theft Receipt

Date: 2026-06-15

Mission: Stop Google Drive "Items Removed" notifications from stealing Ben's cursor/input focus.

## Setting Changed

Changed the current user's Windows notification policy for the registered Google Drive desktop app:

- App: Google Drive
- AppID: `{6D809377-6AF0-444B-8957-A3773F02200E}\Google\Drive File Stream\126.0.5.0\GoogleDriveFS.exe`
- Registry notification key used by Windows settings:
  - `HKCU:\Software\Microsoft\Windows\CurrentVersion\Notifications\Settings\{6D809377-6AF0-444B-8957-A3773F02200E}/Google/Drive File Stream/126.0.5.0/GoogleDriveFS.exe`

Values set:

- `Enabled = 1`
- `ShowBanner = 0`
- `ShowInActionCenter = 1`

Meaning:

- Google Drive notifications remain enabled.
- Google Drive notification banners are off.
- Google Drive notifications should remain visible in notification center/tray-style visibility where Windows/Drive supports it.

## Drive Sync Still Runs

Yes.

Verified after the change:

- `GoogleDriveFS.exe` is still running.
- The Google Drive `G:` mount is still present.
- No Drive process was stopped or restarted.
- No credentials, account settings, OAuth, billing, or sync roots were touched.

## Banners Are Off

Yes for the registered Google Drive Windows notification app entry.

Verified value:

- `ShowBanner = 0`

Important caveat:

- Windows had no pre-existing visible `Google Drive` row under `HKCU:\...\Notifications\Settings`; the setting was created from the Start Apps registration for Google Drive.
- If Google Drive routes a future "Items Removed" toast through an unidentified generated tray AppID, Windows may require a second pass on that generated notification identity.

## Google Drive Desktop Preferences

Checked local Google Drive for Desktop state under:

- `%LOCALAPPDATA%\Google\DriveFS`

Findings:

- Drive local feature files mention notification-related feature flags.
- No safe banner-only user preference was found that could be edited without risking sync/account behavior.
- No Google Drive Desktop preference was changed.

## Do Not Disturb

Not enabled in this pass.

Reason:

- The Drive-specific banner policy is now set, while critical notification-center visibility remains available.
- DND remains the next broad fallback if Drive still steals focus during active work.

## Reboot Required

No reboot required.

Expected behavior:

- Windows should apply the per-app notification policy without reboot.
- If the old behavior persists, restart Google Drive for Desktop or sign out/in before escalating to broader DND/focus-assist rules.

## Next Fallback If Focus Theft Continues

1. Identify the exact generated tray notification AppID used by the next "Items Removed" toast.
2. Set that generated AppID to:
   - `Enabled = 1`
   - `ShowBanner = 0`
   - `ShowInActionCenter = 1`
3. If Google Drive still steals focus, enable Do Not Disturb during active work windows.
4. If DND is too broad, use Windows Settings -> System -> Notifications -> Google Drive and turn off banners manually while leaving notification center visibility on.
5. Last fallback: fully disable Google Drive notifications in Windows while keeping Drive sync running.

## Acceptance Window

Acceptance target remains:

- Ben can type for 20 minutes without Google Drive stealing focus.

This receipt confirms the setting change and sync status. The 20-minute human typing window still needs observation.

