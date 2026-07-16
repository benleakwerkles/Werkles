# Swanson @ Doss — Harvey SSH Machine Onboarding

Status: `DRAFT / REVIEW ONLY`

Packet ID: `TO_SWANSON_HARVEY_SSH_MACHINE_ONBOARDING_PACKET_v1_20260715`

Generated: `2026-07-15T15:53:14-04:00`

## Mission

Build a Harvey workflow that connects each approved machine to the correct GitHub account and repository through a dedicated SSH key.

The operator should complete one GitHub approval per machine. After that, normal Git fetch, pull, clone, and push operations must not trigger browser login, SMS codes, OAuth device codes, or account switching.

This packet also serves as the manual setup guide until the Harvey workflow exists.

## Canonical target

```text
GitHub account: benleakwerkles
Repository:     benleakwerkles/Werkles
Remote:         git@github-benleakwerkles:benleakwerkles/Werkles.git
Harvey folder:  Harvey/Werkles Mobile/
App source:     Harvey/Werkles Mobile/mobile-app/
Default branch: main
```

Do not substitute Courtney's GitHub account, Courtney's game workspace, or `Medullina/harvey-mobile`.

## Core rule: one machine, one key

Generate a new SSH key on every machine.

Never copy a private key from one machine to another. If a machine is lost, retired, reassigned, or compromised, remove only that machine's public key from GitHub. Other machines remain unaffected.

Each key title should identify its machine clearly:

```text
Harvey · <machine-name> · <yyyy-mm-dd>
```

Example:

```text
Harvey · Doss · 2026-07-15
```

## Manual setup — all platforms

The durable setup has six steps:

1. Generate a dedicated Ed25519 key on the machine.
2. Add only the `.pub` public key to the correct GitHub account.
3. Add a named SSH host alias that points to the private key.
4. Test that GitHub identifies the connection as `benleakwerkles`.
5. clone the repo or update its remote to use the alias.
6. Keep the private key outside repos and cloud-sync folders.

### Human-only GitHub gate

Open:

```text
https://github.com/settings/ssh/new
```

Confirm the browser is signed in as `benleakwerkles`.

Use:

```text
Title:    Harvey · <machine-name> · <yyyy-mm-dd>
Key type: Authentication Key
Key:      contents of the machine's .pub file
```

Only the public key is pasted into GitHub. The private key is never pasted, uploaded, synced, committed, logged, or sent in chat.

## Windows quickstart

Run in PowerShell:

```powershell
$Account = 'benleakwerkles'
$Machine = $env:COMPUTERNAME
$SshDir = Join-Path $HOME '.ssh'
$Key = Join-Path $SshDir "id_ed25519_$Account"

New-Item -ItemType Directory -Force -Path $SshDir | Out-Null
ssh-keygen -t ed25519 -C "$Account $Machine Harvey" -f $Key
Get-Content "$Key.pub"
```

At the passphrase prompt:

- Preferred human workstation posture: use a passphrase and load it into `ssh-agent` once.
- Approved dedicated automation machine: an empty passphrase may be used only after the operator accepts the local-machine theft risk. Press Enter twice; do not try to represent an empty passphrase with quote characters.

Optional passphrase caching:

```powershell
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
ssh-add $Key
```

Administrator rights may be required to change the service startup type.

Add this block to `%USERPROFILE%\.ssh\config` without deleting existing entries:

```sshconfig
Host github-benleakwerkles
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_benleakwerkles
    IdentitiesOnly yes
```

Verify:

```powershell
ssh -T -o BatchMode=yes git@github-benleakwerkles
git ls-remote git@github-benleakwerkles:benleakwerkles/Werkles.git HEAD
```

Expected identity line:

```text
Hi benleakwerkles! You've successfully authenticated...
```

GitHub's SSH identity test normally exits with status `1` because GitHub does not provide shell access. The identity line is the success signal.

Clone or repair the remote:

```powershell
git clone git@github-benleakwerkles:benleakwerkles/Werkles.git

# Existing checkout:
git remote set-url origin git@github-benleakwerkles:benleakwerkles/Werkles.git
git remote -v
```

## macOS quickstart

Run in Terminal:

```bash
ACCOUNT='benleakwerkles'
MACHINE="$(scutil --get ComputerName 2>/dev/null || hostname)"
KEY="$HOME/.ssh/id_ed25519_${ACCOUNT}"

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
ssh-keygen -t ed25519 -C "$ACCOUNT $MACHINE Harvey" -f "$KEY"
cat "$KEY.pub"
```

Add to `~/.ssh/config`:

```sshconfig
Host github-benleakwerkles
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_benleakwerkles
    IdentitiesOnly yes
    AddKeysToAgent yes
    UseKeychain yes
```

Then:

```bash
chmod 600 "$HOME/.ssh/config"
ssh-add --apple-use-keychain "$KEY"
ssh -T -o BatchMode=yes git@github-benleakwerkles
git ls-remote git@github-benleakwerkles:benleakwerkles/Werkles.git HEAD
```

