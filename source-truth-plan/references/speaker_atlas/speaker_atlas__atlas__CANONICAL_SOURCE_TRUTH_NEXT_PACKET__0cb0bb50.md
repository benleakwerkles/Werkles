# CANONICAL SOURCE TRUTH NEXT PACKET

PACKET_ID: ATLAS_SPEAKER_CANONICAL_SOURCE_TRUTH_NEXT_PACKET
OWNER: Swanson@Doss
STREAM: ATLAS / SPEAKER / SOURCE TRUTH
STATUS: BLOCKED UNTIL OPERATOR ROUTING DECISION

## Finding

Speaker currently exists as a local `C:\speaker` Git worktree with no GitHub
remote. Werkles has a GitHub remote, but the current local worktree is dirty and
diverged from its upstream snapshot branch.

## Rule

GitHub canonical truth cannot be inferred from local files, session memory, or a
dirty branch. Local artifacts may be preserved, but promotion requires a clean
GitHub-visible branch or repository.

## Smallest Next Action

Choose one canonical target:

1. Add `C:\speaker` as its own GitHub repository.
2. Move audited Speaker/Atlas files into a clean branch of Werkles.
3. Preserve `C:\speaker` locally only and explicitly mark it non-canonical.

## Human Gate

Required before any push:

- Select canonical GitHub destination.
- Confirm whether Speaker is standalone or part of Werkles.
- Approve the exact branch name.

## Do Not Do

- Do not push the dirty Werkles snapshot as canonical.
- Do not call `C:\speaker` canonical while it has no remote.
- Do not merge Speaker into Werkles without an audited file subset.
