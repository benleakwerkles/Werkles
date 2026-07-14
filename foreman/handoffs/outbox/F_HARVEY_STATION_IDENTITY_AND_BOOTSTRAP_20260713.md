# F: Harvey Station Identity and Bootstrap

Packet ID: `F_HARVEY_STATION_IDENTITY_AND_BOOTSTRAP_20260713`  
Status: `PUBLIC_PACKET_BRANCH_APPROVED`  
Active namespace: `WERKLES_HARVEY_ODDLY_GODLY`  
Canonical repository: `benleakwerkles/Werkles`  
Canonical repository ID: `1242158598`

## Order

Every Aeye must load the command language and arm the repository write guard before doing station work. This is a read-only identity/bootstrap pass. It authorizes no edit, stage, commit, push, pull request, upload, project creation, provider sign-in, OAuth, account change, secret handling, deployment, or publication.

Ben is not the courier. Do not ask him to paste or upload a packet that Harvey can deliver as bytes, by immutable public URL, by a bound Codex task, or through a bound relay inbox.

## Identity firewall

The following are separate facts and must never be inferred from one another:

- project namespace;
- repository full name and numeric repository ID;
- provider account and connector installation;
- canonical machine name;
- operating-system hostname;
- operating-system user;
- machine owner;
- Aeye identity and execution surface.

Sharing Ben's ChatGPT account does not authorize any GitHub repository or project. Public readability does not authorize writes.

For Medullina specifically:

- machine: `Medullina`;
- hostname: `COURTNEY`;
- owner: `Courtney`;
- current Windows user: report it from the local receiver;
- allowed Werkles work: only after exact station binding passes.

`COURTNEY` is not a GitHub account or project namespace. Courtney's game is a separate adjacent project, currently `UNREGISTERED_DO_NOT_INFER`, and is inaccessible by default from this station contract.

## Command bootstrap retrieval

The repository is public. The bootstrap is absent from `main`; a default-branch 404 is not a private-repository blocker.

Immutable public source:

`https://raw.githubusercontent.com/benleakwerkles/Werkles/a1d261470c66c94b6c1b7eebef1200f0baabaf1a/foreman/handoffs/outbox/ALL_COUSINS_COMMAND_LANGUAGE_BOOTSTRAP_20260712.md`

- source branch: `machine-readiness-packets-20260711`
- source commit: `a1d261470c66c94b6c1b7eebef1200f0baabaf1a`
- git blob: `614a989ccc201d324b01414881cb07f4959a0961`
- raw transport SHA-256: `019B6B3F5FEE85DDFFA2153719275BFD5ED756358BD185724FBD577EA9980C34`

The hash applies to the raw GitHub transport bytes. Harvey Handeye receipts must hash the exact Base64-decoded bytes they received instead of comparing line-ending variants.

## Receiver procedure

1. Prove execution context, canonical machine name when applicable, hostname, OS user, and workspace path.
2. Retrieve the command bootstrap through the adapter Harvey supplied.
3. Read the complete command bootstrap and the station boundary contract.
4. If a local repository is present, run the read-only guard:

   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/foreman/Test-HarveyStationBinding.ps1 -Operation Inspect`

5. Do not inspect or touch adjacent repositories to look for a match. The expected repository is explicit.
6. Return the required receipt. `SENT` is not completion.

## Required receipt

```text
RECEIVED
PACKET_ID: F_HARVEY_STATION_IDENTITY_AND_BOOTSTRAP_20260713
COUSIN: <role>
SURFACE: <surface>
MACHINE: <canonical machine or REMOTE_CONTAINER>
HOSTNAME: <actual hostname>
OS_USER: <actual user or UNAVAILABLE>
EXECUTION_CONTEXT: <context>
DELIVERY_ADAPTER: <HARVEY_HANDEYE | GITHUB_RAW_PUBLIC | CODEX_STANDING_THREAD | RELAY_INBOX>
EXPECTED_PROJECT_NAMESPACE: WERKLES_HARVEY_ODDLY_GODLY
EXPECTED_REPO_FULL_NAME: benleakwerkles/Werkles
EXPECTED_REPO_ID: 1242158598
OBSERVED_REPO_FULL_NAME: <value or UNAVAILABLE>
OBSERVED_REPO_ID: <value or UNAVAILABLE>
SOURCE_BRANCH: machine-readiness-packets-20260711
SOURCE_COMMIT: a1d261470c66c94b6c1b7eebef1200f0baabaf1a
BOOTSTRAP_BLOB: 614a989ccc201d324b01414881cb07f4959a0961
BOOTSTRAP_SHA256: <transport-byte SHA-256>
COMMANDS_LOADED: FOREMAN; KNOCK; VPG VERIFY; VPG PREPARE; VPG GO
REPO_WRITE_GUARD: ARMED
UNAUTHORIZED_REPOSITORIES_TOUCHED: NONE
MUTATIONS_PERFORMED: NO
BLOCKERS: <NONE | HARVEY_STATION_REPO_BINDING_UNPROVEN | HARVEY_STATION_REPO_BINDING_MISMATCH | HARVEY_STATION_PROJECT_NAMESPACE_MISMATCH | HARVEY_STATION_PACKET_NOT_RETRIEVABLE>
NEXT_ACTION: <smallest safe next action>
COMPLETED
```

If a terminal blocker applies, replace `COMPLETED` with `BLOCKER: <exact blocker>`.

## Completion rule

Completion requires receiver-side `RECEIVED` plus `COMPLETED` or an exact `BLOCKER`, followed by authoritative readback. Packet preparation, dispatch, `SENT`, or an unverified chat acknowledgement is not completion.
