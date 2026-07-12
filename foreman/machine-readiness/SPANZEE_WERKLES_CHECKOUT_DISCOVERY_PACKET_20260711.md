# Spanzee Werkles Checkout Discovery Packet - 2026-07-11

Packet id: `SPANZEE_WERKLES_CHECKOUT_DISCOVERY_20260711`
Status: `READY_FOR_SPANZEE_LOCAL_DISPATCH`
Prepared by: `Dink @ Doss via Codex Desktop`
Prepared from: `C:\Users\BenLeak\github\Werkles`
Target: `Direwolf Dink @ Spanzee` or another hands-capable local operator on Spanzee
Mode: read-only checkout discovery; no secrets; no Git or filesystem mutation

## Mission

Run this packet in a terminal that is actually local to Spanzee. Find existing
Werkles checkout candidates, prove each candidate's path and Git remote without
changing it, and return the redacted receipt contract below.

The expected Doss path is not evidence for Spanzee. Do not clone a repository or
create the expected path during this discovery pass.

## Source Truth

- Canonical repository: `benleakwerkles/Werkles`
- Canonical remote: `https://github.com/benleakwerkles/Werkles.git`
- Expected per-user shape: `C:\Users\<user>\github\Werkles`
- Prior Spanzee blocker: `EXPECTED_WERKLES_PATH_MISSING_ON_SPANZEE`
- Prior baseline proved hostname `SPANZEE`; re-prove it in this receipt.
- Historical hostname `DESKTOP-UL1T2KE` is context only and does not override a
  current hostname mismatch.

## Hard Stop Before Discovery

Return `RECEIVED` and `BLOCKER: NOT_SPANZEE_LOCAL_CONTEXT` if the current
hostname is not `SPANZEE`. Include the actual hostname and stop. Do not infer
Spanzee disk state from Doss, a relay task, a network share, or another machine.

If terminal execution is unavailable, return
`BLOCKER: SPANZEE_TERMINAL_UNAVAILABLE` and stop.

## Constraints

- Read-only only.
- Do not create, edit, copy, move, rename, delete, archive, or export files.
- Do not clone, fetch, pull, switch, checkout, restore, reset, clean, rebase,
  merge, stage, commit, push, or create a pull request.
- Do not install packages or start a dev server.
- Do not read or print file contents from candidate repositories.
- Do not read, print, copy, export, or transform secrets.
- Do not run `op account list`, `op whoami`, or `gh auth status`.
- Do not submit provider sign-in forms or trigger credential prompts.
- Do not run commands through Doss against a Spanzee share or remote shell and
  label the result machine-local without a Spanzee-local hands readback.

## Read-Only Discovery Command

Run in Windows PowerShell on Spanzee. This command only tests paths and reads Git
metadata. It does not write a receipt; return the displayed fields using the
receipt contract below.

