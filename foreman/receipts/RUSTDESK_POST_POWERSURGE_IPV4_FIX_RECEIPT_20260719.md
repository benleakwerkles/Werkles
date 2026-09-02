# RUSTDESK_POST_POWERSURGE_IPV4_FIX_RECEIPT_20260719

RECEIPT_ID: RECEIPT_RUSTDESK_POST_POWERSURGE_IPV4_FIX_20260719
TIMESTAMP: 2026-07-19
AGENT: Maker@Betsy
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS
MACHINE: Betsy

## LOCAL HANDS

- Machine: Betsy
- Repo: `C:\Users\Ben Leak\github\Werkles` @ `maker/site-g-20260703` / `674f3db`

## What was wrong

- `hbbs` / `hbbr` were **already listening** after the surge (ports 21115–21119 on `10.1.10.194`).
- Betsy client dialed **`betsy.local:21116`**, which prefers **IPv6 link-local** (`fe80::…`).
- Logs: `Failed to connect via rendezvous server: Please try later(0)` with `rendezvous server: betsy.local:21116`.
- User-level config patch alone was **overwritten** by the elevated RustDesk service still holding `betsy.local`.

## What was fixed

1. Confirmed server listeners still up (no need to respawn hbbs/hbbr).
2. Patched user `RustDesk2.toml` to:
   - ID: `10.1.10.194:21116`
   - Relay: `10.1.10.194:21117`
   - cleared `local-ip-addr`
3. Restarted RustDesk UI processes; config **held** on IPv4 after relaunch.
4. Added elevated repair script: `C:\Users\Ben Leak\RustDeskServer\Fix-BetsyRustDeskIPv4.ps1` (patches all profiles + service; needs UAC).

## Still needs Ben if service fights again

Accept UAC for `Fix-BetsyRustDeskIPv4.ps1`, or run elevated:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Ben Leak\RustDeskServer\Fix-BetsyRustDeskIPv4.ps1"
```

PM2 daemon pipe returned `EPERM` from this agent shell — scheduled health task may still own hbbs/hbbr; do not treat PM2 CLI failure as server-down when listeners are up.

## Peers

If Spanzee/Medullina still use `betsy.local` and fail the same way after the surge, set them to `10.1.10.194:21116` / `:21117` + same public key (not `betsy.local`).

## Pass / Fail

PASS for Betsy user-client IPv4 cutover + live hbbs/hbbr. Elevated multi-profile lock pending UAC if service reverts.