## Linux quickstart

Run in a shell:

```bash
ACCOUNT='benleakwerkles'
MACHINE="$(hostname)"
KEY="$HOME/.ssh/id_ed25519_${ACCOUNT}"

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
ssh-keygen -t ed25519 -C "$ACCOUNT $MACHINE Harvey" -f "$KEY"
cat "$KEY.pub"
```

Add to `~/.ssh/config`:

```sshconfig
Host github-benleakwerkles
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_benleakwerkles
    IdentitiesOnly yes
    AddKeysToAgent yes
```

Then:

```bash
chmod 600 "$HOME/.ssh/config"
eval "$(ssh-agent -s)"
ssh-add "$KEY"
ssh -T -o BatchMode=yes git@github-benleakwerkles
git ls-remote git@github-benleakwerkles:benleakwerkles/Werkles.git HEAD
```

## What Swanson should build into Harvey

### User-facing feature

Add a machine onboarding surface named:

```text
Connect this machine to GitHub with SSH
```

The flow should use plain language and show one current step at a time.

Recommended states:

```text
NOT_STARTED
DISCOVERING
READY_TO_GENERATE
KEY_GENERATED
AWAITING_GITHUB_APPROVAL
VERIFYING
CONNECTED
CONFLICT
REVOKED
```

### Required flow

1. Read back machine name, operating system, current repo path, branch, commit, and working-tree status.
2. Ask which GitHub identity and repo this machine is being connected to.
3. For this lane, prefill `benleakwerkles/Werkles` but keep the account and repo visible.
4. Detect existing keys and matching `Host` blocks without reading or displaying private-key contents.
5. Propose an exact key path and host alias.
6. Generate a new Ed25519 key locally.
7. Display the public key with a one-click Copy action.
8. Open `https://github.com/settings/ssh/new` at the human-only approval step.
9. Wait for the operator to confirm that GitHub added the key.
10. Verify the SSH identity in batch mode.
11. Verify the canonical repo with `git ls-remote`.
12. Offer to clone the repo or update an existing checkout's `origin` remote.
13. Save a non-secret receipt and show a clear `CONNECTED AS benleakwerkles` result.

### Do not use OAuth device flow for Git transport

The SSH onboarding path must not depend on:

- `gh auth login`
- SMS codes
- OAuth device codes
- GitHub Desktop account switching
- browser cookies remaining available
- a private key copied from another machine

GitHub CLI may remain an optional, separate connection for issues, pull requests, and Actions. It is not required for Git clone, fetch, pull, or push.

### Command execution requirements

Swanson must use child-process argument arrays, not concatenated shell strings, when Harvey runs `ssh-keygen`, `ssh`, or `git`.

This matters for:

- paths containing spaces
- Windows quoting
- an intentionally empty passphrase argument
- preventing account names or repo paths from becoming shell injection

For an approved empty passphrase, pass the `-N` value as an actual empty argument in the process API. Do not pass the two-character string `""`.

### SSH config behavior

Harvey must parse and merge `~/.ssh/config` conservatively.

Rules:

- Preserve comments, line endings, unrelated hosts, and user formatting.
- Never replace the whole file to add one host.
- Treat an exact matching block as idempotent success.
- If the alias exists with a different hostname or identity file, stop in `CONFLICT` and show a bounded diff.
- Back up the config locally before changing it.
- Never place the backup in Git, OneDrive, Google Drive, Dropbox, or another synced folder.
- Use account-specific aliases such as `github-benleakwerkles`; never change the behavior of the generic `github.com` host for every account on the machine.

### Private-key handling

Harvey must never:

- read a private key into application logs or telemetry
- display private-key contents
- transmit a private key
- place a private key in the Werkles repo
- place a private key in a cloud-synced directory
- include a private key in a handoff packet, screenshot, clipboard history, crash report, or support bundle
- silently reuse another machine's private key

On POSIX systems, enforce directory mode `0700` and private-key mode `0600`.

On Windows, rely on the user's protected profile directory and tighten ACLs if they are broader than the current user and required system principals.

### First-contact host verification

Do not hard-code a GitHub host-key fingerprint copied from this packet.

Harvey should either:

1. rely on the operating system's normal SSH host verification prompt, or
2. validate against GitHub's current official SSH host-key documentation at implementation time.

If an existing `known_hosts` entry conflicts, stop. Do not delete or bypass it automatically.

### Non-secret connection receipt

Store only:

```json
{
  "provider": "github",
  "account": "benleakwerkles",
  "repository": "benleakwerkles/Werkles",
  "host_alias": "github-benleakwerkles",
  "machine_name": "<machine>",
  "public_key_fingerprint": "SHA256:<fingerprint>",
  "key_title": "Harvey · <machine> · <date>",
  "verified_identity": "benleakwerkles",
  "verified_at": "<ISO-8601 timestamp>",
  "remote_url": "git@github-benleakwerkles:benleakwerkles/Werkles.git"
}
```