```powershell
$Machine = $env:COMPUTERNAME
$UserHome = $env:USERPROFILE

"PACKET_ID=SPANZEE_WERKLES_CHECKOUT_DISCOVERY_20260711"
"HOSTNAME=$Machine"
"USER_HOME=$UserHome"

if ($Machine -ine 'SPANZEE') {
    "RESULT=BLOCKER"
    "BLOCKER=NOT_SPANZEE_LOCAL_CONTEXT"
    return
}

$CandidatePaths = @(
    (Join-Path $UserHome 'github\Werkles'),
    (Join-Path $UserHome 'github\Werkles1'),
    (Join-Path $UserHome 'Desktop\github\Werkles'),
    (Join-Path $UserHome 'Desktop\github\Werkles1'),
    (Join-Path $UserHome 'Documents\GitHub\Werkles'),
    (Join-Path $UserHome 'Documents\GitHub\Werkles1'),
    (Join-Path $UserHome 'Documents\Werkles'),
    (Join-Path $UserHome 'Documents\Werkles1'),
    (Join-Path $UserHome 'source\repos\Werkles'),
    (Join-Path $UserHome 'repos\Werkles'),
    (Join-Path $UserHome 'dev\Werkles'),
    'C:\Dev\Werkles',
    'C:\Dev\Werkles1',
    'C:\wt\Werkles'
) | Select-Object -Unique

# If the explicit set is empty, perform a bounded directory-name search under
# the current user's common source roots. This enumerates directory paths only;
# it does not read repository file contents.
$ExistingExplicit = @($CandidatePaths | Where-Object {
    Test-Path -LiteralPath $_ -PathType Container
})

if ($ExistingExplicit.Count -eq 0) {
    $SearchRoots = @(
        (Join-Path $UserHome 'github'),
        (Join-Path $UserHome 'Desktop'),
        (Join-Path $UserHome 'Documents'),
        (Join-Path $UserHome 'source'),
        (Join-Path $UserHome 'repos'),
        (Join-Path $UserHome 'dev')
    ) | Where-Object { Test-Path -LiteralPath $_ -PathType Container }

    $Discovered = foreach ($Root in $SearchRoots) {
        Get-ChildItem -LiteralPath $Root -Directory -Recurse -Depth 4 `
            -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '^Werkles([._ -]?\d+)?$' } |
            Select-Object -ExpandProperty FullName
    }

    $CandidatePaths = @($CandidatePaths) + @($Discovered) |
        Select-Object -Unique
}

$Found = 0
foreach ($Path in $CandidatePaths) {
    if (-not (Test-Path -LiteralPath $Path -PathType Container)) { continue }
    $Found++
    $ResolvedPath = (Resolve-Path -LiteralPath $Path).Path
    $IsGitRoot = Test-Path -LiteralPath (Join-Path $ResolvedPath '.git')

    "CANDIDATE_BEGIN"
    "PATH=$ResolvedPath"
    "IS_GIT_ROOT=$IsGitRoot"

    if ($IsGitRoot -and (Get-Command git.exe -ErrorAction SilentlyContinue)) {
        $Origin = git.exe -C $ResolvedPath remote get-url origin 2>$null
        $Branch = git.exe -C $ResolvedPath branch --show-current 2>$null
        $Head = git.exe -C $ResolvedPath rev-parse HEAD 2>$null
        $Porcelain = @(git.exe -C $ResolvedPath status --porcelain 2>$null)
        "ORIGIN=$Origin"
        "BRANCH=$Branch"
        "HEAD=$Head"
        "WORKTREE_CLEAN=$($Porcelain.Count -eq 0)"
        "DIRTY_ENTRY_COUNT=$($Porcelain.Count)"
        "REMOTE_MATCH=$($Origin -eq 'https://github.com/benleakwerkles/Werkles.git')"
    }
    elseif ($IsGitRoot) {
        "BLOCKER=GIT_COMMAND_UNAVAILABLE"
    }

    "CANDIDATE_END"
}

"CANDIDATE_COUNT=$Found"
if ($Found -eq 0) {
    "RESULT=BLOCKER"
    "BLOCKER=NO_WERKLES_CANDIDATE_FOUND_IN_APPROVED_PATH_SET"
}
else {
    "RESULT=DISCOVERY_COMPLETE"
}
```

## Candidate Decision Rules

Classify each found path as exactly one of:

- `CANONICAL_REMOTE_MATCH`: Git root whose `origin` exactly matches the canonical
  HTTPS remote.
- `REMOTE_MATCH_NORMALIZATION_NEEDED`: Git root whose origin clearly identifies
  `benleakwerkles/Werkles` using another transport or harmless URL spelling;
  report the exact non-secret remote, but do not change it.
- `DIFFERENT_REMOTE`: Git root with another origin.
- `GIT_ROOT_NO_ORIGIN`: Git root with no readable origin.
- `NOT_A_GIT_ROOT`: existing directory without `.git` at its root.
- `UNPROVEN`: Git metadata could not be read without credentials, mutation, or
  another blocked action.

Discovery is `COMPLETED` only when every found candidate is classified and at
least one candidate is `CANONICAL_REMOTE_MATCH` or
`REMOTE_MATCH_NORMALIZATION_NEEDED`. Multiple matches remain a review condition;
do not silently choose between them.

If no candidate matches, return a specific `BLOCKER`. Do not clone or repair.

## Redacted Receipt Contract

Return the receipt in this exact order. The receipt may be pasted into the
receiver lane or saved by the coordinating Foreman after readback; this packet
itself does not authorize a local write on Spanzee.

```text
RECEIVED

