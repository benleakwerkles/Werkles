# Swanson @ Doss — Harvey SSH Machine Onboarding Plan

Status: `DRAFT / REVIEW ONLY`

Source packet: `TO_SWANSON_HARVEY_SSH_MACHINE_ONBOARDING_PACKET_v1_20260715`

Generated: `2026-07-15T16:03:51-04:00`

## Decision

`VERDICT: PATCH_REQUESTED`

`CONFIDENCE: HIGH`

The proposed SSH route is a strong replacement for repeated OAuth/device-code Git transport. The review-safe Harvey surface may be integrated now. Key generation, SSH configuration mutation, remote mutation, and provider approval must remain inactive until the identity and platform patches below are implemented and tested.

## Required architecture patch

The durable identity key is:

```text
project namespace + repository full name + canonical repo ID + provider account
+ canonical machine + hostname evidence + OS user SID/UID + workspace
+ public-key fingerprint
```

It is not only `one physical machine, one key`. A shared machine may have Ben and Courtney profiles with different provider identities. The Werkles lane must never change Courtney's generic `github.com` behavior, repo remotes, SSH files, or GitHub settings.

## Proposed Harvey modules

| Module | Proposed path | Responsibility |
|---|---|---|
| Review surface | `app/harvey/HarveySshOnboarding.tsx` | Plain-language state, visible account/repo/alias, current gate, and receipt meaning |
| Server contract | `lib/harvey/ssh-onboarding/types.ts` | Validated identity tuple, state enum, non-secret receipt schema |
| State reducer | `lib/harvey/ssh-onboarding/state-machine.ts` | Legal transitions and terminal/error semantics |
| Process adapter | `lib/harvey/ssh-onboarding/process.ts` | Child-process argument arrays, bounded output, redaction |
| Platform adapters | `lib/harvey/ssh-onboarding/platform/{windows,macos,linux}.ts` | Profile paths, permissions, agent behavior, receipt directory |
| SSH config parser | `lib/harvey/ssh-onboarding/ssh-config.ts` | Conservative targeted block merge with formatting preservation |
| Local API | `app/api/harvey/ssh-onboarding/route.ts` | Same-host-only orchestration; no secret or private-key response fields |
| Tests | `scripts/foreman/harvey-tests/ssh-onboarding-*.test.*` | Fake-home unit/integration coverage and UI contract |

These are proposed implementation paths, not proof that the executable modules already exist.

## State machine

```text
NOT_STARTED
  -> DISCOVERING
  -> AWAITING_IDENTITY_CONFIRMATION
  -> READY_TO_GENERATE
  -> AWAITING_PASSPHRASE_DECISION
  -> KEY_GENERATED
  -> AWAITING_HOST_TRUST
  -> AWAITING_GITHUB_APPROVAL
  -> VERIFYING
  -> IDENTITY_VERIFIED
  -> REPO_READ_VERIFIED
  -> AWAITING_REMOTE_APPROVAL
  -> CONNECTED
```

Any discovery or merge mismatch enters `CONFLICT`. A failed check enters `VERIFICATION_FAILED` while preserving the last proven state. `REVOKED` requires an operator-confirmed or provider-authoritative revocation read; an unreachable provider or generic authentication failure must not be mislabeled as revocation.

`CONNECTED` means both are proven:

1. SSH identifies the session as the expected GitHub account.
2. `git ls-remote` can read the expected repository.

The receipt must bind those checks to repo ID `1242158598`, the canonical machine, hostname evidence, OS user SID/UID, workspace, and public-key fingerprint. `CONNECTED` does not prove push authority, correct commit authorship, a clean worktree, canonical promotion, merge, deploy, or release authority.

## Platform command adapters

- Use direct executable invocation with argument arrays. Never concatenate a shell command.
- Use a temporary fake home for automated tests.
- Windows: keep keys and receipts under the current user's protected local profile; inspect and tighten over-broad ACLs without touching another user's profile. Key names must include a stable machine/profile discriminator rather than only the provider account.
- macOS/Linux: enforce `.ssh` mode `0700` and private key mode `0600`.
- Do not start or persist `ssh-agent` automatically. Service startup changes are a separate operator decision.
- A non-empty passphrase remains human/OS-terminal-side and must never be captured, logged, serialized, transmitted, or placed in process arguments. A passphrase-less key requires an explicit, durable risk decision for that exact machine/profile.
- First-contact host verification must use the normal SSH trust flow or GitHub's current official host-key publication at implementation time. Never disable strict verification or auto-delete `known_hosts` entries.

## SSH config merge

