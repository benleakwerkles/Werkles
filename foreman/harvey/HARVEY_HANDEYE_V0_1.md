# Harvey Handeye v0.1

Status: first working machine-control slice.

## What it does

`scripts/foreman/Invoke-HarveyHandeye.ps1` runs on the machine it represents. It:

1. proves the operating-system hostname against an explicitly configured expected hostname;
2. heartbeats to Harvey;
3. polls only that canonical machine's command queue;
4. accepts only allowlisted `OPEN_URL` commands;
5. writes `RECEIVED`, then `COMPLETED` or `BLOCKER` back to the cockpit.

It installs no package, creates no scheduled task or service, holds no secret, and creates no background process except the browser requested by an accepted `OPEN_URL` command.

## Sally one-cycle bootstrap

Run locally on Sally only:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/foreman/Invoke-HarveyHandeye.ps1 `
  -MachineName Sally `
  -ExpectedHostname SALLY `
  -CockpitUrl http://10.1.10.8:3000 `
  -Once
```

Remove `-Once` to keep the foreground receiver polling while the Harvey session is active. v0.1 deliberately does not install persistence.

## Proof boundary

- A queued command is not delivery.
- `RECEIVED` proves a correctly named machine Handeye accepted the command.
- `COMPLETED` proves the allowlisted local action returned without error.
- A browser opening does not prove a human viewed the page.
- Doss cannot run this command with `-MachineName Sally -ExpectedHostname SALLY`; hostname mismatch is a hard stop.