PACKET_ID: SPANZEE_WERKLES_CHECKOUT_DISCOVERY_20260711
RECEIPT_ID: SPANZEE_WERKLES_CHECKOUT_DISCOVERY_<YYYYMMDD-HHMMSS>

LOCAL HANDS READBACK
Machine: Spanzee
Hostname: <actual hostname>
Repo: <proven canonical candidate path | UNKNOWN>
Branch: <branch | UNKNOWN>
Commit: <full HEAD | UNKNOWN>
Working tree: <clean | dirty - count only | UNKNOWN>
Runtime: <Codex Desktop | Cursor | PowerShell | other>
Terminal: <available | unavailable>
Localhost: <running | not running | UNKNOWN>
Port: <port number(s) | none | UNKNOWN>
EXECUTION_CONTEXT: CODEX_LOCAL

DISCOVERY_SCOPE
Approved candidate paths checked: <count>
Existing candidate paths found: <count>

CANDIDATES
- Path: <absolute path>
  Is Git root: <yes | no>
  Origin: <non-secret remote | none | unreadable>
  Branch: <branch | UNKNOWN>
  HEAD: <full hash | UNKNOWN>
  Working tree: <clean | dirty - count only | UNKNOWN>
  Classification: <allowed classification>

CANONICAL_SPANZEE_CHECKOUT
Path: <absolute path | UNKNOWN>
Remote proof: <exact non-secret origin | UNKNOWN>
Selection status: <PROVEN_UNIQUE | MULTIPLE_MATCHES_REVIEW_REQUIRED | UNPROVEN>

SECRET_BOUNDARY
Secrets read or printed: NO
Forbidden auth commands run: NO
Filesystem or Git mutations performed: NO

BLOCKERS
<NONE | specific blocker(s)>

NEXT_ACTION
<RUN_WORKSPACE_CLI_BASELINE_FROM_PROVEN_CHECKOUT | REVIEW_MULTIPLE_MATCHES | BLOCKED_NO_MATCH>

COMPLETED
```

If the mission cannot complete, replace the final `COMPLETED` with:

```text
BLOCKER: <specific blocker>
```

## Receipt Acceptance Gate

The coordinating Foreman accepts the receipt only if:

1. `RECEIVED` is present.
2. The hands readback proves current hostname `SPANZEE`.
3. The packet and receipt ids are present.
4. Candidate paths and exact non-secret remotes are reported.
5. The secret boundary says all three values are `NO`.
6. The terminal state is `COMPLETED` or a specific `BLOCKER`.
7. A `COMPLETED` receipt identifies a unique proven checkout or explicitly flags
   multiple matching checkouts for review.

`SENT` is routing evidence only. It is not receipt acceptance, checkout proof,
or completion. Close this packet only after receiver-side `RECEIVED` followed by
`COMPLETED` or `BLOCKER`, plus authoritative receiver-lane readback.

## After A Proven Receipt

Only after the canonical Spanzee checkout path is proven, run the existing
read-only workspace/CLI baseline from that checkout using
`foreman/machine-readiness/AEYE_WORKSPACE_AND_CLI_BASELINE_20260711.md` and its
script. A checkout-discovery receipt does not itself prove workspace or CLI
readiness.