The receipt location must be local application data, not the repository and not a synced document folder.

## Human gates and stop conditions

Harvey must stop for the operator at:

- GitHub login or reauthentication
- clicking the final `Add SSH key` approval
- accepting a passphrase-less automation key risk
- replacing a conflicting SSH host block
- changing an existing repo remote that points to a different owner
- deleting or revoking a GitHub SSH key
- any git push, merge, deploy, or public release

Harvey should do all mechanical preparation before each stop and open the exact GitHub page when browser control is available.

## Failure handling

| Failure | Harvey response |
|---|---|
| GitHub says `Permission denied (publickey)` | Confirm correct alias, key path, public key registration, and passphrase/agent state. Do not generate repeated keys blindly. |
| GitHub accepts the public key but no signature is sent | The private key is likely encrypted and not loaded in an agent, or the passphrase was created incorrectly. Offer agent loading or an operator-approved key replacement. |
| Identity is the wrong GitHub account | Stop. Do not touch the repo remote or push. Show the detected account and expected account. |
| `git ls-remote` fails after identity succeeds | Check repo spelling and account permission separately from SSH identity. |
| Host key conflict | Stop and present the known-hosts conflict. Never auto-delete the entry. |
| SSH alias already exists with different settings | Enter `CONFLICT`; show a diff and require operator choice. |
| Key path already exists | Never overwrite. Offer reuse after fingerprint confirmation or generate a machine-suffixed name. |

## Acceptance tests

### Unit tests

- Parse an empty SSH config.
- Add a new account-specific host block.
- Preserve comments, CRLF/LF endings, indentation, and unrelated blocks.
- Re-run against the same config with no changes.
- Detect a conflicting alias.
- Reject account, alias, path, and repo values containing unsafe characters.
- Confirm private-key contents never enter logs, receipts, analytics, or error messages.

### Integration tests

- Use a temporary fake home directory.
- Generate a test key through an argument-array process call.
- Confirm the public key and fingerprint are readable.
- Confirm the private key is not printed.
- Confirm the expected remote URL is formed.
- Confirm no actual GitHub account, repo, SSH config, or key is changed during automated tests.

### Operator acceptance test

On an approved test machine:

```text
1. Generate one machine-specific key.
2. Add its public key to benleakwerkles.
3. Verify SSH reports: Hi benleakwerkles!
4. Verify git ls-remote returns HEAD for benleakwerkles/Werkles.
5. Restart Harvey.
6. Confirm Harvey reports CONNECTED without another browser, SMS, or OAuth/device-code flow.
7. Confirm Courtney's GitHub defaults remain unchanged.
```

## Definition of done

- One guided setup works on Windows, macOS, and Linux.
- Every machine receives a distinct key.
- The correct account and repo remain visible throughout setup.
- The private key never leaves the machine.
- Existing SSH config is preserved.
- A restart does not trigger another sign-in flow.
- Git identity and repo access are verified separately.
- Multi-account machines use account-specific aliases.
- Courtney's defaults are not changed by the Ben lane.
- The operator can revoke one machine without breaking others.
- Tests prove idempotency, conflict handling, and secret redaction.

## Swanson response requested

Return a packet named:

```text
FROM_SWANSON_HARVEY_SSH_MACHINE_ONBOARDING_PLAN_v1_<timestamp>.md
```

Include:

1. proposed Harvey modules and file paths
2. state-machine design
3. platform command adapters
4. SSH config merge strategy
5. secret-redaction strategy
6. test plan
7. unresolved human gates
8. `GO`, `PATCH_REQUESTED`, or `NO-GO`

Do not push, merge, deploy, change GitHub account settings, or create additional keys while responding to this packet.

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "SWANSON",
  "machine": "Doss",
  "mission": "Harvey SSH Machine Onboarding",
  "generated_at": "2026-07-15T15:53:14-04:00",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a",
  "nextActionHash": "e37f23f306c21b31649a46ca4b315e57a1cd970403507f0d1a857b9ab2cb093a",
  "packet_id": "TO_SWANSON_HARVEY_SSH_MACHINE_ONBOARDING_PACKET_v1_20260715",
  "source_packet_file": "Harvey/Werkles Mobile/TO_SWANSON_HARVEY_SSH_MACHINE_ONBOARDING_PACKET_v1_20260715.md",
  "canonical_repo": "benleakwerkles/Werkles",
  "canonical_folder": "Harvey/Werkles Mobile/",
  "output_status": "DRAFT_REVIEW_ONLY",
  "human_gate_required_before_push": true,
  "REQUIRED_RESPONSE_FIELDS": [
    "schemaVersion",
    "cousin",
    "source_packet_id",
    "source_packet_file",
    "generated_at",
    "nextActionHash",
    "CONFIDENCE",
    "VERDICT",
    "UNKNOWNS"
  ]
}
```