1. Read text and line endings without interpreting private-key files.
2. Parse host blocks while preserving comments, whitespace, order, and unrelated blocks.
3. Exact alias + host + identity match is idempotent success.
4. Any different alias target or identity path enters `CONFLICT` with a bounded redacted diff.
5. Back up locally outside repos and sync roots immediately before a write.
6. Use atomic replacement while preserving BOM, bytes, line endings, ownership, and permissions.
7. Modify only the account-specific `github-benleakwerkles` block.
8. Never change the generic `github.com` host block automatically.
9. Conflict output is a bounded allowlisted summary; never log the raw config or unrelated host lines.

## Secret and account isolation

- Private-key content is outside the application data model: no logs, telemetry, React state, HTTP response, receipt, screenshot, clipboard helper, or error serialization.
- Public-key content may be displayed only during the explicit local onboarding flow.
- Logs allowlist event names and non-secret fingerprints instead of trying to redact arbitrary process output after capture.
- Process output is bounded and matched against the expected GitHub identity without echoing unrelated stderr.
- Receipt path is per-user local application data, for example `%LOCALAPPDATA%\Werkles\Harvey\ssh-onboarding\` on Windows or the platform-equivalent application-data directory. The receipt includes schema version, canonical machine, hostname, OS user SID/UID, transition evidence, bounded exit codes, and public-key fingerprint.
- Medullina remains cloud-first and session-only. Activation requires an exact minimal-residue exception naming persistent files and limits. No resident Harvey service, watcher, package install, automatic agent startup, large cache, or additional durable clone is authorized by this plan; otherwise return `MEDULLINA_MINIMAL_RESIDUE_POLICY_CONFLICT`.

## Test plan

1. Unit-test empty, CRLF, LF, commented, idempotent, duplicate, wildcard, and conflicting SSH configs.
2. Reject unsafe account, alias, repository, and path input before process creation.
3. Prove the logger cannot accept private-key material and receipts expose only allowlisted fields.
4. Generate a test key only inside a disposable fake home through argument arrays.
5. Prove the test neither reads nor changes the real home, SSH config, Git remote, provider account, or keychain/agent service.
6. Test wrong-account success from `ssh -T` as a hard stop before `ls-remote` or remote mutation.
7. Test identity success plus repository denial as two distinct results.
8. Test a shared-machine fixture with Ben and Courtney profiles and prove no path or config crosses the profile boundary.
9. Test `ssh -T` exit `1` with exact success-banner parsing, identity success plus repo denial, host-key conflicts, interrupted atomic writes, and recovery.
10. Before any origin proposal, inspect fetch URL, push URL, worktree/shared Git config, repo ID `1242158598`, and owner; fail closed on mismatch and never change global Git author identity.
11. Test Medullina minimal-residue shutdown and absence of background processes, caches, and extra clones.
12. Run one operator acceptance on an approved non-shared test profile, followed by an independent Bean/Petra recheck, before fleet rollout.

## Human gates

- Provider login or reauthentication.
- Final GitHub `Add SSH key` approval.
- Passphrase-less key risk acceptance.
- Replacement of a conflicting SSH alias or key path.
- Changing an existing repo remote with a different owner or account alias.
- Starting or persisting an SSH agent service.
- Key deletion or provider-side revocation.
- Any push, merge, deploy, release, or public exposure.

## Unknowns

- Existing SSH keys, aliases, agent state, and Git remotes on each OS profile have not been inventoried.
- Per-machine passphrase posture has not been approved.
- Provider-side revocation visibility is not yet available to Harvey.
- The final same-host API capability and anti-CSRF binding require implementation review.

## Next action

Build and test the inert discovery/state-machine slice against fake homes. Do not generate real keys or change GitHub, SSH config, agents, or Git remotes until that slice passes independent red-team review and receives a per-machine execution order.

`nextActionHash: 8599cbd4a9666da0b1d3f502e754427a3f26abb783fab3bc916b482eb3139b12`

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "SWANSON",
  "machine": "Doss",
  "source_packet_id": "TO_SWANSON_HARVEY_SSH_MACHINE_ONBOARDING_PACKET_v1_20260715",
  "source_packet_file": "Harvey/Werkles Mobile/TO_SWANSON_HARVEY_SSH_MACHINE_ONBOARDING_PACKET_v1_20260715.md",
  "generated_at": "2026-07-15T16:03:51-04:00",
  "nextActionHash": "8599cbd4a9666da0b1d3f502e754427a3f26abb783fab3bc916b482eb3139b12",
  "CONFIDENCE": "HIGH",
  "VERDICT": "PATCH_REQUESTED",
  "UNKNOWNS": [
    "existing per-profile SSH state",
    "per-machine passphrase posture",
    "provider-side revocation visibility",
    "same-host API capability binding"
  ]
}
```
